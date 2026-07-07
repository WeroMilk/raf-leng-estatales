import config from "./raf-config.json";

export type RafConfig = typeof config;

export const RAF_CONFIG: RafConfig = config;

/** RegExp para extraer número de escuela del CCT */
export function getCctNumeroRegex(): RegExp {
  const escaped = config.cctPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped + "(\\d{4})", "i");
}

export function getTituloApp(): string {
  return "RAF " + config.materia + " | " + config.abreviatura;
}

export function getDescripcionApp(): string {
  return "Resultados del examen diagnóstico RAF " + config.materia + " para maestros de " + config.nombrePlural + ", " + config.ciudad + ".";
}

export function getManifestDescription(): string {
  return "Resultados RAF " + config.materia + " - " + config.nombrePlural + " Hermosillo";
}
