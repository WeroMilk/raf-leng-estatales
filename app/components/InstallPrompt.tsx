"use client";

import { useState, useEffect } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setShow(false);
    setDeferredPrompt(null);
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-16 left-2 right-2 z-40 rounded-2xl bg-gris-iphone p-4 text-white shadow-xl sm:left-auto sm:right-2 sm:max-w-xs">
      <p className="text-xs font-medium">Instala la app para acceder más rápido.</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="btn-ios rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#8e8e93]"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="btn-ios rounded-xl border border-white/50 px-4 py-2 text-xs text-white"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
