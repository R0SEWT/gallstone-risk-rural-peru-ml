---
purpose: Fuente única de verdad para los tipos compartidos entre frontend y backend. Referenciado desde Fases 1-4.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: active
---

# Data Contracts — Tipos compartidos FE/BE

Este documento centraliza las definiciones de tipos que cruzan la frontera frontend/backend. Los planes de fase referencian este archivo en lugar de duplicar las estructuras.

**Regla:** Si un tipo cambia aquí, actualizar los consumidores en el mismo PR. Si un plan de fase contradice este archivo, este archivo gana.

---

## 1. Las 25 features del modelo rural

Orden canónico (importa — el scaler y el modelo esperan este orden exacto):

```
[
  "Age", "Gender", "Comorbidity", "CAD", "Hypothyroidism",
  "Hyperlipidemia", "DM", "Height", "Weight", "BMI",
  "TBW", "ECW", "ICW", "ECF_TBW", "TBFR",
  "LM", "Protein", "VFR", "BM", "MM",
  "Obesity", "TFC", "VFA", "VMA", "HFA"
]
```

Origen: `RURAL_FEATURES` en `scripts/portfolio_pipeline.py:49-91`.

### Clasificación por acto

| Origen | Features | Cómo se obtienen |
|--------|----------|------------------|
| Acto 1 (chat) | Age, Gender, Comorbidity, CAD, Hypothyroidism, Hyperlipidemia, DM, Height, Weight | Extracción del LLM doctor |
| Acto 1 (derivado) | BMI | `Weight / (Height/100)²` en el cliente |
| Acto 2 (animación) | TBW, ECW, ICW, ECF_TBW, TBFR, LM, Protein, VFR, BM, MM, Obesity, TFC, VFA, VMA, HFA | Generación por template (ver Fase 4) |

**Total:** 9 del chat + 1 derivado + 15 generados = **25 features**.

### Rangos de validación

Rangos con margen respecto al dataset. Usados por Pydantic (backend) y por el form de fallback (frontend).

| Feature | Tipo | Min | Max | Notas |
|---------|------|-----|-----|-------|
| Age | int | 18 | 100 | Años |
| Gender | int | 0 | 1 | 0=femenino, 1=masculino |
| Comorbidity | int | 0 | 1 | Cualquier condición crónica |
| CAD | int | 0 | 1 | Enfermedad coronaria |
| Hypothyroidism | int | 0 | 1 | — |
| Hyperlipidemia | int | 0 | 1 | Colesterol/triglicéridos altos |
| DM | int | 0 | 1 | Diabetes |
| Height | float | 100 | 220 | cm |
| Weight | float | 30 | 200 | kg |
| BMI | float | 10 | 60 | kg/m² |
| TBW | float | 15 | 70 | L |
| ECW | float | 5 | 30 | L |
| ICW | float | 10 | 45 | L |
| ECF_TBW | float | 0.3 | 0.5 | ratio |
| TBFR | float | 5 | 60 | % |
| LM | float | 20 | 90 | kg |
| Protein | float | 5 | 25 | kg |
| VFR | int | 1 | 30 | nivel |
| BM | float | 1 | 6 | kg |
| MM | float | 15 | 80 | kg |
| Obesity | int | 0 | 3 | grado |
| TFC | float | 5 | 80 | kg |
| VFA | float | 10 | 350 | cm² |
| VMA | float | 30 | 180 | cm² |
| HFA | float | 0.1 | 1.5 | ratio |

**Nota:** Los rangos exactos se calculan desde `dataset-uci.xlsx` al exportar el modelo y se sobrescriben en `feature_config.json` por el script `export_models.py`. Los valores de la tabla son placeholders seguros.

---

## 2. Pydantic schemas (backend)

**Archivo:** `demo/backend/app/models.py`

```python
from pydantic import BaseModel, Field, field_validator
from typing import Literal

# Orden canónico de features — mismo que feature_config.json
FEATURE_ORDER = [
    "Age", "Gender", "Comorbidity", "CAD", "Hypothyroidism",
    "Hyperlipidemia", "DM", "Height", "Weight", "BMI",
    "TBW", "ECW", "ICW", "ECF_TBW", "TBFR",
    "LM", "Protein", "VFR", "BM", "MM",
    "Obesity", "TFC", "VFA", "VMA", "HFA",
]


class PredictRequest(BaseModel):
    features: dict[str, float]

    @field_validator("features")
    @classmethod
    def validate_features(cls, v: dict[str, float]) -> dict[str, float]:
        missing = set(FEATURE_ORDER) - set(v.keys())
        if missing:
            raise ValueError(f"Missing features: {sorted(missing)}")
        extra = set(v.keys()) - set(FEATURE_ORDER)
        if extra:
            raise ValueError(f"Unexpected features: {sorted(extra)}")
        return v


class PredictResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: Literal["bajo", "moderado", "alto"]
    threshold_used: float


class ExplainResponse(BaseModel):
    shap_values: dict[str, float]  # top 7 por |valor|
    base_value: float


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: dict | None = None


class ModelInfo(BaseModel):
    algorithm: str
    training_samples: int
    features: int
    accuracy: float
    auc: float
    threshold_recommended: float
    seed: int
    feature_order: list[str]
```

---

## 3. TypeScript interfaces (frontend)

**Archivo:** `demo/frontend/src/lib/types.ts`

```typescript
// === Datos del paciente recogidos por acto ===

export interface Demographics {
  Age: number;
  Gender: 0 | 1;          // 0=femenino, 1=masculino
  Comorbidity: 0 | 1;
  CAD: 0 | 1;
  Hypothyroidism: 0 | 1;
  Hyperlipidemia: 0 | 1;
  DM: 0 | 1;
  Height: number;          // cm
  Weight: number;          // kg
}

export interface Bioimpedance {
  BMI: number;
  TBW: number;
  ECW: number;
  ICW: number;
  ECF_TBW: number;
  TBFR: number;
  LM: number;
  Protein: number;
  VFR: number;
  BM: number;
  MM: number;
  Obesity: number;
  TFC: number;
  VFA: number;
  VMA: number;
  HFA: number;
}

// === Payload completo para el backend ===

export type PatientFeatures = Demographics & Bioimpedance;

// === Respuestas del backend ===

export type RiskLevel = 'bajo' | 'moderado' | 'alto';

export interface PredictResponse {
  probability: number;
  risk_level: RiskLevel;
  threshold_used: number;
}

export interface ExplainResponse {
  shap_values: Record<string, number>;
  base_value: number;
}

export interface Prediction extends PredictResponse {
  shap: ExplainResponse;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ModelInfo {
  algorithm: string;
  training_samples: number;
  features: number;
  accuracy: number;
  auc: number;
  threshold_recommended: number;
  seed: number;
  feature_order: string[];
}

// === Orden canónico — debe coincidir con FEATURE_ORDER de Python ===

export const FEATURE_ORDER = [
  'Age', 'Gender', 'Comorbidity', 'CAD', 'Hypothyroidism',
  'Hyperlipidemia', 'DM', 'Height', 'Weight', 'BMI',
  'TBW', 'ECW', 'ICW', 'ECF_TBW', 'TBFR',
  'LM', 'Protein', 'VFR', 'BM', 'MM',
  'Obesity', 'TFC', 'VFA', 'VMA', 'HFA',
] as const;

export type FeatureName = typeof FEATURE_ORDER[number];
```

---

## 4. Mapeo de feature names a labels en español

Usado por `ShapWaterfall` (Fase 2) y `MetricCard` (Fase 4). Única fuente de verdad:

**Archivo:** `demo/frontend/src/lib/feature-labels.ts`

```typescript
export const FEATURE_LABELS: Record<string, { label: string; unit?: string }> = {
  Age: { label: 'Edad', unit: 'años' },
  Gender: { label: 'Género' },
  Comorbidity: { label: 'Comorbilidad' },
  CAD: { label: 'Enfermedad coronaria' },
  Hypothyroidism: { label: 'Hipotiroidismo' },
  Hyperlipidemia: { label: 'Hiperlipidemia' },
  DM: { label: 'Diabetes' },
  Height: { label: 'Altura', unit: 'cm' },
  Weight: { label: 'Peso', unit: 'kg' },
  BMI: { label: 'Índice de masa corporal', unit: 'kg/m²' },
  TBW: { label: 'Agua corporal total', unit: 'L' },
  ECW: { label: 'Agua extracelular', unit: 'L' },
  ICW: { label: 'Agua intracelular', unit: 'L' },
  ECF_TBW: { label: 'Ratio agua extracelular' },
  TBFR: { label: 'Grasa corporal', unit: '%' },
  LM: { label: 'Masa magra', unit: 'kg' },
  Protein: { label: 'Proteína', unit: 'kg' },
  VFR: { label: 'Nivel de grasa visceral' },
  BM: { label: 'Masa ósea', unit: 'kg' },
  MM: { label: 'Masa muscular', unit: 'kg' },
  Obesity: { label: 'Grado de obesidad' },
  TFC: { label: 'Grasa total', unit: 'kg' },
  VFA: { label: 'Área de grasa visceral', unit: 'cm²' },
  VMA: { label: 'Área muscular visceral', unit: 'cm²' },
  HFA: { label: 'Área de grasa hepática' },
};
```

---

## 5. Cálculo de risk_level

Lógica compartida por backend (lo devuelve) y frontend (lo puede recomputar si necesario):

| Probabilidad | risk_level |
|-------------|------------|
| `< 0.35` | `"bajo"` |
| `0.35 ≤ p < 0.55` | `"moderado"` |
| `p ≥ 0.55` | `"alto"` |

**Threshold operativo del modelo:** 0.45 (para `predict_binary`, si se necesita).
**Threshold recomendado en model card:** 0.45 (recall 0.69, specificity 0.75).

**Nota:** El color continuo del gauge (Fase 2) no usa estos cortes — interpola gradiente sobre `[0, 1]`. Los cortes solo son para el texto categórico.

---

## 6. Ejemplo de request completo (para tests y curl)

```json
{
  "features": {
    "Age": 45,
    "Gender": 1,
    "Comorbidity": 1,
    "CAD": 0,
    "Hypothyroidism": 0,
    "Hyperlipidemia": 1,
    "DM": 0,
    "Height": 170,
    "Weight": 82,
    "BMI": 28.4,
    "TBW": 38.5,
    "ECW": 15.2,
    "ICW": 23.3,
    "ECF_TBW": 0.39,
    "TBFR": 32.1,
    "LM": 52.6,
    "Protein": 14.1,
    "VFR": 12,
    "BM": 3.2,
    "MM": 49.5,
    "Obesity": 1,
    "TFC": 28.4,
    "VFA": 145,
    "VMA": 95,
    "HFA": 0.42
  }
}
```

Respuesta esperada de `/predict/rural`:
```json
{
  "probability": 0.72,
  "risk_level": "alto",
  "threshold_used": 0.45
}
```

Respuesta esperada de `/explain/rural` (top 7):
```json
{
  "shap_values": {
    "VFA": 0.142,
    "Age": 0.089,
    "BMI": 0.073,
    "TBW": -0.051,
    "Hyperlipidemia": 0.044,
    "TBFR": 0.038,
    "LM": -0.027
  },
  "base_value": 0.49
}
```

---

## Checklist de sincronización

Cuando un tipo cambia, verificar en orden:

- [ ] `FEATURE_ORDER` en `models.py` (Python)
- [ ] `FEATURE_ORDER` en `types.ts` (TypeScript)
- [ ] `feature_config.json` generado por `export_models.py`
- [ ] Rangos en Pydantic `PredictRequest` si añadiste validación
- [ ] Mapeo en `FEATURE_LABELS` si el feature es nuevo
- [ ] Ejemplo curl en este documento
- [ ] Tests de contrato (si existen)

Si los dos `FEATURE_ORDER` divergen, el backend rechazará requests y el frontend enviará campos faltantes — error silencioso en el peor caso.
