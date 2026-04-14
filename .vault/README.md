---
purpose: Punto de entrada y reglas de uso para la vault interna del proyecto.
last_updated: 2026-04-09
source_of_truth: ../README.md
status: ready
---

# `.vault`

Esta carpeta concentra la documentación interna del proyecto en formato Markdown portable. Está pensada para tres usos:

- preparar entrevistas y storytelling profesional,
- mantener decisiones, claims y límites del proyecto en un solo lugar,
- reutilizar plantillas para futuros proyectos de portafolio.

## Qué se versiona
- notas neutras sobre narrativa, métricas, decisiones y contribución,
- templates reutilizables,
- documentos que sirven para preparar entrevistas o publicar el proyecto.

## Qué no se versiona
- notas personales o sensibles,
- lista de empresas objetivo,
- expectativas salariales,
- retros privadas de entrevistas,
- material local de Obsidian o archivos temporales.

## Estructura
- [00_index.md](./00_index.md): mapa rápido de navegación.
- [10_project_story.md](./10_project_story.md): narrativa larga del proyecto.
- [11_interview_pitch.md](./11_interview_pitch.md): pitches listos para entrevista.
- [12_decisions_tradeoffs.md](./12_decisions_tradeoffs.md): decisiones y tradeoffs.
- [13_hard_questions.md](./13_hard_questions.md): preguntas difíciles y respuestas.
- [14_metrics_claims.md](./14_metrics_claims.md): métricas, fuentes y claims.
- [15_contribution.md](./15_contribution.md): aporte individual y contexto grupal.
- [16_cv_bullets.md](./private/16_cv_bullets.md): bullets listos para CV y portfolio.
- [17_linkedin_post.md](./private/17_linkedin_post.md): copy breve para publicar el proyecto.
- [18_paper_traceability.md](./private/18_paper_traceability.md): reconciliación paper -> dataset -> repo.
- [templates/](./templates/): plantillas para nuevos proyectos y entrevistas.
- `private/`: zona local no versionada para notas sensibles.

## Reglas de escritura
- Una idea principal por archivo.
- Usar links relativos siempre que la fuente esté dentro del repo.
- Si un claim depende de una métrica, enlazar al archivo fuente.
- Escribir primero la versión corta de una respuesta y luego la extendida.
- Mantener el mismo bloque de metadata en todos los documentos.

## Flujo recomendado
1. Actualizar [14_metrics_claims.md](./14_metrics_claims.md) si cambian resultados o framing.
2. Ajustar [10_project_story.md](./10_project_story.md) y [11_interview_pitch.md](./11_interview_pitch.md) antes de una entrevista.
3. Revisar [18_paper_traceability.md](./18_paper_traceability.md) antes de afirmar equivalencia exacta con el paper.
4. Reutilizar [16_cv_bullets.md](./16_cv_bullets.md) y [17_linkedin_post.md](./17_linkedin_post.md) para difusión y aplicaciones.
5. Guardar notas personales o retro en `private/`, no en archivos versionados.
