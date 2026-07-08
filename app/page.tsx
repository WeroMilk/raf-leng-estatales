import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  getResultadosSync,
  getEvaluacionSync,
  resolveEvalId,
} from "@/lib/data-server";
import { COLORS, DESCRIPTORES_NIVEL, NIVELES_LENGUAJE } from "@/types/raf";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";
import PageHeader from "@/app/components/PageHeader";
import ChartPastelDistribucion from "@/app/components/ChartPastelDistribucion";
import HeaderEvaluacionControles from "@/app/components/HeaderEvaluacionControles";
import DashboardComparativo from "@/app/components/DashboardComparativo";
import { getSession } from "@/lib/auth";
import { filtrarEscuelasPorZona, parseZonasParam } from "@/lib/zonas";
import { parseEvalParam, buildQueryString, isComparativa } from "@/lib/eval-query";
import { resumenDesdeEscuelas } from "@/lib/comparativa";
import { formatUltimaActualizacion } from "@/lib/format-fecha";
import { RAF_CONFIG } from "@/lib/raf-config";

function parseZonasFromParams(params: { zona?: string | string[] }) {
  return parseZonasParam(params.zona);
}

export default async function HomePage({
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

  const zonasFiltro =
    session?.tipo === "zona" && session.zona != null
      ? [session.zona]
      : parseZonasFromParams(params);

  const ev2025 = getEvaluacionSync("despegue2025");
  const ev2026 = getEvaluacionSync("aterrizaje2026");
  const parcial2026 = ev2026?.parcial ?? false;

  let escuelas2025 = ev2025?.escuelas ?? [];
  let escuelas2026 = ev2026?.escuelas ?? [];

  const filterEscuelas = <T extends { cct: string }>(list: T[]) => {
    let out = list;
    if (session?.tipo === "escuela" && session.cct) {
      out = out.filter((e) => e.cct === session.cct);
    } else if (session?.tipo === "zona" && session.zona != null) {
      out = filtrarEscuelasPorZona(out, [session.zona]);
    } else if (session?.tipo === "super" && zonasFiltro.length > 0) {
      out = filtrarEscuelasPorZona(out, zonasFiltro);
    }
    return out;
  };

  escuelas2025 = filterEscuelas(escuelas2025);
  escuelas2026 = filterEscuelas(escuelas2026);

  const { escuelas, generado, evaluacion } = comparar
    ? { escuelas: escuelas2025, generado: ev2025?.generado ?? "", evaluacion: ev2025 }
    : getResultadosSync(evalId);

  let escuelasActivas = escuelas;
  if (!comparar) {
    if (session?.tipo === "escuela" && session.cct) {
      escuelasActivas = escuelas.filter((e) => e.cct === session.cct);
    } else if (session?.tipo === "zona" && session.zona != null) {
      escuelasActivas = filtrarEscuelasPorZona(escuelas, [session.zona]);
    } else if (session?.tipo === "super" && zonasFiltro.length > 0) {
      escuelasActivas = filtrarEscuelasPorZona(escuelas, zonasFiltro);
    }
  }

  const resumen2025 = resumenDesdeEscuelas(escuelas2025);
  const resumen2026 = resumenDesdeEscuelas(escuelas2026);

  const totalAlumnos = escuelasActivas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const totalN1 = escuelasActivas.reduce((s, e) => s + (e.nivel1 ?? 0), 0);
  const totalN2 = escuelasActivas.reduce((s, e) => s + (e.nivel2 ?? 0), 0);
  const totalN3 = escuelasActivas.reduce((s, e) => s + (e.nivel3 ?? 0), 0);
  const totalN4 = escuelasActivas.reduce((s, e) => s + (e.nivel4 ?? 0), 0);
  const pctN1 = totalAlumnos ? Math.round((totalN1 / totalAlumnos) * 100) : 0;
  const pctN2 = totalAlumnos ? Math.round((totalN2 / totalAlumnos) * 100) : 0;
  const pctN3 = totalAlumnos ? Math.round((totalN3 / totalAlumnos) * 100) : 0;
  const pctN4 = totalAlumnos ? Math.round((totalN4 / totalAlumnos) * 100) : 0;

  const nivelTotales = [
    { n: 1, total: totalN1, pct: pctN1, color: COLORS.nivel1 },
    { n: 2, total: totalN2, pct: pctN2, color: COLORS.nivel2 },
    { n: 3, total: totalN3, pct: pctN3, color: COLORS.nivel3 },
    { n: 4, total: totalN4, pct: pctN4, color: COLORS.nivel4 },
  ];

  const qsBase = buildQueryString({ evalModo, zona: zonasFiltro });
  const basePorNivel = `/por-nivel${qsBase}`;

  return (
    <div className="home-page animate-fade-in">
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
          <>
            <p className="text-xs leading-snug text-foreground/80 lg:text-sm">
              {RAF_CONFIG.nombrePlural}
            </p>
            {session?.tipo === "zona" && (
              <span className="text-sm font-medium text-foreground/70">Zona {session.zona}</span>
            )}
          </>
        }
      >
        <h1 className="page-title">RAF Lenguaje</h1>
      </PageHeader>

      <ScrollOnlyWhenNeeded className="home-page__scroll flex min-h-0 flex-1 flex-col overflow-x-hidden">
        {comparar ? (
          escuelas2025.length === 0 && escuelas2026.length === 0 ? (
            <div className="empty-state card-ios rounded-2xl border border-border bg-card">
              <span className="empty-state__icon" aria-hidden>📊</span>
              <p className="empty-state__text">No hay datos para comparar en este momento.</p>
            </div>
          ) : (
            <div className="home-page__main">
              <DashboardComparativo
                resumen2025={resumen2025}
                resumen2026={resumen2026}
                basePorNivel={basePorNivel}
                              />
              <p className="home-page__updated">
                Última actualización: {formatUltimaActualizacion(generado)}
              </p>
            </div>
          )
        ) : escuelasActivas.length === 0 ? (
          <div className="empty-state card-ios rounded-2xl border border-border bg-card">
            <span className="empty-state__icon" aria-hidden>📋</span>
            <p className="empty-state__text">
              No hay datos para {evaluacion?.nombreCorto ?? "esta evaluación"}.
            </p>
          </div>
        ) : (
          <div className="home-page__main">
            {parcial2026 && evalId === "aterrizaje2026" && (
              <p className="text-xs text-foreground/70">
                <span className="eval-badge--parcial">
                  <span aria-hidden>⚠</span> Datos parciales — {escuelas2026.length} de {escuelas2025.length} escuelas
                </span>
              </p>
            )}
              <section className="home-page__levels grid min-w-0 grid-cols-4 gap-1.5 lg:gap-3">
              <p className="label-alumnos-por-nivel col-span-full">Alumnos por nivel</p>
              {nivelTotales.map(({ n, total, pct, color }) => (
                <Link
                  key={n}
                  href={`${basePorNivel}${basePorNivel.includes("?") ? "&" : "?"}nivel=${n}&vista=colocacion`}
                  className="nivel-card link-ios group relative flex min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl p-2 text-center text-foreground lg:rounded-2xl"
                  style={{ backgroundColor: color }}
                  title={`${pct}% · ${DESCRIPTORES_NIVEL[n as 1 | 2 | 3 | 4]}`}
                >
                  <span className="nivel-card__pct-badge tabular-nums">{pct}%</span>
                  <div className="nivel-card__count tabular-nums">{total}</div>
                  <div className="nivel-card__label">Nivel {n}</div>
                </Link>
              ))}
            </section>

            <section className="home-page__summary card-ios shrink-0 rounded-xl border border-border bg-card p-2 lg:rounded-2xl lg:p-4">
              <p className="text-xs font-semibold lg:text-base">
                {totalAlumnos} Alumnos Evaluados · {escuelasActivas.length} Escuelas · Primer Grado
              </p>
              <p className="text-xs text-foreground/70">{evaluacion?.nombre}</p>
            </section>

            <section className="home-page__charts">
              <h2 className="label-alumnos-por-nivel mb-1 shrink-0 lg:mb-1.5">Distribución por nivel</h2>
              <div className="home-charts-grid">
                {NIVELES_LENGUAJE.map((n) => (
                  <Link
                    key={n}
                    href={`${basePorNivel}${basePorNivel.includes("?") ? "&" : "?"}nivel=${n}&vista=colocacion`}
                    className="link-ios group/chart flex h-full min-h-0 w-full min-w-0 rounded-xl transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sonora)]"
                  >
                    <div className="h-full w-full rounded-xl transition-shadow group-hover/chart:shadow-md">
                      <ChartPastelDistribucion
                        nivel={n}
                        escuelas={escuelasActivas}
                        color={COLORS[`nivel${n}` as keyof typeof COLORS]}
                        descriptor={DESCRIPTORES_NIVEL[n]}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <p className="home-page__updated">
              Última actualización: {formatUltimaActualizacion(generado)}
            </p>
          </div>
        )}
      </ScrollOnlyWhenNeeded>
    </div>
  );
}
