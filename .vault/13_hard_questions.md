---
purpose: Preparar respuestas breves y extendidas a preguntas difíciles de entrevista.
last_updated: 2026-04-09
source_of_truth: ./10_project_story.md
status: ready
---

# Preguntas difíciles

## ¿Por qué usar este dataset si no es peruano?
Respuesta corta: porque el objetivo del proyecto no fue validación clínica en Perú, sino reproducir una metodología publicada y evaluar si podía reformularse para un contexto operativo rural.  

Respuesta extendida: el dataset sirve como base experimental para medir tradeoffs entre variables completas y variables capturables en campo. No lo presento como evidencia de deploy en Perú; de hecho, una de las limitaciones explícitas es que faltaría validación externa con datos locales antes de cualquier piloto real.

## ¿Qué tan confiable es con solo 319 filas?
Respuesta corta: es suficiente para una pieza de portafolio y para explorar señal, pero insuficiente para sostener claims clínicos fuertes.  

Respuesta extendida: el tamaño del dataset obliga a ser conservador. Lo uso para comparar escenarios y mostrar criterio metodológico, no para vender precisión clínica. Si este fuera un proyecto de producción, lo siguiente sería validación externa, análisis de estabilidad y calibración.

## ¿Qué harías antes de desplegarlo?
Respuesta corta: recolectar datos peruanos, validar externamente y redefinir la métrica objetivo junto con personal clínico.  

Respuesta extendida:
- validación externa con cohortes locales,
- verificación de equivalencia de sensores de bioimpedancia,
- calibración y análisis de costo por error,
- definición operativa de umbrales de screening,
- piloto controlado con flujo clínico claro y supervisión médica.

## ¿Qué aportaste tú exactamente?
Respuesta corta: convertí un trabajo exploratorio en un caso de estudio reproducible y defendible para portafolio.  

Respuesta extendida: mi aporte fuerte está en la curación final del proyecto: estructura reproducible, limpieza de notebooks, narrativa técnica, definición de claims permitidos, exportación de figuras y documentación interna para entrevistas. También articulé el valor del proyecto como adaptación de una metodología publicada a restricciones operativas reales.
