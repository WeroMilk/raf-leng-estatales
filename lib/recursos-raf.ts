/**
 * Contenido pedagógico RAF: perfiles lectores, estrategias y guía para padres.
 * Extraído del documento técnico de cortes y perfiles por nivel.
 */

import type { NivelLenguaje } from "@/types/raf";

export interface CorteNivel {
  nivel: NivelLenguaje;
  rango: string;
  caracterizacion: string;
}

export interface PerfilNivel {
  nivel: NivelLenguaje;
  titulo: string;
  rango: string;
  notaTecnica: string;
  perfil: string[];
  necesita: string[];
  dificultades: string;
  fortalezas: string;
  intervencionDocente: string[];
  meta: string;
  estrategiasEstudiante: string[];
  estrategiasDocente: string[];
  estrategiasPadres: string[];
}

export interface PreguntaPadres {
  nivel: NivelLenguaje;
  preguntas: string[];
}

export interface GuiaPadresNivel {
  nivel: NivelLenguaje;
  nombre: string;
  descripcion: string;
  comoApoyarlo: string[];
  objetivo: string;
}

/** Tabla de clasificación - Cortes (modelo mixto) - Escalera cognitiva completa */
export const TABLA_CORTES: CorteNivel[] = [
  { nivel: 1, rango: "0–13", caracterizacion: "Lector Emergente" },
  { nivel: 2, rango: "14–21", caracterizacion: "Lector con Comprensión Funcional" },
  { nivel: 3, rango: "22–26", caracterizacion: "Lector Interpretativo" },
  { nivel: 4, rango: "27–30", caracterizacion: "Lector Estratégico" },
];

/** Perfiles lectores por nivel - Fase 3 */
export const PERFILES_NIVEL: PerfilNivel[] = [
  {
    nivel: 1,
    titulo: "Lector Emergente",
    rango: "0–13 aciertos",
    notaTecnica:
      "En el instrumento debe mostrar: menos de 3 literales correctos o menos de 6 inferencias cercanas. Aquí no hay construcción estable de significado.",
    perfil: [
      "Realiza lectura fragmentada.",
      "No identifica ideas centrales.",
      "Presenta dificultad para conectar causa–efecto.",
      "Presenta respuestas intuitivas.",
      "Presenta escasa metacognición.",
    ],
    necesita: ["Andamiaje fuerte.", "Modelado constante."],
    dificultades:
      "Puede tener dificultad para integrar dos o más fragmentos del texto; explicar causas, intenciones o emociones no dichas explícitamente; justificar sus respuestas con evidencia textual y distinguir entre lo que el texto dice y lo que él piensa.",
    fortalezas:
      "Puede identificar información explícita en el texto (personajes, acciones, lugares); localizar datos cuando la pregunta es directa y coincide con el texto; reconocer palabras o frases tal como aparecen en el relato y responder correctamente cuando la respuesta está textualmente visible.",
    intervencionDocente: [
      "Lectura guiada en voz alta.",
      "Preguntas muy estructuradas.",
      "Trabajo con textos más breves.",
    ],
    meta: "Consolidar literal e inferencia cercana.",
    estrategiasEstudiante: [
      "Rutina 5 minutos antes y después: Antes: leer el título y preguntarse «¿De qué tratará?»; Después: escribir 3 datos importantes sin copiar completo.",
      "Regla de la idea principal: Después de cada texto: ¿Quién o qué es lo más importante? ¿Qué pasa con eso?",
      "Subrayado con intención: Solo personajes, hechos principales, fechas o datos clave.",
      "Explicación oral breve: Poder contar el texto en 1 minuto sin leer.",
      "Subrayar personajes, acciones y lugares con colores distintos.",
      "Responder preguntas guiándose por: ¿dónde dice eso?",
      "Releer fragmentos breves antes de contestar.",
      "Usar organizadores simples (¿quién?, ¿qué?, ¿dónde?).",
      "Hacer líneas del tiempo, subrayado guiado, contestar preguntas dirigidas.",
    ],
    estrategiasDocente: [
      "Modelado constante: Pensar en voz alta: «Aquí veo que lo importante es…»",
      "Enseñar qué es idea principal. No asumir que lo saben.",
      "Preguntas que obliguen a sintetizar: No solo «¿qué pasó?», sino «¿Qué fue lo más importante?»",
      "Retroalimentación específica: No solo «bien/mal», sino «Esto es un detalle, ¿cuál es la idea central?»",
      "Modelar cómo identificar idea principal.",
      "Enseñar explícitamente qué SÍ o qué NO subrayar.",
      "Hacer preguntas que obliguen a localizar y luego explicar (escalonadas).",
      "Pedir evidencia textual con fórmula guiada.",
      "Trabajar con organizadores gráficos simples.",
      "Implementar estrategias de prelectura, durante la lectura y después de la lectura.",
      "Modelar cómo se busca una respuesta en el texto («aquí lo dice»).",
      "Trabajar con textos cortos y fragmentados.",
      "Formular preguntas literales, inferenciales y críticas, mediante preguntas escalonadas.",
    ],
    estrategiasPadres: [
      "Pedir que expliquen lo que leyeron con sus palabras.",
      "Preguntar: ¿De qué trató? ¿Qué fue lo más importante?",
      "Escuchar sin corregir todo.",
      "Fomentar lectura breve diaria (10 minutos).",
      "Leer juntos y hacer preguntas directas sin interpretación.",
      "Reforzar la relectura, no la rapidez.",
      "Promover la lectura en voz alta.",
      "Evitar que solo lean y respondan cuestionarios sin diálogo.",
    ],
  },
  {
    nivel: 2,
    titulo: "Lector con Comprensión Funcional",
    rango: "14–21 aciertos",
    notaTecnica:
      "En el instrumento debe mostrar: 3–4 literales correctos, 6–8 inferencias cercanas, máximo 4 inferencias profundas. Aquí el estudiante entiende lo explícito y parte de lo implícito inmediato, pero no integra globalmente.",
    perfil: [
      "Recupera información explícita.",
      "Realiza inferencias simples.",
      "Dificultad para integrar todo el texto.",
      "No distingue intención profunda.",
    ],
    necesita: [
      "Justificación y precisión inferencial.",
      "Estrategias de integración global.",
      "Trabajo en conflicto y propósito.",
    ],
    dificultades:
      "Presenta dificultad para integrar el texto completo como una unidad de sentido; identificar el mensaje global o el conflicto central; interpretar símbolos o significados implícitos amplios, y comparar inicio, desarrollo y cierre del texto.",
    fortalezas:
      "Puede inferir información cercana al texto a partir de indicios claros; relacionar dos fragmentos próximos del relato; deducir emociones, causas o consecuencias inmediatas y justificar sus respuestas usando frases o acciones del texto.",
    intervencionDocente: [
      "Trabajar con organizadores gráficos constantemente.",
      "Realizar trabajo explícito de conflicto.",
      "Resúmenes dirigidos.",
    ],
    meta: "Construir integración global básica.",
    estrategiasEstudiante: [
      "Doble pregunta obligatoria: ¿Qué dice el texto? ¿Qué entiendo yo?",
      "Regla del «porque»: No responder nada sin añadir: porque en el texto dice…",
      "Regla del «¿Por qué?» doble: ¿Por qué pasó? ¿Por qué creo eso?",
      "Relacionar párrafos: Preguntarse ¿Qué tiene que ver este párrafo con el anterior?",
      "Detector de opinión: Antes de escribir: ¿Esto lo dice el texto o lo estoy suponiendo?",
      "Mapa causa–consecuencia: Identificar hecho, causa, consecuencia.",
      "Frases académicas obligatorias: Se infiere que…; El texto sugiere…; Esto implica que…",
      "Hecho → ¿por qué? → ¿qué pasó después?",
      "Justificar respuestas con frases del texto («pienso esto porque…»).",
      "Relacionar acciones con emociones o causas inmediatas.",
      "Comparar dos fragmentos cercanos del texto.",
      "Realizar esquemas causa–efecto.",
      "Identificación de conflicto.",
      "Hacer reescritura de párrafos.",
    ],
    estrategiasDocente: [
      "Asegurar que las y los estudiantes presenten evidencia textual en todas las respuestas.",
      "Enseñar explícitamente cómo se construye una inferencia.",
      "Diseñar preguntas que integren dos partes del texto.",
      "Corregir formativamente cuando haya opinión sin sustento.",
      "Dar ejemplos comparativos: Respuesta sin evidencia vs con evidencia.",
      "Evaluar procesos, no solo aciertos.",
      "Diseñar preguntas «¿cómo lo sabes?» o «¿qué parte del texto te ayuda?».",
      "Trabajar inferencias de pronombres, causas y consecuencias.",
      "Usar mapas simples de relaciones (acción → consecuencia).",
      "Trabajar estrategias de prelectura, durante la lectura y después de la lectura.",
    ],
    estrategiasPadres: [
      "Preguntar: ¿Cómo sabes eso? ¿Dónde lo dice?",
      "Conversar sobre causas en situaciones cotidianas.",
      "Valorar que expliquen, no solo que acierten.",
      "Fomentar conversación sobre causas.",
      "Relacionar lectura con situaciones reales o vivencias.",
      "Evitar aceptar respuestas vagas.",
      "Preguntar «¿qué te hizo pensar eso?».",
      "Ayudar a encontrar pistas textuales.",
      "Evitar decir si está «bien o mal»; es mejor pedir explicación de por qué se dio determinada respuesta.",
      "Preguntar por qué ocurrió algo.",
    ],
  },
  {
    nivel: 3,
    titulo: "Lector Interpretativo",
    rango: "22–26 aciertos",
    notaTecnica:
      "En el instrumento debe mostrar: dominio literal completo, 9–11 inferencias cercanas, 5–7 inferencias profundas, al menos 1 crítico-simbólico. Ya hay construcción de macroestructura.",
    perfil: [
      "Identifica conflicto.",
      "Reconoce propósito.",
      "Integra información dispersa.",
      "Puede justificar respuestas.",
    ],
    necesita: ["Profundizar en lectura crítica.", "Ampliar argumentación."],
    dificultades:
      "Presenta dificultad para interpretar símbolos complejos sin guía; distinguir entre interpretación fundamentada y opinión personal; realizar lecturas simbólicas sin perder anclaje en el texto.",
    fortalezas:
      "Puede comprender el sentido global del texto; identificar conflicto, transformación y desenlace; integrar información de diferentes partes del texto; evaluar opciones de respuesta a partir del significado general; proponer títulos, ideas centrales o mensajes con sustento textual.",
    intervencionDocente: [
      "Justificación escrita de respuestas.",
      "Comparación entre textos.",
      "Identificación de intención.",
    ],
    meta: "Profundizar lectura global.",
    estrategiasEstudiante: [
      "Justificar opiniones con fragmentos del texto.",
      "Comparar decisiones de personajes.",
      "Preguntarse: ¿Estoy de acuerdo? ¿Por qué?",
      "Relacionar texto con situaciones reales.",
      "Identificar tema, conflicto o idea central.",
      "Proponer títulos alternativos y explicarlos.",
      "Comparar inicio y final del texto.",
      "Distinguir hechos de interpretaciones.",
    ],
    estrategiasDocente: [
      "Guiar la argumentación estructurada.",
      "Modelar cómo se evalúa una postura.",
      "Fomentar pequeños debates guiados.",
      "Pedir citas textuales en respuestas críticas.",
      "Seguir realizando lectura modelada.",
      "Continuar implementando estrategias de prelectura, durante la lectura y después de la lectura.",
      "Proponer actividades de discusión guiada.",
      "Realizar trabajo áulico con intención comunicativa.",
      "Formular preguntas de sentido global («¿qué nos quiere decir el texto?»).",
      "Trabajar cierres, mensajes y transformaciones.",
      "Usar textos completos, no solo fragmentos.",
    ],
    estrategiasPadres: [
      "Conversar sobre decisiones de personajes.",
      "Preguntar: ¿Tú qué hubieras hecho?",
      "Escuchar argumentos sin imponer opinión.",
      "Conversar sobre «qué trata el texto en general».",
      "Relacionar el texto con experiencias propias.",
      "Fomentar la explicación oral con sustento.",
    ],
  },
  {
    nivel: 4,
    titulo: "Lector Estratégico",
    rango: "27–30 aciertos",
    notaTecnica:
      "Sus resultados deben mostrar: ≥ 8/9 literal, ≥ 8/11 cercana, ≥ 6/8 profunda y 2/2 crítico-simbólico. Este nivel NO significa que el estudiante ya argumenta de forma autónoma, sino que está listo para transitar hacia la comprensión crítico-interpretativa formal.",
    perfil: [
      "Integra información compleja.",
      "Identifica y maneja estructura global del texto.",
      "Identifica implicaciones simbólicas.",
      "Realiza lectura autorregulada.",
      "Reconoce intención autoral.",
      "Elige posturas valorativas correctas cuando se le ofrecen.",
    ],
    necesita: [
      "Mayor exposición a textos complejos.",
      "Participar en dinámicas de debate y producción crítica.",
    ],
    dificultades:
      "Debe seguir fortaleciendo la argumentación escrita abierta (fuera del alcance del instrumento); la explicitación consciente de sus procesos interpretativos para desarrollar argumentación propia, intertextualizar y profundizar en análisis simbólico autónomo. No ha demostrado si puede argumentar si no se le brindan opciones. No ha demostrado si puede sostener postura escrita extensa.",
    fortalezas:
      "El estudiante en este nivel tiene alta consistencia cognitiva. Ha desarrollado pensamiento articulado, por lo que está preparado para producción crítica. También está listo para profundizar en la interpretación de símbolos, metáforas o acciones como portadoras de significado; elegir la interpretación más sólida entre varias opciones cerradas; relacionar el texto con dilemas éticos o humanos sin salir del texto; sostener una lectura crítica controlada, basada en evidencias y comprender implicaciones profundas del relato.",
    intervencionDocente: [
      "Practicar el debate socrático.",
      "Fomentar el ensayo argumentativo.",
      "Trabajar análisis simbólico complejo.",
    ],
    meta: "Consolidar el pensamiento crítico-simbólico.",
    estrategiasEstudiante: [
      "Identificar qué representa un elemento del texto.",
      "Buscar mensajes profundos.",
      "Explorar significados múltiples.",
      "Escribir interpretaciones propias justificadas.",
      "Interpretar símbolos, acciones o finales con sustento textual.",
      "Elegir la interpretación más sólida entre opciones.",
      "Argumentar por qué una opción es mejor que otra.",
      "Cuestionar lo que se lee.",
    ],
    estrategiasDocente: [
      "Introducir análisis de símbolos progresivamente.",
      "Enseñar que puede haber varias interpretaciones válidas.",
      "Solicitar un sustento textual siempre.",
      "Enseñar a distinguir interpretación de opinión.",
      "Realizar seminarios socráticos.",
      "Promover el análisis intertextual.",
    ],
    estrategiasPadres: [
      "Después de una lectura preguntar: ¿Qué crees que quiso decir el autor?",
      "Relacionar lectura con valores o experiencias.",
      "Conversar sobre «qué representa» una acción o final.",
      "Pedir siempre que expliquen con base en el texto.",
      "Evitar juicios morales sin lectura previa.",
      "Conversar sobre qué opina del texto.",
    ],
  },
];

/** Guía para padres - Preguntas por nivel (legacy, se mantiene por compatibilidad) */
export const GUIA_PADRES: PreguntaPadres[] = [
  { nivel: 1, preguntas: ["¿Qué pasó primero?", "¿Quién hizo qué?", "¿Qué ocurrió después?"] },
  { nivel: 2, preguntas: ["¿Por qué pasó eso?", "¿Qué problema enfrenta el personaje?", "¿Qué quiere decir el autor?"] },
  { nivel: 3, preguntas: ["¿Cuál es el mensaje?", "¿Qué cambiarías del texto?", "¿Qué intención tiene el autor?"] },
  { nivel: 4, preguntas: ["¿Estás de acuerdo con el autor?", "¿Qué simboliza…?", "¿Qué relación tiene con la vida real?"] },
];

/** Guía para madres y/o padres RAF (cuidadores RAF) - Contenido completo */
export const GUIA_PADRES_RAF: GuiaPadresNivel[] = [
  {
    nivel: 1,
    nombre: "Lector Emergente (Nivel 1)",
    descripcion: "Está desarrollando comprensión básica del texto.",
    comoApoyarlo: [
      "Lean juntos en voz alta 10–15 minutos al día.",
      "Pregunte cosas simples: ¿quién aparece?, ¿qué pasó?, ¿dónde ocurrió?",
      "Ayúdele a explicar con sus propias palabras lo que entendió.",
    ],
    objetivo: "Fortalecer comprensión literal y seguridad lectora.",
  },
  {
    nivel: 2,
    nombre: "Lector con Comprensión Funcional (Nivel 2)",
    descripcion: "Comprende lo que lee y puede identificar ideas principales.",
    comoApoyarlo: [
      "Pregunte: ¿por qué ocurrió eso?, ¿qué crees que pasará después?",
      "Pídale que resuma la lectura en pocas oraciones.",
      "Relacionen lo leído con situaciones reales.",
    ],
    objetivo: "Desarrollar inferencia y conexión de ideas.",
  },
  {
    nivel: 3,
    nombre: "Lector Interpretativo (Nivel 3)",
    descripcion: "Puede explicar intenciones, emociones y mensajes del texto.",
    comoApoyarlo: [
      "Pregunte: ¿qué mensaje deja la historia?",
      "Invite a opinar: ¿estás de acuerdo con el personaje?, ¿por qué?",
      "Conversen sobre lo que el texto hace pensar o sentir.",
    ],
    objetivo: "Fortalecer pensamiento crítico y argumentación.",
  },
  {
    nivel: 4,
    nombre: "Lector Estratégico (Nivel 4)",
    descripcion: "Reflexiona, analiza y construye significado profundo.",
    comoApoyarlo: [
      "Anime a comparar textos o puntos de vista.",
      "Pregunte: ¿qué cambiarías del final?, ¿qué simboliza esta parte?",
      "Motívelo a expresar su opinión con argumentos claros.",
    ],
    objetivo: "Consolidar lectura crítica y autonomía intelectual.",
  },
];
