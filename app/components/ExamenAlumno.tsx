"use client";

import { NIVEL_COLOR, DESCRIPTORES_NIVEL, type NivelLenguaje } from "@/types/raf";
import { NIVEL_POR_REACTIVO, NUM_REACTIVOS } from "@/lib/reactivos";
import type { AlumnoRAF } from "@/types/raf";

interface Props {
  alumno: AlumnoRAF;
  titulo?: string;
  evalLabel?: string;
}

export default function ExamenAlumno({ alumno, titulo, evalLabel }: Props) {
  const aciertos = alumno.respuestas.filter((r) => r === "C").length;

  return (
    <section className="card-ios rounded-xl border border-border bg-card p-3">
      {titulo && <h2 className="mb-1 text-sm font-bold">{titulo}</h2>}
      {evalLabel && <p className="mb-2 text-xs text-foreground/70">{evalLabel}</p>}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <span>
          <strong className="tabular-nums">{aciertos}</strong> / {NUM_REACTIVOS} aciertos
        </span>
        <span>
          <strong className="tabular-nums">{alumno.porcentaje}%</strong> del examen
        </span>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: NIVEL_COLOR[alumno.nivelGeneral] }}
        >
          N{alumno.nivelGeneral}: {DESCRIPTORES_NIVEL[alumno.nivelGeneral]}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-10">
        {Array.from({ length: NUM_REACTIVOS }, (_, i) => {
          const ok = alumno.respuestas[i] === "C";
          const num = i + 1;
          const nivel = NIVEL_POR_REACTIVO[num] as NivelLenguaje;
          return (
            <div
              key={num}
              className={`flex flex-col items-center rounded-lg border px-1 py-1.5 text-center ${
                ok
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-red-300 bg-red-50 text-red-900"
              }`}
              title={`Reactivo ${num} · N${nivel} · ${ok ? "Correcto" : "Incorrecto"}`}
            >
              <span className="text-[9px] font-medium opacity-70">R{num}</span>
              <span className="text-sm font-bold">{ok ? "✓" : "✗"}</span>
              <span
                className="mt-0.5 rounded px-1 text-[8px] font-semibold"
                style={{ backgroundColor: NIVEL_COLOR[nivel], color: "#1a1a1a" }}
              >
                N{nivel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
