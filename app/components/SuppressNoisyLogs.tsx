"use client";

import { useEffect } from "react";

function shouldSkip(args: unknown[]): boolean {
  const msg = typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
  return (
    msg.includes("React DevTools") ||
    msg.includes("react.dev/link/react-devtools") ||
    msg.includes("[HMR]") ||
    msg.includes("preloaded using link preload but not used") ||
    (msg.includes("_next/static/chunks") && msg.includes("preload")) ||
    msg.includes("width(-1) and height(-1) of chart") ||
    msg.includes("Content Security Policy") ||
    msg.includes("blocks the use of 'eval'") ||
    msg.includes("Learn more: Content Security Policy")
  );
}

export default function SuppressNoisyLogs() {
  useEffect(() => {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args: unknown[]) => {
      if (shouldSkip(args)) return;
      origLog.apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
      if (shouldSkip(args)) return;
      origWarn.apply(console, args);
    };
    console.error = (...args: unknown[]) => {
      if (shouldSkip(args)) return;
      origError.apply(console, args);
    };

    return () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    };
  }, []);
  return null;
}
