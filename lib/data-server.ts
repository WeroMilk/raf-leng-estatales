import type {
  ResultadosMultiRAF,
  EscuelaResumen,
  NivelLenguaje,
  EvaluacionId,
  EvaluacionRAF,
  EvalModo,
  AlumnoRAF,
} from "@/types/raf";
import { toAlumnoSlug } from "@/lib/alumno-link";
import { DEFAULT_EVALUACION } from "@/types/raf";
import { fixObjectStrings } from "@/lib/utf8-fix";
import { aplicarNombresEscuelas } from "@/lib/nombres-escuelas";
import {
  emparejarAlumnosGrupo,
  compararGrupos,
  resumenDesdeEscuela,
  normalizeNombre,
  type AlumnoComparativo,
  type GrupoComparativo,
  type ResumenNiveles,
} from "@/lib/comparativa";

import resultadosData from "@/data/resultados.json";

export type RowNivel = {
  alumno: {
    nombre: string;
    apellido: string;
    grupo: string;
    porcentaje: number;
    nivelGeneral: NivelLenguaje;
    porcentajeNivel1: number;
    porcentajeNivel2: number;
    porcentajeNivel3: number;
    porcentajeNivel4: number;
  };
  cct: string;
};

function normalizeMultiData(input: unknown): ResultadosMultiRAF {
  const data = fixObjectStrings(input as ResultadosMultiRAF);

  const dataRecord = data as unknown as Record<string, unknown>;
  // Migración: formato antiguo { escuelas, generado }
  if ("escuelas" in dataRecord && !("evaluaciones" in dataRecord)) {
    const legacy = dataRecord as { escuelas: EscuelaResumen[]; generado: string };
    return {
      evaluaciones: {
        despegue2025: {
          id: "despegue2025",
          nombre: "RAF Despegue 2025",
          nombreCorto: "Despegue 2025",
          escuelas: aplicarNombresEscuelas({ escuelas: legacy.escuelas, generado: legacy.generado }).escuelas,
          generado: legacy.generado,
        },
      },
    };
  }

  const evaluaciones: Partial<Record<EvaluacionId, EvaluacionRAF>> = {};
  for (const [id, ev] of Object.entries(data.evaluaciones ?? {})) {
    if (!ev) continue;
    const escuelas = aplicarNombresEscuelas({ escuelas: ev.escuelas, generado: ev.generado }).escuelas;
    evaluaciones[id as EvaluacionId] = { ...ev, escuelas };
  }
  return { evaluaciones };
}

function loadMulti(): ResultadosMultiRAF {
  try {
    return normalizeMultiData(resultadosData);
  } catch {
    return { evaluaciones: {} };
  }
}

export function getEvaluacionesSync(): EvaluacionRAF[] {
  const { evaluaciones } = loadMulti();
  return Object.values(evaluaciones).filter(Boolean) as EvaluacionRAF[];
}

export function getEvaluacionSync(id: EvaluacionId): EvaluacionRAF | null {
  return loadMulti().evaluaciones[id] ?? null;
}

export function getResultadosSync(evalId: EvaluacionId = DEFAULT_EVALUACION): {
  escuelas: EscuelaResumen[];
  generado: string;
  evaluacion: EvaluacionRAF | null;
} {
  const ev = getEvaluacionSync(evalId);
  return {
    escuelas: ev?.escuelas ?? [],
    generado: ev?.generado ?? new Date().toISOString(),
    evaluacion: ev,
  };
}

export function getEscuelaSync(cct: string, evalId: EvaluacionId = DEFAULT_EVALUACION): EscuelaResumen | null {
  const { escuelas } = getResultadosSync(evalId);
  return escuelas.find((e) => e.cct === cct) ?? null;
}

export function getEscuelasSync(evalId: EvaluacionId = DEFAULT_EVALUACION): EscuelaResumen[] {
  return getResultadosSync(evalId).escuelas;
}

export function getEscuelaComparativaSync(cct: string): {
  despegue2025: EscuelaResumen | null;
  aterrizaje2026: EscuelaResumen | null;
  resumen2025: ResumenNiveles | null;
  resumen2026: ResumenNiveles | null;
  grupos: GrupoComparativo[];
} {
  const e25 = getEscuelaSync(cct, "despegue2025");
  const e26 = getEscuelaSync(cct, "aterrizaje2026");
  return {
    despegue2025: e25,
    aterrizaje2026: e26,
    resumen2025: e25 ? resumenDesdeEscuela(e25) : null,
    resumen2026: e26 ? resumenDesdeEscuela(e26) : null,
    grupos: compararGrupos(e25, e26),
  };
}

export function getGrupoComparativoSync(
  cct: string,
  grupo: string
): {
  escuela2025: EscuelaResumen | null;
  escuela2026: EscuelaResumen | null;
  alumnos: AlumnoComparativo[];
} {
  const e25 = getEscuelaSync(cct, "despegue2025");
  const e26 = getEscuelaSync(cct, "aterrizaje2026");
  const g25 = e25?.grupos.find((g) => g.nombre === grupo);
  const g26 = e26?.grupos.find((g) => g.nombre === grupo);
  return {
    escuela2025: e25,
    escuela2026: e26,
    alumnos: emparejarAlumnosGrupo(g25?.alumnos ?? [], g26?.alumnos ?? []),
  };
}

/** Escuelas unificadas para listado comparativo (union de CCTs) */
export function getEscuelasUnionSync(): {
  cct: string;
  despegue2025?: EscuelaResumen;
  aterrizaje2026?: EscuelaResumen;
}[] {
  const map = new Map<string, { cct: string; despegue2025?: EscuelaResumen; aterrizaje2026?: EscuelaResumen }>();
  for (const e of getEscuelasSync("despegue2025")) {
    map.set(e.cct, { cct: e.cct, despegue2025: e });
  }
  for (const e of getEscuelasSync("aterrizaje2026")) {
    const cur = map.get(e.cct) ?? { cct: e.cct };
    cur.aterrizaje2026 = e;
    map.set(e.cct, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.cct.localeCompare(b.cct));
}

const UMBRAL_NECESITA_APOYO = 50;

function collectAlumnos(evalId: EvaluacionId, filterFn: (a: EscuelaResumen["grupos"][0]["alumnos"][0]) => boolean): RowNivel[] {
  const escuelas = getEscuelasSync(evalId);
  const out: RowNivel[] = [];
  for (const esc of escuelas) {
    for (const g of esc.grupos) {
      for (const a of g.alumnos) {
        if (filterFn(a)) {
          out.push({
            alumno: {
              nombre: a.nombre,
              apellido: a.apellido,
              grupo: a.grupo,
              porcentaje: a.porcentaje,
              nivelGeneral: a.nivelGeneral,
              porcentajeNivel1: a.porcentajeNivel1,
              porcentajeNivel2: a.porcentajeNivel2,
              porcentajeNivel3: a.porcentajeNivel3,
              porcentajeNivel4: a.porcentajeNivel4,
            },
            cct: esc.cct,
          });
        }
      }
    }
  }
  return out;
}

export function getAlumnosPorNivelGeneralSync(
  nivel: NivelLenguaje,
  evalId: EvaluacionId = DEFAULT_EVALUACION
): RowNivel[] {
  return collectAlumnos(evalId, (a) => a.nivelGeneral === nivel);
}

export function getAlumnosPorNivelSync(
  nivel: NivelLenguaje,
  evalId: EvaluacionId = DEFAULT_EVALUACION
): RowNivel[] {
  return collectAlumnos(evalId, (a) => {
    const pct =
      nivel === 1
        ? a.porcentajeNivel1
        : nivel === 2
          ? a.porcentajeNivel2
          : nivel === 3
            ? a.porcentajeNivel3
            : a.porcentajeNivel4;
    return pct < UMBRAL_NECESITA_APOYO;
  });
}

export function getAlumnosOrdenadosPorNivelReforzarSync(
  evalId: EvaluacionId = DEFAULT_EVALUACION
): RowNivel[] {
  const escuelas = getEscuelasSync(evalId);
  const out: RowNivel[] = [];
  for (const esc of escuelas) {
    for (const g of esc.grupos) {
      for (const a of g.alumnos) {
        out.push({
          alumno: {
            nombre: a.nombre,
            apellido: a.apellido,
            grupo: a.grupo,
            porcentaje: a.porcentaje,
            nivelGeneral: a.nivelGeneral,
            porcentajeNivel1: a.porcentajeNivel1,
            porcentajeNivel2: a.porcentajeNivel2,
            porcentajeNivel3: a.porcentajeNivel3,
            porcentajeNivel4: a.porcentajeNivel4,
          },
          cct: esc.cct,
        });
      }
    }
  }
  return out.sort((a, b) => a.alumno.nivelGeneral - b.alumno.nivelGeneral);
}

export function resolveEvalId(evalModo: EvalModo): EvaluacionId {
  return evalModo === "aterrizaje2026" ? "aterrizaje2026" : "despegue2025";
}

export function getAlumnoSync(
  cct: string,
  grupo: string,
  slug: string,
  evalId: EvaluacionId = DEFAULT_EVALUACION
): AlumnoRAF | null {
  const slugNorm = decodeURIComponent(slug).toLowerCase();
  const escuela = getEscuelaSync(cct, evalId);
  const g = escuela?.grupos.find((x) => x.nombre === decodeURIComponent(grupo));
  if (!g) return null;
  return (
    g.alumnos.find((a) => toAlumnoSlug(a.apellido, a.nombre) === slugNorm) ??
    g.alumnos.find((a) => normalizeNombre(a.apellido, a.nombre).replace(/\s+/g, "-") === slugNorm) ??
    null
  );
}
