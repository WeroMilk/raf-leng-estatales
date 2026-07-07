"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { EscuelaResumen } from "@/types/raf";
import { useSquareChartSize } from "@/app/components/useSquareChartSize";

interface Props {
  nivel: 1 | 2 | 3 | 4;
  escuelas: EscuelaResumen[];
  color: string;
  descriptor: string;
  /** donut = gráfica circular. stat = número + % (compact/mini). pct-only = solo % (Comparativa) */
  variant?: "donut" | "stat" | "pct-only";
  className?: string;
}

function calcPct(nivel: 1 | 2 | 3 | 4, escuelas: EscuelaResumen[]) {
  const key = `nivel${nivel}` as keyof EscuelaResumen;
  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const alumnosEnNivel = escuelas.reduce((s, e) => s + ((e[key] as number) ?? 0), 0);
  return totalAlumnos ? Math.round((alumnosEnNivel / totalAlumnos) * 100) : 0;
}

export default function ChartPastelDistribucion({
  nivel,
  escuelas,
  color,
  descriptor,
  variant = "donut",
  className = "",
}: Props) {
  const { ref: ringWrapRef, size: ringSize } = useSquareChartSize(6);
  const key = `nivel${nivel}` as keyof EscuelaResumen;
  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const alumnosEnNivel = escuelas.reduce((s, e) => s + ((e[key] as number) ?? 0), 0);
  const otros = totalAlumnos - alumnosEnNivel;
  const pctNivel = calcPct(nivel, escuelas);

  if (variant === "pct-only") {
    return (
      <div className="chart-pct-solo chart-animate-in card-ios rounded-xl border border-border bg-card">
        <span className="chart-pct-solo__value tabular-nums" style={{ color }}>
          {alumnosEnNivel}
        </span>
        <span className="chart-pct-solo__sub tabular-nums" style={{ color }}>
          {pctNivel}%
        </span>
        <span className="chart-pct-solo__label font-medium" style={{ color }}>
          Nivel {nivel}
        </span>
        <span className="chart-pct-solo__desc text-[9px] leading-tight text-foreground/55 px-1" title={descriptor}>
          {descriptor}
        </span>
      </div>
    );
  }

  if (variant === "stat") {
    const statClass = className.includes("mini")
      ? "chart-nivel-stat chart-nivel-stat--mini"
      : className.includes("compact")
        ? "chart-nivel-stat chart-nivel-stat--compact"
        : "chart-nivel-stat";

    return (
      <div
        className={`${statClass} chart-animate-in card-ios rounded-xl border border-border bg-card ${className}`.trim()}
        title={descriptor ? `${alumnosEnNivel} alumnos · ${pctNivel}% · ${descriptor}` : `${alumnosEnNivel} alumnos · ${pctNivel}%`}
      >
        <span className="chart-nivel-stat__count tabular-nums" style={{ color }}>
          {alumnosEnNivel}
        </span>
        <span className="chart-nivel-stat__pct tabular-nums" style={{ color }}>
          {pctNivel}%
        </span>
        <span className="chart-nivel-stat__label font-medium" style={{ color }}>
          Nivel {nivel}
        </span>
        {descriptor ? (
          <span className="chart-nivel-stat__desc truncate" title={descriptor}>
            {descriptor}
          </span>
        ) : null}
      </div>
    );
  }

  const data = [
    { name: "Este nivel", value: alumnosEnNivel, fill: color },
    { name: "Otros", value: otros, fill: "var(--fill-tertiary)" },
  ].filter((d) => d.value > 0);

  if (data.length === 0 || totalAlumnos === 0) {
    return (
      <div className="chart-pastel-donut chart-pastel-donut--empty card-ios rounded-xl border border-border bg-card">
        <span className="chart-pct-solo__label font-semibold" style={{ color }}>
          Nivel {nivel}
        </span>
        <p className="text-[9px] text-foreground/50 tabular-nums">0 alumnos</p>
      </div>
    );
  }

  /* Si el nivel es 0% pero hay otros datos, mostrar anillo gris completo + 0% centrado */
  const chartData =
    alumnosEnNivel === 0
      ? [{ name: "Otros", value: totalAlumnos, fill: "var(--fill-tertiary)" }]
      : data;

  const ringStyle = {
    width: ringSize,
    height: ringSize,
  } as const;

  const pctFontSize = Math.max(11, Math.min(22, Math.round(ringSize * 0.22)));

  return (
    <div className={`chart-pastel-donut chart-animate-in card-ios rounded-xl border border-border bg-card ${className}`.trim()}>
      <div ref={ringWrapRef} className="chart-pastel-donut__ring-wrap">
        <div className="chart-pastel-donut__ring" style={ringStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="86%"
                paddingAngle={alumnosEnNivel > 0 ? 1 : 0}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={400}
                animationBegin={nivel * 80}
                label={false}
                labelLine={false}
              >
                {chartData.map((entry, i) => (
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
          <div className="chart-pastel-donut__center" aria-hidden>
            <span className="chart-pastel-donut__center-bg" />
            <div className="chart-pastel-donut__center-values">
              <span
                className="chart-pastel-donut__count tabular-nums"
                style={{ color, fontSize: Math.max(10, Math.min(18, Math.round(ringSize * 0.18))) }}
              >
                {alumnosEnNivel}
              </span>
              <span className="chart-pastel-donut__pct tabular-nums" style={{ color, fontSize: pctFontSize }}>
                {pctNivel}%
              </span>
            </div>
          </div>
        </div>
      </div>
      <span
        className="chart-pastel-donut__title truncate font-medium"
        style={{ color }}
        title={descriptor || `Nivel ${nivel}`}
      >
        Nivel {nivel} · {alumnosEnNivel} alumnos
      </span>
      {descriptor ? (
        <span
          className="chart-pastel-donut__desc w-full truncate px-0.5 text-center leading-tight text-foreground/55"
          title={descriptor}
        >
          {descriptor}
        </span>
      ) : null}
    </div>
  );
}
