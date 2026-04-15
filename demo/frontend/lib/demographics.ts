import type { Demographics } from "./types";

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeHeight(height: number) {
  if (height > 0 && height < 3) {
    return height * 100;
  }

  return height;
}

function normalizeBinary(value: number) {
  return value >= 0.5 ? 1 : 0;
}

export function areDemographicsEqual(a: Demographics, b: Demographics) {
  return (
    a.Age === b.Age &&
    a.Gender === b.Gender &&
    a.Comorbidity === b.Comorbidity &&
    a.CAD === b.CAD &&
    a.Hypothyroidism === b.Hypothyroidism &&
    a.Hyperlipidemia === b.Hyperlipidemia &&
    a.DM === b.DM &&
    a.Height === b.Height &&
    a.Weight === b.Weight &&
    a.BMI === b.BMI
  );
}

export function coerceDemographics(
  input: Partial<Demographics>,
): Demographics | null {
  const age = parseNumber(input.Age);
  const gender = parseNumber(input.Gender);
  const comorbidity = parseNumber(input.Comorbidity);
  const cad = parseNumber(input.CAD);
  const hypothyroidism = parseNumber(input.Hypothyroidism);
  const hyperlipidemia = parseNumber(input.Hyperlipidemia);
  const dm = parseNumber(input.DM);
  const rawHeight = parseNumber(input.Height);
  const rawWeight = parseNumber(input.Weight);

  if (
    age == null ||
    gender == null ||
    comorbidity == null ||
    cad == null ||
    hypothyroidism == null ||
    hyperlipidemia == null ||
    dm == null ||
    rawHeight == null ||
    rawWeight == null
  ) {
    return null;
  }

  const height = Number(normalizeHeight(rawHeight).toFixed(2));
  const weight = Number(rawWeight.toFixed(2));
  const bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(2));

  const normalized: Demographics = {
    Age: Math.round(age),
    Gender: normalizeBinary(gender),
    Comorbidity: normalizeBinary(comorbidity),
    CAD: normalizeBinary(cad),
    Hypothyroidism: normalizeBinary(hypothyroidism),
    Hyperlipidemia: normalizeBinary(hyperlipidemia),
    DM: normalizeBinary(dm),
    Height: height,
    Weight: weight,
    BMI: bmi,
  };

  if (
    normalized.Age < 0 ||
    normalized.Age > 120 ||
    normalized.Height < 50 ||
    normalized.Height > 250 ||
    normalized.Weight < 20 ||
    normalized.Weight > 300 ||
    normalized.BMI < 10 ||
    normalized.BMI > 80
  ) {
    return null;
  }

  return normalized;
}
