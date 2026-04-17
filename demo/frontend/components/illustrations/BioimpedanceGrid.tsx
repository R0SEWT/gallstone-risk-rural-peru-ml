"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  className?: string;
}

const ELECTRODES = [
  { cx: 62, cy: 298, label: "E1" },
  { cx: 258, cy: 298, label: "E2" },
  { cx: 132, cy: 600, label: "E3" },
  { cx: 188, cy: 600, label: "E4" },
];

const CURRENT_LINES = [
  "M 62 298 Q 90 340 132 600",
  "M 258 298 Q 230 340 188 600",
  "M 62 298 Q 160 380 258 298",
  "M 132 600 Q 160 560 188 600",
];

export function BioimpedanceGrid({ className = "" }: Props) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 320 640"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* faint grid */}
      <g opacity="0.22" stroke="var(--muted-strong)" strokeWidth="0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 56} x2="320" y2={i * 56} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 54} y1="0" x2={i * 54} y2="640" />
        ))}
      </g>

      {/* silhouette */}
      <motion.g
        stroke="var(--muted-strong)"
        strokeWidth="1"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 1.6 }}
      >
        <ellipse cx="160" cy="80" rx="40" ry="48" />
        <path d="M 140 124 L 138 150" />
        <path d="M 180 124 L 182 150" />
        <path d="M 138 150 C 104 162 94 202 96 252 C 98 312 102 380 108 430 L 118 462 C 122 470 128 474 134 476" />
        <path d="M 182 150 C 216 162 226 202 224 252 C 222 312 218 380 212 430 L 202 462 C 198 470 192 474 186 476" />
        <path d="M 134 476 L 160 484 L 186 476" />
        <path d="M 100 208 C 86 244 76 290 70 334 C 66 358 64 278 62 298" />
        <path d="M 220 208 C 234 244 244 290 250 334 C 254 358 256 278 258 298" />
        <path d="M 130 484 C 126 540 124 582 132 600" />
        <path d="M 190 484 C 194 540 196 582 188 600" />
      </motion.g>

      {/* current lines animated */}
      {CURRENT_LINES.map((d, i) => (
        <motion.path
          key={`cur${i}`}
          d={d}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="3 6"
          opacity="0.8"
          initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.8 }}
          viewport={{ once: true }}
          transition={{
            duration: reduce ? 0.3 : 1.6,
            delay: reduce ? 0 : 0.4 + i * 0.18,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}

      {/* animated pulse traveling along first line */}
      {!reduce && (
        <motion.circle
          r="3"
          fill="var(--accent)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "linear",
            delay: 1.4,
          }}
          style={{
            offsetPath: `path("${CURRENT_LINES[0]}")`,
            filter: "drop-shadow(0 0 6px var(--accent-glow))",
          }}
        />
      )}

      {/* electrodes */}
      {ELECTRODES.map((e, i) => (
        <motion.g
          key={e.label}
          initial={{ opacity: 0, scale: reduce ? 1 : 0.3 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: reduce ? 0.3 : 0.6,
            delay: reduce ? 0 : 0.2 + i * 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${e.cx}px ${e.cy}px` }}
        >
          <circle
            cx={e.cx}
            cy={e.cy}
            r="9"
            fill="var(--background)"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <circle cx={e.cx} cy={e.cy} r="3" fill="var(--accent)" />
          <text
            x={e.cx + 14}
            y={e.cy + 4}
            fill="var(--muted-strong)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="9"
            letterSpacing="0.2em"
          >
            {e.label}
          </text>
        </motion.g>
      ))}

      {/* caption */}
      <motion.text
        x="20"
        y="632"
        fill="var(--muted)"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="9"
        letterSpacing="0.26em"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        BIOIMPEDANCIA · 4 ELECTRODOS
      </motion.text>
    </svg>
  );
}
