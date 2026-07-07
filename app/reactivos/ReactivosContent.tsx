"use client";

import { useMemo, useState } from "react";
import SelectPopup from "@/app/components/SelectPopup";
import { getNombreEscuela } from "@/lib/nombres-escuelas";
import { deltaClass } from "@/lib/comparativa";
import { pctColor, type ReactivoComparativo, type ReactivoStats } from "@/lib/reactivos";
import { NIVEL_COLOR, DESCRIPTORES_NIVEL, type NivelLenguaje } from "@/types/raf";

interface Props {
  comparar?: boolean;
  general: ReactivoStats[];
  porEscuela: { cct: string; stats: ReactivoStats[] }[];
  generalComparativa?: ReactivoComparativo[];
  porEscuelaComparativa?: { cct: string; stats: ReactivoComparativo[] }[];
  soloCct?: string;
}

function NivelBadge({ nivel }: { nivel: NivelLenguaje }) {
  return (
    <span
      className="reactivos-table__nivel inline-block rounded px-1 py-0.5 font-semibold tabular-nums"
      style={{ backgroundColor: NIVEL_COLOR[nivel] }}
      title={DESCRIPTORES_NIVEL[nivel]}
    >
      N{nivel}
    </span>
  );
}

function PctBadge({ pct }: { pct: number }) {
  return (
    <span
      className="reactivos-table__pct inline-block rounded px-1 py-0.5 font-bold tabular-nums"
      style={{ backgroundColor: pctColor(pct) }}
    >
      {pct}%
    </span>
  );
}

export default function ReactivosContent({
  comparar = false,
  general,
  porEscuela,
  generalComparativa,
  porEscuelaComparativa,
  soloCct,
}: Props) {
  const [selectedCct, setSelectedCct] = useState(soloCct ?? "");

  const escuelaOptions = useMemo(() => {
    const list = comparar ? (porEscuelaComparativa ?? porEscuela) : porEscuela;
    return [
      { value: "", label: "General (todas las escuelas)" },
      ...list.map(({ cct }) => ({
        value: cct,
        label: getNombreEscuela(cct) ?? cct,
      })),
    ];
  }, [porEscuela, porEscuelaComparativa, comparar]);

  const stats = useMemo(() => {
    if (!selectedCct) return general;
    return porEscuela.find((e) => e.cct === selectedCct)?.stats ?? general;
  }, [selectedCct, general, porEscuela]);

  const statsComparativa = useMemo(() => {
    if (!generalComparativa) return [];
    if (!selectedCct) return generalComparativa;
    return porEscuelaComparativa?.find((e) => e.cct === selectedCct)?.stats ?? generalComparativa;
  }, [selectedCct, generalComparativa, porEscuelaComparativa]);

  const titulo = selectedCct
    ? getNombreEscuela(selectedCct) ?? selectedCct
    : "Todas las escuelas";

  return (
    <div className="reactivos-page flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2 sm:gap-1.5">
      {!soloCct && (
        <section className="card-ios shrink-0 rounded-xl border border-border bg-card p-2.5 sm:p-2">
          <SelectPopup
            label="Ver:"
            title="Seleccionar alcance"
            value={selectedCct}
            options={escuelaOptions}
            onChange={setSelectedCct}
          />
        </section>
      )}

      <section className="reactivos-panel card-ios flex flex-col rounded-xl border border-border bg-card p-2.5 sm:p-2">
        <h2 className="reactivos-panel__title shrink-0 text-sm font-semibold sm:text-xs lg:text-sm">{titulo}</h2>

        {comparar ? (
          <ul className="reactivos-cards reactivos-cards--comparativa">
            {statsComparativa.map((r) => (
              <li key={r.num} className="reactivos-card">
                <div className="reactivos-card__head">
                  <span className="reactivos-card__num tabular-nums">R{r.num}</span>
                  <NivelBadge nivel={r.nivel} />
                </div>
                <div className="reactivos-card__stats">
                  <div className="reactivos-card__stat">
                    <span className="reactivos-card__stat-label">2025</span>
                    <PctBadge pct={r.pct2025} />
                  </div>
                  <div className="reactivos-card__stat">
                    <span className="reactivos-card__stat-label">2026</span>
                    <PctBadge pct={r.pct2026} />
                  </div>
                  <div className="reactivos-card__stat">
                    <span className="reactivos-card__stat-label">Δ</span>
                    <span className={`reactivos-card__delta tabular-nums ${deltaClass(r.deltaPct)}`}>
                      {r.deltaPct > 0 ? "+" : ""}
                      {r.deltaPct}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="reactivos-table">
            <div className="reactivos-table__head reactivos-table__row">
              <span>Reactivo</span>
              <span className="text-center">Nivel</span>
              <span className="text-center">% acierto</span>
              <span className="text-center">Aciertos</span>
            </div>
            <div className="reactivos-table__body">
              {stats.map((r) => (
                <div key={r.num} className="reactivos-table__row">
                  <span className="font-medium tabular-nums">R{r.num}</span>
                  <span className="text-center">
                    <NivelBadge nivel={r.nivel} />
                  </span>
                  <span className="text-center">
                    <PctBadge pct={r.pctAcierto} />
                  </span>
                  <span className="text-center tabular-nums text-foreground/80">
                    {r.aciertos}/{r.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
