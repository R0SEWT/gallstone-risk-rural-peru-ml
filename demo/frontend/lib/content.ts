import type { RiskLevel } from "./types";

export const DEMO_STEPS = [
  {
    id: "consulta",
    label: "Consulta",
    caption: "9 respuestas guiadas",
  },
  {
    id: "medicion",
    label: "Medición",
    caption: "15 señales corporales",
  },
  {
    id: "resultado",
    label: "Resultado",
    caption: "riesgo + explicación",
  },
] as const;

export const HERO_FACTS = [
  {
    label: "Traslado sin apoyo de modelo",
    value: "4–5 h",
    note: "hasta llegar a un hospital y acceder a imágenes.",
  },
  {
    label: "Si el flujo aún depende de sangre",
    value: "~1 día",
    note: "para enviar la muestra y devolver una indicación.",
  },
  {
    label: "Con la adaptación rural",
    value: "En la visita",
    note: "la lectura vuelve a ocurrir frente al poblador.",
  },
] as const;

export const HOME_SCENARIOS = [
  {
    id: "sierra",
    eyebrow: "Escenario 1",
    kicker: "Visita clínica sin modelo",
    title: "El médico llega al poblador, pero la decisión sigue viviendo lejos.",
    accent: "var(--accent-earth)",
    summary:
      "Ante sospecha de cálculos, la visita termina en derivación. El siguiente paso todavía depende del traslado del poblador y del acceso al hospital.",
    route: ["Médico", "Poblador", "Hospital"],
    equipment: ["Ficha clínica", "Evaluación básica"],
    responseWindow: "Después del traslado",
    patientLoad: "4–5 h de viaje para acceder a imágenes",
    decisionPoint: "La decisión útil llega fuera de la visita",
    metricLabel: "Resultado operativo",
    metricValue: "Derivación",
    points: [
      "Sin score de apoyo para priorizar durante la visita.",
      "La fricción principal recae en tiempo de viaje y espera.",
      "El cuello de botella es acceso a imágenes y confirmación clínica.",
    ],
  },
  {
    id: "paper",
    eyebrow: "Escenario 2",
    kicker: "Si la visita intentara usar el modelo original",
    title: "La brigada tendría que cargar bioimpedancia, extracción y espera.",
    accent: "var(--accent-clinical)",
    summary:
      "El paper funciona bien con laboratorio. Para acercarlo al trabajo en sierra, el médico tendría que medir, extraer sangre, enviarla y responder después.",
    route: ["Médico", "Balanza", "Muestra", "Mensaje"],
    equipment: ["Balanza de bioimpedancia", "Extracción de sangre"],
    responseWindow: "≈ 1 día",
    patientLoad: "El poblador espera la indicación antes de acercarse",
    decisionPoint: "La decisión vuelve por mensaje, no en el momento",
    metricLabel: "Rendimiento del modelo original",
    metricValue: "AUC 0.9280 · Acc 88.54%",
    points: [
      "La referencia metodológica viene del dataset UCI de Ankara, Turquía.",
      "El modelo original depende de variables de laboratorio.",
      "La visita mejora, pero la respuesta todavía no ocurre frente al paciente.",
    ],
  },
  {
    id: "rural",
    eyebrow: "Escenario 3",
    kicker: "Adaptación rural",
    title: "La brigada carga solo la balanza y obtiene una lectura en ese momento.",
    accent: "var(--accent-signal)",
    summary:
      "La adaptación sacrifica precisión frente al entorno clínico completo, pero devuelve la decisión al espacio de la visita y reduce la carga del poblador.",
    route: ["Médico", "Balanza", "Modelo", "Respuesta"],
    equipment: ["Balanza de bioimpedancia"],
    responseWindow: "En la visita",
    patientLoad: "No requiere extracción ni espera de laboratorio",
    decisionPoint: "La priorización ocurre frente al poblador",
    metricLabel: "Rendimiento rural",
    metricValue: "AUC 0.8138 · Acc 77.08%",
    points: [
      "Conserva 25 variables medibles en campo y elimina 13 de laboratorio.",
      "Sirve para tamizaje y priorización, no para diagnóstico definitivo.",
      "La respuesta es inmediata, aunque sin validación externa en Perú.",
    ],
  },
] as const;

export const TRADEOFF_METRICS = [
  {
    label: "Escenario clínico completo",
    eyebrow: "Paper / réplica",
    accuracy: 0.8854,
    auc: 0.928,
    accent: "var(--accent-clinical)",
  },
  {
    label: "Adaptación rural optimizada",
    eyebrow: "Bioimpedancia + ML",
    accuracy: 0.7708,
    auc: 0.8138,
    accent: "var(--accent-signal)",
  },
] as const;

export const LIMITATIONS = [
  "Los datos provienen de un hospital en Ankara, Turquía; no de campañas rurales peruanas.",
  "El dataset tiene 319 casos y no incluye validación externa en una cohorte de Perú.",
  "La demo es de tamizaje y priorización. No sustituye ecografía ni diagnóstico médico.",
] as const;

export const METHODOLOGY_FACTS = [
  "25 variables conservadas para la versión rural.",
  "13 variables de laboratorio excluidas por fricción operativa.",
  "Gradient Boosting + SMOTE + Optuna como modelo rural final.",
] as const;

export const EXCLUDED_LAB_FEATURES = [
  "Glucose",
  "LDL",
  "HDL",
  "Triglyceride",
  "AST",
  "ALT",
] as const;

export const RESULT_INTERPRETATION: Record<
  RiskLevel,
  {
    title: string;
    summary: string;
    emphasis: string;
  }
> = {
  bajo: {
    title: "Lectura tranquilizadora, no concluyente",
    summary:
      "El patrón observado se parece más a perfiles de baja probabilidad dentro del dataset usado en la demo.",
    emphasis:
      "Sirve para priorizar menos urgencia operativa, pero no descarta evaluación clínica si hay síntomas.",
  },
  moderado: {
    title: "Caso para revisar con más criterio clínico",
    summary:
      "La señal está en una zona intermedia: hay factores que empujan el riesgo, pero no una lectura decisiva por sí sola.",
    emphasis:
      "Es el tipo de caso donde la priorización y la derivación oportuna aportan más valor.",
  },
  alto: {
    title: "Perfil que merece atención prioritaria",
    summary:
      "El conjunto de variables se alinea con perfiles de alta probabilidad dentro del escenario rural modelado.",
    emphasis:
      "No es un diagnóstico, pero sí una señal útil para acelerar revisión clínica y pruebas confirmatorias.",
  },
};

export const ACT_NOTES = {
  consulta: "Entrevista breve para capturar datos que sí pueden obtenerse en campo.",
  medicion: "Simulación de bioimpedancia como reemplazo operacional del laboratorio.",
  resultado: "La salida combina riesgo estimado y lectura explicativa de las variables.",
} as const;
