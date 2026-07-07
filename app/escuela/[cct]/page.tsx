import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import {
  getEscuelaSync,
  getEscuelaComparativaSync,
  resolveEvalId,
  getEvaluacionSync,
} from "@/lib/data-server";
import { getSession } from "@/lib/auth";
import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";
import DistribucionNivelesCharts from "@/app/components/DistribucionNivelesCharts";
import DistribucionNivelesComparativa from "@/app/components/DistribucionNivelesComparativa";
import { grupoToEscuelaResumen, countsToEscuelaResumen } from "@/lib/escuela-charts";
import { parseEvalParam, isComparativa, appendEvalParam } from "@/lib/eval-query";
import { calcularDelta, deltaClass, deltaLabel } from "@/lib/comparativa";

export default async function EscuelaPage({
  params,
  searchParams,
}: {
  params: Promise<{ cct: string }>;
  searchParams: Promise<{ eval?: string | string[] }>;
}) {
  const { cct } = await params;
  const sp = await searchParams;
  const evalModo = parseEvalParam(sp.eval);
  const comparar = isComparativa(evalModo);
  const evalId = resolveEvalId(evalModo);

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);
  const isSuper = session?.tipo === "super";
  const parcial2026 = getEvaluacionSync("aterrizaje2026")?.parcial ?? false;

  if (comparar) {
    const comp = getEscuelaComparativaSync(cct);
    if (!comp.despegue2025 && !comp.aterrizaje2026) notFound();

    const delta =
      comp.resumen2025 && comp.resumen2026
        ? calcularDelta(comp.resumen2025, comp.resumen2026)
        : null;

    const ref = comp.despegue2025 ?? comp.aterrizaje2026!;
    const backHref = isSuper ? appendEvalParam("/escuelas", "comparar") : "/";

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2 pb-2 pt-1 min-w-0 lg:gap-3 lg:pt-1.5 lg:px-0 lg:pb-8">
        <PageHeader
          centerContent={
            <Suspense fallback={null}>
              <SelectorEvaluacion parcial2026={parcial2026} />
            </Suspense>
          }
        >
          <div className="flex flex-wrap items-start gap-2">
            {isSuper && <BackButton href={backHref} label="Escuelas" />}
          </div>
          <h1 className="mt-0 text-base font-bold lg:text-xl lg:tracking-tight">
            {ref.buscador?.nombre ?? ref.cct}
          </h1>
          <p className="text-xs text-foreground/80">Comparativa · {ref.cct}</p>
        </PageHeader>

        <ScrollOnlyWhenNeeded className="flex min-h-0 flex-1 flex-col gap-1.5 min-w-0">
        {!comp.aterrizaje2026 && (
          <p className="shrink-0 text-xs">
            <span className="eval-badge--solo-2025">Sin datos de Aterrizaje 2026</span>
          </p>
        )}

        <section className="shrink-0">
          {comp.resumen2025 && comp.resumen2026 ? (
            <DistribucionNivelesComparativa
              resumen2025={comp.resumen2025}
              resumen2026={comp.resumen2026}
              showLabel
              linkNivel={{ evalModo: "comparar", cct, origen: "comparar" }}
            />
          ) : (
            <div className="comparativa-dual-grid">
              {comp.resumen2025 && comp.despegue2025 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--year-2025)]">Despegue 2025</p>
                  <DistribucionNivelesCharts
                    escuelas={[comp.despegue2025]}
                    size="compact"
                    descriptorVariant="short"
                    linkNivel={{
                      evalModo: "despegue2025",
                      cct,
                      origen: "comparar",
                    }}
                  />
                </div>
              )}
              {comp.resumen2026 && comp.aterrizaje2026 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--year-2026)]">Aterrizaje 2026</p>
                  <DistribucionNivelesCharts
                    escuelas={[comp.aterrizaje2026]}
                    size="compact"
                    descriptorVariant="short"
                    linkNivel={{
                      evalModo: "aterrizaje2026",
                      cct,
                      origen: "comparar",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {delta && (
          <section className="shrink-0">
            <p className="label-alumnos-por-nivel mb-1">Cambio (2026 − 2025)</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {([1, 2, 3, 4] as const).map((n) => {
                const d =
                  n === 1 ? delta.nivel1 : n === 2 ? delta.nivel2 : n === 3 ? delta.nivel3 : delta.nivel4;
                return (
                  <span key={n} className={`card-ios rounded-lg px-2 py-1 ${deltaClass(d)}`}>
                    Δ N{n}: {deltaLabel(d)}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-1.5 pb-2 lg:gap-2 lg:pb-4">
            <h2 className="shrink-0 text-xs font-semibold lg:text-sm">Grupos</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {comp.grupos.map((g) => (
                <li key={g.nombre} className="flex min-w-0">
                  <Link
                    href={appendEvalParam(
                      `/escuela/${cct}/grupo/${encodeURIComponent(g.nombre)}`,
                      "comparar"
                    )}
                    className="link-ios card-ios flex h-full w-full flex-col items-start rounded-xl border border-border bg-card p-2 text-left lg:rounded-2xl lg:p-2.5"
                  >
                    <span className="w-full truncate text-xs font-semibold">{g.nombre}</span>
                    <div className="mt-1 w-full space-y-1 pointer-events-none">
                      {g.despegue2025 && (
                        <DistribucionNivelesCharts
                          escuelas={[countsToEscuelaResumen(g.despegue2025, cct)]}
                          size="mini"
                          descriptorVariant="none"
                        />
                      )}
                      {g.aterrizaje2026 && (
                        <DistribucionNivelesCharts
                          escuelas={[countsToEscuelaResumen(g.aterrizaje2026, cct)]}
                          size="mini"
                          descriptorVariant="none"
                        />
                      )}
                    </div>
                    {g.deltaN3 != null && (
                      <span className={`mt-1 text-[10px] font-semibold leading-none ${deltaClass(g.deltaN3)}`}>
                        Δ N3: {deltaLabel(g.deltaN3)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </ScrollOnlyWhenNeeded>
      </div>
    );
  }

  const escuela = getEscuelaSync(cct, evalId);
  if (!escuela) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2 pb-2 pt-1 min-w-0 lg:gap-3 lg:pt-1.5 lg:px-0 lg:pb-8">
      <PageHeader
        centerContent={
          <Suspense fallback={null}>
            <SelectorEvaluacion parcial2026={parcial2026} />
          </Suspense>
        }
      >
        <div className="flex flex-wrap items-start gap-2">
          {isSuper && <BackButton href={appendEvalParam("/escuelas", evalModo)} label="Escuelas" />}
        </div>
        <h1 className="mt-0 text-base font-bold lg:text-xl lg:tracking-tight">
          {escuela.buscador?.nombre ?? escuela.cct}
        </h1>
        <p className="text-xs text-foreground/80 lg:text-sm leading-tight">
          {escuela.cct}
          {escuela.buscador?.localidad || escuela.buscador?.municipio
            ? ` · ${[escuela.buscador.localidad, escuela.buscador.municipio].filter(Boolean).join(", ")}`
            : ""}
        </p>
        <p className="text-xs text-foreground/70 lg:text-sm leading-tight">
          {escuela.totalEstudiantes} alumnos · {escuela.grupos.length} grupos
        </p>
      </PageHeader>

      <section className="shrink-0">
        <DistribucionNivelesCharts
          escuelas={[escuela]}
          showLabel
          size="compact"
          descriptorVariant="short"
          linkNivel={{
            evalModo,
            cct,
            origen: "escuela",
          }}
        />
      </section>

      <ScrollOnlyWhenNeeded className="min-h-0 flex-1 min-w-0">
        <div className="flex flex-col gap-1.5 pb-2 lg:gap-2 lg:pb-4">
          <h2 className="shrink-0 text-xs font-semibold lg:text-sm">Grupos</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {escuela.grupos.map((g) => (
              <li key={g.nombre} className="flex min-w-0">
                <Link
                  href={appendEvalParam(
                    `/escuela/${escuela.cct}/grupo/${encodeURIComponent(g.nombre)}`,
                    evalModo
                  )}
                  className="link-ios card-ios flex h-full w-full flex-col items-center rounded-xl border border-border bg-card p-1.5 text-center lg:rounded-2xl lg:p-2.5"
                >
                  <span className="w-full truncate text-xs font-semibold leading-tight lg:text-sm">{g.nombre}</span>
                  <span className="text-[10px] leading-none text-foreground/70 lg:text-xs">
                    {g.total} alumnos
                  </span>
                  <div className="mt-1 w-full pointer-events-none">
                    <DistribucionNivelesCharts
                      escuelas={[grupoToEscuelaResumen(g, escuela.cct)]}
                      size="mini"
                      descriptorVariant="none"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ScrollOnlyWhenNeeded>
    </div>
  );
}
