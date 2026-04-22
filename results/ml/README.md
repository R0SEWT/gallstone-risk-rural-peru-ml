# Validación metodológica

Esta carpeta contiene la salida de `python scripts/build_ml_validation_reports.py`.

## Archivos principales
- `full_repeated_cv_summary.csv`: resumen de métricas por modelo en la réplica completa bajo CV repetida.
- `rural_repeated_cv_summary.csv`: resumen de métricas por modelo en el escenario rural.
- `rural_feature_scheme_summary.csv`: comparación de tres esquemas de selección de variables para el caso rural.
- `rural_threshold_table.csv`: tabla de umbrales del modelo calibrado para discutir screening.
- `rural_feature_stability.csv`: frecuencia de selección de variables rurales entre folds.
- `validation_manifest.json`: manifiesto mínimo de artefactos y metadatos.

## Figuras
- ![Boxplots CV completo](full_repeated_cv_boxplots.png)
- ![Boxplots CV rural](rural_repeated_cv_boxplots.png)
- ![Boxplots de variables rurales](rural_feature_scheme_boxplots.png)
- ![Curvas ROC y PR rurales](rural_roc_pr_curves.png)
- ![Curva de calibración rural](rural_calibration_curve.png)
- ![Tabla de umbrales rural](rural_threshold_table.png)
- ![Estabilidad de variables rural](rural_feature_stability.png)

## Lectura recomendada
1. `rural_repeated_cv_summary.csv`
2. ![Curva de calibración rural](rural_calibration_curve.png)
3. `rural_threshold_table.csv`
4. `rural_feature_stability.csv`
