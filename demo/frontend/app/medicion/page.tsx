"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { generateBioimpedance } from "@/lib/api";
import { useDemoStore } from "@/lib/store";
import { FEATURE_LABELS, type Bioimpedance } from "@/lib/types";

const BIO_ORDER: (keyof Bioimpedance)[] = [
  "TBW", "ECW", "ICW", "ECF_TBW", "TBFR",
  "LM", "Protein", "VFR", "BM", "MM",
  "Obesity", "TFC", "VFA", "VMA", "HFA",
];

export default function MedicionPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { demographics, setBioimpedance } = useDemoStore();
  const [bio, setBio] = useState<Bioimpedance | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!demographics) {
      router.replace("/consulta");
      return;
    }
    generateBioimpedance({
      age: demographics.Age,
      gender: demographics.Gender,
      height: demographics.Height,
      weight: demographics.Weight,
      bmi: demographics.BMI,
    })
      .then((r) => {
        setBio(r.features);
        setBioimpedance(r.features);
      })
      .catch((e) => setError(e.message));
  }, [demographics, router, setBioimpedance]);

  useEffect(() => {
    if (!bio) return;
    if (reduceMotion) {
      setRevealed(BIO_ORDER.length);
      const t = setTimeout(() => router.push("/resultado"), 1200);
      return () => clearTimeout(t);
    }
    if (revealed >= BIO_ORDER.length) {
      const t = setTimeout(() => router.push("/resultado"), 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), 350);
    return () => clearTimeout(t);
  }, [bio, revealed, reduceMotion, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-rose-600">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Acto 2 · Medición
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Análisis de bioimpedancia
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            La báscula envía señales eléctricas imperceptibles para estimar 15
            variables corporales.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[320px_1fr]">
          <div className="relative flex items-center justify-center">
            <div className="relative h-[420px] w-[220px]">
              <motion.div
                className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              <svg
                viewBox="0 0 200 400"
                className="relative z-10 h-full w-full"
                fill="none"
                stroke="#38bdf8"
                strokeWidth={2}
              >
                <circle cx="100" cy="50" r="32" />
                <path d="M 68 90 L 62 200 L 75 290" />
                <path d="M 132 90 L 138 200 L 125 290" />
                <path d="M 75 290 L 70 390" />
                <path d="M 125 290 L 130 390" />
                <path d="M 62 110 L 30 200" />
                <path d="M 138 110 L 170 200" />
              </svg>
              {!reduceMotion && bio && (
                <motion.div
                  className="absolute left-0 right-0 z-20 h-0.5 bg-cyan-400 shadow-[0_0_20px_#22d3ee]"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <AnimatePresence>
              {bio &&
                BIO_ORDER.slice(0, revealed).map((key) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="rounded-xl bg-slate-900/80 p-3 ring-1 ring-cyan-500/30"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-cyan-300/70">
                      {FEATURE_LABELS[key]}
                    </p>
                    <p className="mt-1 font-mono text-lg text-white tabular-nums">
                      {bio[key].toFixed(2)}
                    </p>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>

        {bio && revealed >= BIO_ORDER.length && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-center text-sm text-cyan-300"
          >
            Medición completa · calculando resultado…
          </motion.p>
        )}
      </div>
    </main>
  );
}
