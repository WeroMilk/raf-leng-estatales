"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string };

export default function SelectPopup({
  label,
  title,
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
  className = "",
}: {
  label: string;
  title: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

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
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`select-popup-${title.replace(/\s+/g, "-")}`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className="relative flex max-h-[min(80vh,480px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-card shadow-2xl animate-stagger-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <h2
              id={`select-popup-${title.replace(/\s+/g, "-")}`}
              className="text-sm font-bold text-foreground"
            >
              {title}
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
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {options.map(({ value: optValue, label: optLabel }) => {
              const isSelected = value === optValue;
              return (
                <li key={optValue || "__empty__"}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(optValue);
                      setOpen(false);
                    }}
                    className={`btn-ios w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-[var(--fill-secondary)] text-foreground"
                        : "text-foreground/80 hover:bg-[var(--fill-tertiary)]"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {optLabel}
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
    <>
      <div className={`flex min-w-0 items-center gap-2 ${className}`}>
        <span className="shrink-0 text-xs font-semibold text-foreground/80 sm:text-sm">{label}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="select-ios flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-border bg-[var(--fill-tertiary)] px-2.5 py-1.5 text-left text-xs font-medium text-foreground sm:text-sm"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {modal}
    </>
  );
}
