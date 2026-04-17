"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  className?: string;
}

const STONES = [
  { cx: 248, cy: 208, rx: 14, ry: 11, delay: 0.6 },
  { cx: 268, cy: 234, rx: 9, ry: 8, delay: 0.9 },
  { cx: 236, cy: 240, rx: 7, ry: 6, delay: 1.2 },
];

export function GallbladderDetail({ className = "" }: Props) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* liver background */}
      <motion.path
        d="M 60 120 C 40 140 40 200 60 240 C 80 280 140 300 200 298 C 260 296 320 284 360 260 C 380 248 388 232 386 216 C 384 196 368 184 344 180 C 320 176 260 168 200 156 C 140 144 92 132 80 124 C 72 120 66 119 60 120 Z"
        stroke="var(--muted-strong)"
        strokeWidth="1"
        opacity="0.4"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 2.0, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* liver texture lines */}
      <motion.path
        d="M 120 180 Q 180 200 260 196 M 100 220 Q 180 240 300 228 M 140 250 Q 220 264 320 250"
        stroke="var(--muted-strong)"
        strokeWidth="0.6"
        opacity="0.3"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 1.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* gallbladder outline */}
      <motion.path
        d="M 216 160 C 208 168 204 188 210 210 C 216 232 230 254 252 264 C 276 272 296 268 304 252 C 312 232 306 208 288 190 C 268 172 244 160 228 158 C 222 158 218 158 216 160 Z"
        stroke="var(--accent)"
        strokeWidth="1.5"
        fill="var(--accent-soft)"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* cystic duct */}
      <motion.path
        d="M 216 160 C 200 140 176 128 156 122"
        stroke="var(--accent)"
        strokeWidth="1.2"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 1.0, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* stones */}
      {STONES.map((stone, i) => (
        <motion.ellipse
          key={i}
          cx={stone.cx}
          cy={stone.cy}
          rx={stone.rx}
          ry={stone.ry}
          fill="var(--foreground-strong)"
          stroke="var(--accent-strong)"
          strokeWidth="0.8"
          initial={{ opacity: 0, scale: reduce ? 1 : 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: reduce ? 0.3 : 0.6,
            delay: reduce ? 0 : stone.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${stone.cx}px ${stone.cy}px` }}
        />
      ))}

      {/* labels */}
      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 0.8, delay: 1.6 }}
      >
        <line x1="280" y1="220" x2="360" y2="190" stroke="var(--accent)" strokeWidth="0.6" />
        <text
          x="364"
          y="186"
          fill="var(--accent-strong)"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="10"
          letterSpacing="0.22em"
        >
          CÁLCULOS
        </text>
        <text
          x="364"
          y="200"
          fill="var(--muted)"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="8"
          letterSpacing="0.22em"
        >
          BILIARES
        </text>
      </motion.g>

      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 0.8, delay: 1.8 }}
      >
        <line x1="150" y1="130" x2="90" y2="96" stroke="var(--accent)" strokeWidth="0.6" />
        <text
          x="20"
          y="90"
          fill="var(--accent-strong)"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="10"
          letterSpacing="0.22em"
        >
          CONDUCTO
        </text>
        <text
          x="20"
          y="104"
          fill="var(--muted)"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="8"
          letterSpacing="0.22em"
        >
          CÍSTICO
        </text>
      </motion.g>

      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.3 : 0.8, delay: 2.0 }}
      >
        <line x1="268" y1="168" x2="340" y2="130" stroke="var(--muted-strong)" strokeWidth="0.6" />
        <text
          x="344"
          y="126"
          fill="var(--foreground-strong)"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="10"
          letterSpacing="0.22em"
        >
          VESÍCULA
        </text>
        <text
          x="344"
          y="140"
          fill="var(--muted)"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="8"
          letterSpacing="0.22em"
        >
          BILIAR
        </text>
      </motion.g>
    </svg>
  );
}
