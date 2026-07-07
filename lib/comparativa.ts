import type {
  AlumnoRAF,
  EscuelaResumen,
  EvaluacionId,
  NivelLenguaje,
} from "@/types/raf";

export interface ResumenNiveles {
  total: number;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  nivel4: number;
  pctN1: number;
  pctN2: number;
  pctN3: number;
  pctN4: number;
}

export interface DeltaNiveles {
  total: number;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  nivel4: number;
}

type AlumnoComparativoBase = Pick<
  AlumnoRAF,
  | "nombre"
  | "apellido"
  | "grupo"
  | "porcentaje"
  | "nivelGeneral"
  | "porcentajeNivel1"
  | "porcentajeNivel2"
  | "porcentajeNivel3"
  | "porcentajeNivel4"
>;

export interface AlumnoComparativo {
  key: string;
  nombre: string;
  apellido: string;
  grupo: string;
  cct?: string;
  despegue2025?: AlumnoComparativoBase;
  aterrizaje2026?: AlumnoComparativoBase;
  deltaNivel: number | null;
  deltaPorcentaje: number | null;
  soloEn?: EvaluacionId;
}

type RowAlumnoCct = { alumno: AlumnoComparativoBase; cct: string };

export interface GrupoComparativo {
  nombre: string;
  despegue2025?: { total: number; nivel1: number; nivel2: number; nivel3: number; nivel4: number };
  aterrizaje2026?: { total: number; nivel1: number; nivel2: number; nivel3: number; nivel4: number };
  deltaN3: number | null;
}

export function resumenDesdeEscuelas(escuelas: EscuelaResumen[]): ResumenNiveles {
  const total = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const nivel1 = escuelas.reduce((s, e) => s + (e.nivel1 ?? 0), 0);
  const nivel2 = escuelas.reduce((s, e) => s + (e.nivel2 ?? 0), 0);
  const nivel3 = escuelas.reduce((s, e) => s + (e.nivel3 ?? 0), 0);
  const nivel4 = escuelas.reduce((s, e) => s + (e.nivel4 ?? 0), 0);
  return {
    total,
    nivel1,
    nivel2,
    nivel3,
    nivel4,
    pctN1: total ? Math.round((nivel1 / total) * 100) : 0,
    pctN2: total ? Math.round((nivel2 / total) * 100) : 0,
    pctN3: total ? Math.round((nivel3 / total) * 100) : 0,
    pctN4: total ? Math.round((nivel4 / total) * 100) : 0,
  };
}

export function resumenDesdeEscuela(escuela: EscuelaResumen): ResumenNiveles {
  return resumenDesdeEscuelas([escuela]);
}

export function calcularDelta(a: ResumenNiveles, b: ResumenNiveles): DeltaNiveles {
  return {
    total: b.total - a.total,
    nivel1: b.nivel1 - a.nivel1,
    nivel2: b.nivel2 - a.nivel2,
    nivel3: b.nivel3 - a.nivel3,
    nivel4: b.nivel4 - a.nivel4,
  };
}

export function normalizeNombre(apellido: string, nombre: string): string {
  return `${apellido} ${nombre}`.trim().toLowerCase().replace(/\s+/g, " ");
}

export function emparejarAlumnosGrupo(
  alumnos2025: AlumnoRAF[],
  alumnos2026: AlumnoRAF[]
): AlumnoComparativo[] {
  const map2025 = new Map<string, AlumnoRAF>();
  const map2026 = new Map<string, AlumnoRAF>();

  for (const a of alumnos2025) {
    map2025.set(normalizeNombre(a.apellido, a.nombre), a);
  }
  for (const a of alumnos2026) {
    map2026.set(normalizeNombre(a.apellido, a.nombre), a);
  }

  const keys = new Set([...map2025.keys(), ...map2026.keys()]);
  const out: AlumnoComparativo[] = [];

  for (const key of keys) {
    const d25 = map2025.get(key);
    const d26 = map2026.get(key);
    const ref = d25 ?? d26!;
    let deltaNivel: number | null = null;
    let deltaPorcentaje: number | null = null;
    let soloEn: EvaluacionId | undefined;

    if (d25 && d26) {
      deltaNivel = d26.nivelGeneral - d25.nivelGeneral;
      deltaPorcentaje = Math.round((d26.porcentaje - d25.porcentaje) * 10) / 10;
    } else if (d25) {
      soloEn = "despegue2025";
    } else {
      soloEn = "aterrizaje2026";
    }

    out.push({
      key,
      nombre: ref.nombre,
      apellido: ref.apellido,
      grupo: ref.grupo,
      despegue2025: d25,
      aterrizaje2026: d26,
      deltaNivel,
      deltaPorcentaje,
      soloEn,
    });
  }

  return out.sort((a, b) => {
    const na = `${a.apellido} ${a.nombre}`.trim().toLowerCase();
    const nb = `${b.apellido} ${b.nombre}`.trim().toLowerCase();
    return na.localeCompare(nb);
  });
}

/** Empareja alumnos en un nivel concreto (colocación): unión 2025/2026, datos completos por nombre */
export function emparejarAlumnosPorNivel(
  enNivel2025: RowAlumnoCct[],
  enNivel2026: RowAlumnoCct[],
  todos2025: RowAlumnoCct[],
  todos2026: RowAlumnoCct[],
  nivel: NivelLenguaje
): AlumnoComparativo[] {
  const mapAll2025 = new Map<string, RowAlumnoCct>();
  const mapAll2026 = new Map<string, RowAlumnoCct>();

  for (const r of todos2025) {
    mapAll2025.set(normalizeNombre(r.alumno.apellido, r.alumno.nombre), r);
  }
  for (const r of todos2026) {
    mapAll2026.set(normalizeNombre(r.alumno.apellido, r.alumno.nombre), r);
  }

  const keys = new Set<string>();
  for (const r of enNivel2025) keys.add(normalizeNombre(r.alumno.apellido, r.alumno.nombre));
  for (const r of enNivel2026) keys.add(normalizeNombre(r.alumno.apellido, r.alumno.nombre));

  const out: AlumnoComparativo[] = [];

  for (const key of keys) {
    const row25 = mapAll2025.get(key);
    const row26 = mapAll2026.get(key);
    const d25 = row25?.alumno;
    const d26 = row26?.alumno;
    const ref = d25 ?? d26!;
    let deltaNivel: number | null = null;
    let deltaPorcentaje: number | null = null;
    let soloEn: EvaluacionId | undefined;

    if (d25 && d26) {
      deltaNivel = d26.nivelGeneral - d25.nivelGeneral;
      deltaPorcentaje = Math.round((d26.porcentaje - d25.porcentaje) * 10) / 10;
    } else if (d25) {
      soloEn = "despegue2025";
    } else {
      soloEn = "aterrizaje2026";
    }

    out.push({
      key,
      nombre: ref.nombre,
      apellido: ref.apellido,
      grupo: ref.grupo,
      cct: row25?.cct ?? row26?.cct,
      despegue2025: d25,
      aterrizaje2026: d26,
      deltaNivel,
      deltaPorcentaje,
      soloEn,
    });
  }

  return out.sort((a, b) => {
    const na = `${a.apellido} ${a.nombre}`.trim().toLowerCase();
    const nb = `${b.apellido} ${b.nombre}`.trim().toLowerCase();
    return na.localeCompare(nb);
  });
}

export function compararGrupos(
  escuela2025: EscuelaResumen | null,
  escuela2026: EscuelaResumen | null
): GrupoComparativo[] {
  const nombres = new Set<string>();
  escuela2025?.grupos.forEach((g) => nombres.add(g.nombre));
  escuela2026?.grupos.forEach((g) => nombres.add(g.nombre));

  return Array.from(nombres)
    .sort()
    .map((nombre) => {
      const g25 = escuela2025?.grupos.find((g) => g.nombre === nombre);
      const g26 = escuela2026?.grupos.find((g) => g.nombre === nombre);
      const n3_25 = g25?.nivel3 ?? 0;
      const n3_26 = g26?.nivel3 ?? 0;
      return {
        nombre,
        despegue2025: g25
          ? { total: g25.total, nivel1: g25.nivel1, nivel2: g25.nivel2, nivel3: g25.nivel3, nivel4: g25.nivel4 }
          : undefined,
        aterrizaje2026: g26
          ? { total: g26.total, nivel1: g26.nivel1, nivel2: g26.nivel2, nivel3: g26.nivel3, nivel4: g26.nivel4 }
          : undefined,
        deltaN3: g25 && g26 ? n3_26 - n3_25 : null,
      };
    });
}

export function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function deltaClass(delta: number | null): string {
  if (delta == null) return "delta-neutral";
  if (delta > 0) return "delta-up";
  if (delta < 0) return "delta-down";
  return "delta-neutral";
}

export function nivelLabel(n: NivelLenguaje): string {
  return `N${n}`;
}
