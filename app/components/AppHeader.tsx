"use client";

import LogoSonoraSec from "@/app/components/LogoSonoraSec";

/**
 * Header global con el logo de Sonora siempre en la esquina superior derecha.
 * Se muestra en todas las pantallas excepto login (que tiene su propio logo centrado y grande).
 * En móvil y desktop: misma posición, esquina superior derecha.
 */
export default function AppHeader() {
  return (
    <header
      className="app-header-bar shrink-0 flex items-center justify-end min-h-[52px] pt-[env(safe-area-inset-top)] pr-[max(12px,env(safe-area-inset-right))] pl-4"
      aria-label="Cabecera"
    >
      <div className="flex shrink-0 items-center justify-end w-[130px] sm:w-[160px]">
        <LogoSonoraSec variant="header" maxWidth={160} className="w-full" />
      </div>
    </header>
  );
}
