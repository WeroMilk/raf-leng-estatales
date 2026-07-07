"use client";

import type { ReactNode } from "react";

/**
 * Contenedor con scroll vertical cuando el contenido desborda.
 * Solo CSS: evita ResizeObserver y cambios de minHeight que provocaban parpadeos.
 */
export default function ScrollOnlyWhenNeeded({
  children,
  className = "",
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style">) {
  return (
    <div
      className={`scroll-area overflow-x-hidden overflow-y-auto ${className}`.trim()}
      style={{ WebkitOverflowScrolling: "touch", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
