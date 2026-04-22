import { SectionReveal } from "@/components/SectionReveal";

const ARCHITECTURE_CARDS = [
  {
    eyebrow: "Frontend público",
    title: "Vercel + gallstone.rosewt.dev",
    summary:
      "Landing, flujo de consulta y visualización del resultado. El chat vive en el route handler /api/chat y se ejecuta server-side.",
    stack: [
      "Next.js 16",
      "React 19",
      "Tailwind CSS 4",
      "Framer Motion",
      "Zustand",
      "sessionStorage",
    ],
    notes: [
      "Subdominio principal: gallstone.rosewt.dev",
      "Previews temporales: *.vercel.app",
      "Variable clave: NEXT_PUBLIC_API_URL",
    ],
  },
  {
    eyebrow: "Backend ML",
    title: "Hugging Face Spaces + Docker",
    summary:
      "API HTTP para health, metadata del modelo, predicción, explicación SHAP y generación de bioimpedancia.",
    stack: [
      "Python 3.12",
      "FastAPI",
      "Uvicorn",
      "Pydantic",
      "scikit-learn",
      "SHAP",
      "NumPy",
      "joblib",
    ],
    notes: [
      "URL pública de la API: rosewt-gallstone.hf.space",
      "CORS habilita gallstone.rosewt.dev y previews de Vercel",
      "Endpoints: /health, /model/info, /predict/rural, /explain/rural",
    ],
  },
  {
    eyebrow: "Artefactos del modelo",
    title: "Bundled dentro del backend",
    summary:
      "La inferencia no consulta un modelo remoto. El contenedor lleva los archivos necesarios y los reutiliza en memoria durante la sesión.",
    stack: [
      "rural_gb_pipeline.joblib",
      "bioimpedance_templates.json",
      "rural_metrics.json",
    ],
    notes: [
      "Viven en demo/backend/models/",
      "main.py llama predictor.load_artifacts() en el startup de FastAPI",
      "predictor.py inicializa TreeExplainer sobre _pipeline['gb']",
    ],
  },
  {
    eyebrow: "Servicios externos",
    title: "DeepSeek sólo para la entrevista guiada",
    summary:
      "La conversación médica simulada no hace la predicción. Solo extrae datos estructurados antes de llamar a la API del modelo.",
    stack: [
      "AI SDK",
      "@ai-sdk/openai",
      "Route Handler /api/chat",
      "DeepSeek API",
    ],
    notes: [
      "Se ejecuta desde el frontend server-side",
      "Variable clave: DEEPSEEK_API_KEY",
      "La predicción clínica sigue corriendo en FastAPI",
    ],
  },
] as const;

const OPERATIONS_NOTES = [
  {
    label: "Subdominio",
    value: "gallstone.rosewt.dev",
    detail: "Entrada pública del frontend desplegado en Vercel.",
  },
  {
    label: "Backend público",
    value: "rosewt-gallstone.hf.space",
    detail: "Space Docker donde vive la API de inferencia.",
  },
  {
    label: "Deploy backend",
    value: "scripts/deploy_hf_space.sh",
    detail: "Sincroniza demo/backend hacia el Space de Hugging Face.",
  },
  {
    label: "Dónde cargan",
    value: "FastAPI startup",
    detail: "Los modelos y métricas se leen una vez al iniciar la app.",
  },
] as const;

export function ArchitectureSection() {
  return (
    <section className="relative border-t border-[var(--hairline)] px-6 py-24 sm:px-10 md:py-36 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          <span className="text-[var(--foreground-strong)]">06</span>
          <span className="h-px w-8 bg-[var(--hairline-strong)]" />
          <span>Arquitectura y despliegue</span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 border-b border-[var(--hairline)] pb-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <SectionReveal>
            <h2
              className="max-w-4xl font-sans font-light leading-[1.02] tracking-[-0.03em] text-[var(--foreground-strong)]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
            >
              Frontend en <em className="italic text-[var(--accent)] not-italic font-medium">Vercel</em>. Backend en <em className="italic text-[var(--accent)] not-italic font-medium">Hugging Face</em>. Los modelos viajan con la API.
            </h2>
          </SectionReveal>

          <SectionReveal delay={0.12} className="lg:pl-10">
            <p className="max-w-lg text-[15px] leading-relaxed text-[var(--muted-strong)]">
              La app pública vive en <span className="font-mono text-[var(--foreground)]">gallstone.rosewt.dev</span>, consume la API rural desde un Space Docker y deja el chat guiado como una capa separada. La inferencia no depende de un endpoint de modelos aparte: el backend carga sus artefactos al arrancar y responde predicción, SHAP y generación de bioimpedancia desde ahí.
            </p>
          </SectionReveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:mt-20 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <SectionReveal delay={0.08}>
            <div className="overflow-hidden border border-[var(--hairline)] bg-[#fcfbf7]">
              <img
                src="/architecture/gallstone_runtime_architecture.png"
                alt="Diagrama runtime del demo: usuario, dominio, frontend en Vercel, chat con DeepSeek y backend en Hugging Face Space."
                className="block h-auto w-full"
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--hairline)] pt-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Runtime view
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  Separa el flujo que vive durante la sesión del usuario: navegador, chat y API de inferencia.
                </p>
              </div>
              <a
                href="/architecture/gallstone_runtime_architecture.svg"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted-strong)] transition hover:text-[var(--accent)]"
              >
                Abrir SVG →
              </a>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.14}>
            <div className="overflow-hidden border border-[var(--hairline)] bg-[#fcfbf7]">
              <img
                src="/architecture/gallstone_delivery_architecture.png"
                alt="Diagrama de delivery del demo: GitHub, build en Vercel, exportación de artefactos y despliegue del backend a Hugging Face Space."
                className="block h-auto w-full"
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--hairline)] pt-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Delivery view
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  Muestra cómo el repo construye el frontend y cómo los artefactos del modelo viajan hacia el Space.
                </p>
              </div>
              <a
                href="/architecture/gallstone_delivery_architecture.svg"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted-strong)] transition hover:text-[var(--accent)]"
              >
                Abrir SVG →
              </a>
            </div>
          </SectionReveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {ARCHITECTURE_CARDS.map((card, index) => (
            <SectionReveal
              key={card.title}
              delay={0.08 + index * 0.05}
              className="border border-[var(--hairline)] px-6 py-7 md:px-8"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                {card.eyebrow}
              </p>
              <h3 className="mt-5 max-w-xl font-sans text-[1.7rem] font-light leading-[1.08] tracking-[-0.02em] text-[var(--foreground-strong)]">
                {card.title}
              </h3>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-strong)]">
                {card.summary}
              </p>

              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Stack
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.stack.map((item) => (
                    <span
                      key={item}
                      className="border border-[var(--hairline-strong)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3">
                {card.notes.map((item) => (
                  <div
                    key={item}
                    className="flex gap-4 border-t border-[var(--hairline)] pt-4 text-sm leading-relaxed text-[var(--muted-strong)]"
                  >
                    <span className="mt-2 h-px w-6 bg-[var(--accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </SectionReveal>
          ))}
        </div>

        <div className="mt-16 border-t border-[var(--hairline)] pt-10 md:mt-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Lectura operativa
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {OPERATIONS_NOTES.map((item, index) => (
              <SectionReveal key={item.label} delay={0.1 + index * 0.04}>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-4 font-sans text-[1.45rem] font-light leading-tight tracking-[-0.02em] text-[var(--foreground-strong)]">
                  {item.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
                  {item.detail}
                </p>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
