"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RiskGauge } from "@/components/RiskGauge";
import { ShapWaterfall } from "@/components/ShapWaterfall";
import {
  explainRural,
  getModelInfo,
  predictRural,
} from "@/lib/api";
import { useDemoStore } from "@/lib/store";
import type { ModelInfo } from "@/lib/types";

export default function ResultadoPage() {
  const router = useRouter();
  const {
    demographics,
    bioimpedance,
    prediction,
    setPrediction,
    reset,
  } = useDemoStore();
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);

  useEffect(() => {
    if (!demographics || !bioimpedance) {
      router.replace("/consulta");
      return;
    }
    if (prediction) return;

    const features = { ...demographics, ...bioimpedance };
    Promise.all([predictRural(features), explainRural(features)])
      .then(([pred, exp]) => {
        setPrediction({
          probability: pred.probability,
          risk_level: pred.risk_level,
          shap_values: exp.shap_values,
          base_value: exp.base_value,
        });
      })
      .catch((e) => setError(e.message));
  }, [demographics, bioimpedance, prediction, setPrediction, router]);

  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(() => null);
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-rose-600">
            Error de conexión
          </h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-5 py-2 text-white"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (!prediction) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 animate-pulse">
          Calculando predicción…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Acto 3 · Resultado
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Evaluación completada
            </h1>
          </div>
          <button
            onClick={() => {
              reset();
              router.push("/");
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
          >
            Nueva evaluación
          </button>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:grid-cols-[auto_1fr] md:items-center"
        >
          <RiskGauge
            probability={prediction.probability}
            riskLevel={prediction.risk_level}
          />
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              El modelo estima una probabilidad de{" "}
              <strong>{(prediction.probability * 100).toFixed(1)}%</strong>{" "}
              de presentar colelitiasis con base en las 25 variables
              recolectadas (9 demográficas + 15 de bioimpedancia + BMI).
            </p>
            <p className="text-slate-500">
              Este es un resultado orientativo y no reemplaza la evaluación
              clínica con un médico.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Variables que más influyeron
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Valores SHAP — muestran el aporte de cada variable a la
              predicción.
            </p>
          </div>
          <ShapWaterfall shapValues={prediction.shap_values} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 grid gap-6 md:grid-cols-2"
        >
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Laboratorio tradicional
            </h3>
            <p className="mt-2 text-2xl font-bold text-slate-900">1–3 días</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>· Ecografía + panel lipídico</li>
              <li>· Requiere centro médico</li>
              <li>· Costo: $$</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm ring-1 ring-emerald-200">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Bioimpedancia + ML
            </h3>
            <p className="mt-2 text-2xl font-bold text-emerald-900">
              8 segundos
            </p>
            <ul className="mt-3 space-y-1 text-sm text-emerald-800">
              <li>· Báscula portátil de bioimpedancia</li>
              <li>· Aplicable en campo / zonas rurales</li>
              <li>· Costo: $</li>
            </ul>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <button
            onClick={() => setShowTechDetails((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Detalles técnicos del modelo
            </h3>
            <span className="text-xs text-slate-500">
              {showTechDetails ? "Ocultar" : "Mostrar"}
            </span>
          </button>
          {showTechDetails && modelInfo && (
            <dl className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-400">Modelo</dt>
                <dd className="font-medium text-slate-800">
                  Gradient Boosting (SMOTE + Optuna)
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Dataset</dt>
                <dd className="font-medium text-slate-800">
                  {modelInfo.dataset_shape[0]} casos · UCI Gallstone
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Accuracy</dt>
                <dd className="font-medium text-slate-800">
                  {(modelInfo.optimized_accuracy * 100).toFixed(2)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">AUC</dt>
                <dd className="font-medium text-slate-800">
                  {modelInfo.optimized_auc.toFixed(4)}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs uppercase text-slate-400">Variables</dt>
                <dd className="font-medium text-slate-800">
                  {modelInfo.feature_count} (sin análisis de sangre ni lípidos)
                </dd>
              </div>
            </dl>
          )}
        </motion.section>

        <footer className="mt-10 text-center text-xs text-slate-400">
          Proyecto académico · UPC 2024 · No sustituye diagnóstico médico
        </footer>
      </div>
    </main>
  );
}
