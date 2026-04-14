---
purpose: Plan detallado de Fase 5 — polish, landing page, responsive y deploy a Vercel + Railway.
last_updated: 2026-04-12
source_of_truth: ./00_orchestrator.md
status: pending
---

# Fase 5: Polish + Deploy

## Objetivo
Demo deployada y accesible por URL, pulida para primera impresión de reclutador.

## Dependencia
Fases 1-4 completadas.

---

## Paso 5.1: Landing page

**Archivo:** `demo/frontend/src/app/page.tsx`

- Hero section: título del proyecto + subtítulo sobre screening rural
- Descripción breve (2-3 oraciones) del caso de estudio
- Botón prominente "Iniciar Demo" → navega a `/consulta`
- Sección breve de contexto: qué es cálculos biliares, por qué bioimpedancia
- Footer: créditos del equipo + link al repo GitHub

**Tono:** profesional pero accesible. Un reclutador debe entender la propuesta de valor en 10 segundos.

---

## Paso 5.2: Transiciones entre actos

### StepIndicator.tsx (`components/layout/`)
- Barra horizontal con 3 pasos: "Consulta" → "Medición" → "Resultado"
- Paso activo: resaltado con color primario
- Pasos completados: check mark
- Pasos pendientes: gris
- Visible en las 3 páginas de acto (no en landing)

### ActTransition.tsx (`components/layout/`)
- Wrapper con `AnimatePresence` de Framer Motion
- Transición entre páginas: fade + slide horizontal sutil
- Duración: 300ms

---

## Paso 5.3: Responsive

| Componente | Desktop | Móvil |
|-----------|---------|-------|
| Chat (Acto 1) | Funciona nativamente | Full width, input fijo abajo |
| Silueta (Acto 2) | Centrada con MetricCards alrededor | Silueta arriba, MetricCards en grid 2xN debajo |
| RiskGauge (Acto 3) | Centrado | Centrado, algo más pequeño |
| ShapWaterfall | Barras horizontales | Mismo, con scroll horizontal si necesario |
| ComparisonCard | Dos columnas lado a lado | Stackean verticalmente |

Breakpoint clave: 768px (md de Tailwind).

---

## Paso 5.4: Deploy backend (Railway)

**Archivo:** `demo/backend/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ app/
COPY ml/ ml/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Pasos:**
1. Crear proyecto en Railway
2. Conectar repo GitHub, root directory: `demo/backend`
3. Railway detecta Dockerfile automáticamente
4. No necesita variables de entorno (backend no usa LLM)
5. URL resultante: `*.up.railway.app`

**Costo estimado:** Railway free tier: 500 horas/mes, suficiente para demo.

---

## Paso 5.5: Deploy frontend (Vercel)

**Pasos:**
1. Conectar repo en Vercel, root directory: `demo/frontend`
2. Variables de entorno:
   - `DEEPSEEK_API_KEY` — API key de DeepSeek
   - `NEXT_PUBLIC_API_URL` — URL del backend Railway
3. Build command: `npm run build` (default de Next.js)
4. URL resultante: `*.vercel.app`

**Costo estimado:**
- Vercel: free tier cubre de sobra
- DeepSeek: ~4-6 intercambios por sesión, ~2K tokens, ~$0.001/sesión

---

## Paso 5.6: Meta tags y OG

**Archivo:** `demo/frontend/src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: 'Gallstone Screening Demo — ML + AI',
  description: 'Demo interactiva de screening de cálculos biliares para zonas rurales usando ML y bioimpedancia',
  openGraph: {
    title: 'Gallstone Screening Demo',
    description: 'Screening de cálculos biliares en 8 segundos con bioimpedancia + ML',
    images: ['/og-image.png'],  // captura de pantalla de resultados
  },
};
```

Generar `og-image.png`: screenshot de la pantalla de resultados con datos demo.

---

---

## Detalles adicionales

### Variables de entorno

**Frontend — `demo/frontend/.env.local` (gitignored):**
```bash
# API key de DeepSeek para el chat del Acto 1
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx

# URL del backend FastAPI (local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Frontend — `demo/frontend/.env.example` (commit):**
```bash
# Copiar a .env.local y rellenar
DEEPSEEK_API_KEY=your_deepseek_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Frontend — producción (Vercel dashboard):**
```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx  (secret)
NEXT_PUBLIC_API_URL=https://gallstone-api.up.railway.app
```

**Backend — local:**
Sin variables necesarias. CORS por defecto permite `http://localhost:3000`.

**Backend — producción (Railway dashboard):**
```
ALLOWED_ORIGINS=https://gallstone-demo.vercel.app,https://*.vercel.app,http://localhost:3000
```

Nota: CORS con wildcard subdomain requiere regex en FastAPI:
```python
import re
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:3000|https://gallstone-demo\.vercel\.app",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

### Railway cold start — estrategia de mitigación

**Problema:** Railway free tier suspende servicios tras inactividad. La primera request después de dormido puede tardar 10-30s (pull container + load modelo + SHAP explainer).

**Estrategias:**

1. **Pre-warming desde la landing:** Al cargar `/` (landing page), hacer un fetch a `/health` del backend. Esto despierta el servicio mientras el usuario lee el hero section.
   ```tsx
   // app/page.tsx
   useEffect(() => {
     fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {});
   }, []);
   ```

2. **Loading states transparentes:** En Acto 3, mostrar "Despertando el servidor..." si la primera request tarda >2s.

3. **Alternativa de pago:** Railway Pro ($5/mes) elimina el sleep. Decidir si vale la pena para una demo de portafolio.

4. **Backend siempre caliente:** Usar un cron externo (UptimeRobot, cron-job.org) que haga ping cada 10 minutos a `/health`. Gratis y mantiene el servicio despierto.

**Recomendación:** Combinación de 1 + 4. Pre-warm al cargar landing + cron externo.

### Checklist pre-deploy

**Backend:**
- [ ] Modelo exportado y committeado (o en stage de build)
- [ ] `requirements.txt` con versiones exactas
- [ ] Dockerfile prueba en local: `docker build -t gallstone-api . && docker run -p 8000:8000 gallstone-api`
- [ ] `/health` responde 200
- [ ] `/predict/rural` funciona con curl
- [ ] `/explain/rural` funciona con curl
- [ ] CORS configurado con variables de entorno
- [ ] Logs en formato JSON para Railway

**Frontend:**
- [ ] `npm run build` sin errores
- [ ] `npm run start` corre producción en local
- [ ] `.env.example` committeado con placeholders
- [ ] `.env.local` en `.gitignore`
- [ ] Flujo completo funciona contra backend local
- [ ] Flujo completo funciona contra backend de Railway (staging)
- [ ] Responsive en móvil (DevTools + device real)
- [ ] `prefers-reduced-motion` respetado
- [ ] OG image generada y en `/public`

**Post-deploy:**
- [ ] Ping manual a `/health` del backend
- [ ] Flujo completo E2E en URL de producción
- [ ] Compartir URL en Slack y verificar OG preview
- [ ] Probar en móvil real (no solo DevTools)
- [ ] Medir latencia del primer request (cold start)
- [ ] Verificar que analytics (si se agregan) están enviando eventos

### Estructura final del repo

```
WinterProject/
├── .vault/
│   └── demo/              # planes docs-as-code
├── data/
├── demo/                  # ← NUEVO: la demo completa
│   ├── backend/
│   │   ├── app/
│   │   ├── ml/            # artifacts generados por export_models.py
│   │   ├── scripts/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── .env.example
│       └── next.config.js
├── figures/
├── notebooks/
├── results/
├── scripts/
├── archive/
├── CLAUDE.md
├── LICENSE
├── README.md
└── requirements.txt
```

### Actualización del README público

Una vez deployada la demo, agregar al `README.md` principal:

```markdown
## 🎮 Demo interactiva
Prueba el modelo en vivo: [gallstone-demo.vercel.app](https://gallstone-demo.vercel.app)

Una experiencia en tres actos:
1. **La consulta** — un doctor virtual recoge tu historia clínica
2. **La medición** — simulación de una báscula de bioimpedancia
3. **El resultado** — predicción de riesgo con explicación SHAP

Stack de la demo: Next.js 14 + FastAPI + DeepSeek (LLM) + Framer Motion.
Código fuente de la demo: [`demo/`](./demo)
```

### Costos estimados mensuales

| Servicio | Costo | Notas |
|----------|-------|-------|
| Vercel frontend | $0 | Free tier suficiente |
| Railway backend | $0-5 | Free tier 500h/mes, Pro $5 si se necesita siempre-on |
| DeepSeek API | ~$1-3 | ~$0.001/sesión, depende del tráfico |
| Dominio custom (opcional) | $10-15/año | Solo si Rody quiere `gallstone.rody.dev` o similar |
| **Total** | **$0-5/mes** | Escalable con tráfico |

### Analytics (opcional)

Vercel Analytics es gratuito y se activa con:
```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

Eventos personalizados para medir funnel:
```typescript
import { track } from '@vercel/analytics';

track('landing_view');
track('consulta_start');
track('consulta_completed', { messages: messageCount });
track('medicion_completed');
track('resultado_view', { risk_level: 'alto' });
```

### Dominio custom (opcional)

Si Rody tiene un dominio personal (`rodyvilchez.dev` o similar), apuntar subdominio:

1. Vercel → Project Settings → Domains → Add
2. `demo.rodyvilchez.dev` o `gallstone.rodyvilchez.dev`
3. Configurar CNAME en el DNS del dominio hacia `cname.vercel-dns.com`
4. Vercel auto-emite certificado SSL

---

## Riesgos y preguntas abiertas

Ver `99_open_questions.md` puntos 4, 6, 7, 9 para decisiones pendientes que afectan esta fase:
- **#4 (errores):** retry logic, UX de cold start
- **#6 (CORS y env vars):** estrategia final de variables
- **#7 (performance):** si SHAP es lento, separar de predict
- **#9 (analytics):** activar Vercel Analytics o no

**Riesgos específicos de Fase 5:**
- Railway puede cambiar su política de free tier → tener plan B (Fly.io, Render)
- Vercel tiene límite de 4KB en `NEXT_PUBLIC_*` vars → no debería ser problema, pero documentar
- DeepSeek API puede tener issues de disponibilidad → tener fallback a OpenAI o Anthropic si es crítico
- El dominio `*.vercel.app` puede cambiar entre preview deploys → usar regex en CORS
- El OG image se cachea por Twitter/LinkedIn → si se cambia, el preview viejo persiste días

---

## Verificación final

1. **Funcionalidad:**
   - Abrir URL de Vercel en navegador desktop
   - Flujo completo: Landing → Consulta → Medición → Resultado
   - Verificar que DeepSeek responde (chat funciona)
   - Verificar que el backend responde (predicción retorna datos)

2. **Móvil:**
   - Abrir misma URL en teléfono
   - Verificar que todos los actos son usables

3. **Performance:**
   - Chat: primera respuesta < 2s
   - Animación bioimpedancia: 60fps
   - Predicción: < 500ms

4. **Compartibilidad:**
   - Pegar URL en Slack/WhatsApp/LinkedIn
   - Verificar que OG preview muestra título + imagen

5. **Tiempos de experiencia:**
   - Landing → clic: 10s (lectura)
   - Consulta: 2-3 min
   - Medición: 10s
   - Resultado: exploración libre
   - Total: ~3-4 minutos por sesión
