import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getEscuelaSync,
  getGrupoComparativoSync,
  resolveEvalId,
  getEvaluacionSync,
} from "@/lib/data-server";
import TablaAlumnosLenguaje from "@/app/components/TablaAlumnosLenguaje";
import TablaAlumnosComparativa from "@/app/components/TablaAlumnosComparativa";
import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";
import DistribucionNivelesCharts from "@/app/components/DistribucionNivelesCharts";
import DistribucionNivelesComparativa from "@/app/components/DistribucionNivelesComparativa";
import { grupoToEscuelaResumen } from "@/lib/escuela-charts";
import { resumenDesdeEscuelas } from "@/lib/comparativa";
import { parseEvalParam, isComparativa, appendEvalParam } from "@/lib/eval-query";

export default async function GrupoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cct: string; grupo: string }>;
  searchParams: Promise<{ eval?: string | string[] }>;
}) {
  const { cct, grupo } = await params;
  const sp = await searchParams;
  const evalModo = parseEvalParam(sp.eval);
  const comparar = isComparativa(evalModo);
  const evalId = resolveEvalId(evalModo);
  const grupoDecoded = decodeURIComponent(grupo);

  if (comparar) {
    const comp = getGrupoComparativoSync(cct, grupoDecoded);
    const ref = comp.escuela2025 ?? comp.escuela2026;
    if (!ref) notFound();
    if (comp.alumnos.length === 0) notFound();

    const g25 = comp.escuela2025?.grupos.find((g) => g.nombre === grupoDecoded);
    const g26 = comp.escuela2026?.grupos.find((g) => g.nombre === grupoDecoded);
    const resumen2025 = g25 ? resumenDesdeEscuelas([grupoToEscuelaResumen(g25, cct)]) : null;
    const resumen2026 = g26 ? resumenDesdeEscuelas([grupoToEscuelaResumen(g26, cct)]) : null;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 min-w-0">
        <PageHeader
          centerContent={
            <Suspense fallback={null}>
              <SelectorEvaluacion />
            </Suspense>
          }
        >
          <BackButton
            href={appendEvalParam(`/escuela/${cct}`, "comparar")}
            label={ref.buscador?.nombre ?? ref.cct}
          />
          <h1 className="mt-1 text-base font-bold">Grupo {grupoDecoded}</h1>
          <p className="text-xs text-foreground/80">Comparativa alumno por alumno</p>
        </PageHeader>

        {(resumen2025 || resumen2026) && (
          <section className="shrink-0">
            {resumen2025 && resumen2026 ? (
              <DistribucionNivelesComparativa
                resumen2025={resumen2025}
                resumen2026={resumen2026}
                showLabel
              />
            ) : (
              <div className="comparativa-dual-grid">
                {g25 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--year-2025)]">Despegue 2025</p>
                    <DistribucionNivelesCharts
                      escuelas={[grupoToEscuelaResumen(g25, cct)]}
                      size="compact"
                      descriptorVariant="short"
                    />
                  </div>
                )}
                {g26 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--year-2026)]">Aterrizaje 2026</p>
                    <DistribucionNivelesCharts
                      escuelas={[grupoToEscuelaResumen(g26, cct)]}
                      size="compact"
                      descriptorVariant="short"
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
          <TablaAlumnosComparativa alumnos={comp.alumnos} evalModo="comparar" cctDefault={cct} />
        </div>
      </div>
    );
  }

  const escuela = getEscuelaSync(cct, evalId);
  if (!escuela) notFound();
  const grupoData = escuela.grupos.find((g) => g.nombre === grupoDecoded);
  if (!grupoData) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 min-w-0">
      <PageHeader
        centerContent={
          <Suspense fallback={null}>
            <SelectorEvaluacion />
          </Suspense>
        }
      >
        <BackButton href={appendEvalParam(`/escuela/${cct}`, evalModo)} label={escuela.cct} />
        <h1 className="mt-1 text-base font-bold">Grupo {grupoData.nombre}</h1>
        <p className="text-xs text-foreground/80">{grupoData.total} alumnos</p>
      </PageHeader>

      <ScrollOnlyWhenNeeded className="flex min-h-0 flex-1 flex-col gap-2 min-w-0">
        <section className="shrink-0">
          <DistribucionNivelesCharts
            escuelas={[grupoToEscuelaResumen(grupoData, cct)]}
            showLabel
            size="compact"
            descriptorVariant="short"
            linkNivel={{
              evalModo,
              cct,
              grupo: `${cct}|${grupoDecoded}`,
              origen: "escuela",
            }}
          />
        </section>
        <TablaAlumnosLenguaje alumnos={grupoData.alumnos} cct={cct} evalModo={evalModo} />
      </ScrollOnlyWhenNeeded>
    </div>
  );
}
