"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { DEMO_STEPS } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

type StepId = (typeof DEMO_STEPS)[number]["id"];

interface Props {
  step: StepId;
  eyebrow: string;
  title: string;
  intro: string;
  note?: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function ActShell({
  step,
  eyebrow,
  title,
  intro,
  note,
  aside,
  children,
}: Props) {
  const currentIndex = DEMO_STEPS.findIndex((item) => item.id === step);
  const stepNumber = `0${currentIndex + 1}`.padStart(2, "0");

  return (
    <main className="relative min-h-screen w-full">
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
          <Link
            href="/"
            className="group flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--muted)] transition hover:text-[var(--accent)]"
          >
            <span className="inline-block h-px w-6 bg-[var(--muted)] transition-all group-hover:w-10 group-hover:bg-[var(--accent)]" />
            Case study
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {DEMO_STEPS.map((item, index) => {
              const isActive = item.id === step;
              const isCompleted = index < currentIndex;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] transition ${
                    isActive
                      ? "text-[var(--foreground-strong)]"
                      : isCompleted
                        ? "text-[var(--muted-strong)]"
                        : "text-[var(--muted)]"
                  }`}
                >
                  <span
                    className={`inline-block h-px transition-all ${
                      isActive ? "w-10 bg-[var(--accent)]" : "w-5 bg-[var(--hairline-strong)]"
                    }`}
                  />
                  <span>
                    {`0${index + 1}`} {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--muted)] md:hidden">
            {stepNumber} / 03
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1400px] px-6 pb-24 pt-16 sm:px-10 md:pt-24 lg:px-16">
        <SectionReveal className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              {eyebrow}
            </p>
            <h1
              className="mt-8 font-sans font-light text-balance leading-[0.98] tracking-[-0.03em] text-[var(--foreground-strong)]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              {title}
            </h1>
            <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-strong)] md:text-base">
              {intro}
            </p>
          </div>

          {note ? (
            <div className="flex items-start md:col-span-4 md:justify-end">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-xs border-l border-[var(--hairline-strong)] pl-5 font-mono text-xs leading-relaxed text-[var(--muted-strong)]"
              >
                <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Contexto
                </p>
                {note}
              </motion.div>
            </div>
          ) : null}
        </SectionReveal>

        <div className="mt-20 grid grid-cols-1 gap-12 md:mt-28 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="min-w-0">{children}</div>

          {aside ? (
            <aside className="order-first space-y-10 lg:order-none lg:sticky lg:top-32 lg:self-start">
              {aside}
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
