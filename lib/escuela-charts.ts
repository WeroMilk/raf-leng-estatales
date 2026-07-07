import type { EscuelaResumen, GrupoResumen } from "@/types/raf";
import type { ResumenNiveles } from "@/lib/comparativa";

/** Convierte conteos en un EscuelaResumen mínimo para ChartPastelDistribucion. */
export function countsToEscuelaResumen(
  counts: Pick<ResumenNiveles, "total" | "nivel1" | "nivel2" | "nivel3" | "nivel4">,
  cct = ""
): EscuelaResumen {
  return {
    cct,
    totalEstudiantes: counts.total,
    porcentajesReactivos: [],
    nivel1: counts.nivel1,
    nivel2: counts.nivel2,
    nivel3: counts.nivel3,
    nivel4: counts.nivel4,
    grupos: [],
  };
}

export function grupoToEscuelaResumen(grupo: GrupoResumen, cct = ""): EscuelaResumen {
  return countsToEscuelaResumen(
    {
      total: grupo.total,
      nivel1: grupo.nivel1 ?? 0,
      nivel2: grupo.nivel2 ?? 0,
      nivel3: grupo.nivel3 ?? 0,
      nivel4: grupo.nivel4 ?? 0,
    },
    cct
  );
}

export function resumenToEscuelaResumen(resumen: ResumenNiveles, cct = ""): EscuelaResumen {
  return countsToEscuelaResumen(resumen, cct);
}
