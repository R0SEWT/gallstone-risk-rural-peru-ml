---
purpose: Plan orquestador de la demo gamificada de screening. Mapa de fases, dependencias y stack.
last_updated: 2026-04-12
source_of_truth: .claude/plans/wild-crafting-fairy.md
status: active
---

# Demo Gamificada — Plan Orquestador

## Visión
Convertir WinterProject en una pieza de portafolio de alto impacto para AI Engineer. Una demo interactiva en tres actos que vive en `demo/` dentro del monorepo.

## Los tres actos

| Acto | Nombre | Qué ve el usuario |
|------|--------|-------------------|
| 1 | La Consulta | Chat con doctor LLM que recoge historia clínica |
| 2 | La Medición | Animación de báscula de bioimpedancia midiendo métricas |
| 3 | El Resultado | Gauge de riesgo + SHAP + comparación lab vs bioimpedancia |

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind + Framer Motion + Zustand |
| LLM | DeepSeek API via Vercel AI SDK (`@ai-sdk/openai` con baseURL custom) |
| Backend ML | FastAPI (modelo serializado con joblib) |
| Deploy | Vercel (frontend) + Railway (backend) |

## Métricas de referencia

- **Modelo completo (con lab):** Accuracy 0.8854, AUC 0.9280
- **Modelo rural (sin lab):** Accuracy 0.7708, AUC 0.8138
- **Threshold screening:** 0.35 (recall 0.84) o 0.45 (recall 0.69, specificity 0.75)

## Mapa de fases

```
Fase 1 (Backend) ──→ Fase 2 (Acto 3: Resultados) ──→ Fase 3 (Acto 1: Chat)
                                                            │
                                                            ▼
                                                     Fase 4 (Acto 2: Animación)
                                                            │
                                                            ▼
                                                     Fase 5 (Polish + Deploy)
```

| Fase | Plan | Entregable | Dependencia |
|------|------|-----------|-------------|
| 1 | [01_fase_backend.md](./01_fase_backend.md) | FastAPI con `/predict/rural` y `/explain/rural` | Ninguna |
| 2 | [02_fase_resultados.md](./02_fase_resultados.md) | Página `/resultado` con gauge, SHAP, comparación | Fase 1 |
| 3 | [03_fase_consulta.md](./03_fase_consulta.md) | Página `/consulta` con chat LLM doctor | Fase 2 |
| 4 | [04_fase_bioimpedancia.md](./04_fase_bioimpedancia.md) | Página `/medicion` con animación de báscula | Fase 3 |
| 5 | [05_fase_deploy.md](./05_fase_deploy.md) | Demo deployada en Vercel + Railway | Fases 1-4 |

## Documentos transversales

| Doc | Propósito |
|-----|-----------|
| [06_data_contracts.md](./06_data_contracts.md) | Tipos compartidos FE/BE (Pydantic + TypeScript). Única fuente de verdad para los 25 features y las respuestas de la API. |
| [99_open_questions.md](./99_open_questions.md) | Decisiones pendientes detectadas durante la planificación. Revisar antes de arrancar cada fase. |

## Lógica de priorización
Acto 3 se construye antes que Acto 1 porque es el payoff visual. Si hay que recortar scope, el chat (Acto 1) puede ser un form simple y la animación (Acto 2) un loader. El resultado es el MVP irreducible.

## Archivos clave del repo

| Archivo | Qué tiene | Fases |
|---------|-----------|-------|
| `scripts/portfolio_pipeline.py:29-47` | `SEED`, `RECORDED_OPTUNA_PARAMS` | 1 |
| `scripts/portfolio_pipeline.py:49-91` | `RURAL_FEATURES`, `LAB_EXCLUDED_FEATURES` | 1, 3 |
| `scripts/portfolio_pipeline.py:277-337` | `_prepare_feature_matrices()` | 1 |
| `scripts/portfolio_pipeline.py:380-385` | `_apply_smote()` | 1 |
| `figures/replica_metrics.json` | AUC 0.9280, accuracy 0.8854 | 2 |
| `figures/rural_metrics.json` | AUC 0.8138, accuracy 0.7708 | 2 |
| `results/ml/rural_threshold_table.csv` | Thresholds con recall/specificity | 2 |
| `data/dataset-uci.xlsx` | Dataset fuente, 319 registros | 1 |
