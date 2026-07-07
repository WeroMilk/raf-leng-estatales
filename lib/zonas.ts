import { getCctNumeroRegex } from "./raf-config";

/**
 * Mapeo de escuelas (por número) a zona.
 * Poblar cuando se conozca la asignación escuela → zona.
 */
export const ESCUELA_A_ZONA: Record<number, number> = {};

/** Zonas que tienen al menos una escuela en el sistema */
export const ZONAS_CON_ESCUELAS = [...new Set(Object.values(ESCUELA_A_ZONA))].sort((a, b) => a - b);

/** Extrae el número de escuela del CCT */
export function getNumeroEscuela(cct: string): number | null {
  const m = cct.match(getCctNumeroRegex());
  if (!m) return null;
  const num = parseInt(m[1], 10);
  return num;
}

/** Obtiene la zona de una escuela por su CCT */
export function getZonaPorCct(cct: string): number | null {
  const num = getNumeroEscuela(cct);
  if (num == null) return null;
  return ESCUELA_A_ZONA[num] ?? null;
}

/** Filtra escuelas por zona(s): si zonas está vacío, devuelve todas */
export function filtrarEscuelasPorZona<T extends { cct: string }>(
  escuelas: T[],
  zonas: number[]
): T[] {
  if (zonas.length === 0) return escuelas;
  return escuelas.filter((e) => {
    const z = getZonaPorCct(e.cct);
    return z != null && zonas.includes(z);
  });
}

/** Parsea ?zona=1&zona=3 desde searchParams o page params */
export function parseZonasParam(z?: string | string[] | null): number[] {
  if (!z) return [];
  const arr = Array.isArray(z) ? z : [z];
  return arr
    .map((x) => parseInt(String(x), 10))
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);
}

/** Etiqueta compacta para el selector de zonas */
export function etiquetaFiltroZonas(zonas: number[]): string {
  if (zonas.length === 1) return `Zona ${zonas[0]}`;
  return "Zonas";
}
