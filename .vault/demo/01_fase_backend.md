---
purpose: Plan detallado de Fase 1 — export de modelo + API FastAPI de predicción y explicación.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: pending
---

# Fase 1: Fundación — Export de modelo + API de predicción

## Objetivo
FastAPI funcionando localmente con endpoints de predicción y explicación SHAP para el modelo rural.

## Dependencias
Ninguna. Esta es la primera fase.

---

## Paso 1.1: Script de exportación del modelo

**Archivo:** `demo/backend/scripts/export_models.py`

Reutiliza la lógica existente de `scripts/portfolio_pipeline.py`:

1. Importar: `RURAL_FEATURES`, `RECORDED_OPTUNA_PARAMS`, `SEED`, `TARGET_COLUMN`, `set_global_seed`, `_load_dataset`, `_prepare_feature_matrices`, `_apply_smote`
2. Pipeline de entrenamiento:
   - `_load_dataset("data/dataset-uci.xlsx")`
   - `_prepare_feature_matrices(df, feature_columns=RURAL_FEATURES)` → split 70/30, StandardScaler fit_transform
   - `_apply_smote(X_train_model, y_train)` → SMOTE sobre training set
   - `GradientBoostingClassifier(random_state=42, **RECORDED_OPTUNA_PARAMS["rural"]).fit(X_train_smote, y_train_smote)`
3. Serializar con `joblib.dump()`:
   - `demo/backend/ml/rural_model.joblib` — modelo entrenado
   - `demo/backend/ml/rural_scaler.joblib` — StandardScaler fitted
   - `demo/backend/ml/feature_config.json` — nombres de features en orden, tipos, rangos válidos

**Parámetros del modelo rural (deterministas):**
```python
RECORDED_OPTUNA_PARAMS["rural"] = {
    "n_estimators": 692,
    "learning_rate": 0.030187783433557297,
    "max_depth": 8,
    "min_samples_leaf": 16,
    "subsample": 0.6342139062637353,
}
```

**Referencia de funciones existentes:**
- `_prepare_feature_matrices()` → `portfolio_pipeline.py:277-337`
- `_apply_smote()` → `portfolio_pipeline.py:380-385`
- `_run_experiment()` → `portfolio_pipeline.py:432-544` (flujo completo de referencia)

---

## Paso 1.2: Lookup tables de bioimpedancia

**Archivo de salida:** `demo/frontend/lib/bioimpedance-ranges.json`

Generar estadísticas condicionales del dataset para producir valores bioimpedancia plausibles en Acto 2.

**Features de bioimpedancia:**
TBW, ECW, ICW, ECF_TBW, TBFR, LM, Protein, VFR, BM, MM, Obesity, TFC, VFA, VMA, HFA

**Buckets de segmentación:**
- Age: 18-35, 36-50, 51-65, 65+
- Gender: 0, 1
- BMI: <18.5, 18.5-25, 25-30, 30+

**Para cada combinación (gender, age_bucket, bmi_bucket):**
- Calcular mean y std de cada feature
- Guardar en JSON anidado

**Uso en frontend:** dado age, gender, height, weight del Acto 1 → calcular BMI → buscar bucket → samplear con `mean + random_normal * std * 0.3` → clamp a rangos válidos.

---

## Paso 1.3: FastAPI app

**Estructura de `demo/backend/`:**
```
backend/
├── app/
│   ├── main.py          # FastAPI, CORS, lifespan
│   ├── models.py         # Pydantic schemas
│   ├── predict.py        # POST /predict/rural
│   └── explain.py        # POST /explain/rural
├── ml/
│   ├── rural_model.joblib
│   ├── rural_scaler.joblib
│   └── feature_config.json
├── scripts/
│   └── export_models.py
├── requirements.txt
└── Dockerfile
```

### Lifespan (carga de modelo al startup)
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load("ml/rural_model.joblib")
    app.state.scaler = joblib.load("ml/rural_scaler.joblib")
    app.state.explainer = shap.TreeExplainer(app.state.model)
    yield
```

### Endpoints

**`POST /predict/rural`**
- Input: `{ "features": { "Age": 45, "Gender": 1, "BMI": 28.5, ... } }` — 25 features
- Validación Pydantic: 25 features presentes, en rango
- Proceso: DataFrame → escalar → `model.predict_proba()` → probabilidad clase 1
- Output: `{ "probability": 0.72, "risk_level": "alto", "threshold_used": 0.45 }`
- Risk levels: bajo (<0.35), moderado (0.35-0.55), alto (>=0.55)

**`POST /explain/rural`**
- Input: mismo que predict
- Proceso: `explainer.shap_values(X_scaled)` — valores SHAP por instancia
- Output: `{ "shap_values": { "VFA": 0.12, "Age": 0.08, ... }, "base_value": 0.49 }`
- Ordenado por |SHAP| descendente, top 7

**`GET /model/info`**
- Output estática: features, métricas, dataset size, threshold, metadata del modelo

### Pydantic schemas

Ver [`06_data_contracts.md`](./06_data_contracts.md) sección 2 para `PredictRequest`, `PredictResponse`, `ExplainResponse`, `ErrorResponse` y `ModelInfo`. No duplicar aquí.

### Implementación de `app/main.py`

```python
from contextlib import asynccontextmanager
from pathlib import Path
import json
import os

import joblib
import shap
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.predict import router as predict_router
from app.explain import router as explain_router

BASE_DIR = Path(__file__).resolve().parent.parent  # demo/backend/
ML_DIR = BASE_DIR / "ml"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load(ML_DIR / "rural_model.joblib")
    app.state.scaler = joblib.load(ML_DIR / "rural_scaler.joblib")
    with open(ML_DIR / "feature_config.json") as f:
        app.state.feature_config = json.load(f)
    app.state.explainer = shap.TreeExplainer(app.state.model)
    yield


app = FastAPI(title="Gallstone Rural API", version="1.0.0", lifespan=lifespan)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:3000",
    allow_origins=[o.strip() for o in _raw_origins.split(",")],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(predict_router)
app.include_router(explain_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": hasattr(app.state, "model"),
        "explainer_loaded": hasattr(app.state, "explainer"),
    }


@app.get("/model/info")
async def model_info():
    return app.state.feature_config["model_metadata"] | {
        "feature_order": app.state.feature_config["feature_order"],
    }
```

### Implementación de `app/predict.py`

```python
import pandas as pd
from fastapi import APIRouter, HTTPException, Request

from app.models import PredictRequest, PredictResponse

router = APIRouter()

THRESHOLD = 0.45


def _risk_level(probability: float) -> str:
    if probability < 0.35:
        return "bajo"
    if probability < 0.55:
        return "moderado"
    return "alto"


@router.post("/predict/rural", response_model=PredictResponse)
async def predict_rural(payload: PredictRequest, request: Request):
    model = request.app.state.model
    scaler = request.app.state.scaler
    feature_order = request.app.state.feature_config["feature_order"]

    try:
        row = pd.DataFrame([payload.features], columns=feature_order)
        x_scaled = scaler.transform(row)
        proba = float(model.predict_proba(x_scaled)[0, 1])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model error: {exc}")

    return PredictResponse(
        probability=proba,
        risk_level=_risk_level(proba),
        threshold_used=THRESHOLD,
    )
```

### Implementación de `app/explain.py`

```python
import pandas as pd
from fastapi import APIRouter, HTTPException, Request

from app.models import PredictRequest, ExplainResponse

router = APIRouter()

TOP_K = 7


@router.post("/explain/rural", response_model=ExplainResponse)
async def explain_rural(payload: PredictRequest, request: Request):
    scaler = request.app.state.scaler
    explainer = request.app.state.explainer
    feature_order = request.app.state.feature_config["feature_order"]

    try:
        row = pd.DataFrame([payload.features], columns=feature_order)
        x_scaled = scaler.transform(row)
        shap_values = explainer.shap_values(x_scaled, check_additivity=False)[0]
        base_value = float(explainer.expected_value)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"SHAP error: {exc}")

    impact = dict(zip(feature_order, map(float, shap_values)))
    top = dict(
        sorted(impact.items(), key=lambda kv: abs(kv[1]), reverse=True)[:TOP_K]
    )

    return ExplainResponse(shap_values=top, base_value=base_value)
```

**Nota:** `explainer.expected_value` puede ser escalar o array de 2 elementos (una clase). Para `GradientBoostingClassifier` binario con TreeExplainer es escalar, pero si falla castear, usar `float(np.atleast_1d(explainer.expected_value)[-1])`.

### Requirements del backend
```
fastapi>=0.115
uvicorn>=0.34
joblib>=1.4
scikit-learn==1.7.2
xgboost==3.1.1
shap>=0.51
pandas>=2.3
numpy>=2.3
```

---

---

## Detalles adicionales

### Estructura de `feature_config.json`

```json
{
  "feature_order": ["Age", "Gender", "Comorbidity", "CAD", "Hypothyroidism", "Hyperlipidemia", "DM", "Height", "Weight", "BMI", "TBW", "ECW", "ICW", "ECF_TBW", "TBFR", "LM", "Protein", "VFR", "BM", "MM", "Obesity", "TFC", "VFA", "VMA", "HFA"],
  "feature_types": {
    "Age": "int",
    "Gender": "binary",
    "Comorbidity": "binary",
    "CAD": "binary",
    "Hypothyroidism": "binary",
    "Hyperlipidemia": "binary",
    "DM": "binary",
    "Height": "float",
    "Weight": "float",
    "BMI": "float",
    "TBW": "float",
    "...": "float"
  },
  "feature_ranges": {
    "Age": {"min": 18, "max": 95},
    "Height": {"min": 140, "max": 200},
    "Weight": {"min": 35, "max": 150},
    "BMI": {"min": 15, "max": 50},
    "TBW": {"min": 20, "max": 60},
    "...": {"min": 0, "max": 0}
  },
  "model_metadata": {
    "algorithm": "GradientBoostingClassifier",
    "training_samples": 319,
    "features": 25,
    "accuracy": 0.7708,
    "auc": 0.8138,
    "threshold_recommended": 0.45,
    "seed": 42
  }
}
```

Los rangos se calculan desde el dataset real: `df[feature].min()` y `df[feature].max()` con un pequeño margen de seguridad.

### CORS middleware

```python
from fastapi.middleware.cors import CORSMiddleware
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

En producción, `ALLOWED_ORIGINS` será algo como:
`http://localhost:3000,https://gallstone-demo.vercel.app,https://*.vercel.app`

### Healthcheck endpoint

```python
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": hasattr(app.state, "model"),
        "explainer_loaded": hasattr(app.state, "explainer"),
    }
```

Railway usa este endpoint para verificar que el servicio está vivo. El frontend puede hacer ping en la landing para despertar el backend si está dormido (cold start).

### Formato de error

Todas las respuestas de error siguen el mismo schema:
```python
class ErrorResponse(BaseModel):
    error: str       # código breve: "invalid_features", "model_error"
    message: str     # descripción legible
    details: dict | None = None
```

Ejemplo:
```json
{
  "error": "invalid_features",
  "message": "Feature Age está fuera de rango",
  "details": {"feature": "Age", "received": 250, "min": 18, "max": 95}
}
```

### Handling de SHAP para GradientBoosting

`shap.TreeExplainer(GradientBoostingClassifier)` retorna:
- `shap_values`: array de shape `(n_samples, n_features)` para clasificación binaria
- `expected_value`: valor esperado del modelo (clase positiva)

Para una sola instancia:
```python
X_scaled = scaler.transform(pd.DataFrame([features], columns=feature_order))
shap_values = explainer.shap_values(X_scaled, check_additivity=False)[0]  # shape (n_features,)
base_value = float(explainer.expected_value)

# Top 7 por magnitud
feature_impact = dict(zip(feature_order, shap_values))
top_features = dict(sorted(feature_impact.items(), key=lambda kv: abs(kv[1]), reverse=True)[:7])
```

Nota: `check_additivity=False` replica el comportamiento de `_render_shap_bar_plot` en `portfolio_pipeline.py:418`.

### Path handling y cwd

`uvicorn` ejecuta desde el directorio donde se invoca. Para que `joblib.load("ml/rural_model.joblib")` funcione, hay dos opciones:

1. **Invocar desde `demo/backend/`**: `cd demo/backend && uvicorn app.main:app --reload`
2. **Path absoluto en código**:
```python
BASE_DIR = Path(__file__).resolve().parent.parent  # demo/backend/
ML_DIR = BASE_DIR / "ml"
model = joblib.load(ML_DIR / "rural_model.joblib")
```

**Usar opción 2** — más robusto, funciona desde cualquier cwd, y Docker lo maneja correctamente.

---

## Riesgos y preguntas abiertas

Ver `99_open_questions.md` puntos 4, 6, 7 para decisiones pendientes que afectan esta fase:
- **#4 (manejo de errores):** formato de error, retries
- **#6 (CORS):** origins permitidos en producción
- **#7 (performance SHAP):** medir latencia antes de optimizar

**Riesgos específicos de Fase 1:**
- `shap.TreeExplainer` puede ser lento con n_estimators=692 → medir en primer test
- `joblib.load` con sklearn 1.7.2 debe usar la misma versión en producción o falla → pinear versión exacta en `requirements.txt`
- SMOTE reproducibility: `random_state=SEED` en SMOTE es suficiente, pero verificar que el mismo script produce el mismo modelo byte-a-byte
- El dataset actual tiene 319 filas; si se agregaran más, `RECORDED_OPTUNA_PARAMS` podría no ser óptimo

---

## Verificación

```bash
# 1. Exportar modelo
cd demo/backend && python scripts/export_models.py
# Verifica: ml/rural_model.joblib, ml/rural_scaler.joblib, ml/feature_config.json existen

# 2. Levantar API
uvicorn app.main:app --reload

# 3. Test predict
curl -X POST http://localhost:8000/predict/rural \
  -H "Content-Type: application/json" \
  -d '{"features":{"Age":45,"Gender":1,"Comorbidity":1,"CAD":0,"Hypothyroidism":0,"Hyperlipidemia":1,"DM":0,"Height":170,"Weight":82,"BMI":28.4,"TBW":38.5,"ECW":15.2,"ICW":23.3,"ECF_TBW":0.39,"TBFR":32.1,"LM":52.6,"Protein":14.1,"VFR":12,"BM":3.2,"MM":49.5,"Obesity":1,"TFC":28.4,"VFA":145,"VMA":95,"HFA":0.42}}'
# → {"probability": float, "risk_level": string, "threshold_used": 0.45}

# 4. Test explain
curl -X POST http://localhost:8000/explain/rural \
  -H "Content-Type: application/json" \
  -d '{"features":{...mismo payload...}}'
# → {"shap_values": {...}, "base_value": float}

# 5. OpenAPI docs
# Navegar a http://localhost:8000/docs
```
