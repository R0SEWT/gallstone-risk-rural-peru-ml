"use client";

import { motion } from "framer-motion";
import type { RiskLevel } from "@/lib/types";

interface Props {
  probability: number;
  riskLevel: RiskLevel;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  bajo: "#22c55e",
  moderado: "#eab308",
  alto: "#ef4444",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  bajo: "Riesgo bajo",
  moderado: "Riesgo moderado",
  alto: "Riesgo alto",
};

export function RiskGauge({ probability, riskLevel }: Props) {
  const radius = 100;
  const stroke = 18;
  const circumference = Math.PI * radius;
  const progress = Math.max(0, Math.min(1, probability));
  const dashOffset = circumference * (1 - progress);
  const color = RISK_COLORS[riskLevel];

  return (
    <div className="flex flex-col items-center">
      <svg
        width={260}
        height={160}
        viewBox="0 0 260 160"
        className="overflow-visible"
      >
        <path
          d={`M 30 140 A ${radius} ${radius} 0 0 1 230 140`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <motion.path
          d={`M 30 140 A ${radius} ${radius} 0 0 1 230 140`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="-mt-8 flex flex-col items-center"
      >
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ color }}
        >
          {(probability * 100).toFixed(0)}%
        </span>
        <span
          className="mt-1 rounded-full px-3 py-1 text-sm font-medium"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {RISK_LABELS[riskLevel]}
        </span>
      </motion.div>
    </div>
  );
}
