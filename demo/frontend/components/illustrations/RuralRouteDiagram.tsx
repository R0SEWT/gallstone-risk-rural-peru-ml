"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  route: readonly string[];
  accent?: string;
  className?: string;
}

export function RuralRouteDiagram({
  route,
  accent = "var(--accent)",
  className = "",
}: Props) {
  const reduce = useReducedMotion();
  const count = route.length;
  const width = 480;
  const height = 160;
  const margin = 40;
  const step = count > 1 ? (width - margin * 2) / (count - 1) : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      aria-hidden
    >
      {/* base track */}
      <line
        x1={margin}
        y1="92"
        x2={width - margin}
        y2="92"
        stroke="var(--hairline-strong)"
        strokeWidth="0.8"
        strokeDasharray="2 6"
      />
      {/* animated route */}
      <motion.line
        x1={margin}
        y1="92"
        x2={width - margin}
        y2="92"
        stroke={accent}
        strokeWidth="1.2"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: reduce ? 0.3 : 1.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {route.map((node, i) => {
        const cx = margin + i * step;
        return (
          <motion.g
            key={node + i}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduce ? 0.3 : 0.6,
              delay: reduce ? 0 : 0.3 + i * 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <circle
              cx={cx}
              cy="92"
              r="10"
              fill="var(--background)"
              stroke={accent}
              strokeWidth="1.2"
            />
            <circle cx={cx} cy="92" r="3.5" fill={accent} />
            <text
              x={cx}
              y="128"
              textAnchor="middle"
              fill="var(--foreground-strong)"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="10"
              letterSpacing="0.18em"
            >
              {node.toUpperCase()}
            </text>
            <text
              x={cx}
              y="60"
              textAnchor="middle"
              fill="var(--muted)"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="9"
              letterSpacing="0.22em"
            >
              {String(i + 1).padStart(2, "0")}
            </text>
          </motion.g>
        );
      })}

      {/* moving dot */}
      {!reduce && count > 1 && (
        <motion.circle
          r="3"
          fill={accent}
          initial={{ cx: margin }}
          animate={{ cx: width - margin }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
          cy="92"
          style={{ filter: "drop-shadow(0 0 6px var(--accent-glow))" }}
        />
      )}
    </svg>
  );
}
