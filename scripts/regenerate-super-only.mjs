import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd());
const AUTH_DATA_PATH = path.join(ROOT, "lib", "auth-data.json");

function normalizePassword(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function randomPassword(length = 14) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const raw = fs.readFileSync(AUTH_DATA_PATH, "utf8");
const authData = JSON.parse(raw);

const superPassword = randomPassword(14);
const superHash = sha256(normalizePassword(superPassword));

authData.superUsuario = superHash;
fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(authData, null, 2), "utf8");

console.log("Nuevo super usuario generado. auth-data.json actualizado.");
console.log("\n--- CONTRASEÑA SUPER USUARIO (guárdala, no se vuelve a mostrar) ---");
console.log(superPassword);
console.log("-------------------------------------------------------------------");
console.log("\n--- OPCIONAL: Para Vercel sin subir auth-data.json, añade variable de entorno ---");
console.log("AUTH_SUPER_HASH=" + superHash);
console.log("-------------------------------------------------------------------");
