import { Suspense } from "react";
import { cookies } from "next/headers";
import PageHeader from "@/app/components/PageHeader";
import EvalSelectorShell from "@/app/components/EvalSelectorShell";
import SelectorEvaluacion from "@/app/components/SelectorEvaluacion";
import ReactivosContent from "@/app/reactivos/ReactivosContent";
import { getEscuelasSync, getEvaluacionSync, resolveEvalId } from "@/lib/data-server";
import {
  getReactivosGeneralesCached,
  getReactivosEscuelaSync,
  getReactivosComparativaSync,
  type ReactivoStats,
  type ReactivoComparativo,
  type ReactivosPorEscuela,
} from "@/lib/reactivos";
import { parseEvalParam, isComparativa } from "@/lib/eval-query";
import { getSession } from "@/lib/auth";

function buildPorEscuela(evalId: "despegue2025" | "aterrizaje2026", soloCct?: string): ReactivosPorEscuela[] {
  const escuelas = soloCct
    ? getEscuelasSync(evalId).filter((e) => e.cct === soloCct)
    : getEscuelasSync(evalId);

  const out: ReactivosPorEscuela[] = [];
  for (const { cct } of escuelas) {
    const stats = getReactivosEscuelaSync(cct, evalId);
    if (stats) out.push({ cct, stats });
  }
  return out;
}

export default async function ReactivosPage({
  searchParams,
}: {
  searchParams: Promise<{ eval?: string | string[] }>;
}) {
  const sp = await searchParams;
  const evalModo = parseEvalParam(sp.eval);
  const comparar = isComparativa(evalModo);
  const evalId = resolveEvalId(evalModo);
  const parcial2026 = getEvaluacionSync("aterrizaje2026")?.parcial ?? false;

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("raf_session")?.value ?? null);
  const soloCct = session?.tipo === "escuela" ? session.cct : undefined;

  let general: ReactivoStats[] = [];
  let porEscuela: ReactivosPorEscuela[] = [];
  let generalComparativa: ReactivoComparativo[] | undefined;
  let porEscuelaComparativa: { cct: string; stats: ReactivoComparativo[] }[] | undefined;

  if (comparar) {
    const comparativa = getReactivosComparativaSync(soloCct);
    generalComparativa = comparativa.general;
    porEscuelaComparativa = comparativa.porEscuela;
  } else {
    porEscuela = buildPorEscuela(evalId, soloCct);
    general = soloCct
      ? (porEscuela[0]?.stats ?? getReactivosGeneralesCached(evalId))
      : getReactivosGeneralesCached(evalId);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 pt-1 pb-2">
      <PageHeader>
        <div className="page-header__toolbar">
          <h1 className="min-w-0 flex-1 text-base font-bold leading-tight">Aciertos por reactivo</h1>
          <Suspense fallback={<EvalSelectorShell evalModo={evalModo} parcial2026={parcial2026} />}>
            <SelectorEvaluacion parcial2026={parcial2026} />
          </Suspense>
        </div>
      </PageHeader>
      <ReactivosContent
        comparar={comparar}
        general={general}
        porEscuela={porEscuela}
        generalComparativa={generalComparativa}
        porEscuelaComparativa={porEscuelaComparativa}
        soloCct={soloCct}
      />
    </div>
  );
}
