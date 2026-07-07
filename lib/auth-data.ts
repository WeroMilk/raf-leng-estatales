import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

// Importación directa para que el JSON se incluya en el bundle (Vercel/serverless)
import authDataBundled from "./auth-data.json";

type AuthData = {
  superUsuario: string;
  escuelas?: Record<string, string>;
  zonas?: Record<string, string>;
};

function trimEnv(value: string | undefined): string {
  const s = (value ?? "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

function parseAuthData(parsed: Record<string, unknown>): AuthData {
  const rawSuper = ((): string => {
    const direct = parsed["superUsuario"] ?? parsed["super"];
    if (typeof direct === "string") return direct;
    const norm = (k: string) => k.replace(/\uFEFF/g, "").trim().toLowerCase();
    const key = Object.keys(parsed).find(
      (k) => norm(k) === "superusuario" || norm(k) === "super"
    );
    return key && typeof parsed[key] === "string" ? (parsed[key] as string) : "";
  })();
  const fileSuperHash = typeof rawSuper === "string" ? rawSuper.trim() : "";
  const escuelas =
    parsed["escuelas"] && typeof parsed["escuelas"] === "object" && !Array.isArray(parsed["escuelas"])
      ? (parsed["escuelas"] as Record<string, string>)
      : {};
  const zonas =
    parsed["zonas"] && typeof parsed["zonas"] === "object" && !Array.isArray(parsed["zonas"])
      ? (parsed["zonas"] as Record<string, string>)
      : {};
  return { superUsuario: fileSuperHash, escuelas, zonas };
}

function load(): AuthData {
  const envSuperHash = trimEnv(process.env.AUTH_SUPER_HASH) || "";
  try {
    const filePath = path.join(process.cwd(), "lib", "auth-data.json");
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const data = parseAuthData(parsed);
    return { ...data, superUsuario: envSuperHash || data.superUsuario };
  } catch {
    // Fallback: usar el JSON importado (incluido en el bundle para Vercel)
    const data = parseAuthData(authDataBundled as Record<string, unknown>);
    return { ...data, superUsuario: envSuperHash || data.superUsuario };
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password, "utf8").digest("hex");
}

function normalizePasswordForVerify(password: string): string {
  return String(password ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ""); // espacios normales + no-separables + BOM
}

export function verifyPassword(
  password: string
): { tipo: "super" | "escuela" | "zona"; cct?: string; zona?: number } | null {
  const normalized = normalizePasswordForVerify(password);
  if (!normalized) return null;
  const envSuperPassword = trimEnv(process.env.AUTH_SUPER_PASSWORD);
  if (envSuperPassword && normalized === normalizePasswordForVerify(envSuperPassword)) {
    return { tipo: "super" };
  }
  const data = load();
  const hash = hashPassword(normalized);
  const superHash = (data.superUsuario || "").trim();
  if (superHash && hash === superHash) return { tipo: "super" };
  // Zonas (prioridad sobre escuelas)
  if (data.zonas) {
    for (const [zonaStr, h] of Object.entries(data.zonas)) {
      if (h != null && String(h).trim() === hash) {
        const zona = parseInt(zonaStr, 10);
        if (!isNaN(zona)) return { tipo: "zona", zona };
      }
    }
  }
  // Escuelas (retrocompatibilidad)
  if (data.escuelas) {
    for (const [cct, h] of Object.entries(data.escuelas)) {
      if (h != null && String(h).trim() === hash) return { tipo: "escuela", cct };
    }
  }
  return null;
}
