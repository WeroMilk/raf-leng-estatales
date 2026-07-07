import type { EvaluacionId, EscuelaResumen, NivelLenguaje } from "@/types/raf";
import { getEscuelaSync, getEscuelasSync } from "@/lib/data-server";

export const NUM_REACTIVOS = 30;

/** Nivel al que pertenece cada reactivo (instrumento RAF Lenguaje) */
export const NIVEL_POR_REACTIVO: Record<number, NivelLenguaje> = {
  1: 1, 2: 3, 3: 1, 4: 1, 5: 2, 6: 1, 7: 2, 8: 3, 9: 1, 10: 2, 11: 2, 12: 2, 13: 3,
  14: 2, 15: 2, 16: 1, 17: 3, 18: 2, 19: 2, 20: 2, 21: 2, 22: 3, 23: 2, 24: 2, 25: 3,
  26: 3, 27: 3, 28: 3, 29: 4, 30: 4,
};

export interface ReactivoStats {
  num: number;
  nivel: NivelLenguaje;
  pctAcierto: number;
  aciertos: number;
  total: number;
}

export interface ReactivoComparativo {
  num: number;
  nivel: NivelLenguaje;
  pct2025: number;
  pct2026: number;
  aciertos2025: number;
  total2025: number;
  aciertos2026: number;
  total2026: number;
  deltaPct: number;
}

function aggregateFromEscuelas(escuelas: EscuelaResumen[]): ReactivoStats[] {
  const aciertos = new Array(NUM_REACTIVOS).fill(0);
  const totales = new Array(NUM_REACTIVOS).fill(0);

  for (const esc of escuelas) {
    for (const g of esc.grupos) {
      for (const al of g.alumnos) {
        for (let i = 0; i < NUM_REACTIVOS; i++) {
          if (i >= al.respuestas.length) continue;
          totales[i]++;
          if (al.respuestas[i] === "C") aciertos[i]++;
        }
      }
    }
  }

  return Array.from({ length: NUM_REACTIVOS }, (_, i) => {
    const total = totales[i] || 0;
    const ac = aciertos[i] || 0;
    return {
      num: i + 1,
      nivel: NIVEL_POR_REACTIVO[i + 1],
      aciertos: ac,
      total,
      pctAcierto: total ? Math.round((ac / total) * 1000) / 10 : 0,
    };
  });
}

export function getReactivosGeneralesSync(evalId: EvaluacionId): ReactivoStats[] {
  return aggregateFromEscuelas(getEscuelasSync(evalId));
}

const generalCache = new Map<EvaluacionId, ReactivoStats[]>();
const escuelaCache = new Map<string, ReactivoStats[]>();

function escuelaCacheKey(evalId: EvaluacionId, cct: string) {
  return `${evalId}:${cct}`;
}

export function getReactivosGeneralesCached(evalId: EvaluacionId): ReactivoStats[] {
  const cached = generalCache.get(evalId);
  if (cached) return cached;
  const stats = getReactivosGeneralesSync(evalId);
  generalCache.set(evalId, stats);
  return stats;
}

export function getReactivosEscuelaSync(cct: string, evalId: EvaluacionId): ReactivoStats[] | null {
  const key = escuelaCacheKey(evalId, cct);
  const cached = escuelaCache.get(key);
  if (cached) return cached;

  const esc = getEscuelaSync(cct, evalId);
  if (!esc) return null;
  const stats = aggregateFromEscuelas([esc]);
  escuelaCache.set(key, stats);
  return stats;
}

export type ReactivosPorEscuela = { cct: string; stats: ReactivoStats[] };

export type ReactivosComparativaData = {
  general: ReactivoComparativo[];
  porEscuela: { cct: string; stats: ReactivoComparativo[] }[];
};

const comparativaCache = new Map<string, ReactivosComparativaData>();

function buildPorEscuela(evalId: EvaluacionId, soloCct?: string): ReactivosPorEscuela[] {
  const escuelas = soloCct
    ? getEscuelasSync(evalId).filter((e) => e.cct === soloCct)
    : getEscuelasSync(evalId);

  const out: ReactivosPorEscuela[] = [];
  for (const { cct } of escuelas) {
    const stats = getReactivosEscuelaSync(cct, evalId);
    if (stats) out.push({ cct, stats });
  }
  return out;
}

/** Comparativa general + por escuela (cacheada en memoria del servidor). */
export function getReactivosComparativaSync(soloCct?: string): ReactivosComparativaData {
  const key = soloCct ?? "__all__";
  const cached = comparativaCache.get(key);
  if (cached) return cached;

  const porEscuela2025 = buildPorEscuela("despegue2025", soloCct);
  const porEscuela2026 = buildPorEscuela("aterrizaje2026", soloCct);

  const general2025 = soloCct
    ? (porEscuela2025[0]?.stats ?? getReactivosGeneralesCached("despegue2025"))
    : getReactivosGeneralesCached("despegue2025");
  const general2026 = soloCct
    ? (porEscuela2026[0]?.stats ?? getReactivosGeneralesCached("aterrizaje2026"))
    : getReactivosGeneralesCached("aterrizaje2026");

  const map2025 = new Map(porEscuela2025.map((e) => [e.cct, e.stats]));
  const map2026 = new Map(porEscuela2026.map((e) => [e.cct, e.stats]));
  const ccts = new Set([...map2025.keys(), ...map2026.keys()]);

  const data: ReactivosComparativaData = {
    general: mergeReactivosComparativa(general2025, general2026),
    porEscuela: Array.from(ccts)
      .map((cct) => ({
        cct,
        stats: mergeReactivosComparativa(
          map2025.get(cct) ?? general2025,
          map2026.get(cct) ?? general2026
        ),
      }))
      .sort((a, b) => a.cct.localeCompare(b.cct)),
  };

  comparativaCache.set(key, data);
  return data;
}

export function mergeReactivosComparativa(
  stats2025: ReactivoStats[],
  stats2026: ReactivoStats[]
): ReactivoComparativo[] {
  return Array.from({ length: NUM_REACTIVOS }, (_, i) => {
    const r25 = stats2025[i];
    const r26 = stats2026[i];
    const pct2025 = r25?.pctAcierto ?? 0;
    const pct2026 = r26?.pctAcierto ?? 0;
    return {
      num: i + 1,
      nivel: NIVEL_POR_REACTIVO[i + 1],
      pct2025,
      pct2026,
      aciertos2025: r25?.aciertos ?? 0,
      total2025: r25?.total ?? 0,
      aciertos2026: r26?.aciertos ?? 0,
      total2026: r26?.total ?? 0,
      deltaPct: Math.round((pct2026 - pct2025) * 10) / 10,
    };
  });
}

export function pctColor(pct: number): string {
  if (pct >= 80) return "var(--nivel-4, #A8D4E8)";
  if (pct >= 60) return "var(--nivel-3, #A8DDB5)";
  if (pct >= 40) return "var(--nivel-2, #FAD4A0)";
  return "var(--nivel-1, #F4A6A6)";
}
