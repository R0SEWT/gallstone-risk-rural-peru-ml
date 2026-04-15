"""Singleton model + SHAP explainer + bioimpedance template generator."""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import shap

from .schemas import FEATURE_ORDER

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

BIOIMPEDANCE_FEATURES: list[str] = [
    "TBW", "ECW", "ICW", "ECF_TBW", "TBFR",
    "LM", "Protein", "VFR", "BM", "MM",
    "Obesity", "TFC", "VFA", "VMA", "HFA",
]

_pipeline: Any = None
_explainer: Any = None
_templates: dict[str, dict[str, float]] | None = None
_metrics: dict | None = None


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


def load_artifacts() -> None:
    global _pipeline, _explainer, _templates, _metrics
    pipeline_path = MODELS_DIR / "rural_gb_pipeline.joblib"
    templates_path = MODELS_DIR / "bioimpedance_templates.json"
    metrics_path = MODELS_DIR / "rural_metrics.json"

    _pipeline = joblib.load(pipeline_path)
    _explainer = shap.TreeExplainer(_pipeline["gb"])
    _templates = json.loads(templates_path.read_text())
    if metrics_path.exists():
        _metrics = json.loads(metrics_path.read_text())


def is_model_loaded() -> bool:
    return _pipeline is not None


def is_explainer_loaded() -> bool:
    return _explainer is not None


def get_metrics() -> dict | None:
    return _metrics


def _risk_level(prob: float) -> str:
    if prob < 0.35:
        return "bajo"
    if prob < 0.55:
        return "moderado"
    return "alto"


def _to_array(features: dict[str, float]) -> np.ndarray:
    return np.array([[features[f] for f in FEATURE_ORDER]], dtype=float)


def predict(features: dict[str, float]) -> tuple[float, str]:
    if _pipeline is None:
        raise RuntimeError("Pipeline not loaded")
    X = _to_array(features)
    X_scaled = _pipeline["scaler"].transform(X)
    prob = float(_pipeline["gb"].predict_proba(X_scaled)[0, 1])
    return prob, _risk_level(prob)


def explain(features: dict[str, float]) -> tuple[dict[str, float], float]:
    if _pipeline is None or _explainer is None:
        raise RuntimeError("Model or explainer not loaded")
    X = _to_array(features)
    X_scaled = _pipeline["scaler"].transform(X)
    shap_values = _explainer.shap_values(X_scaled, check_additivity=False)

    # Binary GB classifier: shap_values is (n_samples, n_features) for positive class
    if isinstance(shap_values, list):
        sv_row = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
    else:
        sv_row = shap_values[0]

    ev = _explainer.expected_value
    if isinstance(ev, (list, np.ndarray)):
        ev_scalar = float(ev[1]) if len(ev) > 1 else float(ev[0])
    else:
        ev_scalar = float(ev)

    return (
        {FEATURE_ORDER[i]: float(sv_row[i]) for i in range(len(FEATURE_ORDER))},
        ev_scalar,
    )


def generate_bioimpedance(
    age: float,
    gender: int,
    height: float,
    weight: float,
    bmi: float,
) -> dict[str, float]:
    if _templates is None:
        raise RuntimeError("Templates not loaded")

    key = f"{_age_bucket(age)}_{int(gender)}"
    template = _templates.get(key) or _templates["default"]

    rng = random.Random(int(age * 1000 + weight * 10 + height))
    result: dict[str, float] = {}
    for feat in BIOIMPEDANCE_FEATURES:
        base = template[feat]
        perturbation = 1.0 + rng.uniform(-0.03, 0.03)
        result[feat] = round(base * perturbation, 3)
    return result
