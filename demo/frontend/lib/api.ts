import type { Bioimpedance, ModelInfo, RiskLevel } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export interface PredictResult {
  probability: number;
  risk_level: RiskLevel;
  threshold_used: number;
}

export interface ExplainResult {
  shap_values: Record<string, number>;
  base_value: number;
}

export function predictRural(features: Record<string, number>) {
  return request<PredictResult>("/predict/rural", {
    method: "POST",
    body: JSON.stringify({ features }),
  });
}

export function explainRural(features: Record<string, number>) {
  return request<ExplainResult>("/explain/rural", {
    method: "POST",
    body: JSON.stringify({ features }),
  });
}

export function generateBioimpedance(params: {
  age: number;
  gender: number;
  height: number;
  weight: number;
  bmi: number;
}) {
  return request<{ features: Bioimpedance }>("/generate/bioimpedance", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getModelInfo() {
  return request<ModelInfo>("/model/info");
}

export function warmUp() {
  return fetch(`${API_URL}/health`, { cache: "no-store" }).catch(() => null);
}
