import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";
import EscuelasContent from "./EscuelasContent";
import EscuelasComparativaContent from "./EscuelasComparativaContent";
import HeaderEvaluacionControles from "@/app/components/HeaderEvaluacionControles";
import DistribucionNivelesCharts from "@/app/components/DistribucionNivelesCharts";
import DistribucionNivelesComparativa from "@/app/components/DistribucionNivelesComparativa";
import {
  getEscuelasSync,
  getEscuelasUnionSync,
  getEvaluacionSync,
  resolveEvalId,
} from "@/lib/data-server";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { filtrarEscuelasPorZona, parseZonasParam } from "@/lib/zonas";
import { parseEvalParam, buildQueryString, isComparativa } from "@/lib/eval-query";
import { resumenDesdeEscuelas } from "@/lib/comparativa";

function parseZonas(params: { zona?: string | string[] }) {
  return parseZonasParam(params.zona);
}

export default async function EscuelasPage({
  searchParams,
}: {
  searchParams: Promise<{ zona?: string | string[]; eval?: string | string[] }>;
}) {
  const params = await searchParams;
  const evalModo = parseEvalParam(params.eval);
  const comparar = isComparativa(evalModo);
  const evalId = resolveEvalId(evalModo);

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);

  let zonas = parseZonas(params);
  if (session?.tipo === "zona" && session.zona != null && zonas.length === 0) {
    zonas = [session.zona];
  }

  const ev2026 = getEvaluacionSync("aterrizaje2026");
  const parcial2026 = ev2026?.parcial ?? false;

  let escuelas = comparar ? [] : getEscuelasSync(evalId);
  let escuelasUnion = comparar ? getEscuelasUnionSync() : [];

  if (zonas.length > 0) {
    if (comparar) {
      escuelasUnion = escuelasUnion.filter((e) => {
        const ref = e.despegue2025 ?? e.aterrizaje2026;
        if (!ref) return false;
        const filtered = filtrarEscuelasPorZona([ref], zonas);
        return filtered.length > 0;
      });
    } else {
      escuelas = filtrarEscuelasPorZona(escuelas, zonas);
    }
  }

  const resumen2025 = comparar
    ? resumenDesdeEscuelas(
        escuelasUnion.map((e) => e.despegue2025).filter(Boolean) as NonNullable<
          (typeof escuelasUnion)[0]["despegue2025"]
        >[]
      )
    : resumenDesdeEscuelas(escuelas);

  const resumen2026 = comparar
    ? resumenDesdeEscuelas(
        escuelasUnion.map((e) => e.aterrizaje2026).filter(Boolean) as NonNullable<
          (typeof escuelasUnion)[0]["aterrizaje2026"]
        >[]
      )
    : resumenDesdeEscuelas(escuelas);

  const qs = buildQueryString({ evalModo, zona: zonas });
  const homeHref = qs ? `/${qs}` : "/";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden p-2">
      <PageHeader
        centerContent={
          <Suspense fallback={null}>
            <HeaderEvaluacionControles
              parcial2026={parcial2026}
              showFiltroZona={session?.tipo === "super"}
            />
          </Suspense>
        }
        meta={
          session?.tipo === "zona" ? (
            <span className="text-sm font-medium text-foreground/70">Zona {session.zona}</span>
          ) : undefined
        }
      >
        <BackButton href={homeHref} label="Inicio" />
        <h1 className="mt-1 text-base font-bold">
          {comparar ? "Comparativa por escuela" : "Por escuela"}
        </h1>
        <p className="text-xs text-foreground/80">
          {comparar ? "Despegue 2025 vs Aterrizaje 2026" : "Selecciona una escuela."}
        </p>
      </PageHeader>

      {(comparar ? escuelasUnion.length : escuelas.length) === 0 ? (
        <p className="text-xs text-foreground/60">No hay escuelas cargadas.</p>
      ) : (
        <>
          <section className="shrink-0">
            {comparar ? (
              <DistribucionNivelesComparativa
                resumen2025={resumen2025}
                resumen2026={resumen2026}
                showLabel
                linkNivel={{ evalModo: "comparar" }}
              />
            ) : (
              <DistribucionNivelesCharts
                escuelas={escuelas}
                showLabel
                size="compact"
                descriptorVariant="short"
                linkNivel={{ evalModo }}
              />
            )}
          </section>
          <ScrollOnlyWhenNeeded className="min-h-0 flex-1 overflow-x-hidden">
            {comparar ? (
              <EscuelasComparativaContent escuelas={escuelasUnion} />
            ) : (
              <EscuelasContent escuelas={escuelas} evalModo={evalModo} />
            )}
          </ScrollOnlyWhenNeeded>
        </>
      )}
    </div>
  );
}
