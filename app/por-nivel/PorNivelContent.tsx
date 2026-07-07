"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NivelLenguaje, EvalModo } from "@/types/raf";
import { NIVELES_LENGUAJE, NIVEL_COLOR, DESCRIPTORES_NIVEL } from "@/types/raf";
import TablaAlumnosNivel from "@/app/components/TablaAlumnosNivel";
import TablaAlumnosComparativa from "@/app/components/TablaAlumnosComparativa";
import SelectPopup from "@/app/components/SelectPopup";
import { getNombreEscuela } from "@/lib/nombres-escuelas";
import { isComparativa } from "@/lib/eval-query";
import { emparejarAlumnosPorNivel } from "@/lib/comparativa";
import type { RowNivel } from "@/lib/data-server";

type ViewMode = "todos" | "escuela" | "grupo";
type SortOrder = "asc" | "desc";

type GrupoOption = { cct: string; grupo: string; label: string };

type EscuelaTotales = {
  cct: string;
  totalEstudiantes: number;
  grupos: { nombre: string; total: number }[];
};

const VIEW_MODE_OPTIONS = [
  { value: "todos", label: "Todas las escuelas" },
  { value: "escuela", label: "Por escuela" },
  { value: "grupo", label: "Por grupo" },
];

const SORT_OPTIONS = [
  { value: "desc", label: "↓ Mayor a menor" },
  { value: "asc", label: "↑ Menor a mayor" },
];

function totalAlumnosEvaluados(
  escuelas: EscuelaTotales[],
  viewMode: ViewMode,
  selectedCct: string,
  selectedGrupo: string
): number {
  if (viewMode === "grupo" && selectedGrupo) {
    const [cct, grupo] = selectedGrupo.split("|");
    const esc = escuelas.find((e) => e.cct === cct);
    return esc?.grupos.find((g) => g.nombre === grupo)?.total ?? 0;
  }
  if (viewMode === "escuela" && selectedCct) {
    return escuelas.find((e) => e.cct === selectedCct)?.totalEstudiantes ?? 0;
  }
  return escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
}

function pctDelCohorte(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

interface Props {
  alumnosPorNivel: Record<NivelLenguaje, RowNivel[]>;
  alumnosPorNivel2026?: Record<NivelLenguaje, RowNivel[]>;
  escuelasTotales?: EscuelaTotales[];
  escuelasTotales2026?: EscuelaTotales[];
  escuelas: { cct: string }[];
  gruposOptions: GrupoOption[];
  nivelFiltro?: NivelLenguaje | null;
  soloCct?: string;
  initialCct?: string;
  initialGrupo?: string;
  vistaColocacion?: boolean;
  vistaRefuerzo?: boolean;
  zonasFiltro?: number[];
  evalModo?: EvalModo;
  comparar?: boolean;
}

export default function PorNivelContent({
  alumnosPorNivel,
  alumnosPorNivel2026,
  escuelasTotales,
  escuelasTotales2026,
  escuelas,
  gruposOptions,
  nivelFiltro = null,
  soloCct,
  initialCct = "",
  initialGrupo = "",
  vistaColocacion = true,
  vistaRefuerzo = false,
  zonasFiltro = [],
  evalModo = "despegue2025",
  comparar = false,
}: Props) {
  const esComparativa = comparar || isComparativa(evalModo);
  const grupoValido =
    initialGrupo &&
    gruposOptions.some(
      (o) => `${o.cct}|${o.grupo}` === initialGrupo
    );
  const cctValido = initialCct && escuelas.some((e) => e.cct === initialCct);
  const [viewMode, setViewMode] = useState<ViewMode>(
    grupoValido ? "grupo" : (soloCct || cctValido) ? "escuela" : "todos"
  );
  const [selectedCct, setSelectedCct] = useState(soloCct ?? initialCct ?? "");
  const [selectedGrupo, setSelectedGrupo] = useState(grupoValido ? initialGrupo : "");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const router = useRouter();

  const escuelaOptions = useMemo(
    () => [
      { value: "", label: "Todas las escuelas" },
      ...escuelas.map((e) => ({
        value: e.cct,
        label: getNombreEscuela(e.cct) ?? e.cct,
      })),
    ],
    [escuelas]
  );

  const grupoPopupOptions = useMemo(
    () => [
      { value: "", label: "Todos los grupos" },
      ...gruposOptions.map((opt) => ({
        value: `${opt.cct}|${opt.grupo}`,
        label: `${getNombreEscuela(opt.cct) ?? opt.cct} · ${opt.grupo}`,
      })),
    ],
    [gruposOptions]
  );

  const dataPorNivel = useMemo(() => {
    const filterRow = (r: RowNivel) => {
      if (viewMode === "todos") return true;
      if (viewMode === "escuela") return r.cct === selectedCct;
      if (viewMode === "grupo") {
        const [cct, grupo] = selectedGrupo.split("|");
        return r.cct === cct && r.alumno.grupo === grupo;
      }
      return true;
    };
    const getPct = (r: RowNivel) => r.alumno.porcentaje;
    const sortRows = (rows: RowNivel[]) =>
      [...rows].sort((a, b) =>
        sortOrder === "asc"
          ? getPct(a) - getPct(b)
          : getPct(b) - getPct(a)
      );
    const out: Record<NivelLenguaje, RowNivel[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };
    for (const nivel of NIVELES_LENGUAJE) {
      const filtered = alumnosPorNivel[nivel].filter(filterRow);
      out[nivel] = sortRows(filtered);
    }
    return out;
  }, [alumnosPorNivel, viewMode, selectedCct, selectedGrupo, sortOrder, nivelFiltro]);

  const totalFiltrado = useMemo(
    () => NIVELES_LENGUAJE.reduce((s, n) => s + dataPorNivel[n].length, 0),
    [dataPorNivel]
  );

  const totalEvaluados = useMemo(
    () =>
      escuelasTotales
        ? totalAlumnosEvaluados(escuelasTotales, viewMode, selectedCct, selectedGrupo)
        : totalFiltrado,
    [escuelasTotales, viewMode, selectedCct, selectedGrupo, totalFiltrado]
  );

  const totalEvaluados2026 = useMemo(
    () =>
      escuelasTotales2026
        ? totalAlumnosEvaluados(escuelasTotales2026, viewMode, selectedCct, selectedGrupo)
        : 0,
    [escuelasTotales2026, viewMode, selectedCct, selectedGrupo]
  );

  const expandedNivel = nivelFiltro;
  const nivelesAMostrar = NIVELES_LENGUAJE;

  const buildQuery = (extra?: Record<string, string>) => {
    const q = new URLSearchParams();
    if (evalModo !== "despegue2025") q.set("eval", evalModo);
    if (vistaColocacion) q.set("vista", "colocacion");
    zonasFiltro.forEach((z) => q.append("zona", String(z)));
    Object.entries(extra ?? {}).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return s ? `?${s}` : "";
  };

  const handleVerLos4 = () => {
    router.push(`/por-nivel${buildQuery()}`);
  };

  const dataPorNivel2026 = useMemo(() => {
    if (!esComparativa || !alumnosPorNivel2026) return null;
    const filterRow = (r: RowNivel) => {
      if (viewMode === "todos") return true;
      if (viewMode === "escuela") return r.cct === selectedCct;
      if (viewMode === "grupo") {
        const [cct, grupo] = selectedGrupo.split("|");
        return r.cct === cct && r.alumno.grupo === grupo;
      }
      return true;
    };
    const getPct = (r: RowNivel) => r.alumno.porcentaje;
    const sortRows = (rows: RowNivel[]) =>
      [...rows].sort((a, b) =>
        sortOrder === "asc"
          ? getPct(a) - getPct(b)
          : getPct(b) - getPct(a)
      );
    const out: Record<NivelLenguaje, RowNivel[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const nivel of NIVELES_LENGUAJE) {
      out[nivel] = sortRows(alumnosPorNivel2026[nivel].filter(filterRow));
    }
    return out;
  }, [esComparativa, alumnosPorNivel2026, viewMode, selectedCct, selectedGrupo, sortOrder, nivelFiltro]);

  const todosRows2025 = useMemo(
    () => NIVELES_LENGUAJE.flatMap((n) => dataPorNivel[n]),
    [dataPorNivel]
  );

  const todosRows2026 = useMemo(
    () => (dataPorNivel2026 ? NIVELES_LENGUAJE.flatMap((n) => dataPorNivel2026[n]) : []),
    [dataPorNivel2026]
  );

  const alumnosComparativosPorNivel = useMemo(() => {
    if (!esComparativa || !dataPorNivel2026) return null;
    const out = {} as Record<NivelLenguaje, ReturnType<typeof emparejarAlumnosPorNivel>>;
    for (const nivel of NIVELES_LENGUAJE) {
      out[nivel] = emparejarAlumnosPorNivel(
        dataPorNivel[nivel],
        dataPorNivel2026[nivel],
        todosRows2025,
        todosRows2026,
        nivel
      );
    }
    return out;
  }, [esComparativa, dataPorNivel2026, dataPorNivel, todosRows2025, todosRows2026]);

  const usaColocacion = vistaColocacion;

  const tituloPrincipal = esComparativa
    ? "Comparativa por nivel"
    : vistaColocacion
      ? "Alumnos por nivel"
      : "Por nivel";
  const tituloNivel = usaColocacion
    ? (n: NivelLenguaje) => `Alumnos en Nivel ${n}: ${DESCRIPTORES_NIVEL[n]}`
    : (n: NivelLenguaje) => `Refuerzo en Nivel ${n}: ${DESCRIPTORES_NIVEL[n]}`;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 px-2 pt-0 pb-2 overflow-hidden">
      {!expandedNivel && (
        <header className="shrink-0 py-0.5">
          <h1 className="text-base font-bold leading-tight">{tituloPrincipal}</h1>
          <p className="text-xs text-foreground/80">
            {esComparativa
              ? "Distribución por nivel de lectura (cada alumno cuenta una sola vez). Toca una sección para ver la lista."
              : vistaColocacion
                ? "Alumnos clasificados por nivel. Organiza por escuela o grupo."
                : "Alumnos que necesitan refuerzo en cada nivel. Toca una sección para ver la lista."}
          </p>
        </header>
      )}

      {expandedNivel && (
        <header className="shrink-0 py-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleVerLos4}
              className="text-left text-xs font-medium text-[var(--gris-iphone)] underline hover:opacity-80"
            >
              ← Ver los 4 niveles
            </button>
            <Link
              href={`/recursos#nivel-${expandedNivel}`}
              className="text-xs font-medium text-[var(--gris-iphone)] underline hover:opacity-80"
            >
              Ver estrategias para este nivel →
            </Link>
          </div>
        </header>
      )}

      <section className="card-ios shrink-0 rounded-xl border border-border bg-card p-2.5 sm:p-3">
        <div className="flex flex-col gap-2">
          {!soloCct && (
            <>
              <SelectPopup
                label="Organizar:"
                title="Organizar por"
                value={viewMode}
                options={VIEW_MODE_OPTIONS}
                onChange={(v) => {
                  const mode = v as ViewMode;
                  setViewMode(mode);
                  if (mode !== "escuela") setSelectedCct("");
                  if (mode !== "grupo") setSelectedGrupo("");
                }}
              />
              {viewMode === "escuela" && (
                <SelectPopup
                  label="Escuela:"
                  title="Seleccionar escuela"
                  value={selectedCct}
                  options={escuelaOptions}
                  placeholder="Escuela"
                  onChange={setSelectedCct}
                />
              )}
              {viewMode === "grupo" && (
                <SelectPopup
                  label="Grupo:"
                  title="Seleccionar grupo"
                  value={selectedGrupo}
                  options={grupoPopupOptions}
                  placeholder="Grupo"
                  onChange={setSelectedGrupo}
                />
              )}
            </>
          )}
          {soloCct && (
            <span className="text-xs text-foreground/70 sm:text-sm">
              Escuela: {getNombreEscuela(soloCct) ?? soloCct}
            </span>
          )}
          <SelectPopup
            label="Ordenar %:"
            title="Ordenar por porcentaje"
            value={sortOrder}
            options={SORT_OPTIONS}
            onChange={(v) => setSortOrder(v as SortOrder)}
            className="sm:ml-auto"
          />
        </div>
      </section>

      {!expandedNivel &&
        (esComparativa ? totalEvaluados > 0 || totalEvaluados2026 > 0 : totalEvaluados > 0) && (
        <p className="shrink-0 text-center text-xs text-foreground/60">
          {esComparativa ? (
            <>
              Alumnos evaluados en 2025:{" "}
              <span className="font-semibold text-foreground">{totalEvaluados}</span>
              {" · "}
              Alumnos evaluados en 2026:{" "}
              <span className="font-semibold text-foreground">{totalEvaluados2026}</span>
            </>
          ) : (
            <>
              Total evaluados: <span className="font-semibold text-foreground">{totalEvaluados}</span> alumnos
            </>
          )}
        </p>
      )}

      <div
        className={`por-nivel-sections flex min-h-0 flex-1 flex-col gap-2 overflow-hidden ${
          expandedNivel ? "por-nivel-sections--expanded" : "por-nivel-sections--stack"
        }`}
      >
        {nivelesAMostrar.map((nivel) => {
          const alumnos = dataPorNivel[nivel];
          const color = NIVEL_COLOR[nivel];
          const label = tituloNivel(nivel);
          const isExpanded = expandedNivel === nivel;
          const pctCohorte = pctDelCohorte(alumnos.length, totalEvaluados);
          const alumnos2026 = dataPorNivel2026?.[nivel].length ?? 0;
          const pctCohorte2026 = pctDelCohorte(alumnos2026, totalEvaluados2026);

          if (expandedNivel && !isExpanded) {
            return null;
          }

          return (
            <section
              key={nivel}
              className={`card-ios flex flex-col overflow-hidden rounded-xl border border-border bg-card p-2 sm:p-2.5 ${
                isExpanded ? "min-h-0 flex-1" : "shrink-0"
              }`}
              {...(!expandedNivel && {
                role: "button",
                tabIndex: 0,
                onClick: () => {
                  router.push(`/por-nivel${buildQuery({ nivel: String(nivel), cct: selectedCct, grupo: selectedGrupo })}`);
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/por-nivel${buildQuery({ nivel: String(nivel), cct: selectedCct, grupo: selectedGrupo })}`);
                  }
                },
              })}
            >
              <h2
                className="mb-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold leading-snug text-foreground sm:text-sm"
                style={{ backgroundColor: color }}
              >
                <span className="line-clamp-2">{label}</span>
                {!expandedNivel && (
                  <span className="mt-0.5 block text-[10px] font-medium opacity-80">
                    Toca para ver la lista de alumnos
                  </span>
                )}
              </h2>

              {isExpanded ? (
                esComparativa && dataPorNivel2026 && alumnosComparativosPorNivel ? (
                  <div className="lista-expandida-por-nivel min-h-0 flex flex-1 flex-col">
                    <TablaAlumnosComparativa
                      alumnos={alumnosComparativosPorNivel[nivel]}
                      nivelPorNivel={nivel}
                      evalModo={evalModo}
                      embedded
                    />
                  </div>
                ) : (
                <div
                  className="lista-expandida-por-nivel min-h-0 flex-1"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <TablaAlumnosNivel
                    alumnosConCct={alumnos}
                    nivelPorNivel={nivel}
                    variant="full"
                    evalModo={evalModo}
                  />
                </div>
                )
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--fill-tertiary)] px-3 py-3">
                  {esComparativa && dataPorNivel2026 ? (
                    <div className="grid w-full grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-semibold text-foreground/70">2025</p>
                        <p className="text-xl font-bold tabular-nums" style={{ color }}>{pctCohorte}%</p>
                        <p className="text-[10px] tabular-nums text-foreground/55">
                          {alumnos.length.toLocaleString("es-MX")} de {totalEvaluados.toLocaleString("es-MX")} alumnos
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-foreground/70">2026</p>
                        <p className="text-xl font-bold tabular-nums" style={{ color }}>{pctCohorte2026}%</p>
                        <p className="text-[10px] tabular-nums text-foreground/55">
                          {alumnos2026.toLocaleString("es-MX")} de {totalEvaluados2026.toLocaleString("es-MX")} alumnos
                        </p>
                      </div>
                    </div>
                  ) : (
                  <>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tabular-nums leading-none" style={{ color }}>
                      {pctCohorte}%
                    </p>
                    <p className="mt-1 text-[11px] text-foreground/60">
                      {alumnos.length.toLocaleString("es-MX")} alumnos en esta categoría
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums leading-none text-foreground/70">
                      {totalEvaluados.toLocaleString("es-MX")}
                    </p>
                    <p className="mt-1 text-[10px] text-foreground/50">evaluados en total</p>
                  </div>
                  </>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
