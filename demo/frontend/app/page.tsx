"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  EXCLUDED_LAB_FEATURES,
  HOME_SCENARIOS,
  LIMITATIONS,
  TRADEOFF_METRICS,
} from "@/lib/content";
import { warmUp } from "@/lib/api";
import { SectionReveal } from "@/components/SectionReveal";
import { HairlineDivider } from "@/components/HairlineDivider";
import { MagneticButton } from "@/components/MagneticButton";
import { ArchitectureSection } from "@/components/ArchitectureSection";
import { HumanSilhouette } from "@/components/illustrations/HumanSilhouette";
import { GallbladderDetail } from "@/components/illustrations/GallbladderDetail";
import { BioimpedanceGrid } from "@/components/illustrations/BioimpedanceGrid";
import { RuralRouteDiagram } from "@/components/illustrations/RuralRouteDiagram";

const ROMAN = ["I", "II", "III"];

function SectionNumber({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
      <span className="text-[var(--foreground-strong)]">{index}</span>
      <span className="h-px w-8 bg-[var(--hairline-strong)]" />
      <span>{label}</span>
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const silhouetteY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 120]);
  const silhouetteOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.25]);
  const titleY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -80]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-6 pb-16 pt-10 sm:px-10 md:pt-14 lg:px-16"
    >
      <header className="relative z-20 flex items-center justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-strong)]">
          Caso de estudio · Gallstone
        </span>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)] md:inline">
          Rural Perú · 2026
        </span>
      </header>

      <motion.div
        style={{ y: silhouetteY, opacity: silhouetteOpacity }}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-[-8%] z-0 flex w-[75%] items-center justify-end opacity-80 md:right-[-4%] md:w-[52%] lg:right-[2%] lg:w-[42%]"
      >
        <HumanSilhouette
          highlightGallbladder
          className="h-full max-h-[92vh] w-auto text-[var(--muted-strong)]"
        />
      </motion.div>

      <motion.div
        style={{ y: titleY }}
        className="relative z-10 mt-auto grid grid-cols-12 gap-6"
      >
        <div className="col-span-12 md:col-span-8 lg:col-span-8">
          <h1
            className="text-balance font-sans font-light leading-[0.98] tracking-[-0.03em] text-[var(--foreground-strong)]"
            style={{ fontSize: "clamp(2rem, 6.6vw, 5.25rem)" }}
          >
            Modelo de ML adaptado para diagnóstico rural en&nbsp;
            <span
              className="relative inline-block text-[var(--accent)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              tiempo real
              <motion.span
                aria-hidden
                initial={{ scaleX: 0, transformOrigin: "left" }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduce ? 0.3 : 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 bottom-[0.08em] block h-[2px] bg-[var(--accent)]"
              />
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl font-sans text-lg font-light text-[var(--muted-strong)] md:text-xl">
            Sin laboratorio, usando bioimpedancia.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--muted-strong)]">
            <span className="text-[var(--foreground-strong)]">ML Systems</span>
            <span className="h-px w-5 bg-[var(--hairline-strong)]" />
            <span>Digital Health</span>
            <span className="h-px w-5 bg-[var(--hairline-strong)]" />
            <span>Rural AI</span>
            <span className="h-px w-5 bg-[var(--hairline-strong)]" />
            <span>XAI</span>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mt-16 flex flex-col gap-8 md:mt-20 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md border-l border-[var(--hairline-strong)] pl-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Antes de entrar
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
            Demo de tamizaje, no de diagnóstico. Dataset UCI Gallstone, 319 casos,
            Ankara. Rendimiento rural: AUC 0.8138 · Accuracy 77.08%.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <MagneticButton href="/consulta">Simular visita médica</MagneticButton>
          <a
            href="https://github.com/rosewt-upc/WinterProject"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--muted)] underline decoration-[var(--hairline-strong)] decoration-1 underline-offset-8 transition hover:text-[var(--accent)]"
          >
            Código en GitHub →
          </a>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <SectionNumber index="01" label="El problema" />

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
          <SectionReveal className="md:col-span-7 lg:col-span-8">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-[var(--hairline)] bg-[var(--surface-0)]">
              <div className="absolute inset-0 grid-bg opacity-40" />
              <HumanSilhouette
                highlightGallbladder
                className="absolute inset-0 h-full w-full text-[var(--muted-strong)]"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[var(--hairline)] bg-[var(--background)]/80 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)] backdrop-blur-sm">
                <span>Fig. 01 · Anatomía</span>
                <span className="text-[var(--accent-strong)]">Vesícula biliar</span>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.15} className="flex flex-col md:col-span-5 lg:col-span-4">
            <h2
              className="font-sans font-light leading-[1.1] tracking-[-0.02em] text-[var(--foreground-strong)]"
              style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)" }}
            >
              Llevamos al médico al pueblo. Pero para diagnosticar, <em className="italic text-[var(--accent)] not-italic font-medium">el poblador es el que tiene que ir</em>.
            </h2>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[var(--muted-strong)]">
              La Red Inversa — el programa público que acerca brigadas médicas a comunidades rurales — no alcanza para cálculos biliares: la ecografía vive en el centro de salud de segundo (II) o tercer (III) nivel más cercano.
            </p>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

function PaperSection() {
  return (
    <section className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <SectionNumber index="02" label="Lo que hace el paper" />

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
          <SectionReveal delay={0.1} className="order-2 flex flex-col md:order-1 md:col-span-5 lg:col-span-4">
            <h2
              className="font-sans font-light leading-[1.05] tracking-[-0.02em] text-[var(--foreground-strong)]"
              style={{ fontSize: "clamp(1.75rem, 3.8vw, 2.5rem)" }}
            >
              El estudio UCI entrena con sangre y bioimpedancia en un hospital de <em className="italic text-[var(--accent)] not-italic font-medium">Ankara</em>.
            </h2>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[var(--muted-strong)]">
              319 casos, 38 predictores. El modelo alcanza AUC 0.928 sobre su propio dataset — pero depende de variables que no viajan a la sierra.
            </p>

            <div className="mt-12 flex flex-col gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
                  Rendimiento reportado
                </p>
                <p
                  className="mt-3 font-sans font-light leading-none tracking-[-0.02em] text-[var(--foreground-strong)]"
                  style={{ fontSize: "clamp(2.5rem, 5.5vw, 3.75rem)" }}
                >
                  AUC 0.928
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
                  Accuracy
                </p>
                <p className="mt-2 font-mono text-2xl text-[var(--foreground-strong)]">
                  88.54%
                </p>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal className="order-1 md:order-2 md:col-span-7 lg:col-span-8">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-[var(--hairline)] bg-[var(--surface-0)]">
              <div className="absolute inset-0 grid-bg opacity-40" />
              <GallbladderDetail className="absolute inset-0 h-full w-full text-[var(--muted-strong)]" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[var(--hairline)] bg-[var(--background)]/80 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)] backdrop-blur-sm">
                <span>Fig. 02 · Colelitiasis</span>
                <span>UCI dataset · Ankara</span>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

function RuralSection() {
  return (
    <section className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <SectionNumber index="03" label="La adaptación rural" />

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
          <SectionReveal className="md:col-span-7 lg:col-span-8">
            <div className="relative aspect-[3/4] w-full overflow-hidden border border-[var(--hairline)] bg-[var(--surface-0)] md:aspect-[4/5]">
              <div className="absolute inset-0 grid-bg opacity-40" />
              <BioimpedanceGrid className="absolute inset-0 h-full w-full text-[var(--muted-strong)]" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[var(--hairline)] bg-[var(--background)]/80 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)] backdrop-blur-sm">
                <span>Fig. 03 · Bioimpedancia</span>
                <span className="text-[var(--accent-strong)]">4 electrodos</span>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.15} className="flex flex-col md:col-span-5 lg:col-span-4">
            <h2
              className="font-sans font-light leading-[1.05] tracking-[-0.02em] text-[var(--foreground-strong)]"
              style={{ fontSize: "clamp(1.75rem, 3.8vw, 2.5rem)" }}
            >
              Sacrificamos laboratorio. Conservamos <em className="italic text-[var(--accent)] not-italic font-medium">25 señales</em> de campo.
            </h2>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[var(--muted-strong)]">
              La balanza de bioimpedancia reemplaza la muestra de sangre. La respuesta ocurre frente al poblador — no en un mensaje posterior.
            </p>

            <div className="mt-12 flex flex-col gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
                  Rendimiento rural
                </p>
                <p
                  className="mt-3 font-sans font-light leading-none tracking-[-0.02em] text-[var(--accent)]"
                  style={{ fontSize: "clamp(2.5rem, 5.5vw, 3.75rem)" }}
                >
                  AUC 0.8138
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
                  Accuracy
                </p>
                <p className="mt-2 font-mono text-2xl text-[var(--foreground-strong)]">
                  77.08%
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
                  Variables lab eliminadas
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
                  Se retiraron 13 variables de laboratorio para reducir fricción operativa.
                </p>
                <details className="mt-4 group">
                  <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted-strong)] transition group-open:text-[var(--accent)]">
                    Ver ejemplos
                  </summary>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-[var(--muted-strong)]">
                    {EXCLUDED_LAB_FEATURES.map((f) => (
                      <span key={f} className="line-through decoration-[var(--accent)]/60">
                        {f}
                      </span>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

function TradeoffBar({
  label,
  eyebrow,
  value,
  highlight,
  delay = 0,
}: {
  label: string;
  eyebrow: string;
  value: number;
  highlight?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const pct = (value * 100).toFixed(1);

  return (
    <SectionReveal delay={delay} className="group relative">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {eyebrow}
          </p>
          <p className="mt-2 font-sans text-lg font-medium text-[var(--foreground)] md:text-xl">
            {label}
          </p>
        </div>
        <p
          className={`font-sans font-light tracking-[-0.02em] ${highlight ? "text-[var(--accent)]" : "text-[var(--foreground-strong)]"
            }`}
          style={{ fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)", lineHeight: 0.9 }}
        >
          {pct}
          <span className="font-mono text-sm align-top ml-1">%</span>
        </p>
      </div>

      <div className="relative mt-6 h-px w-full overflow-hidden bg-[var(--hairline)]">
        <motion.span
          initial={{ scaleX: 0, transformOrigin: "left" }}
          whileInView={{ scaleX: reduce ? 1 : value }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduce ? 0.3 : 1.6, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute inset-0 block h-[2px] -mt-px ${highlight ? "bg-[var(--accent)] shadow-[0_0_18px_var(--accent-glow)]" : "bg-[var(--foreground-strong)]"
            }`}
        />
      </div>
    </SectionReveal>
  );
}

function TradeoffSection() {
  return (
    <section className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <SectionNumber index="04" label="El tradeoff" />

        <SectionReveal className="mt-12">
          <h2
            className="max-w-3xl font-sans font-light leading-[1.05] tracking-[-0.02em] text-[var(--foreground-strong)]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Precisión por <em className="italic text-[var(--accent)] not-italic font-medium">inmediatez</em>.
          </h2>
        </SectionReveal>

        <div className="mt-16 grid grid-cols-1 gap-16 md:mt-24 md:grid-cols-2 md:gap-12">
          <div className="space-y-16">
            {TRADEOFF_METRICS.map((item, index) => (
              <TradeoffBar
                key={item.label}
                label={item.label}
                eyebrow={`Accuracy · ${item.eyebrow}`}
                value={item.accuracy}
                highlight={index === 1}
                delay={index * 0.1}
              />
            ))}
          </div>

          <div className="space-y-16">
            {TRADEOFF_METRICS.map((item, index) => (
              <TradeoffBar
                key={`auc-${item.label}`}
                label={item.label}
                eyebrow={`AUC · ${item.eyebrow}`}
                value={item.auc}
                highlight={index === 1}
                delay={index * 0.1 + 0.05}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScenariosSection() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const progressX = useTransform(scrollYProgress, [0.15, 0.85], ["0%", "100%"]);

  return (
    <section
      ref={ref}
      className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16"
    >
      <div className="mx-auto max-w-[1280px]">
        <SectionNumber index="05" label="Tres escenarios" />

        <SectionReveal className="mt-12">
          <h2
            className="max-w-3xl font-sans font-light leading-[1.05] tracking-[-0.02em] text-[var(--foreground-strong)]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Una misma visita, tres formas de que la respuesta <em className="italic text-[var(--accent)] not-italic font-medium">vuelva</em>.
          </h2>
        </SectionReveal>

        <div className="mt-16 md:mt-24 lg:grid lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:sticky lg:top-32 lg:col-span-3 lg:block lg:self-start">
            <div className="relative h-px w-full bg-[var(--hairline)]">
              <motion.span
                style={{ scaleX: reduce ? 1 : progressX, transformOrigin: "left" }}
                className="absolute inset-0 block bg-[var(--accent)]"
              />
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Progresión narrativa
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--muted-strong)]">
              Cada acto cambia qué carga el médico, qué espera el poblador y dónde vive la decisión.
            </p>
          </aside>

          <div className="space-y-24 lg:col-span-9 lg:space-y-36">
            {HOME_SCENARIOS.map((scenario, index) => (
              <SectionReveal
                key={scenario.id}
                delay={0.05}
                className="relative"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-6">
                  <span
                    className="font-sans font-light leading-none tracking-[-0.03em] text-[var(--foreground-strong)]"
                    style={{ fontSize: "clamp(3.5rem, 9vw, 7rem)" }}
                  >
                    {ROMAN[index]}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--muted)]">
                    {scenario.eyebrow}
                  </span>
                </div>

                <HairlineDivider className="mt-8" />

                <h3
                  className="mt-10 max-w-3xl font-sans font-normal leading-[1.15] tracking-[-0.01em] text-[var(--foreground-strong)]"
                  style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                >
                  {scenario.title}
                </h3>

                <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-strong)]">
                  {scenario.summary}
                </p>

                <div className="mt-10 border-t border-[var(--hairline)] pt-10">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                    Ruta operativa
                  </p>
                  <div className="mt-6 w-full overflow-x-auto">
                    <RuralRouteDiagram
                      route={scenario.route}
                      accent={index === 2 ? "var(--accent)" : "var(--muted-strong)"}
                      className="h-40 w-full min-w-[480px] text-[var(--muted-strong)]"
                    />
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Ventana
                    </p>
                    <p
                      className="mt-4 font-sans font-light leading-tight tracking-[-0.01em] text-[var(--foreground-strong)]"
                      style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)" }}
                    >
                      {scenario.responseWindow}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Carga del poblador
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
                      {scenario.patientLoad}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                      Desempeño
                    </p>
                    <p className="mt-4 font-mono text-sm leading-relaxed text-[var(--foreground-strong)]">
                      {scenario.metricValue}
                    </p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <SectionNumber index="07" label="Entrar al demo" />

        <SectionReveal className="mt-12">
          <h2
            className="max-w-4xl font-sans font-light leading-[0.98] tracking-[-0.03em] text-[var(--foreground-strong)]"
            style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
          >
            Vive la <em className="italic font-light text-[var(--accent)]">visita</em>.
          </h2>
        </SectionReveal>

        <SectionReveal
          delay={0.2}
          className="mt-12 flex flex-col gap-10 md:mt-16 md:flex-row md:items-end md:justify-between"
        >
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--muted-strong)]">
            Consulta guiada, medición simulada y lectura de riesgo explicable.
            Tres actos, menos de tres minutos.
          </p>
          <MagneticButton href="/consulta">Empezar</MagneticButton>
        </SectionReveal>

        <SectionReveal
          delay={0.3}
          className="mt-24 border-t border-[var(--hairline)] pt-10 md:mt-32"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Lo que la demo no oculta
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            {LIMITATIONS.map((item, index) => (
              <li key={item} className="flex gap-4 text-sm leading-relaxed text-[var(--muted-strong)]">
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  0{index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionReveal>

        <footer className="mt-24 flex flex-col gap-4 border-t border-[var(--hairline)] pt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <p>Rody Vilchez · UPC · 2026</p>
          <p>Dataset UCI Gallstone · 319 casos · Ankara</p>
          <Link href="/consulta" className="transition hover:text-[var(--accent)]">
            Abrir demo ↗
          </Link>
        </footer>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    warmUp();
  }, []);

  return (
    <main className="relative w-full">
      <Hero />
      <ProblemSection />
      <PaperSection />
      <RuralSection />
      <TradeoffSection />
      <ScenariosSection />
      <ArchitectureSection />
      <ClosingSection />
    </main>
  );
}
