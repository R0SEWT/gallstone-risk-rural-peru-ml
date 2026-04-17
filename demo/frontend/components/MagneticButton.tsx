"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}

export function MagneticButton({
  href,
  children,
  variant = "primary",
  className = "",
}: Props) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.4 });

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.25);
    y.set(relY * 0.25);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`group relative inline-flex min-h-[56px] items-center justify-center ${className}`}
    >
      <motion.span
        style={{ x: springX, y: springY }}
        className={`relative inline-flex items-center gap-3 rounded-full px-7 py-4 text-sm tracking-wide transition-colors duration-300 ${
          isPrimary
            ? "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-strong)]"
            : "border border-[var(--hairline-strong)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }`}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.26em]">
          {children}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
        >
          <path
            d="M5 12h14m0 0-6-6m6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
    </Link>
  );
}
