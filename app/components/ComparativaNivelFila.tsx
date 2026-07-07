import Link from "next/link";
import { deltaClass, deltaLabel } from "@/lib/comparativa";
import { DESCRIPTORES_NIVEL_CORTO, type NivelLenguaje } from "@/types/raf";

interface Props {
  nivel: NivelLenguaje;
  color: string;
  total2025: number;
  pct2025: number;
  total2026: number;
  pct2026: number;
  delta: number;
  href: string;
}

function deltaHint(nivel: NivelLenguaje, delta: number): string {
  if (delta === 0) return "Sin cambio";
  if (nivel >= 3) return delta > 0 ? "Más alumnos en este nivel" : "Menos alumnos en este nivel";
  return delta < 0 ? "Menos alumnos en este nivel" : "Más alumnos en este nivel";
}

export default function ComparativaNivelFila({
  nivel,
  color,
  total2025,
  pct2025,
  total2026,
  pct2026,
  delta,
  href,
}: Props) {
  const deltaCls = deltaClass(delta);

  return (
    <Link
      href={href}
      className="comparativa-nivel-fila link-ios group"
      title={`Ver lista comparativa · Nivel ${nivel}`}
    >
      <div className="comparativa-nivel-fila__accent" style={{ backgroundColor: color }} aria-hidden />
      <div className="comparativa-nivel-fila__body">
        <div className="comparativa-nivel-fila__head">
          <div className="min-w-0 flex-1">
            <p className="comparativa-nivel-fila__title">Nivel {nivel}</p>
            <p className="comparativa-nivel-fila__desc">{DESCRIPTORES_NIVEL_CORTO[nivel]}</p>
          </div>
          <div className={`comparativa-nivel-fila__delta ${deltaCls}`} title={deltaHint(nivel, delta)}>
            <span className="comparativa-nivel-fila__delta-value tabular-nums">{deltaLabel(delta)}</span>
            <span className="comparativa-nivel-fila__delta-label">alumnos</span>
          </div>
        </div>

        <div className="comparativa-nivel-fila__bars">
          <div className="comparativa-bar-row">
            <span className="comparativa-bar-row__year comparativa-bar-row__year--2025">2025</span>
            <div className="comparativa-bar-row__track" aria-hidden>
              <div
                className="comparativa-bar-row__fill"
                style={{ width: `${Math.max(pct2025, 2)}%`, backgroundColor: color }}
              />
            </div>
            <span className="comparativa-bar-row__meta tabular-nums">
              <strong>{total2025.toLocaleString("es-MX")}</strong>
              <span className="text-foreground/55"> · {pct2025}%</span>
            </span>
          </div>
          <div className="comparativa-bar-row">
            <span className="comparativa-bar-row__year comparativa-bar-row__year--2026">2026</span>
            <div className="comparativa-bar-row__track" aria-hidden>
              <div
                className="comparativa-bar-row__fill comparativa-bar-row__fill--2026"
                style={{ width: `${Math.max(pct2026, 2)}%`, backgroundColor: color }}
              />
            </div>
            <span className="comparativa-bar-row__meta tabular-nums">
              <strong>{total2026.toLocaleString("es-MX")}</strong>
              <span className="text-foreground/55"> · {pct2026}%</span>
            </span>
          </div>
        </div>

        <p className="comparativa-nivel-fila__cta">Ver alumnos →</p>
      </div>
    </Link>
  );
}
