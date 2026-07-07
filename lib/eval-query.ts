import type { EvalModo } from "@/types/raf";

export function parseEvalParam(value?: string | string[] | null): EvalModo {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "aterrizaje2026" || raw === "comparar") return raw;
  return "despegue2025";
}

export function isComparativa(evalModo: EvalModo): boolean {
  return evalModo === "comparar";
}

/** Añade o reemplaza ?eval= en una ruta, preservando otros query params del href base */
export function appendEvalParam(href: string, evalModo: EvalModo): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  if (evalModo === "despegue2025") {
    params.delete("eval");
  } else {
    params.set("eval", evalModo);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Combina zona y eval en query string */
export function buildQueryString(opts: {
  evalModo?: EvalModo;
  zona?: number[];
  extra?: Record<string, string | undefined>;
}): string {
  const params = new URLSearchParams();
  if (opts.evalModo && opts.evalModo !== "despegue2025") {
    params.set("eval", opts.evalModo);
  }
  opts.zona?.forEach((z) => params.append("zona", String(z)));
  if (opts.extra) {
    for (const [k, v] of Object.entries(opts.extra)) {
      if (v != null && v !== "") params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function withEvalAndParams(
  path: string,
  evalModo: EvalModo,
  extra?: Record<string, string | undefined>
): string {
  return `${path}${buildQueryString({ evalModo, extra })}`;
}

/** Ruta a lista de alumnos por nivel (colocación), con filtros opcionales */
export function hrefPorNivelAlumnos(opts: {
  nivel: number;
  evalModo?: EvalModo;
  cct?: string;
  grupo?: string;
  zona?: number[];
  origen?: "comparar" | "escuela";
}): string {
  return `/por-nivel${buildQueryString({
    evalModo: opts.evalModo ?? "despegue2025",
    zona: opts.zona,
    extra: {
      nivel: String(opts.nivel),
      vista: "colocacion",
      cct: opts.cct,
      grupo: opts.grupo,
      origen: opts.origen,
    },
  })}`;
}
