"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { RowNivel } from "@/lib/data-server";
import type { NivelLenguaje, EvalModo } from "@/types/raf";
import { hrefAlumno } from "@/lib/alumno-link";

type SortCol = "alumno" | "grupo" | "porcentaje" | "cct";

interface Props {
  alumnosConCct: RowNivel[];
  maxRows?: number;
  verTodosHref?: string;
  /** Conservado por compatibilidad; el % mostrado es siempre del examen completo */
  nivelPorNivel?: NivelLenguaje;
  variant?: "mini" | "full";
  evalModo?: EvalModo;
}

function getPctAlumno(r: RowNivel): number {
  return r.alumno.porcentaje;
}

export default function TablaAlumnosNivel({
  alumnosConCct,
  maxRows,
  verTodosHref,
  nivelPorNivel,
  variant = "full",
  evalModo = "despegue2025",
}: Props) {
  const isMini = variant === "mini";
  const [filtro, setFiltro] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("porcentaje");
  const [sortAsc, setSortAsc] = useState(false);

  const filtrados = useMemo(
    () =>
      filtro
        ? alumnosConCct.filter(
            (r) =>
              r.cct.toLowerCase().includes(filtro.toLowerCase()) ||
              `${r.alumno.apellido} ${r.alumno.nombre}`.trim().toLowerCase().includes(filtro.toLowerCase())
          )
        : alumnosConCct,
    [alumnosConCct, filtro]
  );

  const ordenados = useMemo(() => {
    const dir = sortAsc ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      if (sortCol === "alumno") {
        const na = `${a.alumno.apellido} ${a.alumno.nombre}`.trim().toLowerCase();
        const nb = `${b.alumno.apellido} ${b.alumno.nombre}`.trim().toLowerCase();
        return dir * (na < nb ? -1 : na > nb ? 1 : 0);
      }
      if (sortCol === "grupo") {
        return dir * (a.alumno.grupo < b.alumno.grupo ? -1 : a.alumno.grupo > b.alumno.grupo ? 1 : 0);
      }
      if (sortCol === "porcentaje") {
        return dir * (getPctAlumno(a) - getPctAlumno(b));
      }
      return dir * (a.cct < b.cct ? -1 : a.cct > b.cct ? 1 : 0);
    });
  }, [filtrados, sortCol, sortAsc]);

  const limit = maxRows ?? ordenados.length;
  const visibles = ordenados.slice(0, limit);
  const total = ordenados.length;
  const hayMas = total > limit;
  const mostrarVerTodos = hayMas && maxRows != null && verTodosHref;

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc((s) => !s);
    else {
      setSortCol(col);
      setSortAsc(col === "porcentaje" ? false : true);
    }
  };

  const Th = ({ col, label, className = "" }: { col: SortCol; label: string; className?: string }) => (
    <th className={`bg-white px-1 py-1 ${className}`}>
      <button
        type="button"
        onClick={() => handleSort(col)}
        className={`w-full bg-white text-left font-semibold underline decoration-dotted hover:opacity-80 ${
          isMini ? "min-h-0 py-0.5 text-[10px] leading-tight" : "touch-target min-h-[36px] py-1 text-xs sm:min-h-0 sm:text-sm"
        }`}
        title={`Ordenar por ${label}`}
      >
        {label}
        {sortCol === col && (sortAsc ? " ↑" : " ↓")}
      </button>
    </th>
  );

  return (
    <div className="tabla-alumnos-nivel flex min-h-0 min-w-0 max-w-full flex-col">
      <div className="mb-1 shrink-0">
        <input
          type="search"
          placeholder="Buscar..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={`w-full rounded-lg border border-border bg-background px-2 text-foreground placeholder:text-foreground/50 ${
            isMini ? "py-1 text-[11px]" : "py-1.5 text-xs sm:text-sm"
          }`}
        />
      </div>
      <div
        className={`tabla-alumnos-nivel__body min-h-0 flex-1 ${isMini ? "overflow-hidden" : "overflow-y-auto overflow-x-auto"}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table
          className={`tabla-zebra w-full table-fixed text-left ${isMini ? "text-[11px] leading-snug" : "text-xs sm:text-sm"}`}
          role="grid"
        >
          <colgroup>
            <col className="w-[46%] sm:w-[40%]" />
            <col className="w-[18%] sm:w-[14%]" />
            <col className="w-[14%] sm:w-[10%]" />
            <col className="hidden sm:table-column sm:w-[36%]" />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_var(--border)]">
            <tr className="border-b border-border bg-white font-semibold">
              <Th col="alumno" label="Alumno" />
              <Th col="grupo" label="Grupo" className="w-[3.25rem] sm:w-auto" />
              <Th col="porcentaje" label="%" className="w-[2.5rem] sm:w-auto" />
              <Th col="cct" label="CCT" className="hidden sm:table-cell" />
            </tr>
          </thead>
          <tbody>
            {visibles.map((r, i) => {
              const alumnoHref = hrefAlumno(
                r.cct,
                r.alumno.grupo,
                r.alumno.apellido,
                r.alumno.nombre,
                evalModo
              );
              return (
              <tr
                key={i}
                className="border-b border-border/50 transition-colors duration-150 hover:bg-[var(--fill-tertiary)]"
              >
                <td
                  className={`max-w-0 px-1 ${isMini ? "py-1" : "py-1.5 sm:py-2"}`}
                  title={`${r.alumno.apellido ? `${r.alumno.apellido} ` : ""}${r.alumno.nombre}`}
                >
                  {isMini ? (
                    <span className="block truncate">
                      {(r.alumno.apellido ? `${r.alumno.apellido} ` : "")}
                      {r.alumno.nombre}
                    </span>
                  ) : (
                    <Link
                      href={alumnoHref}
                      className="block truncate font-medium text-[var(--gris-iphone)] underline decoration-dotted hover:opacity-80"
                    >
                      {(r.alumno.apellido ? `${r.alumno.apellido} ` : "")}
                      {r.alumno.nombre}
                    </Link>
                  )}
                </td>
                <td className={`whitespace-nowrap px-1 ${isMini ? "py-1" : "py-1.5 sm:py-2"}`}>{r.alumno.grupo}</td>
                <td className={`whitespace-nowrap px-1 font-medium tabular-nums ${isMini ? "py-1" : "py-1.5 sm:py-2"}`}>
                  {getPctAlumno(r)}%
                </td>
                <td className={`hidden px-1 text-foreground/70 sm:table-cell ${isMini ? "py-1" : "py-1.5 sm:py-2"}`}>
                  {r.cct}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        {!isMini && visibles.length === 0 && (
          <div className="empty-state py-6">
            <span className="empty-state__icon" aria-hidden>👤</span>
            <p className="empty-state__text">No hay alumnos en esta lista.</p>
          </div>
        )}
        {isMini && total > limit && (
          <p className="mt-1 text-center text-[10px] text-foreground/50">
            +{total - limit} más · toca la sección para ver todos
          </p>
        )}
        {mostrarVerTodos && (
          <p className="mt-1 text-center">
            <Link
              href={verTodosHref}
              className="text-[10px] font-medium text-[var(--gris-iphone)] underline hover:opacity-80"
            >
              Ver todos ({total})
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
