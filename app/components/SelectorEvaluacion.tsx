"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { EvalModo } from "@/types/raf";

const OPCIONES: { id: EvalModo; label: string; short: string }[] = [
  { id: "despegue2025", label: "Despegue 2025", short: "2025" },
  { id: "aterrizaje2026", label: "Aterrizaje 2026", short: "2026" },
  { id: "comparar", label: "Comparativa", short: "Comp." },
];

export default function SelectorEvaluacion() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const current: EvalModo = (() => {
    const ev = searchParams.get("eval");
    if (ev === "aterrizaje2026" || ev === "comparar") return ev;
    return "despegue2025";
  })();

  const currentOption = OPCIONES.find((o) => o.id === current) ?? OPCIONES[0];

  const setEval = (id: EvalModo) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "despegue2025") {
      params.delete("eval");
    } else {
      params.set("eval", id);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  useEffect(() => {
    for (const { id } of OPCIONES) {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "despegue2025") params.delete("eval");
      else params.set("eval", id);
      const qs = params.toString();
      router.prefetch(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const modal =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eval-selector-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-card shadow-2xl animate-stagger-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="eval-selector-title" className="text-sm font-bold text-foreground">
              Ver resultados
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-foreground/70"
              aria-label="Cerrar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="p-2">
            {OPCIONES.map(({ id, label }) => {
              const selected = current === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setEval(id)}
                    className={`btn-ios w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "bg-[var(--fill-secondary)] text-foreground"
                        : "text-foreground/80 hover:bg-[var(--fill-tertiary)]"
                    }`}
                    aria-pressed={selected}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="eval-selector-wrap">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="eval-selector-mobile"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Evaluación: ${currentOption.label}. Toca para cambiar.`}
      >
        <span className="eval-selector-mobile__label">{currentOption.short}</span>
        <svg className="eval-selector-mobile__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="eval-selector" role="tablist" aria-label="Evaluación RAF">
        {OPCIONES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            onClick={() => setEval(id)}
            className={`eval-selector__btn ${current === id ? "eval-selector__btn--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {modal}
    </div>
  );
}
