"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AlumnoComparativo } from "@/lib/comparativa";
import { type NivelLenguaje, type EvalModo } from "@/types/raf";
import { deltaClass } from "@/lib/comparativa";
import { hrefAlumno } from "@/lib/alumno-link";

interface Props {
  alumnos: AlumnoComparativo[];
  /** Si se indica, la lista está filtrada por nivel pero los % son del examen completo */
  nivelPorNivel?: NivelLenguaje;
  evalModo?: EvalModo;
  /** CCT por defecto cuando el alumno no trae cct (p. ej. vista de grupo) */
  cctDefault?: string;
  /** Sin borde/card exterior cuando va dentro de otra tarjeta */
  embedded?: boolean;
}

type SortCol = "alumno" | "grupo" | "pct25" | "pct26" | "delta" | "cct";

function pctExamen(a: AlumnoComparativo["despegue2025"]): number | null {
  return a?.porcentaje ?? null;
}

export default function TablaAlumnosComparativa({
  alumnos,
  nivelPorNivel,
  evalModo = "comparar",
  cctDefault,
  embedded = false,
}: Props) {
  const showCct = nivelPorNivel != null;
  const [filtro, setFiltro] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>(showCct ? "pct25" : "alumno");
  const [sortAsc, setSortAsc] = useState(!showCct);

  const filtrados = useMemo(
    () =>
      filtro
        ? alumnos.filter((a) =>
            `${a.apellido} ${a.nombre}`.trim().toLowerCase().includes(filtro.toLowerCase())
          )
        : alumnos,
    [alumnos, filtro]
  );

  const ordenados = useMemo(() => {
    const dir = sortAsc ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      if (sortCol === "alumno") {
        const na = `${a.apellido} ${a.nombre}`.trim().toLowerCase();
        const nb = `${b.apellido} ${b.nombre}`.trim().toLowerCase();
        return dir * na.localeCompare(nb);
      }
      if (sortCol === "grupo") {
        return dir * a.grupo.localeCompare(b.grupo);
      }
      if (sortCol === "cct") {
        return dir * (a.cct ?? "").localeCompare(b.cct ?? "");
      }
      if (sortCol === "pct25") {
        const va = pctExamen(a.despegue2025) ?? -1;
        const vb = pctExamen(b.despegue2025) ?? -1;
        return dir * (va - vb);
      }
      if (sortCol === "pct26") {
        const va = pctExamen(a.aterrizaje2026) ?? -1;
        const vb = pctExamen(b.aterrizaje2026) ?? -1;
        return dir * (va - vb);
      }
      if (sortCol === "delta") {
        const va = a.deltaPorcentaje ?? -99;
        const vb = b.deltaPorcentaje ?? -99;
        return dir * (va - vb);
      }
      return 0;
    });
  }, [filtrados, sortCol, sortAsc]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc((s) => !s);
    else {
      setSortCol(col);
      setSortAsc(col === "alumno" || col === "grupo" || col === "cct");
    }
  };

  const Th = ({ col, label }: { col: SortCol; label: string }) => (
    <th className="px-1 py-1">
      <button
        type="button"
        onClick={() => handleSort(col)}
        className="text-left text-[10px] font-semibold underline decoration-dotted hover:opacity-80"
      >
        {label}
        {sortCol === col && (sortAsc ? " ↑" : " ↓")}
      </button>
    </th>
  );

  return (
    <div
      className={
        embedded
          ? "tabla-alumnos-comparativa tabla-alumnos-comparativa--embedded flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden"
          : "tabla-alumnos-comparativa flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      }
    >
      <div className="shrink-0 border-b border-border bg-card p-2">
        <input
          type="search"
          placeholder="Buscar alumno..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="tabla-zebra w-full min-w-[320px] border-collapse text-[10px] sm:text-xs">
          <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_var(--border)]">
            <tr className="border-b border-border bg-white">
              <Th col="alumno" label="Alumno" />
              <Th col="grupo" label="Grupo" />
              <Th col="pct25" label="Despegue" />
              <Th col="pct26" label="Aterrizaje" />
              <Th col="delta" label="Δ" />
              {showCct && <Th col="cct" label="CCT" />}
            </tr>
          </thead>
          <tbody>
            {ordenados.map((a) => {
              const p25 = pctExamen(a.despegue2025);
              const p26 = pctExamen(a.aterrizaje2026);
              const alumnoHref =
                (a.cct ?? cctDefault) && a.grupo
                  ? hrefAlumno(a.cct ?? cctDefault!, a.grupo, a.apellido, a.nombre, evalModo)
                  : null;

              return (
                <tr key={a.key} className="border-b border-border/50 hover:bg-[var(--fill-tertiary)]">
                  <td className="max-w-[120px] px-1 py-1">
                    {alumnoHref ? (
                      <Link
                        href={alumnoHref}
                        className="block truncate font-medium text-[var(--gris-iphone)] underline decoration-dotted hover:opacity-80"
                        title={`Ver examen de ${a.apellido} ${a.nombre}`}
                      >
                        {a.apellido} {a.nombre}
                      </Link>
                    ) : (
                      <div className="truncate font-medium" title={`${a.apellido} ${a.nombre}`}>
                        {a.apellido} {a.nombre}
                      </div>
                    )}
                    {a.soloEn === "despegue2025" && (
                      <span className="eval-badge--solo-2025">Solo 2025</span>
                    )}
                    {a.soloEn === "aterrizaje2026" && (
                      <span className="eval-badge--solo-2026">Solo 2026</span>
                    )}
                  </td>
                  <td className="px-1 py-1 text-center tabular-nums">{a.grupo}</td>
                  <td className="px-1 py-1 text-center font-semibold tabular-nums">
                    {p25 != null ? `${p25}%` : <span className="text-foreground/40">—</span>}
                  </td>
                  <td className="px-1 py-1 text-center font-semibold tabular-nums">
                    {p26 != null ? `${p26}%` : <span className="text-foreground/40">—</span>}
                  </td>
                  <td className="px-1 py-1 text-center">
                    {a.deltaPorcentaje != null ? (
                      <span className={`font-bold ${deltaClass(a.deltaPorcentaje)}`}>
                        {a.deltaPorcentaje > 0 ? "+" : ""}
                        {a.deltaPorcentaje}%
                      </span>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </td>
                  {showCct && (
                    <td className="px-1 py-1 text-center text-[9px] tabular-nums text-foreground/70">
                      {a.cct ?? "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {ordenados.length === 0 && (
          <div className="empty-state py-6">
            <span className="empty-state__icon" aria-hidden>🔍</span>
            <p className="empty-state__text">No se encontraron alumnos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
