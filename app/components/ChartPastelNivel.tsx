"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { EscuelaResumen } from "@/types/raf";

interface Props {
  nivel: 1 | 2 | 3 | 4;
  escuelas: EscuelaResumen[];
  color: string;
  descriptor: string;
}

export default function ChartPastelNivel({ nivel, escuelas, color, descriptor }: Props) {
  const key = `nivelReforzarMas${nivel}` as keyof EscuelaResumen;
  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const refuerzanEsteNivel = escuelas.reduce((s, e) => s + ((e[key] as number) ?? 0), 0);
  const otros = totalAlumnos - refuerzanEsteNivel;

  const pctRefuerzan = totalAlumnos ? Math.round((refuerzanEsteNivel / totalAlumnos) * 100) : 0;

  const data = [
    { name: "Refuerzo en este nivel", value: refuerzanEsteNivel, fill: color },
    { name: "Otros", value: otros, fill: "var(--fill-tertiary)" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 min-h-0 min-w-0">
        <span className="text-[10px] font-semibold" style={{ color }}>Nivel {nivel}</span>
        <p className="text-[9px] text-foreground/50">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-1.5 min-h-0 min-w-0 h-full w-full overflow-hidden">
      <div className="relative w-full flex-1 min-h-[60px] min-w-[60px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={60} minHeight={60}>
          <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="95%"
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 10, borderRadius: 6, padding: "4px 8px" }}
              formatter={(value, name) => {
                const v = Number(value ?? 0);
                const pct = totalAlumnos ? Math.round((v / totalAlumnos) * 100) : 0;
                return [`${v} (${pct}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span className="text-sm font-bold tabular-nums leading-tight" style={{ color }}>
            {pctRefuerzan}%
          </span>
        </div>
      </div>
      <span className="text-[9px] font-medium mt-0.5 truncate w-full text-center" style={{ color }} title={descriptor}>
        Nivel {nivel}
      </span>
    </div>
  );
}
