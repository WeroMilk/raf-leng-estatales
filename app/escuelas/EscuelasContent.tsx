"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NIVEL_COLOR } from "@/types/raf";
import type { EscuelaResumen, EvalModo } from "@/types/raf";
import { appendEvalParam } from "@/lib/eval-query";
import DistribucionNivelesCharts from "@/app/components/DistribucionNivelesCharts";

type SortOption = "numero-asc" | "numero-desc" | "nivel";

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

const NIVEL_ORDER = { 1: 0, 2: 1, 3: 2, 4: 3 };

interface Props {
  escuelas: EscuelaResumen[];
  evalModo?: EvalModo;
}

export default function EscuelasContent({ escuelas, evalModo = "despegue2025" }: Props) {
  const [sort, setSort] = useState<SortOption>("numero-asc");

  const sorted = useMemo(() => {
    const list = escuelas.map((e) => ({ escuela: e, nivel: getNivelConMasApoyo(e) }));
    if (sort === "numero-asc") return list.sort((a, b) => a.escuela.cct.localeCompare(b.escuela.cct));
    if (sort === "numero-desc") return list.sort((a, b) => b.escuela.cct.localeCompare(a.escuela.cct));
    return list.sort((a, b) => NIVEL_ORDER[a.nivel] - NIVEL_ORDER[b.nivel]);
  }, [escuelas, sort]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 pb-6 min-w-0">
      <div className="card-ios shrink-0 space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
          Ordenar
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSort("numero-asc")}
            className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              sort === "numero-asc"
                ? "pill-sonora-active"
                : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
            }`}
          >
            Nº ascendente
          </button>
          <button
            type="button"
            onClick={() => setSort("numero-desc")}
            className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              sort === "numero-desc"
                ? "pill-sonora-active"
                : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
            }`}
          >
            Nº descendente
          </button>
          <button
            type="button"
            onClick={() => setSort("nivel")}
            className={`btn-ios rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              sort === "nivel"
                ? "pill-sonora-active"
                : "bg-[var(--fill-tertiary)] text-foreground hover:bg-[var(--fill-secondary)]"
            }`}
          >
            Por nivel (1→4)
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 content-start">
        {sorted.map(({ escuela: e, nivel }, i) => {
          const color = NIVEL_COLOR[nivel];
          return (
            <li
              key={e.cct}
              className="min-w-0 animate-stagger-in"
              style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}
            >
              <Link
                href={appendEvalParam(`/escuela/${e.cct}`, evalModo)}
                className="link-ios card-ios flex flex-col items-start rounded-2xl border border-border bg-card p-2.5 shadow-sm text-left"
              >
                <span className="truncate w-full text-xs font-bold leading-tight" title={e.buscador?.nombre ?? e.cct}>
                  {e.buscador?.nombre ?? e.cct}
                </span>
                <span className="mt-0.5 truncate w-full text-[10px] text-foreground/80">
                  {e.cct}
                  {(e.buscador?.localidad || e.buscador?.municipio) && (
                    <> · {[e.buscador.localidad, e.buscador.municipio].filter(Boolean).join(", ")}</>
                  )}
                </span>
                <span className="mt-0.5 text-[10px] text-foreground/70">
                  {e.totalEstudiantes} alumnos · {e.grupos.length} grupos
                </span>
                {(e.buscador?.domicilio || e.buscador?.telefono) && (
                  <span className="mt-0.5 truncate w-full text-[9px] text-foreground/60">
                    {[e.buscador.domicilio, e.buscador.telefono].filter(Boolean).join(" · ")}
                  </span>
                )}
                <div className="mt-1.5 w-full pointer-events-none">
                  <DistribucionNivelesCharts
                    escuelas={[e]}
                    size="mini"
                    descriptorVariant="none"
                  />
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
