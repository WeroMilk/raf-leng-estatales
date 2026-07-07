"use client";

import FiltroZona from "@/app/components/FiltroZona";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";

interface Props {
  parcial2026?: boolean;
  showFiltroZona?: boolean;
}

export default function HeaderEvaluacionControles({ parcial2026, showFiltroZona }: Props) {
  return (
    <div className="page-header__controls">
      {showFiltroZona && <FiltroZona />}
      <SelectorEvaluacion parcial2026={parcial2026} />
    </div>
  );
}
