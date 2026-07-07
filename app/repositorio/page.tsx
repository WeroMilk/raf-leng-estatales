import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";

const BTN_CLASS =
  "inline-flex items-center gap-2 rounded-xl border border-border/60 bg-[var(--fill-tertiary)] px-4 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-[var(--fill-secondary)] hover:border-border";

export default function RepositorioPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden px-4 pt-2 pb-2 lg:px-6 lg:pt-3 lg:pb-6">
      <PageHeader>
        <Link href="/recursos" className={BTN_CLASS}>
          <svg className="h-4 w-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Recursos
        </Link>
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0 -mt-2 animate-fade-in">
        <header className="shrink-0 space-y-0.5 -mt-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight lg:text-2xl">
            Repositorio
          </h1>
          <p className="text-sm text-foreground/70 lg:text-base">
            Archivos descargables en Word, Excel y PDF
          </p>
        </header>
        <ScrollOnlyWhenNeeded className="min-h-0 flex-1 overflow-x-hidden pb-6">
          <section className="mt-6">
            <a
              href="/documentos/raf-comparativa-2025-2026.pdf"
              download
              className="card-ios inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md"
            >
              <svg className="h-5 w-5 shrink-0 text-[var(--sonora)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>
                Comparativa RAF Lenguaje 2025 vs 2026
                <span className="mt-0.5 block text-xs font-normal text-foreground/60">PDF · Todas las escuelas</span>
              </span>
            </a>
          </section>
        </ScrollOnlyWhenNeeded>
      </div>
    </div>
  );
}
