---
purpose: Centralizar métricas, fuentes verificables y claims permitidos o prohibidos.
last_updated: 2026-04-10
source_of_truth: ../figures/replica_metrics.json
status: ready
---

# Métricas y claims

## Tabla maestra de métricas
| Escenario | Estrategia | Accuracy | AUC | Fuente |
| --- | --- | ---: | ---: | --- |
| Réplica completa | XGBoost benchmark | 0.8542 | 0.9015 | [../figures/replica_metrics.json](../figures/replica_metrics.json) |
| Réplica completa | GB Optimizado (SMOTE + Optuna) | 0.8854 | 0.9280 | [../figures/replica_metrics.json](../figures/replica_metrics.json) |
| Adaptación rural | XGBoost benchmark | 0.7500 | 0.8069 | [../figures/rural_metrics.json](../figures/rural_metrics.json) |
| Adaptación rural | GB Optimizado (SMOTE + Optuna) | 0.7708 | 0.8138 | [../figures/rural_metrics.json](../figures/rural_metrics.json) |

## Fuentes canónicas
- Resumen público del proyecto: [../README.md](../README.md)
- Notebook de réplica: [../notebooks/01_replicacion_paper.ipynb](../notebooks/01_replicacion_paper.ipynb)
- Notebook de adaptación rural: [../notebooks/02_adaptacion_rural_peru.ipynb](../notebooks/02_adaptacion_rural_peru.ipynb)
- Reporte JSON réplica: [../figures/replica_metrics.json](../figures/replica_metrics.json)
- Reporte JSON rural: [../figures/rural_metrics.json](../figures/rural_metrics.json)
- Dataset UCI: [Gallstone - UCI Machine Learning Repository](https://www.archive.ics.uci.edu/dataset/1150/gallstone-1)
- Paper fuente: [PubMed 38394521](https://pubmed.ncbi.nlm.nih.gov/38394521/)
- Trazabilidad paper/dataset/repo: [18_paper_traceability.md](./18_paper_traceability.md)
- Validación metodológica adicional: [../results/ml/README.md](../results/ml/README.md)

## Claims aprobados
- “Replicamos una metodología publicada para predicción de cálculos biliares con el dataset público asociado.”
- “Luego adaptamos el problema para un escenario rural sin pruebas de laboratorio.”
- “La versión rural conserva señal predictiva útil, aunque con menor rendimiento que el escenario completo.”
- “El framing correcto del proyecto es screening/priorización de riesgo.”
- “El proyecto demuestra reproducción metodológica y adaptación a restricciones operativas.”
- “El paper reporta `Gradient Boosting` con `85.42%` accuracy en su split 70/30.”
- “La release pública actual en UCI no coincide de forma perfecta con la descripción narrativa del paper y esa discrepancia está documentada.”

## Claims prohibidos
- “El modelo está listo para despliegue clínico.”
- “El modelo diagnostica cálculos biliares en población peruana.”
- “La solución fue validada en campo en Perú.”
- “El rendimiento prueba efectividad clínica.”
- “La versión rural reemplaza laboratorio.”
- “La release UCI coincide 1:1 con el paper sin discrepancias.”
- “La codificación de clases quedó resuelta de forma definitiva por el artículo.”

## Nota operativa
Cuando una entrevista o publicación requiera citar números, usar siempre las métricas de esta página y no valores recordados de memoria.

## Nota sobre métricas repetidas
Las métricas de esta página son las que sostienen hoy la pieza pública del repo. La validación metodológica más estricta por CV repetida vive aparte en `results/ml/` y sirve para discusión técnica, no para reemplazar automáticamente el framing público sin reinterpretación.
