"""Pydantic models and canonical feature order."""
from __future__ import annotations

from typing import Dict, Literal

from pydantic import BaseModel, Field, field_validator

FEATURE_ORDER: list[str] = [
    "Age", "Gender", "Comorbidity", "CAD", "Hypothyroidism",
    "Hyperlipidemia", "DM", "Height", "Weight", "BMI",
    "TBW", "ECW", "ICW", "ECF_TBW", "TBFR", "LM", "Protein",
    "VFR", "BM", "MM", "Obesity", "TFC", "VFA", "VMA", "HFA",
]

FEATURE_SET = frozenset(FEATURE_ORDER)

RiskLevel = Literal["bajo", "moderado", "alto"]


class PredictRequest(BaseModel):
    features: Dict[str, float]

    @field_validator("features")
    @classmethod
    def _require_all_features(cls, value: Dict[str, float]) -> Dict[str, float]:
        missing = FEATURE_SET - value.keys()
        extra = value.keys() - FEATURE_SET
        if missing:
            raise ValueError(f"Missing features: {sorted(missing)}")
        if extra:
            raise ValueError(f"Unknown features: {sorted(extra)}")
        return value


class PredictResponse(BaseModel):
    probability: float
    risk_level: RiskLevel
    threshold_used: float = 0.45


class ExplainResponse(BaseModel):
    shap_values: Dict[str, float]
    base_value: float


class BioimpedanceRequest(BaseModel):
    age: float = Field(..., ge=0, le=120)
    gender: int = Field(..., ge=0, le=1)
    height: float = Field(..., ge=50, le=250)
    weight: float = Field(..., ge=20, le=300)
    bmi: float = Field(..., ge=10, le=80)


class BioimpedanceResponse(BaseModel):
    features: Dict[str, float]
