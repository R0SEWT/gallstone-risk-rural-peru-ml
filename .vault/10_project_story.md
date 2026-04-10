---
purpose: Narrativa larga del proyecto para entrevistas, portfolio y escritura derivada.
last_updated: 2026-04-09
source_of_truth: ../README.md
status: ready
---

# Historia del proyecto

## Problema
El punto de partida fue un paper sobre predicción temprana de cálculos biliares con variables demográficas, bioimpedancia y laboratorio. El problema técnico inicial era entender si podíamos reproducir el enfoque con el dataset público asociado y obtener un rendimiento comparable en un pipeline propio.

## Enfoque
La primera fase fue una réplica metodológica:

- usar el dataset de UCI asociado al paper,
- mantener división estratificada,
- comparar varios modelos base,
- mejorar el mejor punto de partida con `SMOTE + Optuna`.

Esa fase sirve como validación de que el pipeline reproduce una metodología publicada y no parte de una idea arbitraria.

## Adaptación rural
La segunda fase cambió la pregunta. En vez de maximizar rendimiento con todas las variables disponibles, reformulamos el problema para un escenario de tamizaje rural en Perú:

- conservar historial clínico básico,
- conservar antropometría,
- conservar bioimpedancia portátil,
- retirar pruebas de laboratorio.

La hipótesis práctica fue que una reducción fuerte en costo y fricción de captura de datos podía justificar una pérdida moderada de rendimiento si el modelo seguía siendo útil para priorización.

## Qué se logró
- La réplica completa mantuvo señal fuerte y mejoró el benchmark con `Gradient Boosting + SMOTE`.
- La versión rural perdió rendimiento frente al escenario completo, pero siguió mostrando capacidad de separación útil.
- El valor del proyecto no está en afirmar “tenemos un modelo clínico”, sino en mostrar cómo se adapta una metodología publicada a restricciones operativas reales.

## Limitaciones
- El dataset tiene solo `319` casos.
- Los datos no fueron recolectados en Perú.
- No existe validación externa.
- La bioimpedancia observada en el dataset no garantiza equivalencia con dispositivos de campo.
- El framing correcto es screening/priorización, no diagnóstico.

## Por qué importa
Como pieza de portafolio, este proyecto demuestra algo más interesante que entrenar un modelo:

- capacidad de reproducir trabajo publicado,
- criterio para cambiar la formulación del problema cuando cambia el contexto operativo,
- disciplina para documentar límites y evitar claims clínicos débiles.
