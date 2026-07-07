import { normalizeNombre } from "@/lib/comparativa";
import { appendEvalParam } from "@/lib/eval-query";
import type { EvalModo } from "@/types/raf";

export function toAlumnoSlug(apellido: string, nombre: string): string {
  return normalizeNombre(apellido, nombre).replace(/\s+/g, "-");
}

export function hrefAlumno(
  cct: string,
  grupo: string,
  apellido: string,
  nombre: string,
  evalModo: EvalModo = "despegue2025"
): string {
  const slug = toAlumnoSlug(apellido, nombre);
  const base = `/alumno/${encodeURIComponent(cct)}/${encodeURIComponent(grupo)}/${encodeURIComponent(slug)}`;
  return appendEvalParam(base, evalModo);
}
