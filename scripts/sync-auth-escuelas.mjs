#!/usr/bin/env node
/**
 * Sincroniza auth-data.json.escuelas con los CCTs de public/data/resultados.json.
 * - Añade hashes para CCTs nuevos (genera contraseña aleatoria, escribe en lib/passwords-nuevos.txt).
 * - Elimina de escuelas los CCTs que ya no están en resultados.
 * No modifica superUsuario.
 *
 * Uso: node scripts/sync-auth-escuelas.mjs
 * (Ejecutar después de npm run build:data si cambió el listado de escuelas.)
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTADOS_PATH = path.join(ROOT, "public", "data", "resultados.json");
const AUTH_DATA_PATH = path.join(ROOT, "lib", "auth-data.json");
const PASSWORDS_NUEVOS_PATH = path.join(ROOT, "lib", "passwords-nuevos.txt");

function normalizePassword(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function randomPassword(length = 12) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, "utf8"));
const cctsEnResultados = new Set((resultados.escuelas || []).map((e) => e.cct));

const authData = JSON.parse(fs.readFileSync(AUTH_DATA_PATH, "utf8"));
const escuelas = { ...(authData.escuelas || {}) };

let added = [];
let removed = [];

for (const cct of cctsEnResultados) {
  if (!escuelas[cct]) {
    const pwd = randomPassword(12);
    escuelas[cct] = sha256(normalizePassword(pwd));
    added.push({ cct, pwd });
  }
}

for (const cct of Object.keys(escuelas)) {
  if (!cctsEnResultados.has(cct)) {
    delete escuelas[cct];
    removed.push(cct);
  }
}

authData.escuelas = escuelas;
fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(authData, null, 2), "utf8");

if (added.length > 0) {
  const lines = added.map(({ cct, pwd }) => `${cct}\t${pwd}`);
  fs.writeFileSync(PASSWORDS_NUEVOS_PATH, lines.join("\n") + "\n", "utf8");
  console.log("CCTs nuevos (contraseñas en", PASSWORDS_NUEVOS_PATH + "):");
  added.forEach(({ cct, pwd }) => console.log(" ", cct, "→", pwd));
}

if (removed.length > 0) {
  console.log("CCTs eliminados (ya no en resultados):", removed.join(", "));
}

if (added.length === 0 && removed.length === 0) {
  console.log("auth-data.escuelas ya está en sync con resultados.json. Nada que actualizar.");
} else {
  console.log("Actualizado:", AUTH_DATA_PATH);
}
