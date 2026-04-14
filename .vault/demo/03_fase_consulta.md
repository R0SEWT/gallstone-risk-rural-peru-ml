---
purpose: Plan detallado de Fase 3 — Acto 1, consulta médica conversacional con LLM.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: pending
---

# Fase 3: Acto 1 — Consulta Médica Conversacional

## Objetivo
Página `/consulta` con chat LLM que recoge historia clínica del paciente de forma natural y extrae datos estructurados.

## Dependencia
Fase 2 (para que la transición al resultado funcione).

---

## Paso 3.1: Route handler para chat

**Archivo:** `demo/frontend/src/app/api/chat/route.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { DOCTOR_SYSTEM_PROMPT } from '@/lib/prompts';

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: DOCTOR_SYSTEM_PROMPT,
    messages,
  });
  return result.toDataStreamResponse();
}
```

**Variable de entorno necesaria:** `DEEPSEEK_API_KEY` en `.env.local`

---

## Paso 3.2: System prompt del doctor

**Archivo:** `demo/frontend/src/lib/prompts.ts`

El prompt instruye al LLM a:

1. **Rol:** Profesional de salud realizando un screening de riesgo de cálculos biliares
2. **Idioma:** Español, tono cálido y profesional
3. **Flujo conversacional:**
   - Saludo y explicación del screening
   - Preguntar edad y género
   - Preguntar sobre condiciones crónicas: enfermedad coronaria, hipotiroidismo, colesterol alto, diabetes
   - Preguntar altura y peso
4. **Restricciones:**
   - NO preguntar sobre bioimpedancia (viene en Acto 2)
   - NO preguntar sobre análisis de sangre
   - Ser conversacional, no hacer un interrogatorio
   - Agrupar preguntas relacionadas (no preguntar una por una)
5. **Señal de completitud:** Cuando tenga todos los datos, emitir:
   ```
   <!--PATIENT_DATA:{"Age":45,"Gender":1,"Comorbidity":1,"CAD":0,"Hypothyroidism":0,"Hyperlipidemia":1,"DM":0,"Height":170,"Weight":82}-->
   ```
6. **Mensaje de transición visible:** "Perfecto, ya tengo toda la información que necesito. Ahora vamos a realizar una medición rápida con nuestro equipo de bioimpedancia..."

**Campos a extraer (8 campos demográficos/clínicos):**

| Campo | Tipo | Codificación |
|-------|------|-------------|
| Age | int | Años |
| Gender | int | 1=masculino, 0=femenino |
| Comorbidity | int | 1=cualquier condición crónica, 0=ninguna |
| CAD | int | 1=enfermedad coronaria, 0=no |
| Hypothyroidism | int | 1=sí, 0=no |
| Hyperlipidemia | int | 1=colesterol/triglicéridos altos, 0=no |
| DM | int | 1=diabetes, 0=no |
| Height | float | cm |
| Weight | float | kg |

---

## Paso 3.3: Chat UI

### ChatWindow.tsx
- Usa `useChat` de `ai/react` (Vercel AI SDK hook)
- Lista de mensajes con scroll automático al último mensaje
- Input de texto con botón submit y soporte para Enter
- Parseo del stream: detectar `<!--PATIENT_DATA:{...}-->` en el contenido
- Al detectar JSON válido: almacenar en Zustand → navegar a `/medicion` con delay de 2s (para que el usuario lea la transición)

### DoctorAvatar.tsx
- Ilustración simple SVG o ícono estilizado de médico
- Indicador "escribiendo..." (tres puntos animados) cuando el LLM genera

### MessageBubble.tsx
- Doctor: alineado izquierda, fondo azul claro, avatar a la izquierda
- Paciente: alineado derecha, fondo gris claro
- El contenido `<!--PATIENT_DATA:...-->` se filtra del texto visible (regex replace)
- Markdown básico renderizado (negritas, listas)

---

## Paso 3.4: Validación de datos extraídos

Antes de navegar al Acto 2:

1. Verificar que los 8 campos están presentes en el JSON
2. Validar rangos:
   - Age: 18-100
   - Gender: 0 o 1
   - Comorbidity, CAD, Hypothyroidism, Hyperlipidemia, DM: 0 o 1
   - Height: 100-220 (cm)
   - Weight: 30-200 (kg)
3. Si falta algún campo o está fuera de rango: mostrar form corto de fallback para completar/corregir manualmente

---

---

## Detalles adicionales

### Primer draft del system prompt del doctor

**Nota:** Este es un draft inicial. Requiere iteración con pruebas reales antes de considerar listo. La reliability de la extracción JSON es punto abierto #3 en `99_open_questions.md`.

```
Eres la Dra. Elena, una médica general realizando un screening rápido de riesgo de cálculos biliares.

TU ROL:
- Eres profesional, cálida y directa
- Hablas en español neutro, accesible
- NO das diagnósticos, solo recoges información para un screening
- NO mencionas bioimpedancia ni análisis de sangre (esos vienen después)

OBJETIVO:
Recoger 9 datos del paciente de forma conversacional:
1. Edad (años)
2. Género (masculino/femenino)
3. Altura (cm)
4. Peso (kg)
5. ¿Enfermedad coronaria? (CAD)
6. ¿Hipotiroidismo?
7. ¿Colesterol o triglicéridos altos? (Hiperlipidemia)
8. ¿Diabetes? (DM)
9. ¿Otra condición crónica? (Comorbidity)

FLUJO SUGERIDO:
1. Saludo breve y explicación: "Hola, soy la Dra. Elena. Vamos a hacer un screening rápido de 2-3 minutos para evaluar tu riesgo de cálculos biliares. Primero necesito unos datos básicos."
2. Preguntar edad y género juntos
3. Preguntar altura y peso juntos
4. Preguntar sobre condiciones crónicas agrupadas: "¿Tienes alguna condición crónica diagnosticada? Por ejemplo, diabetes, problemas de tiroides, colesterol alto, o enfermedades del corazón."
5. Si el paciente menciona alguna, confirmar cuáles específicamente
6. Cuando tengas los 9 datos, responder con el mensaje final + marcador JSON

REGLAS ESTRICTAS:
- Agrupa preguntas relacionadas, no preguntes una por una
- Si el paciente no entiende un término médico, explícalo brevemente
- Si el paciente da datos ambiguos, confirma ("¿45 años?")
- Si el paciente no sabe algo (ej. no sabe si tiene colesterol alto), anótalo como 0 (no)
- Si el paciente ya dio un dato, NO vuelvas a preguntarlo
- Cuando tengas los 9 datos, NO inventes valores faltantes — pregunta por los que falten

MENSAJE FINAL (cuando tengas los 9 datos):
Responde algo como:
"Perfecto, ya tengo toda la información que necesito. Ahora vamos a realizar una medición rápida con nuestro equipo de bioimpedancia. Sube a la báscula cuando estés listo."

Y al final de ese mismo mensaje, incluye esta línea oculta en un comentario HTML (el usuario no la verá):
<!--PATIENT_DATA:{"Age":X,"Gender":X,"Comorbidity":X,"CAD":X,"Hypothyroidism":X,"Hyperlipidemia":X,"DM":X,"Height":X,"Weight":X}-->

CODIFICACIÓN DE VALORES:
- Gender: 1=masculino, 0=femenino
- Binarios (Comorbidity, CAD, Hypothyroidism, Hyperlipidemia, DM): 1=sí, 0=no
- Age: entero
- Height: número en cm (si el paciente da metros, convertir: 1.70 → 170)
- Weight: número en kg

EJEMPLOS DE INTERACCIÓN:

Paciente: "Hola"
Tú: "Hola, soy la Dra. Elena. Voy a hacerte un screening rápido de 2-3 minutos para evaluar tu riesgo de cálculos biliares. Primero, ¿podrías decirme tu edad y género?"

Paciente: "Soy un hombre de 45 años"
Tú: "Gracias. Ahora, ¿cuánto mides y cuánto pesas aproximadamente?"

Paciente: "1.75m y 82 kilos"
Tú: "Perfecto. Ahora una pregunta importante: ¿tienes alguna condición crónica diagnosticada? Por ejemplo, diabetes, problemas de tiroides, colesterol alto, o enfermedades del corazón."

Paciente: "Tengo diabetes y colesterol alto"
Tú: "Entendido, diabetes y colesterol alto. ¿Alguna otra condición? ¿Problemas cardiacos o de tiroides?"

Paciente: "No, nada más"
Tú: "Perfecto, ya tengo toda la información que necesito. Ahora vamos a realizar una medición rápida con nuestro equipo de bioimpedancia. Sube a la báscula cuando estés listo.

<!--PATIENT_DATA:{"Age":45,"Gender":1,"Comorbidity":1,"CAD":0,"Hypothyroidism":0,"Hyperlipidemia":1,"DM":1,"Height":175,"Weight":82}-->"
```

**Iteraciones pendientes sobre el prompt:**
- Probar con DeepSeek y medir reliability del marcador JSON
- Evaluar si `response_format: json_object` es mejor que el marcador HTML
- Ajustar tono si se siente robótico o demasiado formal
- Manejar edge cases: paciente hostil, paciente off-topic, paciente que pregunta su diagnóstico

### Extracción del JSON desde el stream

**Archivo:** `demo/frontend/src/lib/extract-patient-data.ts`

```typescript
const PATIENT_DATA_REGEX = /<!--PATIENT_DATA:(\{[^}]+\})-->/;

export function extractPatientData(text: string): Demographics | null {
  const match = text.match(PATIENT_DATA_REGEX);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    return validatePatientData(data);
  } catch {
    return null;
  }
}

export function stripPatientDataMarker(text: string): string {
  return text.replace(PATIENT_DATA_REGEX, '').trim();
}

function validatePatientData(data: unknown): Demographics | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;

  const required = ['Age', 'Gender', 'Comorbidity', 'CAD', 'Hypothyroidism', 'Hyperlipidemia', 'DM', 'Height', 'Weight'];
  for (const field of required) {
    if (typeof d[field] !== 'number') return null;
  }

  const age = d.Age as number;
  const gender = d.Gender as number;
  const height = d.Height as number;
  const weight = d.Weight as number;

  if (age < 18 || age > 100) return null;
  if (gender !== 0 && gender !== 1) return null;
  if (height < 100 || height > 220) return null;
  if (weight < 30 || weight > 200) return null;

  // Los binarios deben ser 0 o 1
  for (const field of ['Comorbidity', 'CAD', 'Hypothyroidism', 'Hyperlipidemia', 'DM']) {
    if (d[field] !== 0 && d[field] !== 1) return null;
  }

  return d as unknown as Demographics;
}
```

### Detección de completitud en el stream

El hook `useChat` de Vercel AI SDK expone `messages` como array. En cada update, verificar si el último mensaje del asistente contiene el marcador:

```typescript
const { messages } = useChat({ api: '/api/chat' });
const patientDataRef = useRef<Demographics | null>(null);

useEffect(() => {
  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== 'assistant') return;

  const data = extractPatientData(lastMessage.content);
  if (data && !patientDataRef.current) {
    patientDataRef.current = data;
    setDemographics(data);  // Zustand
    setTimeout(() => router.push('/medicion'), 2500);  // delay para leer
  }
}, [messages]);
```

### Form de fallback

Si después de la conversación no se detecta el JSON válido o faltan campos, mostrar un form corto:

```tsx
<Card>
  <h3>Completemos algunos datos</h3>
  <p>No pude capturar toda la información. ¿Podrías confirmar lo siguiente?</p>
  <form>
    <Input label="Edad" type="number" min={18} max={100} />
    <Select label="Género" options={[{value: 1, label: 'Masculino'}, {value: 0, label: 'Femenino'}]} />
    <Input label="Altura (cm)" type="number" min={100} max={220} />
    <Input label="Peso (kg)" type="number" min={30} max={200} />
    <Checkbox label="¿Tienes diabetes?" />
    {/* ... otros binarios */}
    <Button type="submit">Continuar</Button>
  </form>
</Card>
```

El form solo aparece si el JSON falla. En camino feliz, el usuario nunca lo ve.

### Manejo de errores del LLM

| Escenario | UX |
|-----------|-----|
| API key inválida | Pantalla completa de error + instrucción para revisar `.env.local` (solo en dev) |
| Rate limit | Toast "Demasiadas solicitudes, espera un momento" + botón retry |
| Network error | Toast "Sin conexión" + retry automático después de 3s |
| LLM no emite JSON después de 15 mensajes | Mostrar form de fallback directamente |
| LLM emite JSON malformado | Ignorar silenciosamente, continuar chat |

---

## Riesgos y preguntas abiertas

Ver `99_open_questions.md` puntos 3, 4, 10 para decisiones pendientes que afectan esta fase:
- **#3 (LLM reliability):** ¿marcador HTML vs `response_format: json_object`?
- **#4 (errores):** UX de rate limits y timeouts
- **#10 (idioma):** solo español vs toggle

**Riesgos específicos de Fase 3:**
- DeepSeek `deepseek-chat` puede no tener la misma calidad de instruction-following que GPT-4 → testear con muchos perfiles de paciente
- El prompt es largo; reducir tokens si DeepSeek tiene límite o cuesta mucho
- Usuarios pueden intentar "romper" al doctor (jailbreaks, preguntas off-topic) → prompt debería tener una sección de guardrails
- El marcador HTML puede aparecer a la mitad del stream y romper el parsing si se extrae antes de que termine → esperar a que el stream termine antes de extraer

---

## Verificación
- `npm run dev` → navegar a `/consulta`
- Conversación completa: el doctor pregunta edad, género, comorbilidades, altura, peso
- Verificar extracción JSON en Zustand (React DevTools o console.log)
- Verificar transición automática a `/medicion`
- Edge cases:
  - Usuario da información parcial → doctor sigue preguntando
  - Usuario da datos fuera de rango → fallback form aparece
  - Conversación muy corta (usuario da todo junto) → doctor procesa y emite JSON
- Verificar streaming funciona con DeepSeek API key
