"use client";

import { useState } from "react";
import { coerceDemographics } from "@/lib/demographics";
import type { Demographics } from "@/lib/types";

interface Props {
  onSubmit: (d: Demographics) => void;
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
      setError("Revisa estatura y peso. Los datos están fuera de rango.");
      return;
    }

    setError(null);
    onSubmit(demographics);
  }

  return (
    <form
      onSubmit={handle}
      className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2"
    >
      {error && (
        <div className="md:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-slate-600">Edad</label>
        <input
          type="number"
          min={18}
          max={100}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">Sexo</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="1">Hombre</option>
          <option value="0">Mujer</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">
          Estatura (cm)
        </label>
        <input
          type="number"
          min={100}
          max={220}
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">Peso (kg)</label>
        <input
          type="number"
          min={30}
          max={200}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      {[
        ["Comorbilidad", comorbidity, setComorbidity],
        ["Enfermedad coronaria", cad, setCad],
        ["Hipotiroidismo", hypo, setHypo],
        ["Hiperlipidemia", hyper, setHyper],
        ["Diabetes", dm, setDm],
      ].map(([label, value, setter]) => (
        <div key={label as string}>
          <label className="text-xs font-medium text-slate-600">
            {label as string}
          </label>
          <select
            value={value as string}
            onChange={(e) =>
              (setter as React.Dispatch<React.SetStateAction<string>>)(
                e.target.value,
              )
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="0">No</option>
            <option value="1">Sí</option>
          </select>
        </div>
      ))}
      <button
        type="submit"
        className="md:col-span-2 mt-2 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
      >
        Continuar a medición →
      </button>
    </form>
  );
}
