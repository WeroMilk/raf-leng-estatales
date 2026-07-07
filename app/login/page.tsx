"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LogoSonoraSec from "@/app/components/LogoSonoraSec";

const ERROR_MESSAGES: Record<string, string> = {
  empty: "Campo requerido",
  invalid: "Contraseña incorrecta",
  server: "Error al iniciar sesión. Intenta de nuevo.",
  auth_secret_required:
    "La app no está configurada en el servidor. El administrador debe añadir AUTH_SECRET en Vercel (Variables de entorno).",
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMsg = searchParams.get("msg");
  const [error, setError] = useState("");

  useEffect(() => {
    if (errorCode) {
      const decoded = errorMsg ? decodeURIComponent(errorMsg) : "";
      setError((ERROR_MESSAGES[decoded] ?? ERROR_MESSAGES[errorCode] ?? decoded) || "Error");
    }
  }, [errorCode, errorMsg]);

  return (
    <div className="login-page flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div
        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto overflow-x-hidden px-6 py-8"
        style={{
          paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
          paddingRight: "max(1.5rem, env(safe-area-inset-right))",
          paddingTop: "max(2rem, env(safe-area-inset-top))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex justify-center pt-2">
            <LogoSonoraSec maxWidth={300} className="sm:hidden" priority />
            <LogoSonoraSec maxWidth={380} className="hidden sm:block" priority />
          </div>

          <div className="login-card animate-fade-in">
          <div className="mb-6 flex flex-col gap-1.5">
            <h1 className="page-title">RAF Lenguaje</h1>
            <p className="page-subtitle">Ingresa la contraseña de tu C.T.</p>
          </div>

          <form
            action="/api/login"
            method="POST"
            className="flex w-full flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.querySelector<HTMLInputElement>('input[name="password"]');
              const password = input
                ? input.value.trim().replace(/\s+/g, "").replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
                : "";
              if (!password) {
                setError(ERROR_MESSAGES.empty);
                return;
              }
              setLoading(true);
              setError("");
              try {
                const res = await fetch("/api/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Accept: "application/json" },
                  body: JSON.stringify({ password }),
                  credentials: "include",
                });
                const data = (await res.json()) as { ok?: boolean; redirect?: string; error?: string; msg?: string };
                if (data.ok && data.redirect) {
                  window.location.href = data.redirect;
                  return;
                }
                const err = data.msg ?? data.error ?? "invalid";
                setError(ERROR_MESSAGES[err] ?? ERROR_MESSAGES[err as keyof typeof ERROR_MESSAGES] ?? String(err));
              } catch {
                setError(ERROR_MESSAGES.server);
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="sr-only" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              autoFocus
              required
              readOnly={loading}
              className="card-ios w-full rounded-xl border border-border bg-background px-4 py-3.5 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-[var(--sonora)] disabled:opacity-60"
            />
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-login-sonora w-full rounded-2xl py-3.5 font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
        </div>
      </div>

      <div className="login-credits shrink-0 text-center">
        <p>Base de Datos creada por:</p>
        <p>Mtra. Rosa Isela y Luis Silvas.</p>
      </div>
    </div>
  );
}
