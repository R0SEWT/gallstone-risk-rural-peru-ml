"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FallbackForm } from "@/components/FallbackForm";
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

  const handleDemographics = useCallback(
    (demo: Demographics) => {
      setDemographics(demo);
      setTimeout(() => router.push("/medicion"), 1500);
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
        setMessages((m) => [...m, { role: "assistant", content: "" }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: full };
            return copy;
          });
        }
        setFailures(0);

        const extracted = tryExtract(full);
        if (extracted && extracted.Age && extracted.Height && extracted.Weight) {
          const h = Number(extracted.Height);
          const w = Number(extracted.Weight);
          const bmi = h > 0 ? w / Math.pow(h / 100, 2) : 0;
          handleDemographics({
            Age: Number(extracted.Age),
            Gender: Number(extracted.Gender ?? 0),
            Height: h,
            Weight: w,
            BMI: Number(bmi.toFixed(2)),
            Comorbidity: Number(extracted.Comorbidity ?? 0),
            CAD: Number(extracted.CAD ?? 0),
            Hypothyroidism: Number(extracted.Hypothyroidism ?? 0),
            Hyperlipidemia: Number(extracted.Hyperlipidemia ?? 0),
            DM: Number(extracted.DM ?? 0),
          });
        }
      } catch (e) {
        setFailures((f) => {
          const next = f + 1;
          if (next >= 2) setShowFallback(true);
          return next;
        });
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Hubo un problema con la conexión. Si persiste, usa el formulario manual.",
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
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Acto 1 · Consulta
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Dra. Elena Ramírez
            </h1>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Inicio
          </Link>
        </header>

        {showFallback ? (
          <div>
            <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
              La conversación no pudo continuar. Completa los datos manualmente
              para seguir con la medición.
            </div>
            <FallbackForm onSubmit={handleDemographics} />
          </div>
        ) : (
          <>
            <div
              ref={scrollerRef}
              className="h-[480px] overflow-y-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              {messages
                .filter((m) => !m.hidden)
                .map((m, i, arr) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {m.content.replace(EXTRACTION_RE, "").trim() ||
                        (loading && i === arr.length - 1 ? "…" : "")}
                    </div>
                  </motion.div>
                ))}
            </div>

            <form onSubmit={submit} className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu respuesta…"
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:border-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-40"
              >
                Enviar
              </button>
            </form>

            <button
              onClick={() => setShowFallback(true)}
              className="mt-3 text-xs text-slate-500 underline hover:text-slate-700"
            >
              Prefiero completar un formulario
            </button>
          </>
        )}
      </div>
    </main>
  );
}
