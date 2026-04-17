"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ActShell } from "@/components/ActShell";
import { RiskGauge } from "@/components/RiskGauge";
import { ShapWaterfall } from "@/components/ShapWaterfall";
import {
  ACT_NOTES,
  HOME_SCENARIOS,
  LIMITATIONS,
  RESULT_INTERPRETATION,
} from "@/lib/content";
import { explainRural, getModelInfo, predictRural } from "@/lib/api";
import { FEATURE_LABELS, type ModelInfo } from "@/lib/types";
import { useDemoStore } from "@/lib/store";

export default function ResultadoPage() {
  const router = useRouter();
  const { demographics, bioimpedance, prediction, setPrediction, reset } =
    useDemoStore();
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
      <ActShell
        step="resultado"
        eyebrow="Acto 03 · Resultado"
        title="La lectura final se interrumpió."
        intro="El frontend no pudo cerrar la predicción. Reinicia el flujo para reconstruir el caso."
        note={ACT_NOTES.resultado}
      >
        <div className="border-l-2 border-[var(--danger)] pl-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--danger)]">
            Error de conexión
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted-strong)]">
            {error}
          </p>
        </div>
      </ActShell>
    );
  }

  if (!prediction) {
    return (
      <ActShell
        step="resultado"
        eyebrow="Acto 03 · Resultado"
        title="El modelo está leyendo el caso."
        intro="La demo combina entrevista y bioimpedancia en una lectura de riesgo explicable."
        note={ACT_NOTES.resultado}
      >
        <div className="flex flex-col items-center py-32">
          <motion.span
            aria-hidden
            className="block h-[2px] w-16 bg-[var(--accent)]"
            animate={{ scaleX: [0.2, 1, 0.2], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          />
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Procesando predicción + SHAP
          </p>
        </div>
      </ActShell>
    );
  }

  const interpretation = RESULT_INTERPRETATION[prediction.risk_level];
  const topDrivers = Object.entries(prediction.shap_values)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4);

  return (
    <ActShell
      step="resultado"
      eyebrow="Acto 03 · Resultado"
      title="No es un diagnóstico. Es una lectura para decidir mejor."
      intro="25 variables convertidas en una interpretación operativa. La prioridad es que el usuario entienda qué significa el riesgo y por qué."
      note={ACT_NOTES.resultado}
      aside={
        <>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Estado del caso
            </p>
            <p className="mt-6 font-sans font-light text-6xl leading-none tracking-[-0.03em] text-[var(--foreground-strong)]">
              {(prediction.probability * 100).toFixed(0)}
              <span className="font-mono text-xl align-top text-[var(--muted)]">
                %
              </span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
              Riesgo estimado rural. Para priorizar, no para confirmar.
            </p>
            <button
              onClick={() => {
                reset();
                router.push("/");
              }}
              className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[var(--hairline-strong)] px-6 font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Nueva evaluación →
            </button>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Límites vigentes
            </p>
            <ul className="mt-6 space-y-5 text-[13px] leading-relaxed text-[var(--muted-strong)]">
              {LIMITATIONS.map((item) => (
                <li key={item} className="flex gap-4">
                  <span className="mt-1 h-px w-6 bg-[var(--warning)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    >
      <section className="grid grid-cols-1 gap-16 border-b border-[var(--hairline)] pb-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <RiskGauge
          probability={prediction.probability}
          riskLevel={prediction.risk_level}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Lectura principal
          </p>
          <h2
            className="mt-8 font-sans font-light leading-[1.05] tracking-[-0.03em] text-[var(--foreground-strong)]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {interpretation.title}
          </h2>
          <p className="mt-8 text-[15px] leading-relaxed text-[var(--muted-strong)] md:text-base">
            {interpretation.summary}
          </p>
          <p className="mt-8 border-l border-[var(--accent)] pl-5 font-sans text-lg font-normal italic leading-[1.5] text-[var(--muted-strong)] md:text-xl">
            {interpretation.emphasis}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-8 border-t border-[var(--hairline)] pt-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Entrada
              </p>
              <p className="mt-3 font-sans font-light text-2xl tracking-[-0.02em] text-[var(--foreground-strong)]">
                25 variables
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted-strong)]">
                9 demo + 15 bio + BMI
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Uso
              </p>
              <p className="mt-3 font-sans font-light text-2xl tracking-[-0.02em] text-[var(--foreground-strong)]">
                Tamizaje
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted-strong)]">
                No reemplaza ecografía
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-b border-[var(--hairline)] py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Escenario
            </p>
            <p className="mt-6 font-sans font-light text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-[var(--foreground-strong)] md:text-[2rem]">
              La predicción vive en la <em className="italic font-light text-[var(--accent)]">tercera</em> columna.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:col-span-8 md:grid-cols-3 md:gap-4">
            {HOME_SCENARIOS.map((scenario) => {
              const active = scenario.id === "rural";
              return (
                <div
                  key={scenario.id}
                  className={`flex flex-col border-t py-8 ${
                    active
                      ? "border-[var(--accent)]"
                      : "border-[var(--hairline-strong)]"
                  }`}
                >
                  <p
                    className="font-mono text-[10px] uppercase tracking-[0.28em]"
                    style={{
                      color: active ? "var(--accent)" : "var(--muted)",
                    }}
                  >
                    {scenario.eyebrow}
                  </p>
                  <p
                    className={`mt-5 font-sans text-lg font-normal leading-tight tracking-[-0.01em] ${
                      active
                        ? "text-[var(--foreground-strong)]"
                        : "text-[var(--muted-strong)]"
                    }`}
                  >
                    {scenario.title}
                  </p>
                  <p
                    className={`mt-auto pt-6 font-mono text-[11px] uppercase tracking-[0.22em] ${
                      active ? "text-[var(--accent)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {scenario.metricValue}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.3fr_1fr]">
          <article>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Explicabilidad · SHAP
            </p>
            <h2
              className="mt-6 font-sans font-light leading-[1.08] tracking-[-0.03em] text-[var(--foreground-strong)]"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
            >
              Variables que movieron la lectura.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[var(--muted-strong)]">
              Qué factores empujaron el resultado hacia más o menos riesgo dentro
              del escenario rural.
            </p>
            <div className="mt-12">
              <ShapWaterfall shapValues={prediction.shap_values} />
            </div>
          </article>

          <aside className="space-y-16">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Drivers principales
              </p>
              <div className="mt-8 space-y-6">
                {topDrivers.map(([feature, value], index) => {
                  const positive = value >= 0;
                  return (
                    <div
                      key={feature}
                      className="border-t border-[var(--hairline)] pt-5"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
                          {`0${index + 1}`.padStart(2, "0")}
                        </span>
                        <span
                          className="font-mono text-xs"
                          style={{
                            color: positive ? "var(--danger)" : "var(--success)",
                          }}
                        >
                          {positive ? "+" : ""}
                          {value.toFixed(3)}
                        </span>
                      </div>
                      <p className="mt-3 font-sans text-xl font-medium leading-tight tracking-[-0.01em] text-[var(--foreground-strong)]">
                        {FEATURE_LABELS[feature] ?? feature}
                      </p>
                      <p
                        className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em]"
                        style={{
                          color: positive ? "var(--danger)" : "var(--accent)",
                        }}
                      >
                        {positive ? "Empuja ↑" : "Reduce ↓"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <details
              open={showTechDetails}
              onToggle={(e) => setShowTechDetails(e.currentTarget.open)}
              className="group"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Capa técnica
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-strong)] transition group-open:text-[var(--accent)]">
                  {showTechDetails ? "− Ocultar" : "+ Mostrar"}
                </span>
              </summary>

              <dl className="mt-8 grid grid-cols-1 gap-6 text-sm">
                {[
                  [
                    "Modelo",
                    modelInfo?.optimized_model_name ??
                      "Gradient Boosting + SMOTE + Optuna",
                  ],
                  [
                    "Accuracy rural",
                    modelInfo
                      ? `${(modelInfo.optimized_accuracy * 100).toFixed(2)}%`
                      : "77.08%",
                  ],
                  [
                    "AUC rural",
                    modelInfo ? modelInfo.optimized_auc.toFixed(4) : "0.8138",
                  ],
                  ["Referencia", "Paper: 88.54% · 0.9280"],
                  ["Dataset", "UCI Gallstone · 319 · Ankara"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-6 border-b border-[var(--hairline)] pb-3"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                      {label}
                    </dt>
                    <dd className="font-mono text-xs text-[var(--foreground)]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          </aside>
        </div>
      </section>
    </ActShell>
  );
}
