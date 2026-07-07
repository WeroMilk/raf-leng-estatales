import type { EscuelaResumen, ResultadosRAF } from "@/types/raf";
import nombresEscuelas from "@/data/nombres-escuelas.json";

const NOMBRES_POR_CCT = nombresEscuelas as Record<string, string>;

export function getNombreEscuela(cct: string): string | undefined {
  return NOMBRES_POR_CCT[cct];
}

export function aplicarNombresEscuelas(data: ResultadosRAF): ResultadosRAF {
  return {
    ...data,
    escuelas: data.escuelas.map((esc) => aplicarNombreEscuela(esc)),
  };
}

export function aplicarNombreEscuela(esc: EscuelaResumen): EscuelaResumen {
  const nombre = NOMBRES_POR_CCT[esc.cct];
  if (!nombre) return esc;
  return {
    ...esc,
    buscador: { ...esc.buscador, nombre },
  };
}
