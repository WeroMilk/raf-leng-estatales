"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NivelLenguaje } from "@/types/raf";
import { NIVEL_COLOR } from "@/types/raf";
import {
  TABLA_CORTES,
  PERFILES_NIVEL,
  GUIA_PADRES_RAF,
  type PerfilNivel,
} from "@/lib/recursos-raf";
import ScrollOnlyWhenNeeded from "@/app/components/ScrollOnlyWhenNeeded";
import PerfilModal from "@/app/components/PerfilModal";

export default function RecursosContent() {
  const [modalPerfil, setModalPerfil] = useState<PerfilNivel | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const match = hash.match(/^nivel-([1-4])$/);
    if (match) {
      const n = parseInt(match[1], 10) as NivelLenguaje;
      const perfil = PERFILES_NIVEL.find((p) => p.nivel === n);
      if (perfil) setModalPerfil(perfil);
      document.getElementById("perfiles")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden animate-fade-in pt-0">
      {/* Hero / Header */}
      <header className="shrink-0 space-y-2">
        <Link
          href="/repositorio"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-[var(--fill-tertiary)] px-4 py-2.5 text-sm font-medium text-foreground/90 transition-all hover:bg-[var(--fill-secondary)] hover:border-border hover:shadow-sm"
        >
          <svg className="h-4 w-4 shrink-0 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Repositorio
        </Link>
      </header>

      <ScrollOnlyWhenNeeded className="min-h-0 flex-1 pb-6">
        <div className="space-y-8">
          {/* Tabla de clasificación - Cards modernas */}
          <section id="clasificacion" className="shrink-0 scroll-mt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground lg:text-base">
              <span className="text-lg">📊</span>
              Clasificación por nivel
            </h2>
            <p className="mb-3 text-xs text-foreground/70 lg:text-sm">
              Clasificación por nivel de lectura
            </p>
            <div className="card-grid-scroll-safe grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TABLA_CORTES.map((c) => (
                <div
                  key={c.nivel}
                  className="card-ios card-with-accent flex overflow-hidden rounded-2xl border border-border bg-card transition-shadow"
                >
                  <div
                    className="card-with-accent__bar shrink-0"
                    style={{ backgroundColor: NIVEL_COLOR[c.nivel] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 p-4">
                  <div className="mb-2">
                    <span
                      className="inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-foreground"
                      style={{ backgroundColor: NIVEL_COLOR[c.nivel] }}
                    >
                      Nivel {c.nivel}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60">
                    Escalera cognitiva completa
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/90">{c.caracterizacion}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Perfiles lectores */}
          <section id="perfiles" className="shrink-0 scroll-mt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground lg:text-base">
              <span className="text-lg">📖</span>
              Perfiles lectores por nivel
            </h2>
            <p className="mb-4 text-xs text-foreground/70 lg:text-sm">
              Haz clic en cada nivel para ver el perfil completo, estrategias e intervenciones
            </p>
            <div className="card-grid-scroll-safe grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PERFILES_NIVEL.map((perfil) => (
                <button
                  key={perfil.nivel}
                  type="button"
                  onClick={() => setModalPerfil(perfil)}
                  className="card-ios card-with-accent card-tap-safe group flex w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 lg:hover:scale-[1.01]"
                >
                  <div
                    className="card-with-accent__bar shrink-0"
                    style={{ backgroundColor: NIVEL_COLOR[perfil.nivel] }}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col items-start p-4">
                  <span
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-foreground"
                    style={{ backgroundColor: NIVEL_COLOR[perfil.nivel] }}
                  >
                    {perfil.nivel}
                  </span>
                  <div className="text-sm font-semibold text-foreground">{perfil.titulo}</div>
                  <span className="mt-3 flex items-center gap-1 text-[10px] font-medium text-foreground/50 group-hover:text-foreground/70">
                    Ver más
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {modalPerfil && (
            <PerfilModal
              perfil={modalPerfil}
              isOpen
              onClose={() => setModalPerfil(null)}
            />
          )}

          {/* Guía para madres y/o padres RAF (cuidadores RAF) */}
          <section id="guia-padres" className="shrink-0 scroll-mt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground lg:text-base">
              <span className="text-lg">👨‍👩‍👧</span>
              Guía para madres y/o padres RAF (cuidadores RAF)
            </h2>
            <div className="mb-4 space-y-2 text-xs leading-relaxed text-foreground/80 lg:text-sm">
              <p>
                Cada estudiante avanza a su propio ritmo, y lo más importante no es el nivel en el que se encuentra hoy, sino el apoyo constante que recibe en casa.
              </p>
              <p>
                A continuación, encontrará algunas sugerencias para acompañar a su hijo(a) según su nivel lector actual. No se trata de hacer tareas adicionales, sino de integrar pequeños momentos de lectura y conversación en nuestro día a día.
              </p>
            </div>
            <div className="card-grid-scroll-safe grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GUIA_PADRES_RAF.map((g) => (
                <div
                  key={g.nivel}
                  className="card-ios card-with-accent flex overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div
                    className="card-with-accent__bar shrink-0"
                    style={{ backgroundColor: NIVEL_COLOR[g.nivel] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 p-4">
                  <div
                    className="mb-3 rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground"
                    style={{ backgroundColor: NIVEL_COLOR[g.nivel] }}
                  >
                    {g.nombre}
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-foreground/90">{g.descripcion}</p>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                    Cómo apoyarlo:
                  </p>
                  <ol className="mb-3 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-foreground/90">
                    {g.comoApoyarlo.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                  <p className="text-[10px] font-medium text-foreground/80">
                    <span className="font-semibold">Objetivo:</span> {g.objetivo}
                  </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recomendaciones para directores y supervisores */}
          <section id="directores-supervisores" className="shrink-0 scroll-mt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground lg:text-base">
              <span className="text-lg">👔</span>
              Recomendaciones para directores y supervisores
            </h2>
            <div className="card-ios rounded-2xl border border-dashed border-border bg-[var(--fill-tertiary)]/30 p-6 text-center">
              <p className="text-sm text-foreground/60">
                Próximamente se agregarán recomendaciones para directores y supervisores.
              </p>
            </div>
          </section>
        </div>
      </ScrollOnlyWhenNeeded>
    </div>
  );
}
