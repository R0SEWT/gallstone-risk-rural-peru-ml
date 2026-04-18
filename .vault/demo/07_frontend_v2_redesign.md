---
purpose: Reference del frontend v2 — tokens, componentes compartidos, ilustraciones, páginas y pitfalls. Consultable por agentes.
last_updated: 2026-04-17
source_of_truth: ./00_orchestrator.md
status: active
---

# Frontend v2 — Reference

Estado actual: `demo/frontend/` corre en **light documental + sans-serif + ilustración SVG anatómica**. La versión anterior (dark-editorial con Instrument Serif) fue reemplazada en `bddb6e1`. No existe dark mode.

Stack runtime: Next.js 16.2.3 (App Router, Turbopack), React 19.2.4, Tailwind v4, Framer Motion 12.38.0, Lenis 1.3.11, Zustand 5. DOM/flujo demo sin cambios: Zustand store, endpoint `/api/chat`, backend FastAPI en HuggingFace Spaces.

---

## 1. Mapa de archivos

Todo path relativo a `demo/frontend/`.

| Área | Archivo |
|------|---------|
| Global styles | `app/globals.css` |
| Layout raíz | `app/layout.tsx` |
| Home | `app/page.tsx` |
| Acto 1 — consulta | `app/consulta/page.tsx` |
| Acto 2 — medición | `app/medicion/page.tsx` |
| Acto 3 — resultado | `app/resultado/page.tsx` |
| API chat | `app/api/chat/route.ts` |
| Componentes | `components/*.tsx` |
| Ilustraciones SVG | `components/illustrations/*.tsx` |
| API client | `lib/api.ts` |
| Store demo | `lib/store.ts` |
| Contenido editorial | `lib/content.ts` |
| Tipos compartidos | `lib/types.ts` |
| Demographics helpers | `lib/demographics.ts` |

---

## 2. Design tokens — `app/globals.css:3-44`

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `#f4f1ea` | Fondo base (off-white cálido) |
| `--surface-0` | `#efeae0` | Elevación mínima |
| `--surface-1` | `#e8e2d4` | Superficie intermedia |
| `--surface-2` | `#dcd3c0` | Panel destacado |
| `--surface-3` | `#c9bfa9` | — (reservado) |
| `--foreground` | `#17171a` | Texto base |
| `--foreground-strong` | `#0a0a0c` | Titulares |
| `--muted` | `#6b675f` | Labels secundarios |
| `--muted-strong` | `#3c3a35` | Texto destacado mutado |
| `--hairline` | `rgba(23,23,26,0.12)` | Separadores sutiles |
| `--hairline-strong` | `rgba(23,23,26,0.24)` | Underlines, bordes input |
| `--accent` | `#b24a2a` | Acento único (terracota) |
| `--accent-strong` | `#8f3a20` | Hover del accent |
| `--accent-soft` | `rgba(178,74,42,0.12)` | Fondos tenues del accent |
| `--accent-glow` | `rgba(178,74,42,0.28)` | Glow gauge/anillo |
| `--accent-ink` | `#f4f1ea` | **Texto sobre fondo `--accent`** |
| `--danger` | `#b33322` | Riesgo alto, SHAP positivo |
| `--warning` | `#a67000` | Riesgo medio |
| `--success` | `#1f7a4a` | Riesgo bajo, SHAP negativo |
| `--font-sans` | `var(--font-geist-sans)` | Display + cuerpo |
| `--font-mono` | `var(--font-geist-mono)` | Labels, numeración, meta |

`color-scheme: light`. Tailwind v4 `@theme inline` mapea `--color-*` a los mismos tokens (`globals.css:39-44`).

---

## 3. Tipografía

| Rol | Font | Peso | Tracking |
|-----|------|------|----------|
| Display | Geist Sans | 300 (light) | `-0.03em` a `-0.02em` |
| Cuerpo | Geist Sans | 400–500 | normal |
| Mono labels | Geist Mono | 400 uppercase | `0.24em`–`0.28em` |

Imports de fuentes: `app/layout.tsx` (solo `Geist_Sans` + `Geist_Mono`). `font-feature-settings: "ss01","ss02"` activo.

---

## 4. Componentes compartidos — `components/`

| Componente | Archivo:línea | Props |
|-----------|---------------|-------|
| `ActShell` | `ActShell.tsx:21` | `{ step: StepId; eyebrow, title, intro: string; note?: string; aside?: ReactNode; children: ReactNode }` — shell de las 3 páginas de acto. `StepId` viene de `DEMO_STEPS` en `lib/content.ts`. |
| `RiskGauge` | `RiskGauge.tsx:31` | `{ probability: number; riskLevel: RiskLevel }` — semicírculo animado. Colores desde `RISK_COLORS` (líneas 11-15) que resuelven a `--success / --warning / --danger`. |
| `ShapWaterfall` | `ShapWaterfall.tsx:11` | `{ shapValues: Record<string, number>; topN?: number }` (default 7). Negativo en `--success`, positivo en `--danger`. Labels vía `FEATURE_LABELS` en `lib/types.ts`. |
| `FallbackForm` | `FallbackForm.tsx:99` | `{ onSubmit: (d: Demographics) => void }` — form fallback del chat LLM. Usa `coerceDemographics` de `lib/demographics.ts`. |
| `MagneticButton` | `MagneticButton.tsx:19` | `{ href: string; children: ReactNode; variant?: "primary" \| "ghost"; className?: string }` — primary usa `var(--accent-ink)` sobre `var(--accent)`. |
| `SectionReveal` | `SectionReveal.tsx:13` | `{ children; delay?: number; y?: number; as?: "div"\|"section"\|"article"\|"aside"\|"header"\|"footer" } & HTMLMotionProps<"div">` — whileInView con `useReducedMotion` fallback. |
| `ParallaxLayer` | `ParallaxLayer.tsx:12` | `{ children; speed?: number; className? }` (speed default 0.3). |
| `HairlineDivider` | `HairlineDivider.tsx:11` | `{ orientation?: "horizontal"\|"vertical"; className?; delay?: number }` — scaleX/scaleY draw-in. Usa `--hairline-strong`. |
| `SmoothScroll` | `SmoothScroll.tsx:6` | Sin props. Lenis global en `app/layout.tsx`. |
| `GridBackground` | `GridBackground.tsx:1` | Sin props. Grid + noise + radiales tintados terracota. |

---

## 5. Ilustraciones SVG — `components/illustrations/`

Todas respetan `useReducedMotion()`: si el usuario lo pide, se renderizan en estado final estático.

| Componente | Archivo:línea | Props | Animación |
|-----------|---------------|-------|-----------|
| `HumanSilhouette` | `HumanSilhouette.tsx:10` | `{ className?; highlightGallbladder?: boolean }` | Stroke `pathLength` draw-in; pulso radial en vesícula si `highlightGallbladder` |
| `GallbladderDetail` | `GallbladderDetail.tsx:15` | `{ className? }` | 3 cálculos aparecen en stagger; leader lines de etiquetas |
| `BioimpedanceGrid` | `BioimpedanceGrid.tsx:23` | `{ className? }` | Corriente en loop via `offsetPath`; grid draw-in |
| `RuralRouteDiagram` | `RuralRouteDiagram.tsx:11` | `{ route: readonly string[]; accent?: string; className? }` | Línea draw-in + indicador viajero sobre el path |

Paleta: stroke `currentColor` o `--muted-strong`, highlights en `--accent`, sin fills pesados.

---

## 6. Páginas

| Ruta | Archivo | Responsabilidad | No tocar |
|------|---------|-----------------|----------|
| `/` | `app/page.tsx` | 6 secciones numeradas (Hero + 01–05 + Closing). Reusa `HOME_SCENARIOS`, `HERO_FACTS`, `TRADEOFF_METRICS`, `LIMITATIONS` de `lib/content.ts`. |
| `/consulta` | `app/consulta/page.tsx` | Chat LLM + `FallbackForm`. Stream via `/api/chat`. | `useDemoStore` (Zustand), `useChat` hook, parsing de `<EXTRACTION>` |
| `/medicion` | `app/medicion/page.tsx` | Anillo pulsante + auto-transición a `/resultado`. Llama `generateBioimpedance()`. | Transición automática, store hydration |
| `/resultado` | `app/resultado/page.tsx` | Gauge + Waterfall + interpretación. Llama `predictRural()` + `explainRural()`. | `RESULT_INTERPRETATION` keys en `lib/content.ts` |

Api client contratos — `lib/api.ts`:

- `predictRural(features)` → `PredictResult { probability, risk_level, threshold_used }`
- `explainRural(features)` → `ExplainResult { shap_values, base_value }`
- `generateBioimpedance({ age, gender, height, weight, bmi })` → `{ features: Bioimpedance }`
- `getModelInfo()` → `ModelInfo`
- `warmUp()` → `fetch('/health')` best-effort

---

## 7. Símbolos prohibidos / removidos

No reintroducir sin refactor de toda la UI:

| Símbolo | Razón | Dónde verificar |
|---------|-------|-----------------|
| `font-serif` (clase Tailwind) | Eliminado en toda la UI | `grep -r "font-serif" demo/frontend/app demo/frontend/components` → 0 matches |
| `Instrument_Serif` (import `next/font`) | Fuente descartada | `app/layout.tsx` no debe importarla |
| `--font-instrument-serif`, `--font-serif` | Tokens borrados | `app/globals.css` no los define |
| `SerifReveal` componente | Archivo borrado | `components/SerifReveal.tsx` no existe |
| Dark mode / paleta oscura | Scope actual es light-only | `color-scheme: light` fijo en `globals.css` |

---

## 8. Pitfalls conocidos

| Síntoma | Causa | Fix |
|---------|-------|-----|
| `POST //generate/bioimpedance 404` (doble slash) | `NEXT_PUBLIC_API_URL` con trailing slash | Normalización en `lib/api.ts:3-6` con `.replace(/\/+$/, "")` — ya aplicada |
| Cambios a `NEXT_PUBLIC_API_URL` no surten efecto | Vars `NEXT_PUBLIC_*` están baked en build time | Rebuild + redeploy del frontend |
| Animaciones rompen con `prefers-reduced-motion` | Contrato: toda animación debe tener fallback estático | Usar `useReducedMotion()` y degradar a estado final (patrón en todas las ilustraciones y en `SectionReveal`) |
| Next.js 16 rompe convenciones del App Router | Breaking changes vs training data | Antes de tocar `app/layout.tsx`, `next/font`, routing: leer `node_modules/next/dist/docs/` (ver `demo/frontend/AGENTS.md`) |
| Secrets en `.env.local` | Archivo ignorado por `.gitignore` raíz y `demo/frontend/.gitignore` | Confirmar con `git ls-files --error-unmatch demo/frontend/.env.local` → debe fallar |

---

## 9. Verificación

```bash
cd demo/frontend
npm run dev              # http://localhost:3000 (o :3100 si ocupado)
npm run build            # compila sin type errors

# Grep de limpieza — debe devolver 0 matches
grep -rn "font-serif\|Instrument_Serif\|instrument-serif" app components
```

Checks manuales rápidos:

- 4 rutas responden 200: `/`, `/consulta`, `/medicion`, `/resultado`.
- Flujo end-to-end: consulta → medicion auto-transiciona → resultado con gauge + waterfall.
- Responsive: 375 / 768 / 1440 sin overflow horizontal.
- Contraste: `--foreground` sobre `--background` ≥ 13:1 (AAA); `--accent` sobre `--background` ≥ 4.5:1 (AA).

No hay test suite (confirmado en `CLAUDE.md` raíz). Validación es visual + build.

---

## 10. Ver también

- `./00_orchestrator.md` — mapa de fases y stack.
- `./06_data_contracts.md` — tipos compartidos FE/BE (25 features, rangos, schemas).
- `./03_fase_consulta.md`, `./04_fase_bioimpedancia.md`, `./02_fase_resultados.md` — plan original de cada acto.
- `demo/frontend/AGENTS.md` — aviso de breaking changes en Next.js 16.
