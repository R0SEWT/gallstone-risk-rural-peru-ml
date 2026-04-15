"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { warmUp } from "@/lib/api";

const STEPS = [
  {
    n: "01",
    title: "Consulta",
    desc: "Conversa con la Dra. Elena — recolecta datos demográficos y antecedentes.",
  },
  {
    n: "02",
    title: "Medición",
    desc: "Simulación de una báscula de bioimpedancia — 15 variables corporales en segundos.",
  },
  {
    n: "03",
    title: "Resultado",
    desc: "Probabilidad de cálculos biliares con explicación SHAP de las variables que más influyeron.",
  },
];

export default function Home() {
  useEffect(() => {
    warmUp();
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-12 md:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500"
        >
          Case study ML · UPC 2024
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-4xl font-bold leading-tight md:text-6xl"
        >
          ¿Tienes riesgo de <br className="hidden md:block" />
          <span className="text-emerald-600">colelitiasis</span>?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-slate-600"
        >
          Descúbrelo en menos de dos minutos con{" "}
          <strong>bioimpedancia</strong> y un modelo entrenado sobre 319 casos
          del dataset UCI — sin análisis de sangre ni pruebas de laboratorio.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/consulta"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-7 py-4 text-base font-medium text-white shadow-lg transition hover:bg-slate-800"
          >
            Iniciar evaluación →
          </Link>
          <a
            href="https://github.com/rosewt-upc/WinterProject"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-7 py-4 text-base font-medium text-slate-700 hover:bg-white"
          >
            Ver código en GitHub
          </a>
        </motion.div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200"
            >
              <p className="text-xs font-mono text-emerald-600">{step.n}</p>
              <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-3xl bg-slate-900 p-10 text-white md:p-14">
          <h2 className="text-2xl font-bold md:text-3xl">
            ¿Por qué sin análisis de sangre?
          </h2>
          <p className="mt-4 max-w-3xl text-slate-300">
            En zonas rurales del Perú los centros de salud no siempre tienen
            laboratorio disponible. El modelo original del paper usa lípidos,
            glucosa y transaminasas; esta adaptación los elimina para que una
            brigada itinerante pueda tamizar con solo una báscula de
            bioimpedancia — perdiendo únicamente <strong>4 puntos de
            AUC</strong> a cambio de disponibilidad inmediata y costo 10× menor.
          </p>
          <div className="mt-8 grid gap-6 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Accuracy
              </p>
              <p className="mt-1 text-3xl font-bold">77.08%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                AUC
              </p>
              <p className="mt-1 text-3xl font-bold">0.8138</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Variables
              </p>
              <p className="mt-1 text-3xl font-bold">25</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-auto w-full max-w-5xl px-6 py-10 text-center text-xs text-slate-400">
        Proyecto académico · UPC 2024 · No sustituye diagnóstico médico
      </footer>
    </main>
  );
}
