import type { EvalModo } from "@/types/raf";

const OPCIONES: { id: EvalModo; label: string; short: string }[] = [
  { id: "despegue2025", label: "Despegue 2025", short: "2025" },
  { id: "aterrizaje2026", label: "Aterrizaje 2026", short: "2026" },
  { id: "comparar", label: "Comparativa", short: "Comp." },
];

interface Props {
  evalModo: EvalModo;
  parcial2026?: boolean;
}

/** Placeholder estático mientras carga SelectorEvaluacion (Suspense). */
export default function EvalSelectorShell({ evalModo, parcial2026 }: Props) {
  const currentOption = OPCIONES.find((o) => o.id === evalModo) ?? OPCIONES[0];

  return (
    <div className="eval-selector-wrap eval-selector-wrap--shell" aria-hidden="true">
      <span className="eval-selector-mobile">
        <span className="eval-selector-mobile__label">{currentOption.short}</span>
        <svg className="eval-selector-mobile__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </span>

      <div className="eval-selector" role="presentation">
        {OPCIONES.map(({ id, label }) => (
          <span
            key={id}
            className={`eval-selector__btn ${evalModo === id ? "eval-selector__btn--active" : ""}`}
          >
            {label}
          </span>
        ))}
      </div>

      {parcial2026 && evalModo !== "despegue2025" && (
        <span className="eval-badge--parcial eval-badge--parcial-desktop">Datos parciales 2026</span>
      )}
    </div>
  );
}
