#!/usr/bin/env node
/**
 * Genera contraseñas más sencillas (8-10 caracteres, sin 0/O/1/l/I)
 * y actualiza auth-data.json. Escribe la lista en lib/passwords-inicial.txt
 * y en USUARIOS-Y-CONTRASEÑAS.txt (raíz del proyecto, en .gitignore).
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

// Caracteres fáciles de escribir, sin 0/O, 1/l/I para evitar confusiones
const CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
function randomSimple(length) {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}

const raw = fs.readFileSync(DATA_PATH, "utf8");
const { escuelas } = JSON.parse(raw);
const ccts = escuelas.map((e) => e.cct);

const superPassword = randomSimple(10);
const superHash = sha256(normalizePassword(superPassword));

const escuelasAuth = {};
const passwordsList = [];
const used = new Set([superPassword]);

for (const cct of ccts) {
  let pwd;
  do {
    pwd = randomSimple(8);
  } while (used.has(pwd));
  used.add(pwd);
  escuelasAuth[cct] = sha256(normalizePassword(pwd));
  passwordsList.push({ cct, pwd });
}

const authData = { superUsuario: superHash, escuelas: escuelasAuth };
fs.mkdirSync(path.dirname(AUTH_DATA_PATH), { recursive: true });
fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(authData, null, 2), "utf8");

const lineasInicial = [
  "=== CONTRASEÑAS RAF (no subir a git) ===",
  "SUPER USUARIO (ve todo): " + superPassword,
  "",
  "--- Por escuela (CCT → contraseña) ---",
  ...passwordsList.map(({ cct, pwd }) => `${cct}\t${pwd}`),
];
fs.writeFileSync(PASSWORDS_PATH, lineasInicial.join("\n"), "utf8");

const lineasLista = [
  "RAF Matemáticas – Usuarios y contraseñas",
  "========================================",
  "",
  "SUPER USUARIO (acceso a todo)",
  "  Usuario: super",
  "  Contraseña: " + superPassword,
  "",
  "POR ESCUELA (solo ve su escuela)",
  "  Usuario = CCT. Contraseña debajo.",
  "",
  "CCT\t\tContraseña",
  "---\t\t----------",
  ...passwordsList.map(({ cct, pwd }) => `${cct}\t\t${pwd}`),
  "",
  "Total: 1 super + " + passwordsList.length + " escuelas.",
  "Guarda este archivo en lugar seguro y no lo subas a Git.",
];
fs.writeFileSync(LISTA_PATH, lineasLista.join("\n"), "utf8");

console.log("Generado:", AUTH_DATA_PATH);
console.log("Lista guardada en:", LISTA_PATH);
console.log("\n--- SUPER USUARIO ---");
console.log("Contraseña:", superPassword);
console.log("\n--- POR ESCUELA (CCT → contraseña) ---");
passwordsList.forEach(({ cct, pwd }) => console.log(" ", cct, "→", pwd));
console.log("\nTotal: 1 super +", passwordsList.length, "escuelas.");
