export const FEATURE_ORDER = [
  "Age", "Gender", "Comorbidity", "CAD", "Hypothyroidism",
  "Hyperlipidemia", "DM", "Height", "Weight", "BMI",
  "TBW", "ECW", "ICW", "ECF_TBW", "TBFR", "LM", "Protein",
  "VFR", "BM", "MM", "Obesity", "TFC", "VFA", "VMA", "HFA",
] as const;

export type FeatureKey = (typeof FEATURE_ORDER)[number];

export const FEATURE_LABELS: Record<string, string> = {
  Age: "Edad",
  Gender: "Género",
  Comorbidity: "Comorbilidad",
  CAD: "Enfermedad coronaria",
  Hypothyroidism: "Hipotiroidismo",
  Hyperlipidemia: "Hiperlipidemia",
  DM: "Diabetes mellitus",
  Height: "Estatura (cm)",
  Weight: "Peso (kg)",
  BMI: "Índice de masa corporal",
  TBW: "Agua corporal total",
  ECW: "Agua extracelular",
  ICW: "Agua intracelular",
  ECF_TBW: "Ratio ECW/TBW",
  TBFR: "% grasa corporal",
  LM: "Masa magra",
  Protein: "Proteína",
  VFR: "Grasa visceral",
  BM: "Masa ósea",
  MM: "Masa muscular",
  Obesity: "Grado de obesidad",
  TFC: "Contenido graso total",
  VFA: "Área grasa visceral",
  VMA: "Área muscular visceral",
  HFA: "Área grasa hepática",
};

export interface Demographics {
  Age: number;
  Gender: number;
  Comorbidity: number;
  CAD: number;
  Hypothyroidism: number;
  Hyperlipidemia: number;
  DM: number;
  Height: number;
  Weight: number;
  BMI: number;
}

export interface Bioimpedance {
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

export type RiskLevel = "bajo" | "moderado" | "alto";

export interface Prediction {
  probability: number;
  risk_level: RiskLevel;
  shap_values: Record<string, number>;
  base_value: number;
}

export interface ModelInfo {
  scenario: string;
  dataset_shape: [number, number];
  feature_count: number;
  optimized_accuracy: number;
  optimized_auc: number;
  best_benchmark_name: string;
  best_benchmark_accuracy: number;
  best_benchmark_auc: number;
}
