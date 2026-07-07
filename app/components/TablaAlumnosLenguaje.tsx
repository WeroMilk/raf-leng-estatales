"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AlumnoRAF, EvalModo } from "@/types/raf";
import { NIVEL_COLOR, DESCRIPTORES_NIVEL } from "@/types/raf";
import { hrefAlumno } from "@/lib/alumno-link";

interface Props {
  alumnos: AlumnoRAF[];
  cct: string;
  evalModo?: EvalModo;
}

type SortCol = "alumno" | "grupo" | "nivel" | "n1" | "n2" | "n3" | "n4" | "total";

export default function TablaAlumnosLenguaje({ alumnos, cct, evalModo = "despegue2025" }: Props) {
  const [filtro, setFiltro] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("nivel");
  const [sortAsc, setSortAsc] = useState(true);

  const filtrados = useMemo(
    () =>
      filtro
        ? alumnos.filter(
            (a) =>
              `${a.apellido} ${a.nombre}`.trim().toLowerCase().includes(filtro.toLowerCase()) ||
              a.grupo.toLowerCase().includes(filtro.toLowerCase())
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
        return dir * (na < nb ? -1 : na > nb ? 1 : 0);
      }
      if (sortCol === "grupo") return dir * (a.grupo < b.grupo ? -1 : a.grupo > b.grupo ? 1 : 0);
      if (sortCol === "nivel") return dir * (a.nivelGeneral - b.nivelGeneral);
      if (sortCol === "n1") return dir * (a.porcentajeNivel1 - b.porcentajeNivel1);
      if (sortCol === "n2") return dir * (a.porcentajeNivel2 - b.porcentajeNivel2);
      if (sortCol === "n3") return dir * (a.porcentajeNivel3 - b.porcentajeNivel3);
      if (sortCol === "n4") return dir * (a.porcentajeNivel4 - b.porcentajeNivel4);
      if (sortCol === "total") return dir * (a.porcentaje - b.porcentaje);
      return 0;
    });
  }, [filtrados, sortCol, sortAsc]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc((s) => !s);
    else {
      setSortCol(col);
      setSortAsc(col === "nivel" ? true : false);
    }
  };

  const Th = ({ col, label }: { col: SortCol; label: string }) => (
    <th className="bg-white px-1 py-1">
      <button
        type="button"
        onClick={() => handleSort(col)}
        className="w-full bg-white text-left font-semibold underline decoration-dotted hover:opacity-80 text-[10px]"
      >
        {label}
        {sortCol === col && (sortAsc ? " ↑" : " ↓")}
      </button>
    </th>
  );

  return (
    <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border bg-card p-2">
        <input
          type="search"
          placeholder="Buscar alumno..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="tabla-zebra w-full min-w-[400px] text-left text-[10px] sm:text-xs" role="grid">
          <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_var(--border)]">
            <tr className="border-b border-border bg-white">
              <Th col="alumno" label="Alumno" />
              <Th col="grupo" label="Grupo" />
              <Th col="nivel" label="Nivel" />
              <Th col="n1" label="N1 %" />
              <Th col="n2" label="N2 %" />
              <Th col="n3" label="N3 %" />
              <Th col="n4" label="N4 %" />
              <Th col="total" label="Total %" />
            </tr>
          </thead>
          <tbody>
            {ordenados.map((a, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-[var(--fill-tertiary)]">
                <td className="px-1 py-0.5">
                  <Link
                    href={hrefAlumno(cct, a.grupo, a.apellido, a.nombre, evalModo)}
                    className="font-medium text-[var(--gris-iphone)] underline decoration-dotted hover:opacity-80"
                  >
                    {(a.apellido ? `${a.apellido} ` : "")}{a.nombre}
                  </Link>
                </td>
                <td className="px-1 py-0.5">{a.grupo}</td>
                <td className="px-1 py-0.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-medium text-foreground"
                    style={{ backgroundColor: NIVEL_COLOR[a.nivelGeneral] }}
                  >
                    {a.nivelGeneral}
                  </span>
                </td>
                <td className="px-1 py-0.5">{a.porcentajeNivel1}%</td>
                <td className="px-1 py-0.5">{a.porcentajeNivel2}%</td>
                <td className="px-1 py-0.5">{a.porcentajeNivel3}%</td>
                <td className="px-1 py-0.5">{a.porcentajeNivel4}%</td>
                <td className="px-1 py-0.5 font-medium">{a.porcentaje}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ordenados.length === 0 && (
          <div className="empty-state py-6">
            <span className="empty-state__icon" aria-hidden>🔍</span>
            <p className="empty-state__text">No se encontraron alumnos con ese criterio.</p>
          </div>
        )}
      </div>
      <p className="shrink-0 border-t border-border p-2 text-[10px] text-foreground/60">
        N1: {DESCRIPTORES_NIVEL[1]} · N2: {DESCRIPTORES_NIVEL[2]} · N3: {DESCRIPTORES_NIVEL[3]} · N4: {DESCRIPTORES_NIVEL[4]}
      </p>
    </div>
  );
}
