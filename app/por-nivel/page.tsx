import { cookies } from "next/headers";
import { Suspense } from "react";
import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import PorNivelContent from "./PorNivelContent";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";
import {
  getResultadosSync,
  getAlumnosPorNivelSync,
  getAlumnosPorNivelGeneralSync,
  resolveEvalId,
  getEvaluacionSync,
} from "@/lib/data-server";
import { getSession } from "@/lib/auth";
import { filtrarEscuelasPorZona, parseZonasParam } from "@/lib/zonas";
import type { NivelLenguaje, EscuelaResumen } from "@/types/raf";
import { NIVELES_LENGUAJE } from "@/types/raf";
import { parseEvalParam, buildQueryString, isComparativa, appendEvalParam } from "@/lib/eval-query";
import type { Session } from "@/lib/auth";

function filterByCct<T extends { cct: string }>(arr: T[], cct: string): T[] {
  return arr.filter((x) => x.cct === cct);
}

function filterByCcts<T extends { cct: string }>(arr: T[], ccts: Set<string>): T[] {
  return arr.filter((x) => ccts.has(x.cct));
}

function parseZonas(params: { zona?: string | string[] }) {
  return parseZonasParam(params.zona);
}

function filtrarEscuelasContexto(
  list: EscuelaResumen[],
  session: Session | null,
  zonasFiltro: number[],
  cctParam: string,
  grupoParam: string
): EscuelaResumen[] {
  let out = list;
  if (session?.tipo === "escuela" && session.cct) {
    out = out.filter((e) => e.cct === session.cct);
  } else {
    if (zonasFiltro.length > 0) {
      out = filtrarEscuelasPorZona(out, zonasFiltro);
    }
    if (cctParam) {
      out = out.filter((e) => e.cct === cctParam);
    }
  }
  if (grupoParam) {
    const [cctG, grupoG] = grupoParam.split("|");
    out = out.filter((e) => e.cct === cctG && e.grupos.some((g) => g.nombre === grupoG));
  }
  return out;
}

function toEscuelaTotales(list: EscuelaResumen[]) {
  return list.map((e) => ({
    cct: e.cct,
    totalEstudiantes: e.totalEstudiantes,
    grupos: e.grupos.map((g) => ({ nombre: g.nombre, total: g.total })),
  }));
}

export default async function PorNivelPage({
  searchParams,
}: {
  searchParams: Promise<{
    nivel?: string;
    grupo?: string;
    vista?: string;
    cct?: string;
    zona?: string | string[];
    eval?: string | string[];
    origen?: string;
  }>;
}) {
  const params = await searchParams;
  const evalModo = parseEvalParam(params.eval);
  const comparar = isComparativa(evalModo);
  const evalId = resolveEvalId(evalModo);
  const parcial2026 = getEvaluacionSync("aterrizaje2026")?.parcial ?? false;

  const nivelParam = params.nivel ?? "";
  const nivelFiltro: NivelLenguaje | null =
    ["1", "2", "3", "4"].includes(nivelParam) ? (parseInt(nivelParam, 10) as NivelLenguaje) : null;
  const grupoParam = params.grupo ?? "";
  const cctParam = params.cct ?? "";
  const origenParam = params.origen ?? "";
  const vistaExplicita = params.vista;
  const vistaRefuerzo = vistaExplicita === "refuerzo";
  const vistaColocacion = !vistaRefuerzo;

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);
  const zonasFiltro =
    session?.tipo === "zona" && session.zona != null
      ? [session.zona]
      : parseZonas(params);

  const getAlumnos = vistaRefuerzo ? getAlumnosPorNivelSync : getAlumnosPorNivelGeneralSync;

  const loadAlumnosPorEval = (id: typeof evalId) => ({
    1: getAlumnos(1, id),
    2: getAlumnos(2, id),
    3: getAlumnos(3, id),
    4: getAlumnos(4, id),
  });

  let { escuelas } = getResultadosSync(evalId);
  let alumnosPorNivel = loadAlumnosPorEval(evalId);
  let alumnosPorNivel2026 = comparar ? loadAlumnosPorEval("aterrizaje2026") : undefined;

  const applyFilters = <T extends { cct: string; alumno?: { grupo: string } }>(
    arr: T[],
    cctFilter?: string
  ) => {
    let out = arr;
    if (cctFilter) out = filterByCct(out, cctFilter);
    if (grupoParam) {
      const [cctG, grupoG] = grupoParam.split("|");
      out = out.filter((x) => x.cct === cctG && x.alumno?.grupo === grupoG);
    }
    return out;
  };

  if (session?.tipo === "escuela" && session.cct) {
    escuelas = escuelas.filter((e) => e.cct === session.cct);
    for (const nivel of NIVELES_LENGUAJE) {
      alumnosPorNivel[nivel] = filterByCct(alumnosPorNivel[nivel], session.cct);
      if (alumnosPorNivel2026) {
        alumnosPorNivel2026[nivel] = filterByCct(alumnosPorNivel2026[nivel], session.cct);
      }
    }
  } else {
    if (zonasFiltro.length > 0) {
      escuelas = filtrarEscuelasPorZona(escuelas, zonasFiltro);
      const ccts = new Set(escuelas.map((e) => e.cct));
      for (const nivel of NIVELES_LENGUAJE) {
        alumnosPorNivel[nivel] = filterByCcts(alumnosPorNivel[nivel], ccts);
        if (alumnosPorNivel2026) {
          alumnosPorNivel2026[nivel] = filterByCcts(alumnosPorNivel2026[nivel], ccts);
        }
      }
    }
    if (cctParam) {
      escuelas = escuelas.filter((e) => e.cct === cctParam);
      for (const nivel of NIVELES_LENGUAJE) {
        alumnosPorNivel[nivel] = applyFilters(alumnosPorNivel[nivel], cctParam);
        if (alumnosPorNivel2026) {
          alumnosPorNivel2026[nivel] = applyFilters(alumnosPorNivel2026[nivel], cctParam);
        }
      }
    }
  }

  if (grupoParam && !cctParam) {
    for (const nivel of NIVELES_LENGUAJE) {
      alumnosPorNivel[nivel] = applyFilters(alumnosPorNivel[nivel]);
      if (alumnosPorNivel2026) {
        alumnosPorNivel2026[nivel] = applyFilters(alumnosPorNivel2026[nivel]);
      }
    }
  } else if (grupoParam && cctParam) {
    for (const nivel of NIVELES_LENGUAJE) {
      alumnosPorNivel[nivel] = applyFilters(alumnosPorNivel[nivel], cctParam);
      if (alumnosPorNivel2026) {
        alumnosPorNivel2026[nivel] = applyFilters(alumnosPorNivel2026[nivel], cctParam);
      }
    }
  }

  const gruposOptions = escuelas.flatMap((e) =>
    e.grupos.map((g) => ({
      cct: e.cct,
      grupo: g.nombre,
      label: `${e.cct} - ${g.nombre}`,
    }))
  );

  const escuelas2026Filtradas = comparar
    ? filtrarEscuelasContexto(
        getEvaluacionSync("aterrizaje2026")?.escuelas ?? [],
        session,
        zonasFiltro,
        cctParam,
        grupoParam
      )
    : [];

  const qsHome = buildQueryString({ evalModo, zona: zonasFiltro });
  const homeHref = qsHome ? `/${qsHome}` : "/";

  const backHref = nivelFiltro
    ? (() => {
        if (cctParam && origenParam === "comparar") {
          return appendEvalParam(`/escuela/${cctParam}`, "comparar");
        }
        if (cctParam && origenParam === "escuela") {
          return appendEvalParam(`/escuela/${cctParam}`, evalModo);
        }
        const q = new URLSearchParams();
        if (evalModo !== "despegue2025") q.set("eval", evalModo);
        if (vistaColocacion) q.set("vista", "colocacion");
        if (cctParam) q.set("cct", cctParam);
        if (grupoParam) q.set("grupo", grupoParam);
        zonasFiltro.forEach((z) => q.append("zona", String(z)));
        return `/por-nivel${q.toString() ? `?${q.toString()}` : ""}`;
      })()
    : homeHref;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden px-2 pt-1 pb-2">
      <PageHeader>
        <div className="page-header__toolbar">
          <BackButton href={backHref} label={nivelFiltro ? (cctParam ? "Escuela" : "Por nivel") : "Inicio"} />
          <Suspense fallback={null}>
            <SelectorEvaluacion parcial2026={parcial2026} />
          </Suspense>
        </div>
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PorNivelContent
          alumnosPorNivel={alumnosPorNivel}
          alumnosPorNivel2026={comparar ? alumnosPorNivel2026 : undefined}
          escuelasTotales={toEscuelaTotales(escuelas)}
          escuelasTotales2026={comparar ? toEscuelaTotales(escuelas2026Filtradas) : undefined}
          escuelas={escuelas.map((e) => ({ cct: e.cct }))}
          gruposOptions={gruposOptions}
          nivelFiltro={nivelFiltro}
          soloCct={session?.tipo === "escuela" ? session.cct : undefined}
          initialCct={cctParam || undefined}
          initialGrupo={grupoParam}
          vistaColocacion={vistaColocacion}
          vistaRefuerzo={vistaRefuerzo}
          zonasFiltro={zonasFiltro}
          evalModo={evalModo}
          comparar={comparar}
        />
      </div>
    </div>
  );
}
