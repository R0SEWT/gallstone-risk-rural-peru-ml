"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ActShell } from "@/components/ActShell";
import { FallbackForm } from "@/components/FallbackForm";
import { ACT_NOTES } from "@/lib/content";
import { coerceDemographics } from "@/lib/demographics";
import { useDemoStore } from "@/lib/store";
import type { Demographics } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
};

const BOOTSTRAP_MESSAGE: ChatMessage = {
  role: "user",
  content: "Hola doctora, vengo a la consulta.",
  hidden: true,
};

const EXTRACTION_RE = /<EXTRACTION>\s*([\s\S]*?)\s*<\/EXTRACTION>/i;

const TOPICS = [
  "Edad",
  "Sexo",
  "Estatura",
  "Peso",
  "Comorbilidad",
  "Coronaria",
  "Tiroides",
  "Lípidos",
  "Diabetes",
];

function tryExtract(text: string): Partial<Demographics> | null {
  const match = text.match(EXTRACTION_RE);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export default function ConsultaPage() {
  const router = useRouter();
  const setDemographics = useDemoStore((s) => s.setDemographics);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [failures, setFailures] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const answeredCount = Math.min(
    messages.filter((message) => message.role === "user" && !message.hidden)
      .length,
    9,
  );
  const progress = answeredCount / 9;
  const remainingAnswers = Math.max(0, 9 - answeredCount);

  const handleDemographics = useCallback(
    (demo: Demographics) => {
      setDemographics(demo);
      setTimeout(() => router.push("/medicion"), 1100);
    },
    [router, setDemographics],
  );

  const send = useCallback(
    async (history: ChatMessage[]) => {
      setLoading(true);
      try {
        const payload = history.map(({ role, content }) => ({ role, content }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
        });
        if (!res.ok || !res.body) throw new Error(`status ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        setMessages((current) => [...current, { role: "assistant", content: "" }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setMessages((current) => {
            const copy = [...current];
            copy[copy.length - 1] = { role: "assistant", content: full };
            return copy;
          });
        }
        setFailures(0);

        const extracted = tryExtract(full);
        if (extracted) {
          const normalized = coerceDemographics(extracted);
          if (normalized) {
            handleDemographics(normalized);
          } else {
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content:
                  "Pude cerrar la entrevista, pero necesito validar estatura o peso antes de seguir. Usa el formulario manual para corregirlos.",
              },
            ]);
            setShowFallback(true);
          }
        }
      } catch {
        setFailures((current) => {
          const next = current + 1;
          if (next >= 2) setShowFallback(true);
          return next;
        });
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              "La entrevista se interrumpió. Si vuelve a pasar, cambia al formulario manual para no perder el flujo.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [handleDemographics],
  );

  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);
    setMessages([BOOTSTRAP_MESSAGE]);
    send([BOOTSTRAP_MESSAGE]);
  }, [bootstrapped, send]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(next);
    setInput("");
    send(next);
  }

  return (
    <ActShell
      step="consulta"
      eyebrow="Acto 01 · Consulta"
      title="Una entrevista breve, solo lo que puede medirse en campo."
      intro="La Dra. Elena recoge nueve datos demográficos y antecedentes básicos. El objetivo no es diagnosticar — es preparar una lectura de riesgo con variables que una brigada sí puede capturar."
      note={ACT_NOTES.consulta}
      aside={
        <>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Progresión
            </p>
            <div className="mt-6 space-y-3">
              {TOPICS.map((topic, index) => {
                const done = index < answeredCount;
                const active = index === answeredCount;
                return (
                  <div
                    key={topic}
                    className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em]"
                  >
                    <span
                      className={`inline-block h-px transition-all ${
                        active
                          ? "w-10 bg-[var(--accent)]"
                          : done
                            ? "w-6 bg-[var(--muted-strong)]"
                            : "w-4 bg-[var(--hairline-strong)]"
                      }`}
                    />
                    <span className="w-6 text-[var(--muted)]">
                      {`0${index + 1}`}
                    </span>
                    <span
                      className={
                        active
                          ? "text-[var(--accent)]"
                          : done
                            ? "text-[var(--muted-strong)]"
                            : "text-[var(--muted)]"
                      }
                    >
                      {topic}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Estado
            </p>
            <p className="mt-6 font-sans font-light text-4xl leading-none tracking-[-0.02em] text-[var(--foreground-strong)]">
              {answeredCount}
              <span className="text-[var(--muted)]">/9</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
              {remainingAnswers > 0
                ? `${remainingAnswers} respuestas faltan antes de medición.`
                : "Entrevista completa. Preparando acto 02."}
            </p>
            {failures > 0 ? (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--warning)]">
                Errores de red: {failures}
              </p>
            ) : null}
          </div>
        </>
      }
    >
      {showFallback ? (
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--warning)]">
                Ruta alternativa
              </p>
              <h2 className="mt-6 font-sans font-light text-[2rem] leading-[1.08] tracking-[-0.02em] text-[var(--foreground-strong)]">
                Completa la ficha manual.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
                Corrige o confirma los datos aquí y pasa directamente a medición.
              </p>
            </div>
            <button
              onClick={() => setShowFallback(false)}
              className="self-start font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--muted-strong)] underline decoration-[var(--hairline-strong)] decoration-1 underline-offset-8 transition hover:text-[var(--accent)]"
            >
              ← Volver al chat
            </button>
          </div>

          <div className="mt-12 border-t border-[var(--hairline)] pt-12">
            <FallbackForm onSubmit={handleDemographics} />
          </div>
        </section>
      ) : (
        <section>
          <div className="flex flex-col gap-4 border-b border-[var(--hairline)] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Interlocutora
              </p>
              <p className="mt-3 font-sans text-2xl font-light italic text-[var(--foreground-strong)]">
                Dra. Elena Ramírez
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]"
                  style={{
                    boxShadow: loading
                      ? "0 0 10px var(--accent)"
                      : "0 0 4px var(--accent)",
                  }}
                />
                {loading ? "Transmitiendo" : "Escuchando"}
              </span>
              <span>·</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="mt-8 h-[52vh] min-h-[380px] overflow-y-auto pr-2 md:h-[56vh]"
          >
            <div className="space-y-8">
              {messages
                .filter((message) => !message.hidden)
                .map((message, index, visibleMessages) => {
                  const isAssistant = message.role === "assistant";
                  const content =
                    message.content.replace(EXTRACTION_RE, "").trim() ||
                    (loading && index === visibleMessages.length - 1 ? "…" : "");

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={
                        isAssistant
                          ? "max-w-xl pr-4"
                          : "ml-auto max-w-md pl-4 text-right"
                      }
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                        {isAssistant ? "Dra. Elena" : "Paciente"}
                      </p>
                      <p
                        className={
                          isAssistant
                            ? "mt-3 font-sans text-[1.25rem] font-normal italic leading-[1.4] text-[var(--muted-strong)] md:text-[1.4rem]"
                            : "mt-3 text-[15px] font-medium leading-relaxed text-[var(--foreground-strong)]"
                        }
                      >
                        {content}
                      </p>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          <form
            onSubmit={submit}
            className="mt-8 border-t border-[var(--hairline)] pt-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label
                  htmlFor="chat-input"
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]"
                >
                  Respuesta del paciente
                </label>
                <input
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe aquí…"
                  disabled={loading}
                  autoComplete="off"
                  className="mt-3 w-full border-0 border-b border-[var(--hairline-strong)] bg-transparent py-3 text-[17px] text-[var(--foreground-strong)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 self-stretch rounded-full bg-[var(--accent)] px-8 font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--accent-ink)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted)] md:self-auto"
              >
                Enviar →
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Si el chat falla, cambia al manual
              </p>
              <button
                type="button"
                onClick={() => setShowFallback(true)}
                className="self-start font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--muted-strong)] underline decoration-[var(--hairline-strong)] underline-offset-6 transition hover:text-[var(--accent)] md:self-auto"
              >
                Formulario manual ↗
              </button>
            </div>
          </form>
        </section>
      )}
    </ActShell>
  );
}
