"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ActShell } from "@/components/ActShell";
import { generateBioimpedance } from "@/lib/api";
import { ACT_NOTES } from "@/lib/content";
import { areDemographicsEqual, coerceDemographics } from "@/lib/demographics";
import { useDemoStore } from "@/lib/store";
import { FEATURE_LABELS, type Bioimpedance } from "@/lib/types";

const BIO_ORDER: (keyof Bioimpedance)[] = [
  "TBW", "ECW", "ICW", "ECF_TBW", "TBFR",
  "LM", "Protein", "VFR", "BM", "MM",
  "Obesity", "TFC", "VFA", "VMA", "HFA",
];

const METRIC_GROUPS = [
  {
    id: "fluids",
    title: "Balance hídrico",
    summary: "Distribución de agua corporal.",
    keys: ["TBW", "ECW", "ICW", "ECF_TBW"] as (keyof Bioimpedance)[],
  },
  {
    id: "mass",
    title: "Masa y tejido magro",
    summary: "Masa muscular y estructura.",
    keys: ["LM", "Protein", "BM", "MM"] as (keyof Bioimpedance)[],
  },
  {
    id: "fat",
    title: "Distribución de grasa",
    summary: "Componente metabólico del riesgo.",
    keys: ["TBFR", "VFR", "Obesity", "TFC", "VFA", "HFA"] as (keyof Bioimpedance)[],
  },
  {
    id: "visceral",
    title: "Lectura visceral",
    summary: "Composición central del cuerpo.",
    keys: ["VMA"] as (keyof Bioimpedance)[],
  },
] as const;

function PulseRing({ active }: { active: boolean }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute inset-0 rounded-full border border-[var(--accent)]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={
            reduce || !active
              ? { scale: 1, opacity: 0.2 }
              : { scale: [0.6, 1.15], opacity: [0.55, 0] }
          }
          transition={{
            duration: 2.4,
            delay: i * 0.8,
            repeat: active && !reduce ? Infinity : 0,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        aria-hidden
        className="absolute inset-8 rounded-full bg-[var(--accent)] opacity-10 blur-2xl"
        animate={reduce ? undefined : { opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Bioimpedancia
        </p>
        <svg
          viewBox="0 0 120 120"
          className="mt-4 h-20 w-20"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
        >
          <circle cx="60" cy="60" r="52" strokeDasharray="2 6" opacity="0.6" />
          <circle cx="60" cy="60" r="40" strokeDasharray="4 4" opacity="0.4" />
          <motion.circle
            cx="60"
            cy="60"
            r="6"
            fill="var(--accent)"
            animate={reduce ? undefined : { r: [5, 9, 5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  visible,
  delay,
}: {
  label: string;
  value: string | null;
  visible: boolean;
  delay: number;
}) {
  return (
    <div className="relative border-t border-[var(--hairline)] py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">
        {label}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {visible && value ? (
          <motion.p
            key="value"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 font-sans font-light text-3xl leading-none tracking-[-0.02em] text-[var(--foreground-strong)]"
          >
            {value}
          </motion.p>
        ) : (
          <motion.p
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 font-mono text-sm text-[var(--muted)]"
          >
            — — —
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MedicionPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { demographics, setDemographics, setBioimpedance } = useDemoStore();
  const [bio, setBio] = useState<Bioimpedance | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const visibleKeys = new Set(BIO_ORDER.slice(0, revealed));
  const captureProgress = bio ? revealed / BIO_ORDER.length : 0;
  const pctDisplay = Math.round(captureProgress * 100)
    .toString()
    .padStart(3, "0");

  useEffect(() => {
    if (!demographics) {
      router.replace("/consulta");
      return;
    }

    const normalized = coerceDemographics(demographics);
    if (!normalized) {
      setError("No se pudieron validar los datos de la consulta.");
      return;
    }

    if (!areDemographicsEqual(demographics, normalized)) {
      setDemographics(normalized);
      return;
    }

    generateBioimpedance({
      age: normalized.Age,
      gender: normalized.Gender,
      height: normalized.Height,
      weight: normalized.Weight,
      bmi: normalized.BMI,
    })
      .then((response) => {
        setBio(response.features);
        setBioimpedance(response.features);
      })
      .catch((e) => setError(e.message));
  }, [demographics, router, setBioimpedance, setDemographics]);

  useEffect(() => {
    if (!bio) return;
    if (reduceMotion) {
      setRevealed(BIO_ORDER.length);
      const timeout = setTimeout(() => router.push("/resultado"), 1200);
      return () => clearTimeout(timeout);
    }

    if (revealed >= BIO_ORDER.length) {
      const timeout = setTimeout(() => router.push("/resultado"), 1600);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => setRevealed((current) => current + 1), 340);
    return () => clearTimeout(timeout);
  }, [bio, revealed, reduceMotion, router]);

  return (
    <ActShell
      step="medicion"
      eyebrow="Acto 02 · Medición"
      title="Bioimpedancia como sustituto del laboratorio."
      intro="A partir de edad, sexo, estatura y peso, la demo genera una lectura corporal completa. La animación dramatiza la transferencia al modelo."
      note={ACT_NOTES.medicion}
      aside={
        <>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Progreso
            </p>
            <p className="mt-6 font-sans font-light text-5xl leading-none tracking-[-0.02em] text-[var(--foreground-strong)]">
              {pctDisplay}
              <span className="ml-2 font-mono text-lg align-top text-[var(--muted)]">
                %
              </span>
            </p>
            <div className="mt-6 h-px w-full bg-[var(--hairline)]">
              <motion.span
                className="block h-px bg-[var(--accent)]"
                style={{ transformOrigin: "left" }}
                animate={{ scaleX: captureProgress }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted-strong)]">
              {bio
                ? `${revealed} / ${BIO_ORDER.length} variables`
                : "Inicializando lectura"}
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Qué se gana
            </p>
            <ul className="mt-6 space-y-5 text-[13px] leading-relaxed text-[var(--muted-strong)]">
              <li className="flex gap-4">
                <span className="mt-1 h-px w-6 bg-[var(--accent)]" />
                <span>Señal fisiológica sin extracción de sangre.</span>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 h-px w-6 bg-[var(--accent)]" />
                <span>Pensado para brigadas, no consultorio equipado.</span>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 h-px w-6 bg-[var(--accent)]" />
                <span>No equivale a medición clínica real.</span>
              </li>
            </ul>
          </div>
        </>
      }
    >
      {error ? (
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--danger)]">
            Medición interrumpida
          </p>
          <h2 className="mt-6 font-sans font-light text-[2rem] leading-tight tracking-[-0.02em] text-[var(--foreground-strong)]">
            No se pudo generar la lectura.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted-strong)]">
            {error}
          </p>
        </section>
      ) : (
        <section className="space-y-16 md:space-y-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[340px_1fr]">
            <PulseRing active={Boolean(bio)} />

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                {bio ? "Escaneando" : "Sincronizando"}
              </p>
              <p
                className="mt-6 font-sans font-light leading-[1.05] tracking-[-0.03em] text-[var(--foreground-strong)]"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              >
                {bio ? (
                  <>
                    {revealed} <em className="italic font-light text-[var(--muted)]">de</em> {BIO_ORDER.length}
                  </>
                ) : (
                  "Preparando"
                )}
              </p>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--muted-strong)]">
                La señal se revela por familia fisiológica y se transfiere al modelo
                cuando la secuencia se completa.
              </p>
            </div>
          </div>

          <div className="space-y-16 md:space-y-20">
            {METRIC_GROUPS.map((group) => {
              const groupVisible = group.keys.filter((k) => visibleKeys.has(k))
                .length;
              return (
                <div key={group.id} className="grid grid-cols-1 gap-8 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                      {`0${METRIC_GROUPS.indexOf(group) + 1}`} · {group.title}
                    </p>
                    <p className="mt-6 font-sans font-light text-2xl leading-[1.15] tracking-[-0.02em] text-[var(--foreground-strong)] md:text-[1.75rem]">
                      {group.summary}
                    </p>
                    <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                      {groupVisible} / {group.keys.length}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 md:col-span-8">
                    {group.keys.map((key, index) => (
                      <MetricCell
                        key={key}
                        label={FEATURE_LABELS[key]}
                        value={bio ? bio[key].toFixed(2) : null}
                        visible={visibleKeys.has(key)}
                        delay={index * 0.05}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {bio && revealed >= BIO_ORDER.length ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-[var(--accent)]/40 pt-8"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">
                Medición completa
              </p>
              <p className="mt-4 font-sans font-light text-2xl leading-tight tracking-[-0.02em] text-[var(--foreground-strong)] md:text-3xl">
                Transfiriendo lectura al modelo rural.
              </p>
            </motion.div>
          ) : null}
        </section>
      )}
    </ActShell>
  );
}
