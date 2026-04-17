"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FEATURE_LABELS } from "@/lib/types";

interface Props {
  shapValues: Record<string, number>;
  topN?: number;
}

export function ShapWaterfall({ shapValues, topN = 7 }: Props) {
  const reduce = useReducedMotion();

  const entries = Object.entries(shapValues)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, topN)
    .map(([feature, value]) => ({
      feature,
      label: FEATURE_LABELS[feature] ?? feature,
      value,
    }));

  const maxAbs = Math.max(...entries.map((e) => Math.abs(e.value)), 0.001);

  return (
    <div>
      <div className="space-y-5">
        {entries.map((entry, index) => {
          const ratio = Math.abs(entry.value) / maxAbs;
          const positive = entry.value >= 0;
          return (
            <motion.div
              key={entry.feature}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                    {`0${index + 1}`.padStart(2, "0")}
                  </span>
                  <span className="font-sans text-lg font-medium tracking-[-0.01em] text-[var(--foreground-strong)] md:text-xl">
                    {entry.label}
                  </span>
                </div>
                <span
                  className="font-mono text-xs"
                  style={{
                    color: positive ? "var(--danger)" : "var(--success)",
                  }}
                >
                  {positive ? "+" : ""}
                  {entry.value.toFixed(3)}
                </span>
              </div>

              <div className="relative mt-3 h-[2px] w-full overflow-hidden">
                <div
                  className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                  style={{ background: "var(--hairline-strong)" }}
                />
                <div className="absolute inset-x-0 top-0 h-px bg-[var(--hairline)]" />

                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: reduce ? 1 : ratio }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduce ? 0.3 : 1.2,
                    delay: index * 0.06 + 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute top-0 block h-[2px]"
                  style={{
                    left: positive ? "50%" : undefined,
                    right: positive ? undefined : "50%",
                    width: "50%",
                    transformOrigin: positive ? "left" : "right",
                    background: positive ? "var(--danger)" : "var(--success)",
                    boxShadow: `0 0 10px ${positive ? "rgba(179,51,34,0.22)" : "rgba(31,122,74,0.22)"}`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-[var(--hairline)] pt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <span className="flex items-center gap-3">
          <span className="inline-block h-px w-6 bg-[var(--success)]" />
          Reduce riesgo
        </span>
        <span className="flex items-center gap-3">
          Aumenta riesgo
          <span className="inline-block h-px w-6 bg-[var(--danger)]" />
        </span>
      </div>
    </div>
  );
}
