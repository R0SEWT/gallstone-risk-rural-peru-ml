"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FEATURE_LABELS } from "@/lib/types";

interface Props {
  shapValues: Record<string, number>;
  topN?: number;
}

export function ShapWaterfall({ shapValues, topN = 7 }: Props) {
  const entries = Object.entries(shapValues)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, topN)
    .map(([feature, value]) => ({
      feature,
      label: FEATURE_LABELS[feature] ?? feature,
      value,
      direction: value >= 0 ? "positive" : "negative",
    }))
    .reverse();

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={entries}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fontSize: 12, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
            formatter={(value) => [Number(value).toFixed(3), "SHAP"]}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {entries.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.direction === "positive" ? "#ef4444" : "#22c55e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-rose-500" />
          Aumenta el riesgo
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-emerald-500" />
          Reduce el riesgo
        </span>
      </div>
    </div>
  );
}
