"use client";

import { useState } from "react";
import Image from "next/image";

const LOGO_WRAPPER_CLASS =
  "relative mx-auto flex w-full items-center justify-center rounded-xl";
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
            ? `mx-auto block h-auto w-auto max-w-full object-contain opacity-100 transition-opacity duration-200 ${
                variant === "header" ? "max-h-[72px] sm:max-h-[84px] lg:max-h-[96px]" : "max-h-[148px]"
              }`
            : `absolute inset-0 m-auto block h-auto w-auto max-w-full object-contain opacity-0 transition-opacity duration-200 ${
                variant === "header" ? "max-h-[72px] sm:max-h-[84px] lg:max-h-[96px]" : "max-h-[148px]"
              }`
        }
        style={{
          maxWidth: "100%",
          width: "auto",
          height: "auto",
          aspectRatio: "603 / 295",
          marginLeft: "auto",
          marginRight: "auto",
          objectPosition: "center",
        }}
        priority={priority}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
}
