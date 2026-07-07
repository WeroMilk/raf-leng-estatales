"use client";

import Link from "next/link";
import ChartPastelDistribucion from "@/app/components/ChartPastelDistribucion";
import {
  COLORS,
  DESCRIPTORES_NIVEL,
  DESCRIPTORES_NIVEL_CORTO,
  NIVELES_LENGUAJE,
} from "@/types/raf";
import type { EscuelaResumen, EvalModo, NivelLenguaje } from "@/types/raf";
import { hrefPorNivelAlumnos } from "@/lib/eval-query";

type Size = "default" | "compact" | "mini";

function alumnosEnNivel(escuelas: EscuelaResumen[], n: NivelLenguaje): number {
  const key = `nivel${n}` as keyof EscuelaResumen;
  return escuelas.reduce((s, e) => s + ((e[key] as number) ?? 0), 0);
}

interface LinkNivelConfig {
  evalModo: EvalModo;
  cct?: string;
  grupo?: string;
  origen?: "comparar" | "escuela";
}

interface Props {
  escuelas: EscuelaResumen[];
  size?: Size;
  showLabel?: boolean;
  label?: string;
  descriptorVariant?: "full" | "short" | "none";
  linkNivel?: LinkNivelConfig;
  className?: string;
}

export default function DistribucionNivelesCharts({
  escuelas,
  size = "default",
  showLabel = false,
  label = "Distribución por nivel",
  descriptorVariant = "full",
  linkNivel,
  className = "",
}: Props) {
  const gridClass =
    size === "default"
      ? "home-charts-grid"
      : `distribucion-charts-grid distribucion-charts-grid--${size}`;

  const descriptorFor = (n: NivelLenguaje) => {
    if (descriptorVariant === "none") return "";
    if (descriptorVariant === "short") return DESCRIPTORES_NIVEL_CORTO[n];
    return DESCRIPTORES_NIVEL[n];
  };

  const chartClass =
    size === "mini"
      ? "chart-pastel-donut--mini"
      : size === "compact"
        ? "chart-pastel-donut--compact"
        : "";

  const chartVariant = size === "default" ? "donut" : "stat";

  return (
    <div className={`distribucion-charts ${className}`.trim()}>
      {showLabel && <p className="label-alumnos-por-nivel mb-1 shrink-0">{label}</p>}
      <div className={gridClass}>
        {NIVELES_LENGUAJE.map((n) => {
          const chart = (
            <ChartPastelDistribucion
              nivel={n}
              escuelas={escuelas}
              color={COLORS[`nivel${n}` as keyof typeof COLORS]}
              descriptor={descriptorFor(n)}
              variant={chartVariant}
              className={chartClass}
            />
          );

          if (!linkNivel) {
            return (
              <div key={n} className="distribucion-charts__cell">
                {chart}
              </div>
            );
          }

          return (
            <Link
              key={n}
              href={hrefPorNivelAlumnos({
                nivel: n,
                evalModo: linkNivel.evalModo,
                cct: linkNivel.cct,
                grupo: linkNivel.grupo,
                origen: linkNivel.origen,
              })}
              className="link-ios group/chart distribucion-charts__cell rounded-xl transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sonora)]"
              title={`${alumnosEnNivel(escuelas, n)} alumnos · Nivel ${n}`}
            >
              <div className="h-full w-full rounded-xl transition-shadow group-hover/chart:shadow-md">
                {chart}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
