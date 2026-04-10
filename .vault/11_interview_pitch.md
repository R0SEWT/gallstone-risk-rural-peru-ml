---
purpose: Pitches preparados para explicar el proyecto en distintos niveles de detalle.
last_updated: 2026-04-09
source_of_truth: ./10_project_story.md
status: ready
---

# Interview Pitch

## Versión de 30 segundos
Tomé un proyecto grupal donde replicamos un paper sobre predicción de cálculos biliares y lo convertí en una pieza de portafolio reproducible. Primero validamos que podíamos reproducir el enfoque con variables completas; después rediseñamos el problema para un escenario rural en Perú eliminando pruebas de laboratorio y usando solo historial médico, antropometría y bioimpedancia. El resultado quedó planteado como screening de riesgo, no como diagnóstico.

## Versión de 60-90 segundos
El proyecto parte de un paper de 2024 y su dataset público en UCI. La primera etapa fue una réplica metodológica: separación estratificada, escalado, selección ANOVA y benchmark de varios modelos para entender si podíamos obtener un rendimiento comparable con un pipeline reproducible.  

La parte más interesante vino después: reformulamos el problema para un contexto rural en Perú, donde no siempre puedes depender de laboratorio. Retiramos variables como glucosa, lípidos, enzimas hepáticas y hemoglobina, y dejamos solo señales que podrían levantarse en una visita de campo con historial clínico, medidas corporales y bioimpedancia portátil.  

La accuracy bajó frente al escenario completo, pero el modelo mantuvo señal suficiente para priorización. Mi trabajo fuerte estuvo en curar el repo, fijar resultados reproducibles, ordenar la narrativa técnica y convertir un conjunto de notebooks sueltos en un case study serio.

## Versión técnica para DS/ML
El proyecto tiene dos capas. La primera es reproducción de una metodología publicada para predicción de cálculos biliares usando el dataset de UCI asociado al paper. Ahí se conserva una división 70/30 estratificada, se escalan las variables, se aplica ANOVA F-score para seleccionar 32 features y se comparan modelos como Logistic Regression, Random Forest, Gradient Boosting, XGBoost y CatBoost.  

La segunda capa es una reformulación con restricciones reales: definir qué subset de variables puede sobrevivir si el entorno operativo elimina laboratorio. En esa versión usamos 25 variables de demografía, comorbilidades, antropometría y bioimpedancia. El punto no fue solo entrenar otro modelo, sino medir el tradeoff entre rendimiento predictivo y costo operativo de captura.  

Para dejarlo sólido como portafolio, documenté los claims permitidos, fijé el replay determinista del mejor experimento original y dejé una capa de docs-as-code para entrevistas y mantenimiento narrativo.
