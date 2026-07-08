"use client";

import FiltroZona from "@/app/components/FiltroZona";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";

interface Props {
  showFiltroZona?: boolean;
}

export default function HeaderEvaluacionControles({ showFiltroZona }: Props) {
  return (
    <div className="page-header__controls">
      {showFiltroZona && <FiltroZona />}
      <SelectorEvaluacion />
    </div>
  );
}
