"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  orientation?: "horizontal" | "vertical";
  className?: string;
  delay?: number;
}

export function HairlineDivider({
  orientation = "horizontal",
  className = "",
  delay = 0,
}: Props) {
  const reduce = useReducedMotion();
  const isH = orientation === "horizontal";

  return (
    <motion.span
      aria-hidden
      initial={
        reduce
          ? { opacity: 0 }
          : isH
            ? { scaleX: 0, transformOrigin: "left" }
            : { scaleY: 0, transformOrigin: "top" }
      }
      whileInView={{ scaleX: 1, scaleY: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        duration: reduce ? 0.3 : 1.2,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`block ${isH ? "h-px w-full" : "h-full w-px"} bg-[var(--hairline-strong)] ${className}`}
    />
  );
}
