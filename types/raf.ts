/** Niveles del examen de Lenguaje (4 dimensiones) */
export type NivelLenguaje = 1 | 2 | 3 | 4;

export const NIVELES_LENGUAJE: NivelLenguaje[] = [1, 2, 3, 4];

/** Descriptores de cada nivel (Lenguaje) - Escalera cognitiva completa */
export const DESCRIPTORES_NIVEL: Record<NivelLenguaje, string> = {
  1: "Lector Emergente",
  2: "Lector con Comprensión Funcional",
  3: "Lector Interpretativo",
  4: "Lector Estratégico",
};

/** Alias para compatibilidad */
export const DESCRIPTORES_NIVEL_CORTO: Record<NivelLenguaje, string> = {
  1: "Lector Emergente",
  2: "Lector con Comprensión Funcional",
  3: "Lector Interpretativo",
  4: "Lector Estratégico",
};

/** Colores por nivel (tonos pastel: rosa, melocotón, menta, azul cielo) */
export const COLORS = {
  nivel1: "#F4A6A6",
  nivel2: "#FAD4A0",
  nivel3: "#A8DDB5",
  nivel4: "#A8D4E8",
  header: "#366092",
} as const;

export const NIVEL_COLOR: Record<NivelLenguaje, string> = {
  1: COLORS.nivel1,
  2: COLORS.nivel2,
  3: COLORS.nivel3,
  4: COLORS.nivel4,
};

export interface AlumnoRAF {
  nombre: string;
  apellido: string;
  grupo: string;
  porcentaje: number;
  /** Nivel asignado (1-4) */
  nivelGeneral: NivelLenguaje;
  /** Porcentaje por dimensión N1-N4 */
  porcentajeNivel1: number;
  porcentajeNivel2: number;
  porcentajeNivel3: number;
  porcentajeNivel4: number;
  /** Dimensión con menor % (prioridad de reforzamiento) */
  nivelReforzarMas?: NivelLenguaje;
  respuestas: string[];
}

export interface GrupoResumen {
  nombre: string;
  alumnos: AlumnoRAF[];
  porcentajesReactivos: number[];
  /** Conteo por nivel */
  nivel1: number;
  nivel2: number;
  nivel3: number;
  nivel4: number;
  /** Conteo por dimensión de refuerzo */
  nivelReforzarMas1?: number;
  nivelReforzarMas2?: number;
  nivelReforzarMas3?: number;
  nivelReforzarMas4?: number;
  total: number;
}

/** Datos opcionales del Buscador de Escuelas en Línea (SEP) para personalizar la ficha */
export interface EscuelaInfoBuscador {
  nombre?: string;
  turno?: string;
  nivelEducativo?: string;
  zona?: string;
  domicilio?: string;
  telefono?: string;
  colonia?: string;
  localidad?: string;
  municipio?: string;
}

export interface EscuelaResumen {
  cct: string;
  totalEstudiantes: number;
  porcentajesReactivos: number[];
  /** Conteo por nivel */
  nivel1: number;
  nivel2: number;
  nivel3: number;
  nivel4: number;
  /** Conteo por dimensión de refuerzo */
  nivelReforzarMas1?: number;
  nivelReforzarMas2?: number;
  nivelReforzarMas3?: number;
  nivelReforzarMas4?: number;
  grupos: GrupoResumen[];
  /** Datos del Buscador de Escuelas (nombre, domicilio, etc.) si se fusionaron */
  buscador?: EscuelaInfoBuscador;
}

export interface ResultadosRAF {
  escuelas: EscuelaResumen[];
  generado: string;
}

export type EvaluacionId = "despegue2025" | "aterrizaje2026";

export type EvalModo = EvaluacionId | "comparar";

export interface EvaluacionRAF {
  id: EvaluacionId;
  nombre: string;
  nombreCorto: string;
  escuelas: EscuelaResumen[];
  generado: string;
  parcial?: boolean;
}

export interface ResultadosMultiRAF {
  evaluaciones: Partial<Record<EvaluacionId, EvaluacionRAF>>;
}

export const EVALUACIONES_CATALOGO: Record<
  EvaluacionId,
  { nombre: string; nombreCorto: string }
> = {
  despegue2025: { nombre: "RAF Despegue 2025", nombreCorto: "Despegue 2025" },
  aterrizaje2026: { nombre: "RAF Aterrizaje 2026", nombreCorto: "Aterrizaje 2026" },
};

export const DEFAULT_EVALUACION: EvaluacionId = "despegue2025";
