"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  className?: string;
  highlightGallbladder?: boolean;
}

export function HumanSilhouette({
  className = "",
  highlightGallbladder = false,
}: Props) {
  const reduce = useReducedMotion();

  const drawTransition = (delay: number) => ({
    duration: reduce ? 0.3 : 2.4,
    delay: reduce ? 0 : delay,
    ease: [0.22, 1, 0.36, 1] as const,
  });

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
      {/* head */}
      <motion.ellipse
        cx="160"
        cy="80"
        rx="42"
        ry="52"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0)}
      />
      {/* neck */}
      <motion.path
        d="M 140 128 L 138 156 M 180 128 L 182 156"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.2)}
      />
      {/* torso */}
      <motion.path
        d="M 138 156 C 100 168 88 210 88 260 C 88 320 92 380 98 430 L 108 464 C 112 472 118 476 124 478"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.4)}
      />
      <motion.path
        d="M 182 156 C 220 168 232 210 232 260 C 232 320 228 380 222 430 L 212 464 C 208 472 202 476 196 478"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.4)}
      />
      {/* waist */}
      <motion.path
        d="M 124 478 L 160 486 L 196 478"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.6)}
      />
      {/* arms */}
      <motion.path
        d="M 92 220 C 78 260 68 310 62 360 C 58 388 54 416 52 440"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.5)}
      />
      <motion.path
        d="M 228 220 C 242 260 252 310 258 360 C 262 388 266 416 268 440"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.5)}
      />
      {/* hands */}
      <motion.ellipse
        cx="50"
        cy="454"
        rx="10"
        ry="14"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.9)}
      />
      <motion.ellipse
        cx="270"
        cy="454"
        rx="10"
        ry="14"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.9)}
      />
      {/* legs */}
      <motion.path
        d="M 130 486 C 124 540 118 586 116 620"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.7)}
      />
      <motion.path
        d="M 190 486 C 196 540 202 586 204 620"
        strokeWidth="1"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(0.7)}
      />
      {/* inner rib suggestion */}
      <motion.path
        d="M 130 220 Q 160 228 190 220 M 128 244 Q 160 252 192 244 M 128 268 Q 160 276 192 268"
        strokeWidth="0.6"
        opacity="0.5"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(1.0)}
      />
      {/* liver outline */}
      <motion.path
        d="M 140 300 C 128 308 124 324 128 340 C 134 354 156 358 174 354 C 192 350 202 340 198 324 C 194 310 176 298 156 298 C 150 298 144 299 140 300 Z"
        strokeWidth="0.8"
        opacity="0.45"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={drawTransition(1.2)}
      />

      {highlightGallbladder && (
        <>
          {/* gallbladder shape */}
          <motion.path
            d="M 168 330 C 164 328 160 330 158 334 C 156 340 158 348 162 352 C 166 354 170 352 172 348 C 174 342 172 334 168 330 Z"
            fill="var(--accent)"
            stroke="var(--accent-strong)"
            strokeWidth="0.8"
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: reduce ? 0.3 : 0.8,
              delay: reduce ? 0 : 2.0,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
            style={{ transformOrigin: "165px 340px" }}
          />
          {/* pulse ring */}
          {!reduce && (
            <motion.circle
              cx="165"
              cy="340"
              r="18"
              stroke="var(--accent)"
              strokeWidth="0.6"
              fill="none"
              initial={{ scale: 1, opacity: 0 }}
              animate={{
                scale: [1, 2.4, 2.4],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: 2.2,
                ease: "easeOut",
              }}
              style={{ transformOrigin: "165px 340px" }}
            />
          )}
          {/* label */}
          <motion.g
            initial={{ opacity: 0, x: reduce ? 0 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: reduce ? 0.3 : 0.6,
              delay: reduce ? 0 : 2.4,
            }}
          >
            <line
              x1="180"
              y1="340"
              x2="236"
              y2="340"
              stroke="var(--accent)"
              strokeWidth="0.6"
            />
            <text
              x="242"
              y="336"
              fill="var(--accent-strong)"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="9"
              letterSpacing="0.2em"
            >
              VESÍCULA
            </text>
            <text
              x="242"
              y="350"
              fill="var(--muted)"
              fontFamily="var(--font-geist-mono), monospace"
              fontSize="7"
              letterSpacing="0.2em"
            >
              BILIAR
            </text>
          </motion.g>
        </>
      )}
    </svg>
  );
}
