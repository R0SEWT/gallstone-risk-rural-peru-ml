"use client";

import { useState } from "react";
import { coerceDemographics } from "@/lib/demographics";
import type { Demographics } from "@/lib/types";

interface Props {
  onSubmit: (d: Demographics) => void;
}

const BINARY_FIELDS = [
  ["Comorbilidad", "Antecedente crónico", "comorbidity"],
  ["Coronaria", "Diagnóstico CAD previo", "cad"],
  ["Hipotiroidismo", "Antecedente confirmado", "hypo"],
  ["Hiperlipidemia", "Colesterol alto", "hyper"],
  ["Diabetes", "DM diagnosticada", "dm"],
] as const;

function UnderlineInput({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
        {label}
      </span>
      <input
        {...props}
        className="mt-3 w-full border-0 border-b border-[var(--hairline-strong)] bg-transparent py-3 font-sans text-2xl font-light tracking-[-0.01em] text-[var(--foreground-strong)] focus:border-[var(--accent)] focus:outline-none"
      />
      {hint ? (
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function BinaryToggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-[var(--hairline)] py-5">
      <div className="min-w-0">
        <p className="font-sans text-lg font-medium leading-tight tracking-[-0.01em] text-[var(--foreground-strong)]">
          {label}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          {hint}
        </p>
      </div>
      <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.26em]">
        {[
          ["0", "No"],
          ["1", "Sí"],
        ].map(([v, l]) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`relative min-w-[52px] px-3 py-2 transition ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{l}</span>
              <span
                className={`absolute inset-x-2 bottom-0 h-px transition-all ${
                  active
                    ? "bg-[var(--accent)]"
                    : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FallbackForm({ onSubmit }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [age, setAge] = useState("45");
  const [gender, setGender] = useState("1");
  const [height, setHeight] = useState("165");
  const [weight, setWeight] = useState("70");
  const [comorbidity, setComorbidity] = useState("0");
  const [cad, setCad] = useState("0");
  const [hypo, setHypo] = useState("0");
  const [hyper, setHyper] = useState("0");
  const [dm, setDm] = useState("0");

  function handle(e: React.FormEvent) {
    e.preventDefault();
    const demographics = coerceDemographics({
      Age: Number(age),
      Gender: Number(gender),
      Height: Number(height),
      Weight: Number(weight),
      Comorbidity: Number(comorbidity),
      CAD: Number(cad),
      Hypothyroidism: Number(hypo),
      Hyperlipidemia: Number(hyper),
      DM: Number(dm),
    });

    if (!demographics) {
      setError("Revisa estatura y peso. Los datos siguen fuera de rango.");
      return;
    }

    setError(null);
    onSubmit(demographics);
  }

  const values = { comorbidity, cad, hypo, hyper, dm };
  const setters = {
    comorbidity: setComorbidity,
    cad: setCad,
    hypo: setHypo,
    hyper: setHyper,
    dm: setDm,
  };

  return (
    <form onSubmit={handle} className="space-y-16">
      {error ? (
        <div className="border-l-2 border-[var(--danger)] pl-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Demográficas
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
          <UnderlineInput
            label="Edad"
            type="number"
            min={18}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <label className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Sexo
            </span>
            <div className="mt-3 flex items-baseline gap-1 font-mono text-[11px] uppercase tracking-[0.26em]">
              {[
                ["1", "Hombre"],
                ["0", "Mujer"],
              ].map(([v, l]) => {
                const active = gender === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setGender(v)}
                    className="relative py-3 pr-6 transition"
                  >
                    <span
                      className={`font-sans text-2xl font-light normal-case tracking-[-0.01em] ${
                        active
                          ? "text-[var(--accent)] italic"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {l}
                    </span>
                    <span
                      className={`absolute inset-x-0 bottom-0 h-px transition-all ${
                        active ? "bg-[var(--accent)]" : "bg-[var(--hairline-strong)]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </label>
          <UnderlineInput
            label="Estatura"
            hint="En centímetros"
            type="number"
            min={100}
            max={220}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <UnderlineInput
            label="Peso"
            hint="En kilogramos"
            type="number"
            min={30}
            max={200}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Antecedentes
        </p>
        <div className="mt-4 border-t border-[var(--hairline)]">
          {BINARY_FIELDS.map(([label, hint, key]) => (
            <BinaryToggle
              key={key}
              label={label}
              hint={hint}
              value={values[key]}
              onChange={(v) => setters[key](v)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-[var(--hairline)] pt-10 md:flex-row md:items-center md:justify-between">
        <p className="max-w-md text-sm leading-relaxed text-[var(--muted-strong)]">
          Al continuar, la demo recalcula el BMI y pasa a medición.
        </p>
        <button
          type="submit"
          className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--accent-ink)] transition hover:bg-[var(--accent-strong)]"
        >
          Continuar a medición →
        </button>
      </div>
    </form>
  );
}
