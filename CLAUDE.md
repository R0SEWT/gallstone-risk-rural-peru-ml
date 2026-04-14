# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ML case study for gallstone disease prediction. Two experiments:
1. **Replica** — reproduces a 2024 paper using the full UCI dataset (319 records, 38 predictors)
2. **Rural adaptation** — drops lab variables to simulate field screening in rural Peru (bioimpedance + anthropometry only)

Dataset: `data/dataset-uci.xlsx`, target column: `GallstoneStatus`.

## Key Commands

```bash
# Install dependencies (Python 3.12)
python -m pip install -r requirements.txt

# Regenerate notebooks, figures, and metrics comparison
python scripts/build_portfolio_assets.py

# Run extended ML validation (repeated CV, calibration, threshold tables)
python scripts/build_ml_validation_reports.py
```

Both scripts are long-running (execute notebooks / cross-validation). No test suite exists.

## Architecture

The pipeline is split across three scripts in `scripts/`:

- **`portfolio_pipeline.py`** — core ML logic: data loading, feature definitions (`RURAL_FEATURES`, `LAB_EXCLUDED_FEATURES`), model training (LR, RF, GB, XGBoost, CatBoost), SMOTE + Optuna replay with `RECORDED_OPTUNA_PARAMS`, SHAP explanations, and figure export. Shared constants: `SEED=42`, `TARGET_COLUMN`, `DATA_SHEET`.
- **`build_portfolio_assets.py`** — generates the two Jupyter notebooks programmatically (not hand-edited), executes them via `nbclient`, then calls `save_metrics_comparison_figure` to produce `figures/metrics_comparison.png`.
- **`build_ml_validation_reports.py`** — deeper validation: repeated stratified CV (5×3), out-of-fold predictions, ROC/PR curves, calibration curves, threshold analysis, feature stability. Outputs go to `results/ml/`.

Notebooks in `notebooks/` are **generated artifacts** — edit the builder scripts, not the `.ipynb` files directly.

## Important Conventions

- All randomness uses `SEED = 42` from `portfolio_pipeline.py`. The `set_global_seed()` helper seeds Python, NumPy, and other RNGs.
- Optuna hyperparameters are recorded as constants (`RECORDED_OPTUNA_PARAMS`), not re-tuned at runtime — this ensures deterministic replay.
- `archive/` contains historical exploratory notebooks from the original group project; not part of the portfolio piece.
- `.vault/` is an internal Markdown workspace (interview prep, project narrative). `.vault/private/` is gitignored.
- The project language is Spanish for documentation/narrative and English for code identifiers.
