#!/usr/bin/env node
/**
 * Genera contraseñas por zona escolar (14 zonas) + superusuario global.
 * Reemplaza el modelo por escuela por el modelo por zona.
 * Escribe auth-data.json con superUsuario y zonas.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd());
const AUTH_DATA_PATH = path.join(ROOT, "lib", "auth-data.json");
const PASSWORDS_PATH = path.join(ROOT, "lib", "passwords-zonas.txt");
const LISTA_PATH = path.join(ROOT, "USUARIOS-Y-CONTRASEÑAS-ZONAS.txt");

function normalizePassword(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

// Contraseñas: rafzona + número + símbolo (+, -, *, /) cíclico
const ZONAS = [1, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 17, 18];
const SIMBOLOS = ["+", "-", "*", "/"];

const superPassword = "MQCX7D7BWwcB8a";
const superHash = sha256(normalizePassword(superPassword));

const zonasAuth = {};
const passwordsList = [];

ZONAS.forEach((zona, i) => {
  const pwd = "rafzona" + zona + SIMBOLOS[i % SIMBOLOS.length];
  zonasAuth[String(zona)] = sha256(normalizePassword(pwd));
  passwordsList.push({ zona, pwd });
});

const authData = { superUsuario: superHash, zonas: zonasAuth };
fs.mkdirSync(path.dirname(AUTH_DATA_PATH), { recursive: true });
fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(authData, null, 2), "utf8");

const lineasInicial = [
  "=== CONTRASEÑAS RAF POR ZONA (no subir a git) ===",
  "SUPER USUARIO (global, ve todo): " + superPassword,
  "",
  "--- Por zona escolar ---",
  ...passwordsList.map(({ zona, pwd }) => `Zona ${zona}\t${pwd}`),
];
fs.writeFileSync(PASSWORDS_PATH, lineasInicial.join("\n"), "utf8");

const lineasLista = [
  "RAF Lenguaje – Usuarios y contraseñas por ZONA ESCOLAR",
  "=======================================================",
  "",
  "SUPER USUARIO (acceso global a todas las zonas)",
  "  Contraseña: " + superPassword,
  "",
  "POR ZONA (solo ve escuelas de su zona)",
  "  Zona\t\tContraseña",
  "  ----\t\t----------",
  ...passwordsList.map(({ zona, pwd }) => `  ${zona}\t\t${pwd}`),
  "",
  "Total: 1 super + 14 zonas.",
  "Guarda este archivo en lugar seguro y no lo subas a Git.",
];
fs.writeFileSync(LISTA_PATH, lineasLista.join("\n"), "utf8");

console.log("Generado:", AUTH_DATA_PATH);
console.log("Lista guardada en:", LISTA_PATH);
console.log("\n--- SUPER USUARIO (global) ---");
console.log("Contraseña:", superPassword);
console.log("\n--- POR ZONA ---");
passwordsList.forEach(({ zona, pwd }) => console.log("  Zona", zona, "→", pwd));
console.log("\nTotal: 1 super + 14 zonas.");
