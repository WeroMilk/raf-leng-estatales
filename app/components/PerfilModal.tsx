"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { NivelLenguaje } from "@/types/raf";
import { NIVEL_COLOR } from "@/types/raf";
import type { PerfilNivel } from "@/lib/recursos-raf";

type PerfilTab = "perfil" | "estrategias" | "padres";

interface Props {
  perfil: PerfilNivel;
  isOpen: boolean;
  onClose: () => void;
}

export default function PerfilModal({ perfil, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<PerfilTab>("perfil");
  const color = NIVEL_COLOR[perfil.nivel];

  useEffect(() => {
    if (isOpen) setActiveTab("perfil");
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perfil-modal-title"
    >
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal content */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl animate-stagger-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="shrink-0 px-5 pt-5 pb-4"
          style={{ borderBottom: `3px solid ${color}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-foreground"
                  style={{ backgroundColor: color }}
                >
                  {perfil.nivel}
                </span>
                <h2 id="perfil-modal-title" className="text-base font-bold text-foreground lg:text-lg">
                  {perfil.titulo}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 transition-colors hover:bg-foreground/20 hover:text-foreground"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-border bg-[var(--fill-tertiary)]/20">
          {(["perfil", "estrategias", "padres"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 bg-card text-foreground"
                  : "border-b-2 border-transparent text-foreground/60 hover:bg-[var(--fill-tertiary)]/50"
              }`}
              style={activeTab === tab ? { borderBottomColor: color } : undefined}
            >
              {tab === "perfil" && "Perfil"}
              {tab === "estrategias" && "Estrategias"}
              {tab === "padres" && "Para padres"}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeTab === "perfil" && (
            <div className="space-y-5 text-sm text-foreground/90">
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span style={{ color }}>●</span> Perfil del lector
                </h4>
                <ul className="ml-4 space-y-1.5 list-disc">
                  {perfil.perfil.map((p, i) => (
                    <li key={i} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span style={{ color }}>●</span> Necesita
                </h4>
                <ul className="ml-4 space-y-1.5 list-disc">
                  {perfil.necesita.map((n, i) => (
                    <li key={i} className="leading-relaxed">{n}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span style={{ color }}>●</span> Fortalezas
                </h4>
                <p className="leading-relaxed">{perfil.fortalezas}</p>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span style={{ color }}>●</span> Retos
                </h4>
                <p className="leading-relaxed">{perfil.dificultades}</p>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span style={{ color }}>●</span> Intervención docente
                </h4>
                <ul className="ml-4 space-y-1.5 list-disc">
                  {perfil.intervencionDocente.map((i, idx) => (
                    <li key={idx} className="leading-relaxed">{i}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border/50 bg-[var(--fill-tertiary)]/30 p-4">
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  Meta
                </h4>
                <p className="font-medium leading-relaxed" style={{ color }}>{perfil.meta}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-[var(--fill-tertiary)]/20 p-3">
                <p className="text-xs italic leading-relaxed text-foreground/60">{perfil.notaTecnica}</p>
              </div>
            </div>
          )}

          {activeTab === "estrategias" && (
            <div className="space-y-5 text-sm text-foreground/90">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  Para estudiantes
                </h4>
                <ul className="ml-4 space-y-2 list-disc">
                  {perfil.estrategiasEstudiante.map((e, i) => (
                    <li key={i} className="leading-relaxed">{e}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  Para docentes
                </h4>
                <ul className="ml-4 space-y-2 list-disc">
                  {perfil.estrategiasDocente.map((e, i) => (
                    <li key={i} className="leading-relaxed">{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "padres" && (
            <div className="space-y-4 text-sm text-foreground/90">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Estrategias para padres o cuidadores
              </h4>
              <ul className="ml-4 space-y-2 list-disc">
                {perfil.estrategiasPadres.map((e, i) => (
                  <li key={i} className="leading-relaxed">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
