import fs from "fs";
import path from "path";

const AUTH_DATA_PATH = path.join(process.cwd(), "lib", "auth-data.json");

try {
  const raw = fs.readFileSync(AUTH_DATA_PATH, "utf8");
  const data = JSON.parse(raw.replace(/^\uFEFF/, ""));
  const hash = data.superUsuario ?? data.super ?? "";
  if (hash) {
    console.log("Hash actual del super usuario (para AUTH_SUPER_HASH en Vercel):");
    console.log(hash.trim());
  } else {
    console.log("No hay superUsuario en auth-data.json. Ejecuta: node scripts/regenerate-super-only.mjs");
  }
} catch (e) {
  console.error("Error leyendo auth-data.json:", e.message);
  process.exit(1);
}
