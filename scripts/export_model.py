"""
Export trained rural GB model (sklearn Pipeline) and bioimpedance templates.

Run from the project root:
    python scripts/export_model.py

Outputs:
    demo/backend/models/rural_gb_pipeline.joblib
    demo/backend/models/bioimpedance_templates.json
    demo/backend/models/rural_metrics.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from portfolio_pipeline import (  # noqa: E402
    RECORDED_OPTUNA_PARAMS,
    RURAL_FEATURES,
    SEED,
    TARGET_COLUMN,
    _apply_smote,
    _load_dataset,
    set_global_seed,
)

BIOIMPEDANCE_FEATURES = [
    "TBW", "ECW", "ICW", "ECF_TBW", "TBFR",
    "LM", "Protein", "VFR", "BM", "MM",
    "Obesity", "TFC", "VFA", "VMA", "HFA",
]

DATA_PATH = ROOT / "data" / "dataset-uci.xlsx"
OUTPUT_DIR = ROOT / "demo" / "backend" / "models"


def _age_bucket(age: float) -> str:
    if age < 30:
        return "<30"
    if age < 40:
        return "30-39"
    if age < 50:
        return "40-49"
    if age < 60:
        return "50-59"
    return "60+"


def main() -> None:
    set_global_seed()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    df = _load_dataset(DATA_PATH)
    X = df[RURAL_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=SEED, stratify=y,
    )

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train),
        columns=X_train.columns,
        index=X_train.index,
    )

    X_train_smote, y_train_smote = _apply_smote(X_train_scaled, y_train)

    gb_params = RECORDED_OPTUNA_PARAMS["rural"]
    gb = GradientBoostingClassifier(random_state=SEED, **gb_params)
    gb.fit(X_train_smote, y_train_smote)

    pipeline = Pipeline([("scaler", scaler), ("gb", gb)])

    assert pipeline["gb"].n_features_in_ == 25, (
        f"Expected 25 features, got {pipeline['gb'].n_features_in_}"
    )

    X_test_scaled = scaler.transform(X_test)
    y_pred = gb.predict(X_test_scaled)
    y_proba = gb.predict_proba(X_test_scaled)[:, 1]
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print(f"Test Accuracy : {acc:.4f}")
    print(f"Test AUC      : {auc:.4f}")

    pipeline_path = OUTPUT_DIR / "rural_gb_pipeline.joblib"
    joblib.dump(pipeline, pipeline_path)
    print(f"Pipeline saved  → {pipeline_path}")

    metrics_src = ROOT / "figures" / "rural_metrics.json"
    if metrics_src.exists():
        metrics_dst = OUTPUT_DIR / "rural_metrics.json"
        metrics_dst.write_text(metrics_src.read_text())
        print(f"Metrics copied  → {metrics_dst}")

    df_templates = df.copy()
    df_templates["_age_bucket"] = df_templates["Age"].apply(_age_bucket)

    templates: dict = {}
    for (bucket, gender), group in df_templates.groupby(["_age_bucket", "Gender"]):
        key = f"{bucket}_{int(gender)}"
        templates[key] = {
            feat: float(group[feat].mean()) for feat in BIOIMPEDANCE_FEATURES
        }

    templates["default"] = {
        feat: float(df_templates[feat].mean()) for feat in BIOIMPEDANCE_FEATURES
    }

    templates_path = OUTPUT_DIR / "bioimpedance_templates.json"
    templates_path.write_text(json.dumps(templates, indent=2, ensure_ascii=False))
    print(f"Templates saved → {templates_path}")
    print(f"Template keys   : {sorted(templates.keys())}")


if __name__ == "__main__":
    main()
