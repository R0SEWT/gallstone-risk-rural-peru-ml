---
purpose: Plan detallado de Fase 4 — Acto 2, animación de simulación de bioimpedancia.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: pending
---

# Fase 4: Acto 2 — Animación de Bioimpedancia

## Objetivo
Página `/medicion` con animación de báscula inteligente que "mide" métricas de bioimpedancia del paciente.

## Dependencia
Fase 3 (recibe datos demográficos del paciente desde Zustand).

---

## Paso 4.1: Generación de valores plausibles

**Archivo:** `demo/frontend/src/lib/bioimpedance-gen.ts`

Usa el archivo `bioimpedance-ranges.json` generado en Fase 1.2.

**Lógica:**
1. Recibir `{ age, gender, height, weight }` del Acto 1
2. Calcular BMI: `weight / (height/100)²`
3. Determinar buckets: `age_bucket`, `bmi_bucket`
4. Buscar en lookup table: `ranges[gender][age_bucket][bmi_bucket]`
5. Para cada feature de bioimpedancia:
   - `value = mean + gaussianRandom() * std * 0.3`
   - Clamp a `[min, max]` del dataset
6. Retornar objeto con 15 features de bioimpedancia + BMI calculado

**Features generadas (15):**
TBW, ECW, ICW, ECF_TBW, TBFR, LM, Protein, VFR, BM, MM, Obesity, TFC, VFA, VMA, HFA

---

## Paso 4.2: Componentes de animación

### DeviceIllustration.tsx
- SVG de báscula de bioimpedancia (vista frontal)
- Estilo minimalista con colores del theme (Tailwind)
- Puede ser una ilustración simple: plataforma rectangular con pantalla

### BodySilhouette.tsx
- SVG de silueta corporal
- Género-aware: silueta masculina o femenina según datos del Acto 1
- Efecto de escaneo: gradiente/barra luminosa que baja de cabeza a pies
- Implementación: `framer-motion` animando `clipPath` o un rect semi-transparente overlay
- Duración del escaneo: ~3 segundos

### MetricCard.tsx
- Card pequeña (~120x80px) con:
  - Nombre de la métrica en español
  - Valor numérico con animación de conteo (0 → valor final)
  - Unidad de medida
- Animación de entrada: fade-in + slide desde la silueta
- `useSpring` de Framer Motion para el conteo numérico
- Tooltip (hover/tap) con descripción de qué mide

**Mapeo de métricas a labels y unidades:** importa `FEATURE_LABELS` de `lib/feature-labels.ts` — definición en [`06_data_contracts.md`](./06_data_contracts.md) sección 4. No duplicar aquí.

### ScanAnimation.tsx (orquestador)
**Secuencia temporal:**

| Tiempo | Evento |
|--------|--------|
| 0s | Pantalla muestra báscula + texto "Suba a la báscula inteligente" + botón "Iniciar medición" (pulsante) |
| click | Silueta aparece con fade-in, báscula desaparece |
| 0-3s | Barra de escaneo baja de arriba a abajo sobre la silueta |
| 3s | Primera MetricCard aparece (BMI) |
| 3-8s | MetricCards aparecen secuencialmente (~350ms entre cada una) en posiciones alrededor de la silueta |
| 8s | Texto: "Medición completada en 8 segundos" + botón "Ver resultados" |
| click | Almacena valores en Zustand → navega a `/resultado` |

**Orden de aparición de métricas:**
1. BMI (ya conocido, confirma)
2. TBW (agua total)
3. ECW / ICW (agua extra/intracelular)
4. TBFR (grasa corporal %)
5. LM (masa magra)
6. MM (masa muscular)
7. VFA (grasa visceral)
8. Resto en grupo final

---

## Paso 4.3: Integración con predicción

Al navegar a `/resultado`:
1. Combinar datos de Zustand: `demographics` (Acto 1) + `bioimpedance` (Acto 2)
2. Construir objeto de 25 features completo
3. Llamar en paralelo: `POST /predict/rural` y `POST /explain/rural`
4. Almacenar resultado en `prediction` de Zustand
5. Renderizar página de resultado (Fase 2)

---

---

## Detalles adicionales

### Estrategia de generación: template-based (opción recomendada)

**Problema:** Generar valores de bioimpedancia con estadísticas marginales puede producir combinaciones incoherentes (ver `99_open_questions.md` punto 2).

**Solución propuesta:** En lugar de samplear cada feature independientemente, usar filas reales del dataset como templates.

**Algoritmo:**
1. Desde el dataset `dataset-uci.xlsx`, exportar las 319 filas con solo las columnas: Age, Gender, Height, Weight, BMI + las 15 de bioimpedancia
2. Guardar como JSON embebible en frontend: `bioimpedance-templates.json`
3. Dado el paciente del Acto 1 con `(age, gender, height, weight, BMI)`:
   - Filtrar filas con el mismo Gender
   - Calcular distancia euclidiana sobre features normalizados: Age, Height, Weight, BMI
   - Tomar los K=5 vecinos más cercanos
   - Seleccionar uno aleatorio de esos 5
   - Usar sus valores de bioimpedancia como base
   - Aplicar perturbación pequeña: `value * (1 + gaussianRandom() * 0.03)` (3% de variación)
   - Clamp a los rangos del dataset

**Ventajas:**
- Valores internamente consistentes (vienen de una persona real)
- La predicción del modelo será razonable (son patrones que el modelo vio durante entrenamiento)
- Simple de implementar en JS sin librerías ML

**Archivo a generar en Fase 1.2:** `demo/frontend/lib/bioimpedance-templates.json`
Formato:
```json
{
  "templates": [
    {
      "Age": 45,
      "Gender": 1,
      "Height": 170,
      "Weight": 82,
      "BMI": 28.4,
      "bioimpedance": {
        "TBW": 38.5,
        "ECW": 15.2,
        "ICW": 23.3,
        "ECF_TBW": 0.39,
        "TBFR": 32.1,
        "LM": 52.6,
        "Protein": 14.1,
        "VFR": 12,
        "BM": 3.2,
        "MM": 49.5,
        "Obesity": 1,
        "TFC": 28.4,
        "VFA": 145,
        "VMA": 95,
        "HFA": 0.42
      }
    },
    ...
  ],
  "normalization": {
    "Age": {"mean": 45, "std": 15},
    "Height": {"mean": 165, "std": 10},
    "Weight": {"mean": 75, "std": 15},
    "BMI": {"mean": 27, "std": 5}
  }
}
```

**Implementación en `demo/frontend/src/lib/bioimpedance-gen.ts`:**
```typescript
import templates from './bioimpedance-templates.json';

export function generateBioimpedance(demographics: Demographics): Bioimpedance {
  const bmi = demographics.Weight / Math.pow(demographics.Height / 100, 2);

  // Filtrar por género
  const sameGender = templates.templates.filter(t => t.Gender === demographics.Gender);

  // Calcular distancia normalizada
  const norm = templates.normalization;
  const distances = sameGender.map(t => {
    const d = [
      (t.Age - demographics.Age) / norm.Age.std,
      (t.Height - demographics.Height) / norm.Height.std,
      (t.Weight - demographics.Weight) / norm.Weight.std,
      (t.BMI - bmi) / norm.BMI.std,
    ];
    return Math.sqrt(d.reduce((sum, x) => sum + x * x, 0));
  });

  // Top 5 vecinos
  const indexed = distances.map((dist, idx) => ({ dist, idx }));
  indexed.sort((a, b) => a.dist - b.dist);
  const topK = indexed.slice(0, 5);

  // Uno aleatorio de los 5
  const chosen = topK[Math.floor(Math.random() * topK.length)];
  const template = sameGender[chosen.idx];

  // Perturbar 3%
  const perturb = (value: number) => value * (1 + gaussianRandom() * 0.03);

  return {
    BMI: bmi,
    TBW: perturb(template.bioimpedance.TBW),
    ECW: perturb(template.bioimpedance.ECW),
    ICW: perturb(template.bioimpedance.ICW),
    ECF_TBW: perturb(template.bioimpedance.ECF_TBW),
    TBFR: perturb(template.bioimpedance.TBFR),
    LM: perturb(template.bioimpedance.LM),
    Protein: perturb(template.bioimpedance.Protein),
    VFR: Math.round(perturb(template.bioimpedance.VFR)),
    BM: perturb(template.bioimpedance.BM),
    MM: perturb(template.bioimpedance.MM),
    Obesity: template.bioimpedance.Obesity,  // no perturbar categórica
    TFC: perturb(template.bioimpedance.TFC),
    VFA: perturb(template.bioimpedance.VFA),
    VMA: perturb(template.bioimpedance.VMA),
    HFA: perturb(template.bioimpedance.HFA),
  };
}

function gaussianRandom(): number {
  // Box-Muller transform
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```

### Layout de MetricCards alrededor de la silueta

Desktop (grid 3 columnas × N filas):
```
     [BMI]        [TBW]        [VFA]
  [TBFR]    [silueta]    [LM]
     [ECW]        [ICW]        [MM]
           [bottom metrics]
```

En realidad, layout más simple y responsive: silueta centrada ocupa ancho máximo de 300px, MetricCards en grid 2×N alrededor:

```
Desktop:                    Mobile:
┌─────────────────────┐    ┌───────────┐
│  [BMI]       [TBW]  │    │  silueta  │
│                     │    ├───────────┤
│  [TBFR]  ███  [LM]  │    │ [BMI][TBW]│
│          ███        │    │ [TBFR][LM]│
│  [ECW]       [VFA]  │    │ [ECW][VFA]│
│                     │    │ [MM][VFR] │
│  [MM]        [VFR]  │    │ ...       │
└─────────────────────┘    └───────────┘
```

Implementación: CSS grid con la silueta en columna central en desktop, stack completo en móvil.

### Animación del escaneo — specs técnicas

**BodySilhouette.tsx**:
- SVG viewBox: `0 0 200 400` (relación 1:2 típica de silueta)
- Path de silueta: curvas Bezier sencillas, contorno solo
- Overlay de escaneo: un `<rect>` con gradiente y `filter: blur(2px)`
- Animación: `framer-motion` anima `y` de -400 a 0 durante 3s con easing `easeInOut`
- Al completar el escaneo, fade out del overlay y fade in de puntos de luz en ubicaciones de métricas

**MetricCard.tsx** — animación de conteo:
```tsx
import { useSpring, animated } from '@react-spring/web';
// o con framer-motion:
import { motion, useSpring, useTransform } from 'framer-motion';

function MetricCard({ label, value, unit }) {
  const spring = useSpring(0, { duration: 1500, bounce: 0 });
  const display = useTransform(spring, (v) => v.toFixed(1));

  useEffect(() => { spring.set(value); }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p>{label}</p>
      <motion.p className="text-2xl font-bold">{display}</motion.p>
      <span>{unit}</span>
    </motion.div>
  );
}
```

### `prefers-reduced-motion` handling

```typescript
// lib/use-reduced-motion.ts
import { useReducedMotion } from 'framer-motion';

export function useAnimationDuration(base: number): number {
  const shouldReduce = useReducedMotion();
  return shouldReduce ? 0 : base;
}
```

Uso en `ScanAnimation.tsx`:
```tsx
const duration = useAnimationDuration(3);  // 3s normal, 0s si reduced-motion
```

Para usuarios con `prefers-reduced-motion: reduce`, la animación se reemplaza con un fade simple y las MetricCards aparecen todas a la vez.

### Posibles approaches para la silueta

| Approach | Pros | Contras |
|----------|------|---------|
| SVG inline custom | Control total, pequeño | Tiempo de diseño |
| Lottie animation | Fluido, preempaquetado | Dependencia extra, tamaño |
| 3D model (three.js) | Wow factor | Overkill, complejo |
| Icono simple de Lucide | Cero trabajo | No impactante |

**Recomendación:** SVG inline custom, simple y minimalista. Ver `99_open_questions.md` punto 8 para decisión sobre estilo.

---

## Riesgos y preguntas abiertas

Ver `99_open_questions.md` puntos 1, 2, 5, 8 para decisiones pendientes que afectan esta fase:
- **#1 (diseño):** estética de la báscula y silueta
- **#2 (bioimpedancia):** estrategia de generación (propuesta: template-based)
- **#5 (a11y):** `prefers-reduced-motion`
- **#8 (silueta):** qué silueta exacta mostrar

**Riesgos específicos de Fase 4:**
- Los templates del dataset pueden embeber sesgos (dataset turco, no peruano) que se propagan a los valores mostrados → no es un problema clínico porque la demo no es clínica, pero vale documentarlo
- Framer Motion puede tener problemas de performance en móviles viejos con muchas animaciones simultáneas → testear en devices modestos
- El usuario puede abandonar durante la animación de 8 segundos → agregar skip button "Ver resultado directo"
- Si el paciente tiene datos muy atípicos (ej. 18 años con BMI 40), los vecinos pueden ser lejanos → fallback: usar los top 10 en vez de 5, o ampliar a ambos géneros

---

## Verificación
- Flujo completo: `/consulta` → `/medicion` → `/resultado`
- Animación fluida (60fps) — verificar con DevTools Performance tab
- Valores generados son plausibles (no negativos, no absurdos)
- Los 25 features llegan correctos a la API (log en consola)
- En móvil: silueta se reduce, MetricCards se reorganizan en grid debajo
- La secuencia temporal se siente natural (~10s total)
