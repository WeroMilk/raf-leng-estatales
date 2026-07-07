import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd());
const DATA_PATH = path.join(ROOT, "public", "data", "resultados.json");
const AUTH_DATA_PATH = path.join(ROOT, "lib", "auth-data.json");
const PASSWORDS_PATH = path.join(ROOT, "lib", "passwords-inicial.txt");

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

const raw = fs.readFileSync(DATA_PATH, "utf8");
const { escuelas } = JSON.parse(raw);
const ccts = escuelas.map((e) => e.cct);

const superPassword = randomPassword(14);
const superHash = sha256(normalizePassword(superPassword));

const escuelasAuth = {};
const passwordsList = [];
const lines = ["=== CONTRASEÑAS RAF (guarda este archivo y no lo subas a git) ===\n", "SUPER USUARIO (ve todo):", superPassword, "\n--- Por secundaria (CCT → contraseña) ---\n"];

for (const cct of ccts) {
  const pwd = randomPassword(12);
  escuelasAuth[cct] = sha256(normalizePassword(pwd));
  lines.push(`${cct}\t${pwd}`);
  passwordsList.push({ cct, pwd });
}

const authData = { superUsuario: superHash, escuelas: escuelasAuth };
fs.mkdirSync(path.dirname(AUTH_DATA_PATH), { recursive: true });
fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(authData, null, 2), "utf8");
fs.writeFileSync(PASSWORDS_PATH, lines.join("\n"), "utf8");

console.log("Generado:", AUTH_DATA_PATH);
console.log("Contraseñas guardadas en:", PASSWORDS_PATH);
console.log("\n--- CONTRASEÑAS (cópialas) ---");
console.log("SUPER:", superPassword);
console.log("Por CCT:");
passwordsList.forEach(({ cct, pwd }) => console.log(" ", cct, "→", pwd));
console.log("\nTotal: 1 super +", ccts.length, "secundarias =", ccts.length + 1, "usuarios.");
