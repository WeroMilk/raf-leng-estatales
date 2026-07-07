#!/usr/bin/env node
/**
 * Asigna a cada escuela una contraseña: dst + parte del CCT + una letra mayúscula aleatoria + "+"
 * Ejemplo: 26DST0078D → dst0078dK+   (la mayúscula varía por escuela, nadie puede adivinar otra)
 * No modifica el superUsuario.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd());
const DATA_PATH = path.join(ROOT, "public", "data", "resultados.json");
const AUTH_DATA_PATH = path.join(ROOT, "lib", "auth-data.json");
const PASSWORDS_PATH = path.join(ROOT, "lib", "passwords-inicial.txt");
const LISTA_PATH = path.join(ROOT, "USUARIOS-Y-CONTRASEÑAS.txt");

function normalizePassword(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

// Letras mayúscula sin I,O para evitar confusiones
const MAYUS = "ABCDEFGHJKMNPQRSTUVWXYZ";

// Una letra distinta por CCT (determinista para que el script sea repetible)
function letraMayusParaCct(cct) {
  let n = 0;
  for (let i = 0; i < cct.length; i++) n += cct.charCodeAt(i) * (i + 1);
  return MAYUS[n % MAYUS.length];
}

// CCT 26DST0001P → dst0001pX+ (X = letra mayúscula por escuela)
function passwordParaCct(cct) {
  const suf = cct.replace(/^26DST/i, "").toLowerCase();
  const letra = letraMayusParaCct(cct);
  return "dst" + suf + letra + "+";
}

const raw = fs.readFileSync(DATA_PATH, "utf8");
const { escuelas } = JSON.parse(raw);
const ccts = escuelas.map((e) => e.cct);

const authData = JSON.parse(fs.readFileSync(AUTH_DATA_PATH, "utf8"));
const escuelasAuth = { ...(authData.escuelas || {}) };
const passwordsList = [];

for (const cct of ccts) {
  const pwd = passwordParaCct(cct);
  escuelasAuth[cct] = sha256(normalizePassword(pwd));
  passwordsList.push({ cct, pwd });
}

authData.escuelas = escuelasAuth;
fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(authData, null, 2), "utf8");

const superLine = authData.superUsuario
  ? "SUPER USUARIO (ve todo): ver lib/passwords-inicial.txt o ejecutar regenerate-super-only.mjs"
  : "";

const lineasInicial = [
  "=== CONTRASEÑAS RAF (no subir a git) ===",
  superLine,
  "",
  "--- Por escuela (dst + suf + letra mayúscula + +) ---",
  ...passwordsList.map(({ cct, pwd }) => `${cct}\t${pwd}`),
];
fs.writeFileSync(PASSWORDS_PATH, lineasInicial.join("\n"), "utf8");

const lineasLista = [
  "RAF Matemáticas – Usuarios y contraseñas (estilo sencillo)",
  "==========================================================",
  "",
  "POR ESCUELA: en el login solo se pide contraseña. Cada escuela usa la suya.",
  "",
  "CCT\t\tContraseña",
  "---\t\t----------",
  ...passwordsList.map(({ cct, pwd }) => `${cct}\t\t${pwd}`),
  "",
  "Total: " + passwordsList.length + " escuelas.",
  "Guarda este archivo en lugar seguro y no lo subas a Git.",
];
fs.writeFileSync(LISTA_PATH, lineasLista.join("\n"), "utf8");

console.log("Actualizado:", AUTH_DATA_PATH);
console.log("Lista guardada en:", LISTA_PATH);
console.log("\n--- POR ESCUELA (CCT → contraseña) ---");
passwordsList.forEach(({ cct, pwd }) => console.log(" ", cct, "→", pwd));
console.log("\nTotal:", passwordsList.length, "escuelas.");
