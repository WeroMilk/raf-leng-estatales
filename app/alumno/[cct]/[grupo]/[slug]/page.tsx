import { notFound } from "next/navigation";
import { Suspense } from "react";
import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";
import ExamenAlumno from "@/app/components/ExamenAlumno";
import { getAlumnoSync, getEvaluacionSync, resolveEvalId } from "@/lib/data-server";
import { parseEvalParam, isComparativa, appendEvalParam } from "@/lib/eval-query";
import { EVALUACIONES_CATALOGO } from "@/types/raf";

export default async function AlumnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cct: string; grupo: string; slug: string }>;
  searchParams: Promise<{ eval?: string | string[] }>;
}) {
  const { cct, grupo, slug } = await params;
  const sp = await searchParams;
  const evalModo = parseEvalParam(sp.eval);
  const comparar = isComparativa(evalModo);
  const evalId = resolveEvalId(evalModo);
  const grupoDecoded = decodeURIComponent(grupo);

  const alumno = getAlumnoSync(cct, grupoDecoded, slug, evalId);
  const alumno2025 = comparar ? getAlumnoSync(cct, grupoDecoded, slug, "despegue2025") : null;
  const alumno2026 = comparar ? getAlumnoSync(cct, grupoDecoded, slug, "aterrizaje2026") : null;

  const ref = alumno ?? alumno2025 ?? alumno2026;
  if (!ref) notFound();

  const nombreCompleto = `${ref.apellido} ${ref.nombre}`.trim();
  const backHref = appendEvalParam(
    `/escuela/${encodeURIComponent(cct)}/grupo/${encodeURIComponent(grupoDecoded)}`,
    evalModo
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
      <PageHeader
        centerContent={
          <Suspense fallback={null}>
            <SelectorEvaluacion />
          </Suspense>
        }
      >
        <BackButton href={backHref} label={`Grupo ${grupoDecoded}`} />
        <h1 className="mt-1 text-base font-bold">{nombreCompleto}</h1>
        <p className="text-xs text-foreground/80">
          Examen individual · Grupo {grupoDecoded}
        </p>
      </PageHeader>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        {comparar ? (
          <>
            {alumno2025 && (
              <ExamenAlumno
                alumno={alumno2025}
                evalLabel={EVALUACIONES_CATALOGO.despegue2025.nombreCorto}
              />
            )}
            {alumno2026 && (
              <ExamenAlumno
                alumno={alumno2026}
                evalLabel={EVALUACIONES_CATALOGO.aterrizaje2026.nombreCorto}
              />
            )}
            {!alumno2025 && !alumno2026 && alumno && <ExamenAlumno alumno={alumno} />}
          </>
        ) : (
          alumno && <ExamenAlumno alumno={alumno} />
        )}
      </div>
    </div>
  );
}
