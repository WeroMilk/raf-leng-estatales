import { COLORS } from "@/types/raf";
import type { ResumenNiveles } from "@/lib/comparativa";
import { calcularDelta, deltaClass, deltaLabel } from "@/lib/comparativa";
import { NIVELES_LENGUAJE } from "@/types/raf";
import ComparativaNivelFila from "@/app/components/ComparativaNivelFila";

interface Props {
  resumen2025: ResumenNiveles;
  resumen2026: ResumenNiveles;
  basePorNivel: string;
  totalEscuelas2025: number;
  totalEscuelas2026: number;
}

export default function DashboardComparativo({
  resumen2025,
  resumen2026,
  totalEscuelas2025,
  totalEscuelas2026,
  basePorNivel,
}: Props) {
  const delta = calcularDelta(resumen2025, resumen2026);
  const parcial = totalEscuelas2026 < totalEscuelas2025;

  const niveles = NIVELES_LENGUAJE.map((n) => {
    const key = `nivel${n}` as keyof ResumenNiveles;
    const pctKey = `pctN${n}` as keyof ResumenNiveles;
    const deltaKey = `nivel${n}` as keyof typeof delta;
    return {
      nivel: n,
      color: COLORS[`nivel${n}` as keyof typeof COLORS],
      total2025: resumen2025[key] as number,
      pct2025: resumen2025[pctKey] as number,
      total2026: resumen2026[key] as number,
      pct2026: resumen2026[pctKey] as number,
      delta: delta[deltaKey] as number,
      href: `${basePorNivel}${basePorNivel.includes("?") ? "&" : "?"}nivel=${n}&vista=colocacion`,
    };
  });

  return (
    <div className="home-page__comparativa comparativa-dashboard flex w-full max-w-full flex-col gap-3">
      {/* Hero antes / después */}
      <section className="comparativa-hero card-ios">
        <p className="comparativa-hero__eyebrow">Comparativa RAF Lenguaje</p>
        <h2 className="comparativa-hero__title">Despegue 2025 → Aterrizaje 2026</h2>
        <p className="comparativa-hero__subtitle">
          Misma escala en cada fila: cuántos alumnos quedaron en cada nivel antes y después.
        </p>

        <div className="comparativa-hero__grid">
          <div className="comparativa-hero__year comparativa-hero__year--2025">
            <span className="comparativa-hero__badge">Antes</span>
            <p className="comparativa-hero__year-name">Despegue 2025</p>
            <p className="comparativa-hero__stat tabular-nums">
              {resumen2025.total.toLocaleString("es-MX")}
              <span className="comparativa-hero__stat-unit"> alumnos</span>
            </p>
            <p className="comparativa-hero__meta tabular-nums">{totalEscuelas2025} escuelas</p>
          </div>

          <div className="comparativa-hero__arrow" aria-hidden>
            <span className="comparativa-hero__arrow-icon">→</span>
          </div>

          <div className="comparativa-hero__year comparativa-hero__year--2026">
            <span className="comparativa-hero__badge">Después</span>
            <p className="comparativa-hero__year-name">Aterrizaje 2026</p>
            <p className="comparativa-hero__stat tabular-nums">
              {resumen2026.total.toLocaleString("es-MX")}
              <span className="comparativa-hero__stat-unit"> alumnos</span>
            </p>
            <p className="comparativa-hero__meta tabular-nums">
              {totalEscuelas2026} escuelas
              {parcial && <span className="eval-badge--parcial ml-1">Parcial</span>}
            </p>
          </div>
        </div>

        <div className="comparativa-hero__total-delta">
          <span className="comparativa-hero__total-label">Cambio total de alumnos evaluados</span>
          <span className={`comparativa-hero__total-value tabular-nums ${deltaClass(delta.total)}`}>
            {deltaLabel(delta.total)}
          </span>
        </div>
      </section>

      {/* Filas por nivel: la pieza central */}
      <section className="comparativa-niveles">
        <div className="comparativa-niveles__head">
          <h2 className="label-alumnos-por-nivel">Alumnos por nivel</h2>
          <p className="comparativa-niveles__hint">
            Barras = % del total de esa evaluación. Toca una fila para ver la lista de alumnos.
          </p>
        </div>
        <div className="comparativa-niveles__list">
          {niveles.map((row) => (
            <ComparativaNivelFila key={row.nivel} {...row} />
          ))}
        </div>
      </section>
    </div>
  );
}
