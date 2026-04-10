---
purpose: Registrar decisiones técnicas clave y el razonamiento que las sostiene.
last_updated: 2026-04-09
source_of_truth: ../README.md
status: ready
---

# Decisiones y tradeoffs

## Por qué réplica primero
Primero había que demostrar que el pipeline entendía el problema original antes de reinterpretarlo. Si la réplica fallaba, cualquier adaptación rural iba a quedar sin baseline confiable.

## Por qué reducir variables
La adaptación rural busca bajar el costo operativo de captura:

- menos dependencia de laboratorio,
- menor fricción logística,
- más compatibilidad con visitas de campo o atención extramural.

El tradeoff aceptado fue perder parte del rendimiento para ganar factibilidad operativa.

## Por qué screening y no diagnóstico
La evidencia disponible no sostiene un claim clínico fuerte:

- dataset pequeño,
- sin validación externa,
- datos no peruanos,
- sin evaluación prospectiva.

El framing correcto es soporte para tamizaje/priorización de riesgo.

## Por qué replay determinista del mejor experimento
Los mejores parámetros de `Optuna` en los notebooks originales forman parte del resultado histórico del proyecto. Para una pieza de portafolio, lo importante era dejar:

- métricas estables,
- narrativa coherente,
- una forma reproducible de regenerar artefactos públicos.

Por eso el repo conserva un replay determinista del mejor experimento en lugar de depender de que una nueva corrida de `Optuna` encuentre exactamente el mismo óptimo.

## Por qué docs-as-code
La parte pública del repo cuenta la historia para terceros. La vault interna existe para un problema distinto:

- mantener respuestas consistentes en entrevistas,
- no improvisar claims,
- separar documentación pública de material privado,
- reutilizar aprendizaje en futuros proyectos.
