import { COLORS } from "@/types/raf";
import type { ResumenNiveles } from "@/lib/comparativa";
import { NIVELES_LENGUAJE } from "@/types/raf";
import ComparativaNivelFila from "@/app/components/ComparativaNivelFila";

interface Props {
  resumen2025: ResumenNiveles;
  resumen2026: ResumenNiveles;
  basePorNivel: string;
}

export default function DashboardComparativo({ resumen2025, resumen2026, basePorNivel }: Props) {
  const niveles = NIVELES_LENGUAJE.map((n) => {
    const pctKey = `pctN${n}` as keyof ResumenNiveles;
    const pct2025 = resumen2025[pctKey] as number;
    const pct2026 = resumen2026[pctKey] as number;
    return {
      nivel: n,
      color: COLORS[`nivel${n}` as keyof typeof COLORS],
      pct2025,
      pct2026,
      deltaPct: Math.round((pct2026 - pct2025) * 10) / 10,
      href: `${basePorNivel}${basePorNivel.includes("?") ? "&" : "?"}nivel=${n}&vista=colocacion`,
    };
  });

  return (
    <div className="home-page__comparativa comparativa-dashboard flex w-full max-w-full flex-col gap-3">
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
