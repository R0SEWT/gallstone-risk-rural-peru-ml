# Portafolio ML: réplica de paper + adaptación rural para Perú

## Resumen ejecutivo
Este repositorio documenta un proyecto de machine learning sobre predicción de cálculos biliares a partir de variables clínicas, antropométricas y de bioimpedancia. El trabajo original tuvo dos objetivos:

1. reproducir el enfoque publicado en un paper de 2024,
2. rediseñar el problema para un escenario de tamizaje rural en Perú, eliminando la dependencia de pruebas de laboratorio.

La versión pública de este repo está pensada como caso de estudio para portafolio DS/ML: deja dos notebooks finales ejecutados, resultados comparables, figuras estáticas para GitHub y una narrativa centrada en decisiones de modelado, tradeoffs y límites de despliegue.

## Problema y contexto sanitario
El paper original trabaja sobre predicción temprana de cálculos biliares usando una combinación de variables demográficas, bioimpedancia y laboratorio. La adaptación que hicimos cambia el objetivo práctico: en lugar de asumir acceso a exámenes clínicos, se formula un modelo de **tamizaje y priorización de riesgo** que podría apoyar brigadas de salud, visitas domiciliarias o campañas en zonas rurales del Perú.

El punto importante es el cambio de restricción operativa:

- la réplica completa busca fidelidad metodológica,
- la versión rural busca reducir fricción de captura de datos,
- el resultado final no se presenta como diagnóstico clínico ni como sistema listo para despliegue.

## Dataset y paper fuente
- Dataset base: [Gallstone - UCI Machine Learning Repository](https://www.archive.ics.uci.edu/dataset/1150/gallstone-1)
- Paper fuente: [Early prediction of gallstone disease with a machine learning-based method from bioimpedance and laboratory data](https://pubmed.ncbi.nlm.nih.gov/38394521/)
- DOI del paper/dataset: `10.1097/MD.0000000000037258`

Notas de trazabilidad:

- El paper fue publicado en `Medicine` en febrero de 2024.
- La ficha actual de UCI indica que los datos provienen de Ankara, Turquía.
- El archivo incluido en este repo (`data/dataset-uci.xlsx`) contiene `319` registros y `38` predictores más la variable objetivo.
- El paper describe datos originalmente disponibles por solicitud; este repo usa la release pública posterior en UCI.
- La release pública actual no coincide de forma perfecta con la descripción narrativa del paper en conteo y naming de variables; la reconciliación detallada se mantiene en la documentación interna del proyecto.

## Cómo está organizado el caso de estudio
### 1. Réplica del paper
- Usa el dataset completo.
- Mantiene división estratificada `70/30`.
- Escala variables con `StandardScaler`.
- Replica la selección de `32` variables con ANOVA F-score.
- Compara cinco modelos base: Logistic Regression, Random Forest, Gradient Boosting, XGBoost y CatBoost.
- Rejuega de forma determinista la mejor configuración de `Gradient Boosting + SMOTE + Optuna` registrada en el experimento original.

Notebook: [`notebooks/01_replicacion_paper.ipynb`](notebooks/01_replicacion_paper.ipynb)

### 2. Adaptación rural para Perú
- Conserva solo variables medibles en campo: demografía, comorbilidades, antropometría y bioimpedancia.
- Elimina variables de laboratorio para simular una captura de datos factible fuera de un entorno clínico completo.
- Mantiene el mismo esquema de evaluación para poder comparar pérdida de rendimiento frente al escenario completo.

Notebook: [`notebooks/02_adaptacion_rural_peru.ipynb`](notebooks/02_adaptacion_rural_peru.ipynb)

## Variables que se conservaron y variables que se retiraron
### Variables conservadas en la versión rural
- Edad, género e historial de comorbilidades.
- Altura, peso, BMI.
- Medidas de bioimpedancia: `TBW`, `ECW`, `ICW`, `ECF_TBW`, `TBFR`, `LM`, `Protein`, `VFR`, `BM`, `MM`, `Obesity`, `TFC`, `VFA`, `VMA`, `HFA`.

### Variables excluidas por requerir laboratorio
- `Glucose`
- `TC`
- `LDL`
- `HDL`
- `Triglyceride`
- `AST`
- `ALT`
- `ALP`
- `Creatinine`
- `GFR`
- `CRP`
- `HGB`
- `VitaminD`

## Resultados comparativos
| Escenario | Mejor benchmark | Accuracy | AUC |
| --- | --- | ---: | ---: |
| Réplica completa | XGBoost | 0.8542 | 0.9015 |
| Réplica completa | GB Optimizado (SMOTE + Optuna) | 0.8854 | 0.9280 |
| Adaptación rural | XGBoost | 0.7500 | 0.8069 |
| Adaptación rural | GB Optimizado (SMOTE + Optuna) | 0.7708 | 0.8138 |

Lectura técnica rápida:

- La réplica completa reproduce el orden de magnitud reportado por el paper y mejora el benchmark con `Gradient Boosting + SMOTE`.
- La versión rural pierde rendimiento frente al escenario completo, pero mantiene señal predictiva útil aun sin laboratorio.
- El tradeoff que interesa al portafolio no es “máxima accuracy”, sino “qué rendimiento se conserva cuando el costo operativo de medir variables baja de forma importante”.

## Figuras clave
### Resumen comparativo
![Resumen comparativo de métricas](figures/metrics_comparison.png)

### Matriz de confusión del escenario rural
![Matriz de confusión rural](figures/rural_confusion_matrix.png)

### Importancia de variables del escenario rural
![Importancia SHAP rural](figures/rural_feature_importance.png)

## Tecnologías, arquitectura y despliegue
### Runtime view
![Diagrama runtime del demo](demo/frontend/public/architecture/gallstone_runtime_architecture.png)

### Delivery view
![Diagrama de delivery del demo](demo/frontend/public/architecture/gallstone_delivery_architecture.png)

### Vista rápida
- **Frontend público:** `demo/frontend`, desplegado en Vercel bajo el subdominio `gallstone.rosewt.dev`.
- **Backend ML:** `demo/backend`, desplegado como Docker Space en Hugging Face y consumido desde el frontend vía `NEXT_PUBLIC_API_URL`.
- **Chat guiado:** `demo/frontend/app/api/chat/route.ts`, ejecutado server-side en Next.js y conectado a DeepSeek; no realiza la predicción ML.
- **Artefactos del modelo:** `demo/backend/models/`, empaquetados dentro del backend y cargados al arranque de FastAPI.

### Stack por capa
| Capa | Stack principal | Rol |
| --- | --- | --- |
| Frontend | `Next.js 16`, `React 19`, `Tailwind CSS 4`, `Framer Motion`, `Zustand` | Landing, flujo `/consulta` → `/medicion` → `/resultado`, estado de sesión y consumo de la API |
| Chat guiado | `Route Handler /api/chat`, `AI SDK`, `@ai-sdk/openai`, `DeepSeek API` | Entrevista conversacional para capturar las 9 variables iniciales |
| Backend ML | `Python 3.12`, `FastAPI`, `Uvicorn`, `Pydantic`, `scikit-learn`, `SHAP`, `NumPy`, `joblib` | Endpoints de salud, metadata, predicción, explicación y generación de bioimpedancia |
| Infraestructura | `Vercel`, `Hugging Face Spaces`, `Docker`, `GitHub` | Hosting del frontend, despliegue del backend y source of truth del proyecto |

### Cómo se conecta todo
- El usuario entra por `gallstone.rosewt.dev`, que sirve el frontend desde Vercel.
- El frontend llama al backend FastAPI publicado en Hugging Face Spaces para `health`, `model/info`, `predict/rural`, `explain/rural` y `generate/bioimpedance`.
- La entrevista médica simulada corre aparte en `/api/chat` y usa DeepSeek solo para extraer datos conversacionales.
- La inferencia clínica no depende de un endpoint externo de modelos: el backend lleva sus artefactos dentro del contenedor.

### Dónde se cargan los modelos
- `demo/backend/app/main.py` ejecuta `predictor.load_artifacts()` durante el `lifespan` de FastAPI.
- `demo/backend/app/predictor.py` carga desde `demo/backend/models/` estos archivos:
  - `rural_gb_pipeline.joblib`
  - `bioimpedance_templates.json`
  - `rural_metrics.json`
- En ese mismo arranque se inicializa el `TreeExplainer` de SHAP sobre el bloque `gb` del pipeline rural.

### Despliegue
- Vercel publica el frontend y atiende el subdominio `gallstone.rosewt.dev`.
- `scripts/deploy_hf_space.sh` sincroniza `demo/backend/` hacia el Space de Hugging Face.
- El backend expone CORS para `https://gallstone.rosewt.dev` y para previews `*.vercel.app`.

## Limitaciones
- El dataset es pequeño: `319` casos.
- No hay validación externa ni cohortes de Perú.
- Los datos provienen de un hospital en Turquía, no de operativos rurales peruanos.
- La bioimpedancia del dataset no garantiza equivalencia con sensores portátiles de campo.
- La pieza no cubre calibración clínica, análisis de costo por error, ni evaluación prospectiva.
- El uso razonable del modelo, con la evidencia actual, es tamizaje/priorización y no diagnóstico.

## Autoría
Proyecto desarrollado por:
- **Rody Vilchez** — UPC
- **Alejandro Untiveros** — PUCP
- **Alejandro Gutierrez** — PUCP
- **Elizabeth Cruces** — UNMSM

Este repositorio es una extensión del caso de estudio original: el equipo diseñó y ejecutó tanto la réplica experimental como la reformulación rural. La versión pública consolida ese trabajo en una estructura reproducible con narrativa técnica de portafolio.

## Documentación interna
El repositorio se mantiene además con una vault interna en Markdown bajo `.vault/`, pensada como docs-as-code para entrevistas, narrativa del proyecto y seguimiento profesional. Esa capa convive con la documentación pública, pero excluye notas privadas o sensibles.

## Reproducibilidad
Instalación:

```bash
python -m pip install -r requirements.txt
```

Regenerar notebooks y figuras:

```bash
python scripts/build_portfolio_assets.py
```

Regenerar el diagrama de arquitectura:

```bash
python scripts/architecture_mingrammer.py
```

Ese render genera las vistas `runtime` y `delivery`, y necesita `diagrams` más el binario local de Graphviz (`dot`).

Auditoría del paper y validación metodológica adicional:

```bash
python scripts/build_ml_validation_reports.py
```

Eso vuelve a crear:

- `notebooks/01_replicacion_paper.ipynb`
- `notebooks/02_adaptacion_rural_peru.ipynb`
- `figures/metrics_comparison.png`
- `figures/rural_confusion_matrix.png`
- `figures/rural_feature_importance.png`
- `results/ml/` con reportes de validación repetida, curvas y tablas de thresholds

## Licencia
El código y la documentación de este repositorio se publican bajo licencia MIT. El dataset y el paper fuente mantienen sus propios términos de uso y atribución.

## Estructura del repo
```text
.
├── .vault/
├── README.md
├── LICENSE
├── requirements.txt
├── data/
├── figures/
├── notebooks/
├── results/
├── scripts/
└── archive/
```

`archive/` conserva los notebooks históricos y exploratorios del trabajo original, pero no forma parte de la pieza final de portafolio.
