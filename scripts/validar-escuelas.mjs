/**
 * Valida que las 31 escuelas tengan grupos y alumnos correctos.
 * Uso: node scripts/validar-escuelas.mjs
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTADOS = path.join(ROOT, "public", "data", "resultados.json");

const j = JSON.parse(fs.readFileSync(RESULTADOS, "utf8"));
const escuelas = j.escuelas || [];

console.log("=== Validación de 31 escuelas ===\n");

let okTotal = 0;
let conUnico = 0;
let alumnosUnico = 0;

for (const e of escuelas) {
  const suma = e.grupos?.reduce((s, g) => s + (g.total ?? g.alumnos?.length ?? 0), 0) ?? 0;
  const ok = suma === e.totalEstudiantes;
  const unico = e.grupos?.find((g) => g.nombre === "UNICO");
  const nUnico = unico ? unico.total ?? unico.alumnos?.length ?? 0 : 0;

  if (ok) okTotal++;
  if (nUnico > 0) {
    conUnico++;
    alumnosUnico += nUnico;
  }

  const status = ok ? "✓" : "✗";
  const unicoStr = nUnico > 0 ? ` (${nUnico} sin grupo)` : "";
  console.log(`${status} ${e.cct}: ${e.totalEstudiantes} alumnos, ${e.grupos?.length ?? 0} grupos, suma=${suma}${unicoStr}`);
}

console.log("\n--- Resumen ---");
console.log(`Escuelas con suma correcta: ${okTotal}/${escuelas.length}`);
console.log(`Escuelas con alumnos en UNICO (sin grupo en Excel): ${conUnico}`);
console.log(`Total alumnos en UNICO: ${alumnosUnico}`);
console.log("\nNota: UNICO = alumnos con Class/QuizClass vacío en el Excel de origen.");
