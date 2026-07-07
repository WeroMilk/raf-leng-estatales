"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ZONAS_CON_ESCUELAS, etiquetaFiltroZonas } from "@/lib/zonas";

function parseZonasFromSearch(sp: URLSearchParams): number[] {
  return sp
    .getAll("zona")
    .map((z) => parseInt(z, 10))
    .filter((n) => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** Filtro de zona para superusuario (una, varias o todas). */
export default function FiltroZona() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const zonasSeleccionadas = parseZonasFromSearch(searchParams);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const visible = pathname === "/" || pathname === "/escuelas";
  const todas = zonasSeleccionadas.length === 0;

  const applyZonas = (zonas: number[]) => {
    const q = new URLSearchParams(searchParams.toString());
    q.delete("zona");
    zonas.forEach((z) => q.append("zona", String(z)));
    const base = pathname === "/escuelas" ? "/escuelas" : "/";
    router.push(`${base}${q.toString() ? `?${q.toString()}` : ""}`);
  };

  const toggleTodas = () => {
    applyZonas([]);
  };

  const toggleZona = (zona: number) => {
    if (zonasSeleccionadas.includes(zona)) {
      applyZonas(zonasSeleccionadas.filter((z) => z !== zona));
    } else {
      applyZonas([...zonasSeleccionadas, zona].sort((a, b) => a - b));
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      if (mobile) document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, mobile]);

  useEffect(() => {
    if (!open || mobile) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, mobile]);

  if (!visible) return null;

  const panelContent = (
    <div className="filtro-zona__panel" role="listbox" aria-multiselectable="true" aria-label="Filtrar por zona">
      <button
        type="button"
        role="option"
        aria-selected={todas}
        onClick={toggleTodas}
        className={`filtro-zona__option filtro-zona__option--todas ${todas ? "filtro-zona__option--active" : ""}`}
      >
        <span className="filtro-zona__check" aria-hidden>
          {todas && <CheckIcon />}
        </span>
        <span>Todas las zonas</span>
      </button>

      <div className="filtro-zona__divider" role="separator" />

      <ul className="filtro-zona__list">
        {ZONAS_CON_ESCUELAS.map((zona) => {
          const selected = zonasSeleccionadas.includes(zona);
          return (
            <li key={zona}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggleZona(zona)}
                className={`filtro-zona__option ${selected ? "filtro-zona__option--active" : ""}`}
              >
                <span className="filtro-zona__check" aria-hidden>
                  {selected && <CheckIcon />}
                </span>
                <span>Zona {zona}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const mobileModal =
    open &&
    mobile &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filtro-zona-title"
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} aria-hidden />
        <div
          className="filtro-zona__sheet relative w-full max-w-sm overflow-hidden rounded-t-2xl bg-card shadow-2xl animate-stagger-in sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="filtro-zona-title" className="text-sm font-bold text-foreground">
              Filtrar por zona
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
          <div className="max-h-[min(62vh,420px)] overflow-y-auto p-2">{panelContent}</div>
          <div className="border-t border-border p-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ios filtro-zona__done w-full rounded-xl py-2.5 text-sm font-semibold">
              Listo
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className="filtro-zona">
      <span className="filtro-zona__label">Zona:</span>
      <div className="filtro-zona__control">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`filtro-zona__trigger ${open ? "filtro-zona__trigger--open" : ""}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Zona: ${etiquetaFiltroZonas(zonasSeleccionadas)}. Toca para cambiar.`}
        >
          <span className="filtro-zona__value">{etiquetaFiltroZonas(zonasSeleccionadas)}</span>
          <ChevronDown className="filtro-zona__chevron" />
        </button>

        {open && !mobile && (
          <div className="filtro-zona__dropdown animate-fade-in">{panelContent}</div>
        )}
      </div>

      {mobileModal}
    </div>
  );
}
