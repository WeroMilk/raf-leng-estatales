"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NIVEL_COLOR } from "@/types/raf";
import type { EscuelaResumen } from "@/types/raf";
import { deltaClass, deltaLabel } from "@/lib/comparativa";
import { appendEvalParam } from "@/lib/eval-query";
import DistribucionNivelesCharts from "@/app/components/DistribucionNivelesCharts";

type SortOption = "numero-asc" | "numero-desc" | "delta-n3";

function getNivelConMasApoyo(escuela: EscuelaResumen): 1 | 2 | 3 | 4 {
  const n1 = escuela.nivel1 ?? 0;
  const n2 = escuela.nivel2 ?? 0;
  const n3 = escuela.nivel3 ?? 0;
  const n4 = escuela.nivel4 ?? 0;
  const max = Math.max(n1, n2, n3, n4);
  if (max === 0) return 1;
  if (n1 === max) return 1;
  if (n2 === max) return 2;
  if (n3 === max) return 3;
  return 4;
}

interface EscuelaUnion {
  cct: string;
  despegue2025?: EscuelaResumen;
  aterrizaje2026?: EscuelaResumen;
}

interface Props {
  escuelas: EscuelaUnion[];
}

export default function EscuelasComparativaContent({ escuelas }: Props) {
  const [sort, setSort] = useState<SortOption>("numero-asc");

  const sorted = useMemo(() => {
    const list = escuelas.map((item) => {
      const ref = item.despegue2025 ?? item.aterrizaje2026!;
      const n3d =
        item.despegue2025 && item.aterrizaje2026
          ? (item.aterrizaje2026.nivel3 ?? 0) - (item.despegue2025.nivel3 ?? 0)
          : null;
      return { item, ref, n3d, nivel: getNivelConMasApoyo(ref) };
    });
    if (sort === "numero-asc") return list.sort((a, b) => a.item.cct.localeCompare(b.item.cct));
    if (sort === "numero-desc") return list.sort((a, b) => b.item.cct.localeCompare(a.item.cct));
    return list.sort((a, b) => (b.n3d ?? -999) - (a.n3d ?? -999));
  }, [escuelas, sort]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 pb-6 min-w-0">
      <div className="card-ios shrink-0 space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">Ordenar</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["numero-asc", "Nº ascendente"],
              ["numero-desc", "Nº descendente"],
              ["delta-n3", "Δ N3 (mayor mejora)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSort(id)}
              className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                sort === id
                  ? "pill-sonora-active"
                  : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 content-start">
        {sorted.map(({ item, ref, n3d, nivel }, i) => {
          const color = NIVEL_COLOR[nivel];
          const nombre = ref.buscador?.nombre ?? item.cct;
          const sin2026 = !item.aterrizaje2026;
          return (
            <li
              key={item.cct}
              className={`min-w-0 animate-stagger-in ${sin2026 ? "opacity-80" : ""}`}
              style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}
            >
              <Link
                href={appendEvalParam(`/escuela/${item.cct}`, "comparar")}
                className="link-ios card-ios flex flex-col items-start rounded-2xl border border-border bg-card p-2.5 shadow-sm text-left"
              >
                <span className="truncate w-full text-xs font-bold leading-tight" title={nombre}>
                  {nombre}
                </span>
                <span className="mt-0.5 truncate w-full text-[10px] text-foreground/80">{item.cct}</span>
                <div className="mt-1 grid w-full grid-cols-2 gap-1 text-[10px]">
                  <div className="comparativa-year-box comparativa-year-box--2025">
                    <span className="font-semibold text-[var(--year-2025)]">2025</span>
                    <div>{item.despegue2025?.totalEstudiantes ?? "—"} alumnos</div>
                    <div>N3: {item.despegue2025?.nivel3 ?? "—"}</div>
                  </div>
                  <div className="comparativa-year-box comparativa-year-box--2026">
                    <span className="font-semibold text-[var(--year-2026)]">2026</span>
                    {item.aterrizaje2026 ? (
                      <>
                        <div>{item.aterrizaje2026.totalEstudiantes} alumnos</div>
                        <div>N3: {item.aterrizaje2026.nivel3}</div>
                      </>
                    ) : (
                      <span className="eval-badge--solo-2025">Sin Aterrizaje 2026</span>
                    )}
                  </div>
                </div>
                {n3d != null && (
                  <span className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${deltaClass(n3d)}`}>
                    <span aria-hidden>{n3d > 0 ? "↑" : n3d < 0 ? "↓" : "·"}</span>
                    Δ N3: {deltaLabel(n3d)}
                  </span>
                )}
                <div className="mt-1.5 w-full space-y-1 pointer-events-none">
                  {item.despegue2025 && (
                    <div>
                      <p className="mb-0.5 text-[9px] font-semibold text-[var(--year-2025)]">Despegue 2025</p>
                      <DistribucionNivelesCharts
                        escuelas={[item.despegue2025]}
                        size="mini"
                        descriptorVariant="none"
                      />
                    </div>
                  )}
                  {item.aterrizaje2026 && (
                    <div>
                      <p className="mb-0.5 text-[9px] font-semibold text-[var(--year-2026)]">Aterrizaje 2026</p>
                      <DistribucionNivelesCharts
                        escuelas={[item.aterrizaje2026]}
                        size="mini"
                        descriptorVariant="none"
                      />
                    </div>
                  )}
                </div>
                <span
                  className="mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-foreground self-center"
                  style={{ backgroundColor: color }}
                >
                  Nivel {nivel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
