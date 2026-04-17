"use client";

import { motion } from "framer-motion";
import type { RiskLevel } from "@/lib/types";

interface Props {
  probability: number;
  riskLevel: RiskLevel;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  bajo: "var(--success)",
  moderado: "var(--warning)",
  alto: "var(--danger)",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  bajo: "Riesgo bajo",
  moderado: "Riesgo moderado",
  alto: "Riesgo alto",
};

function polarToCartesian(radius: number, progress: number) {
  const angle = Math.PI * (1 - progress);
  return {
    x: 180 + radius * Math.cos(angle),
    y: 180 - radius * Math.sin(angle),
  };
}

export function RiskGauge({ probability, riskLevel }: Props) {
  const progress = Math.max(0, Math.min(1, probability));
  const radius = 140;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const color = RISK_COLORS[riskLevel];
  const marker = polarToCartesian(radius, progress);
  const gradientId = `riskGrad-${riskLevel}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[420px]">
        <svg
          viewBox="0 0 360 240"
          className="w-full overflow-visible"
          fill="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 40 180 A 140 140 0 0 1 320 180"
            stroke="var(--hairline-strong)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const p = polarToCartesian(radius - 10, t);
            const p2 = polarToCartesian(radius + 10, t);
            return (
              <line
                key={t}
                x1={p.x}
                y1={p.y}
                x2={p2.x}
                y2={p2.y}
                stroke="var(--muted)"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}

          <motion.path
            d="M 40 180 A 140 140 0 0 1 320 180"
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            filter="url(#glow)"
          />

          <motion.circle
            cx={marker.x}
            cy={marker.y}
            r="5"
            fill={color}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-[38%] flex flex-col items-center"
        >
          <span
            className="font-sans font-light leading-none tracking-[-0.04em] text-[var(--foreground-strong)]"
            style={{ fontSize: "clamp(4rem, 10vw, 6.5rem)" }}
          >
            {(progress * 100).toFixed(0)}
            <span className="font-mono text-2xl align-top text-[var(--muted)]">
              %
            </span>
          </span>
          <span
            className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em]"
            style={{ color }}
          >
            {RISK_LABELS[riskLevel]}
          </span>
        </motion.div>
      </div>

      <div className="mt-2 flex w-full max-w-[420px] items-center justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
        <span>0</span>
        <span>35</span>
        <span>55</span>
        <span>100</span>
      </div>

      <p className="mt-10 max-w-sm text-center text-sm leading-relaxed text-[var(--muted-strong)]">
        Posición del caso dentro del escenario rural. Los cortes operativos separan
        bajo, moderado y alto para priorización.
      </p>
    </div>
  );
}
