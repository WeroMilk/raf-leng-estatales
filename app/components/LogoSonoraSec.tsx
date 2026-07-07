"use client";

import { useState } from "react";
import Image from "next/image";

const LOGO_WRAPPER_CLASS =
  "rounded-xl flex items-center justify-center relative";
const LOGO_WRAPPER_DEFAULT = "p-2 min-h-[96px]";
const LOGO_WRAPPER_HEADER = "p-1.5 min-h-0 sm:p-2";

function LogoTextFallback() {
  return (
    <div className="text-center w-full">
      <p
        className="text-base font-bold leading-tight sm:text-lg"
        style={{
          background: "linear-gradient(180deg, #ea580c 0%, #a21caf 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        SONORA
      </p>
      <p className="text-[10px] font-medium leading-tight text-amber-700 mt-0.5 sm:text-xs">
        TIERRA DE OPORTUNIDADES
      </p>
      <p className="text-[9px] leading-tight text-foreground/80 mt-1 sm:text-[10px]">
        Secretaría de Educación y Cultura
      </p>
    </div>
  );
}

export default function LogoSonoraSec({
  className = "",
  maxWidth = 200,
  priority = false,
  variant = "default",
}: {
  className?: string;
  maxWidth?: number;
  priority?: boolean;
  /** "header" = compacto para barra superior; "default" = tamaño normal */
  variant?: "default" | "header";
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const wrapperSize = variant === "header" ? LOGO_WRAPPER_HEADER : LOGO_WRAPPER_DEFAULT;
  return (
    <div
      className={`${LOGO_WRAPPER_CLASS} ${wrapperSize} ${className}`}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {imgError && <LogoTextFallback />}
      <Image
        src="/Logtipo_EscudoColor.png"
        alt="Sonora Tierra de Oportunidades · Secretaría de Educación y Cultura"
        width={Math.min(maxWidth, 480)}
        height={100}
        className={
          imgLoaded && !imgError
            ? `w-full h-auto object-contain opacity-100 transition-opacity duration-200 ${
                variant === "header" ? "max-h-[58px] sm:max-h-[68px] lg:max-h-[76px]" : "max-h-[96px]"
              }`
            : `absolute inset-0 m-auto w-auto max-w-full object-contain opacity-0 transition-opacity duration-200 ${
                variant === "header" ? "max-h-[58px] sm:max-h-[68px] lg:max-h-[76px]" : "max-h-[96px]"
              }`
        }
        style={{ maxWidth: "100%" }}
        priority={priority}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
}
