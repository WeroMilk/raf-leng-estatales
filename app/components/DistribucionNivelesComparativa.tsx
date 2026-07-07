"use client";

import Link from "next/link";
import {
  COLORS,
  DESCRIPTORES_NIVEL_CORTO,
  NIVELES_LENGUAJE,
  type NivelLenguaje,
  type EvalModo,
} from "@/types/raf";
import type { ResumenNiveles } from "@/lib/comparativa";
import { calcularDelta, deltaClass, deltaLabel } from "@/lib/comparativa";
import { hrefPorNivelAlumnos } from "@/lib/eval-query";

interface LinkNivelConfig {
  evalModo?: EvalModo;
  cct?: string;
  grupo?: string;
  origen?: "comparar" | "escuela";
}

interface Props {
  resumen2025: ResumenNiveles;
  resumen2026: ResumenNiveles;
  showLabel?: boolean;
  label?: string;
  linkNivel?: LinkNivelConfig;
  className?: string;
}

export default function DistribucionNivelesComparativa({
  resumen2025,
  resumen2026,
  showLabel = false,
  label = "Distribución por nivel",
  linkNivel,
  className = "",
}: Props) {
  const delta = calcularDelta(resumen2025, resumen2026);

  return (
    <div className={`distribucion-comparativa ${className}`.trim()}>
      {showLabel && <p className="label-alumnos-por-nivel mb-1 shrink-0">{label}</p>}
      <div className="distribucion-comparativa__grid">
        {NIVELES_LENGUAJE.map((n) => {
          const color = COLORS[`nivel${n}` as keyof typeof COLORS];
          const total2025 = resumen2025[`nivel${n}` as keyof ResumenNiveles] as number;
          const total2026 = resumen2026[`nivel${n}` as keyof ResumenNiveles] as number;
          const pct2025 = resumen2025[`pctN${n}` as keyof ResumenNiveles] as number;
          const pct2026 = resumen2026[`pctN${n}` as keyof ResumenNiveles] as number;
          const d = delta[`nivel${n}` as keyof typeof delta] as number;
          const deltaCls = deltaClass(d);

          const card = (
            <div
              className="distribucion-comparativa__card card-ios"
              style={{ borderColor: `color-mix(in srgb, ${color} 35%, var(--border))` }}
            >
              <span className={`distribucion-comparativa__delta ${deltaCls} tabular-nums`}>
                {deltaLabel(d)}
              </span>
              <p className="distribucion-comparativa__nivel" style={{ color }}>
                Nivel {n}
              </p>
              <p className="distribucion-comparativa__desc">{DESCRIPTORES_NIVEL_CORTO[n]}</p>
              <div className="distribucion-comparativa__cols">
                <div className="distribucion-comparativa__col">
                  <span className="distribucion-comparativa__year distribucion-comparativa__year--2025">
                    2025
                  </span>
                  <span className="distribucion-comparativa__count tabular-nums" style={{ color }}>
                    {total2025.toLocaleString("es-MX")}
                  </span>
                  <span className="distribucion-comparativa__pct tabular-nums" style={{ color }}>
                    {pct2025}%
                  </span>
                </div>
                <span className="distribucion-comparativa__arrow" aria-hidden>
                  →
                </span>
                <div className="distribucion-comparativa__col">
                  <span className="distribucion-comparativa__year distribucion-comparativa__year--2026">
                    2026
                  </span>
                  <span className="distribucion-comparativa__count tabular-nums" style={{ color }}>
                    {total2026.toLocaleString("es-MX")}
                  </span>
                  <span className="distribucion-comparativa__pct tabular-nums" style={{ color }}>
                    {pct2026}%
                  </span>
                </div>
              </div>
            </div>
          );

          if (!linkNivel) {
            return (
              <div key={n} className="distribucion-comparativa__cell">
                {card}
              </div>
            );
          }

          return (
            <Link
              key={n}
              href={hrefPorNivelAlumnos({
                nivel: n,
                evalModo: linkNivel.evalModo ?? "comparar",
                cct: linkNivel.cct,
                grupo: linkNivel.grupo,
                origen: linkNivel.origen,
              })}
              className="link-ios distribucion-comparativa__cell rounded-xl transition-shadow hover:shadow-md"
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
