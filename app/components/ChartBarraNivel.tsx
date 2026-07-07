"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { EscuelaResumen } from "@/types/raf";

interface Props {
  nivel: 1 | 2 | 3 | 4;
  escuelas: EscuelaResumen[];
  color: string;
  descriptor: string;
}

export default function ChartBarraNivel({ nivel, escuelas, color, descriptor }: Props) {
  const key = `nivelReforzarMas${nivel}` as keyof EscuelaResumen;
  const data = escuelas
    .map((e) => ({
      nombre: e.cct,
      count: (e[key] as number) ?? 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 text-xs font-semibold" style={{ color }}>
          Nivel {nivel}: {descriptor}
        </h3>
        <p className="text-xs text-foreground/60">No hay alumnos que deban reforzar este nivel.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <h3 className="mb-2 text-xs font-semibold" style={{ color }}>
        Nivel {nivel}: {descriptor}
      </h3>
      <div className="chart-no-focus h-[180px] w-full min-w-0" tabIndex={-1}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={60}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 9 }}
              tickFormatter={(v) => (v.length > 10 ? v.slice(0, 8) + "…" : v)}
            />
            <YAxis tick={{ fontSize: 10 }} width={24} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(value: number | undefined) => [`${value ?? 0} alumnos`, "Refuerzo"]}
              labelFormatter={(label) => `Escuela ${label}`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
