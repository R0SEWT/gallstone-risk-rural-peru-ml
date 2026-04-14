---
purpose: Preguntas abiertas y decisiones pendientes detectadas durante la planificación. Para resolver antes o durante la implementación.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: pending
---

# Preguntas abiertas y decisiones pendientes

Este documento acumula cosas que no están resueltas en los planes detallados. Cada entrada tiene contexto, impacto, y opciones. Revisar antes de arrancar cada fase.

---

## 1. Sistema de diseño y paleta visual

**Contexto:** Los planes de UI (fases 2, 3, 4, 5) asumen una estética pero nunca la definen. Sin esto cada componente terminará con un look-and-feel inconsistente.

**Impacto:** Alto. Es la primera impresión del reclutador.

**Preguntas:**
- ¿Paleta clara o oscura por defecto? ¿Toggle?
- ¿Colores primario, éxito, alerta, riesgo?
- ¿Tipografía? (Inter, Geist, IBM Plex, system stack)
- ¿Tono visual? (minimalista clínico / editorial / tech moderno)
- ¿Iconografía? (Lucide, Heroicons, custom SVG)

**Recomendación provisional:** Paleta clara con acentos fríos (azul clínico #0f4c5c como en el PDF de métricas del repo), tipografía Inter, estilo minimalista clínico. Iconos de Lucide.

---

## 2. Estrategia de generación de valores de bioimpedancia

**Contexto:** El Acto 2 "mide" valores de bioimpedancia (TBW, ECW, etc.) a partir de datos del Acto 1 (edad, género, altura, peso). Los planes actuales proponen generar estos valores con estadísticas condicionales por bucket.

**Problema:** Las estadísticas marginales pueden producir combinaciones incoherentes. Por ejemplo, TBW y ECW están correlacionadas; si se generan independientemente, la suma puede ser absurda (más agua que peso corporal).

**Opciones:**
1. **Estadísticas marginales por bucket** (propuesta actual): rápido, pero puede producir inconsistencias.
2. **Template-based**: buscar la fila real del dataset más parecida a (age, gender, height, weight, BMI) y usar sus valores de bioimpedancia con pequeñas perturbaciones. Garantiza coherencia biológica.
3. **Regresión multivariada**: entrenar un modelo (ej. Ridge) que mapee (age, gender, height, weight, BMI) → vector de 15 features de bioimpedancia. Usa las 15 salidas correlacionadas.
4. **Nearest-neighbor + noise**: buscar los K vecinos más cercanos, promediar, agregar ruido gaussiano proporcional al std del vecindario.

**Recomendación provisional:** Opción 2 (template-based) o 4 (KNN). Simple de implementar, garantiza valores realistas, y el reclutador técnico lo valora más.

---

## 3. Reliability de la extracción estructurada del LLM

**Contexto:** Fase 3 depende de que el LLM emita un bloque JSON al completar la entrevista. DeepSeek puede no ser determinista en esto.

**Riesgos:**
- LLM olvida emitir el marcador
- LLM emite JSON malformado
- LLM emite valores fuera de rango (edad negativa, etc.)
- LLM mezcla español e inglés
- LLM se auto-corrige a mitad de stream y rompe el parsing

**Opciones:**
1. Confiar en el prompt + fallback form
2. Usar function calling / tool use nativo (OpenAI-compatible) en vez de marcadores HTML
3. Usar structured outputs (response_format: json_schema) si DeepSeek lo soporta
4. Validación post-hoc con segundo call al LLM ("extrae los datos de esta conversación")

**Recomendación provisional:** Empezar con opción 3 (DeepSeek soporta `response_format` en modo JSON). Si no funciona bien, bajar a opción 1 con fallback form robusto.

**Verificar:** Si DeepSeek deepseek-chat soporta `response_format: { type: "json_object" }` o structured outputs similares a OpenAI.

---

## 4. Manejo de errores y fallbacks

**Contexto:** Ningún plan contempla qué pasa cuando algo falla.

**Escenarios a cubrir:**
- Backend Railway cold start (primera request puede tardar 10-30s)
- DeepSeek rate limit o outage
- DeepSeek devuelve respuesta sin JSON válido
- Usuario cierra el tab a la mitad del Acto 2
- Valores de predicción NaN/undefined
- SHAP values no disponibles o vacíos
- Zustand store perdido al recargar

**Decisiones a tomar:**
- ¿Qué UI de error mostrar?
- ¿Reintentar automáticamente? ¿Cuántas veces?
- ¿Persistir el store en sessionStorage?
- ¿Página de "backend dormido, despertando..." para cold start?

**Recomendación provisional:**
- Persistir Zustand en sessionStorage (no localStorage, es sesión única)
- Healthcheck ping al backend al entrar a la landing (despierta Railway)
- Toast para errores recuperables, pantalla completa para irrecuperables
- Sin retry automático; el usuario reintenta manualmente

---

## 5. Accesibilidad (a11y)

**Contexto:** Las animaciones de Framer Motion son el corazón del Acto 2, pero usuarios con `prefers-reduced-motion` o lectores de pantalla verán algo roto.

**Requisitos mínimos:**
- Respetar `prefers-reduced-motion`: animaciones de 8s → 500ms o fade sin movimiento
- ARIA labels en RiskGauge (`aria-label="Riesgo: 72 por ciento, nivel alto"`)
- Contraste WCAG AA mínimo en texto sobre colores
- Keyboard navigation en chat y botones
- Focus visible en botones CTA

**Decisión:** ¿Full compliance WCAG AA o solo lo básico?

**Recomendación provisional:** Lo básico (reduced-motion, ARIA en gauge, contraste, keyboard nav). Full WCAG AA es overkill para una demo.

---

## 6. CORS, variables de entorno y configuración de ambiente

**Contexto:** Frontend (Next.js) necesita saber URL del backend (FastAPI) en local vs producción. Backend necesita saber qué origins aceptar.

**Decisiones:**
- Nombre de variables: `NEXT_PUBLIC_API_URL` (propuesto) o `BACKEND_URL`
- ¿CORS abierto (`allow_origins=["*"]`) o restringido a dominios específicos?
- ¿Cómo manejar preview deployments de Vercel? Cada PR tiene su propia URL.
- ¿`.env.local` ignorado en git? Sí, pero necesitamos un `.env.example`.

**Recomendación provisional:**
- `NEXT_PUBLIC_API_URL` para frontend, `ALLOWED_ORIGINS` para backend
- CORS permite: localhost:3000, `*.vercel.app` (con regex), dominio custom si aplica
- Crear `.env.example` con placeholders documentados

---

## 7. Performance del backend — SHAP y cold start

**Contexto:** `shap.TreeExplainer.shap_values()` puede ser lento dependiendo del tamaño del modelo. El modelo rural tiene n_estimators=692, que no es trivial.

**Mediciones necesarias:**
- ¿Cuánto tarda una explicación SHAP para una sola instancia?
- ¿Cuánto tarda el modelo en cargar en startup?

**Estrategias si es lento:**
- Pre-compute TreeExplainer una vez en lifespan (ya propuesto)
- Usar `shap.Explainer` con `algorithm="tree"` (potencialmente más rápido)
- Cachear explicaciones por hash del input
- Devolver predicción rápido y SHAP en endpoint separado (ya propuesto)

**Recomendación provisional:** Medir primero. Si <500ms, no optimizar. Si >1s, separar endpoints y llamar en paralelo desde el frontend.

---

## 8. Silueta corporal — qué mostrar

**Contexto:** Acto 2 muestra una silueta que se escanea. ¿Qué silueta?

**Opciones:**
1. Silueta genérica minimalista (sin género marcado)
2. Dos siluetas: masculina/femenina, elegida según Gender del Acto 1
3. Avatar más detallado (estilo Duolingo)
4. Ilustración anatómica clínica

**Consideraciones:**
- Sensibilidad cultural (no estereotipar)
- Complejidad visual (overkill vs minimal)
- Tiempo de producción

**Recomendación provisional:** Opción 1 (silueta genérica minimalista) para evitar complicaciones y porque el foco debe estar en las métricas, no en la silueta.

---

## 9. Analítica y tracking

**Contexto:** Sería útil saber cuánta gente visita la demo, cuántos completan los 3 actos, dónde abandonan.

**Opciones:**
- Plausible Analytics (privacy-first, simple)
- Vercel Analytics (nativo, gratis)
- Ninguno (simplicidad)

**Recomendación provisional:** Vercel Analytics (gratis, ya integrado al deploy). Eventos mínimos: landing_view, consulta_start, medicion_start, resultado_view, consulta_completed.

---

## 10. Idioma de la interfaz

**Contexto:** Todos los planes asumen español. Pero si apuntas a roles internacionales, inglés puede ser relevante.

**Opciones:**
1. Solo español (audiencia latinoamericana)
2. Solo inglés (audiencia global)
3. Toggle ES/EN
4. Español con README y comentarios en inglés

**Recomendación provisional:** Opción 1 (español). El caso de estudio es Perú rural, tiene sentido que la demo esté en español. El README público del repo puede ser bilingüe.

---

## Cómo usar este documento

Antes de arrancar cada fase, revisar las preguntas que la afectan:

- **Fase 1 (backend):** 4 (errores), 6 (CORS), 7 (performance)
- **Fase 2 (resultados):** 1 (diseño), 4 (errores), 5 (a11y)
- **Fase 3 (consulta):** 3 (LLM reliability), 4 (errores), 10 (idioma)
- **Fase 4 (animación):** 1 (diseño), 2 (bioimpedancia), 5 (a11y), 8 (silueta)
- **Fase 5 (deploy):** 6 (env vars), 7 (cold start), 9 (analytics)
