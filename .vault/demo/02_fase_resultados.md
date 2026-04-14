---
purpose: Plan detallado de Fase 2 — Acto 3, pantalla de resultados con gauge, SHAP y comparación.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: pending
---

# Fase 2: Acto 3 — Pantalla de Resultados

## Objetivo
Página `/resultado` con visualizaciones del resultado de predicción. Se construye primero porque es el payoff visual y el MVP irreducible.

## Dependencia
Fase 1 (necesita la API para datos reales, pero puede desarrollarse con datos hardcodeados).

---

## Paso 2.1: Scaffold Next.js

```bash
cd demo
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --no-eslint
cd frontend
npm install framer-motion zustand recharts
npm install @ai-sdk/openai ai
```

---

## Paso 2.2: Zustand store

**Archivo:** `demo/frontend/src/lib/patient-store.ts`

Store que persiste datos del paciente entre los tres actos:

```typescript
interface PatientState {
  demographics: Demographics | null;  // Acto 1: edad, género, comorbilidades, altura, peso
  bioimpedance: Bioimpedance | null;  // Acto 2: TBW, ECW, BMI, etc.
  prediction: Prediction | null;      // Acto 3: probabilidad, SHAP, risk_level
  setDemographics: (data: Demographics) => void;
  setBioimpedance: (data: Bioimpedance) => void;
  setPrediction: (data: Prediction) => void;
  reset: () => void;
}
```

---

## Paso 2.3: Componentes de resultados

### RiskGauge (`components/results/RiskGauge.tsx`)
- Gauge circular SVG con gradiente verde → amarillo → rojo
- Animación de 0 al valor final con `framer-motion` `useSpring`
- Texto central grande: "72% riesgo"
- Subtexto: categoría ("Riesgo alto" / "Riesgo moderado" / "Riesgo bajo")
- Thresholds de color: <35% verde, 35-55% amarillo, >=55% rojo

### ShapWaterfall (`components/results/ShapWaterfall.tsx`)
- Barras horizontales tipo waterfall con `recharts` BarChart
- Top 7 features por |SHAP|, ordenadas descendente
- Barras rojas (aumenta riesgo) y azules (reduce riesgo)
- Labels en español: importa `FEATURE_LABELS` de `lib/feature-labels.ts` (definición en [`06_data_contracts.md`](./06_data_contracts.md) sección 4)
- Animación: barras aparecen secuencialmente con stagger de 100ms

### ComparisonCard (`components/results/ComparisonCard.tsx`)
- Dos columnas lado a lado con cards:

**Columna izquierda — "Con análisis de sangre":**
- Ícono: tubo de sangre
- Tiempo: 1-3 días
- Requiere: Laboratorio clínico
- Costo: $$
- AUC: 0.93

**Columna derecha (highlighted) — "Con bioimpedancia":**
- Ícono: báscula
- Tiempo: 8 segundos
- Requiere: Báscula portátil
- Costo: $
- AUC: 0.81

**Anotación inferior:**
"En zonas rurales sin acceso a laboratorio, este modelo permite screening inmediato"

- Animación: cards entran desde los lados con `framer-motion`

### TechDeepDive (`components/results/TechDeepDive.tsx`)
- Sección colapsable (cerrada por defecto)
- Model card:
  - Algoritmo: Gradient Boosting + SMOTE + Optuna
  - Dataset: 319 muestras, Ankara (Turquía)
  - Features: 25 (sin laboratorio)
  - Validación: Stratified 70/30 split
- Métricas: accuracy 0.7708, AUC 0.8138
- Threshold y su recall/specificity
- Link al repo GitHub
- Disclaimer: "Este modelo es para screening/priorización, no para diagnóstico clínico"

---

## Paso 2.4: Página `/resultado`

**Archivo:** `demo/frontend/src/app/resultado/page.tsx`

Layout vertical:
1. Header: "Resultado de screening"
2. RiskGauge (centrado, prominente)
3. ShapWaterfall
4. ComparisonCard
5. TechDeepDive
6. Botón "Reiniciar consulta" → `reset()` en Zustand → navega a `/`

---

## Paso 2.5: API client

**Archivo:** `demo/frontend/src/lib/api-client.ts`

Wrappers tipados para los endpoints de FastAPI:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function predictRural(features: Record<string, number>): Promise<PredictResponse>
async function explainRural(features: Record<string, number>): Promise<ExplainResponse>
async function getModelInfo(): Promise<ModelInfo>
```

---

---

## Detalles adicionales

### TypeScript interfaces compartidas

Definiciones en [`06_data_contracts.md`](./06_data_contracts.md) sección 3 (`Demographics`, `Bioimpedance`, `PatientFeatures`, `PredictResponse`, `ExplainResponse`, `Prediction`). Vivirán en `demo/frontend/src/lib/types.ts` — no duplicar aquí.

El mapeo de feature names a labels españoles está en `06_data_contracts.md` sección 4 (`FEATURE_LABELS`). `ShapWaterfall` y `MetricCard` importan de ahí.

### Data flow del Acto 3

```
Usuario llega a /resultado
  │
  ▼
useEffect: leer demographics + bioimpedance del Zustand store
  │
  ├── ambos presentes → continuar
  └── alguno faltante → redirect a /consulta
  │
  ▼
Construir objeto de 25 features (merge demographics + bioimpedance)
  │
  ▼
Llamar en paralelo: predictRural(features) + explainRural(features)
  │
  ├── error → mostrar ErrorState con retry
  ├── loading → mostrar LoadingState
  └── success → setPrediction(data) en store → renderizar componentes
```

### Cálculo de risk_level

La lógica de nivel de riesgo se aplica en el backend usando el threshold 0.45:
- `probability < 0.35` → "bajo"
- `0.35 <= probability < 0.55` → "moderado"
- `probability >= 0.55` → "alto"

Pero el color del gauge es continuo (gradiente), no discreto. La categoría solo aparece como texto debajo del número.

### Estados de la página

**Loading:**
- Skeleton del gauge (círculo gris pulsante)
- Skeleton de barras de SHAP
- Mensaje: "Calculando predicción..."

**Error:**
- Icono de error (círculo rojo con signo de admiración)
- Mensaje legible en español
- Botón "Reintentar" (llama a predict/explain de nuevo)
- Botón "Volver al inicio"

**Backend dormido (Railway cold start):**
- Mensaje específico: "Despertando el servidor... (puede tardar unos segundos la primera vez)"
- Spinner + poll cada 2s hasta que responda
- Después de 30s, mostrar error con retry

### RiskGauge — lógica de color

Interpolación de color continuo:
```typescript
function getGaugeColor(probability: number): string {
  // 0 → verde (#22c55e)
  // 0.5 → amarillo (#eab308)
  // 1 → rojo (#ef4444)
  if (probability < 0.5) {
    // Verde a amarillo
    return interpolateColor('#22c55e', '#eab308', probability * 2);
  } else {
    // Amarillo a rojo
    return interpolateColor('#eab308', '#ef4444', (probability - 0.5) * 2);
  }
}
```

### Accesibilidad del gauge

```tsx
<div
  role="img"
  aria-label={`Riesgo de cálculos biliares: ${Math.round(probability * 100)} por ciento, nivel ${riskLevel}`}
>
  {/* SVG del gauge */}
</div>
```

### Accesibilidad del ShapWaterfall

Cada barra necesita un aria-label descriptivo:
```tsx
<Bar
  aria-label={`${featureLabel}: contribución de ${shapValue > 0 ? 'aumento' : 'reducción'} de riesgo, magnitud ${Math.abs(shapValue).toFixed(3)}`}
/>
```

---

## Riesgos y preguntas abiertas

Ver `99_open_questions.md` puntos 1, 4, 5 para decisiones pendientes que afectan esta fase:
- **#1 (diseño):** paleta exacta, tipografía, tono visual
- **#4 (errores):** UX de estados de error y loading
- **#5 (a11y):** alcance de accesibilidad (básico vs WCAG AA)

**Riesgos específicos de Fase 2:**
- `recharts` puede no tener buena API para waterfall charts custom → alternativa: construir las barras con SVG directo + framer-motion
- El gauge circular con gradiente puede ser tricky en SVG puro → alternativa: usar `react-gauge-chart` o construir con `conic-gradient` en CSS
- Los textos en español de features son largos → verificar truncation en móvil
- SHAP puede devolver valores muy pequeños (e.g. 0.001) que se ven como barras invisibles → normalizar el eje X al max absoluto de los top 7

---

## Verificación
- `npm run dev` → navegar a `localhost:3000/resultado`
- Verificar con datos hardcodeados que los 4 componentes renderizan
- Probar animaciones del gauge y waterfall
- Verificar responsive en viewport móvil (375px width en DevTools)
- Conectar a FastAPI local (Fase 1) y verificar datos reales
- Verificar que el mapeo de feature names a español es correcto
