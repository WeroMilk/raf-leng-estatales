/**
 * Verifica que public/data/resultados.json coincida con los Excel "obra maestra"
 * (generados por MARTA.PY). Compara por escuela: total alumnos, niveles, % por reactivo.
 *
 * Uso: node scripts/verificar-resultados-vs-excel.mjs "C:\ruta\a\obra maestra"
 *   o:  OBRA_MAESTRA_DIR="C:\ruta\a\obra maestra" node scripts/verificar-resultados-vs-excel.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTADOS_PATH = path.join(ROOT, "public", "data", "resultados.json");

const OBRA_MAESTRA_DIR =
  process.env.OBRA_MAESTRA_DIR || process.argv[2] || "";

function readCell(sheet, col, row) {
  const ref = XLSX.utils.encode_cell({ c: col, r: row });
  const cell = sheet[ref];
  if (!cell || cell.v === undefined) return null;
  return cell.v;
}

function leerEscuelaDesdeObraMaestra(dir, cct) {
  const fileName = `${cct} Resultados RAF Matemáticas.xlsx`;
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return { error: "Archivo no encontrado", path: filePath };

  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheetNames = wb.SheetNames;
  // Primera hoja = Escala, segunda = hoja de la escuela (CCT)
  const hojaEscuela = sheetNames[1];
  if (!hojaEscuela) return { error: "No hay hoja de escuela", path: filePath };

  const sheet = wb.Sheets[hojaEscuela];

  const totalEstudiantes = readCell(sheet, 1, 16); // B17
  const requiereApoyo = readCell(sheet, 1, 20);   // B21
  const enDesarrollo = readCell(sheet, 1, 21);   // B22
  const esperado = readCell(sheet, 1, 22);       // B23

  const porcentajesReactivos = [];
  for (let r = 3; r <= 14; r++) {
    const val = readCell(sheet, 1, r); // B4..B15
    if (val != null) {
      // En obra maestra se guarda como decimal 0-1 (openpyxl pct/100)
      const pct = typeof val === "number" && val <= 1 ? val * 100 : val;
      porcentajesReactivos.push(Math.round(pct * 10) / 10);
    }
  }

  return {
    totalEstudiantes: totalEstudiantes != null ? Number(totalEstudiantes) : null,
    requiereApoyo: requiereApoyo != null ? Number(requiereApoyo) : null,
    enDesarrollo: enDesarrollo != null ? Number(enDesarrollo) : null,
    esperado: esperado != null ? Number(esperado) : null,
    porcentajesReactivos: porcentajesReactivos.length === 12 ? porcentajesReactivos : null,
  };
}

function comparar(a, b, label, tolerancia = 0) {
  if (a === b) return null;
  if (tolerancia > 0 && typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= tolerancia) return null;
  return { label, json: a, excel: b };
}

function main() {
  if (!OBRA_MAESTRA_DIR || !fs.existsSync(OBRA_MAESTRA_DIR)) {
    console.error("Uso: node scripts/verificar-resultados-vs-excel.mjs \"C:\\ruta\\a\\obra maestra\"");
    console.error("  o: OBRA_MAESTRA_DIR=\"C:\\ruta\\a\\obra maestra\" node scripts/verificar-resultados-vs-excel.mjs");
    process.exit(1);
  }

  if (!fs.existsSync(RESULTADOS_PATH)) {
    console.error("No existe public/data/resultados.json. Ejecuta antes: npm run build:data");
    process.exit(1);
  }

  const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, "utf8"));
  const escuelas = resultados.escuelas || [];
  console.log("Escuelas en resultados.json:", escuelas.length);
  console.log("Comparando con Excel en:", OBRA_MAESTRA_DIR);
  console.log("");

  let totalDiferencias = 0;
  const resumen = { ok: [], diferencias: [] };

  for (const esc of escuelas) {
    const cct = esc.cct;
    const excel = leerEscuelaDesdeObraMaestra(OBRA_MAESTRA_DIR, cct);

    if (excel.error) {
      console.log(`❌ ${cct}: ${excel.error}`);
      resumen.diferencias.push({ cct, error: excel.error });
      totalDiferencias++;
      continue;
    }

    const difs = [];

    const dTotal = comparar(esc.totalEstudiantes, excel.totalEstudiantes, "totalEstudiantes");
    if (dTotal) difs.push(dTotal);

    const dReq = comparar(esc.requiereApoyo, excel.requiereApoyo, "requiereApoyo");
    if (dReq) difs.push(dReq);
    const dDes = comparar(esc.enDesarrollo, excel.enDesarrollo, "enDesarrollo");
    if (dDes) difs.push(dDes);
    const dEsp = comparar(esc.esperado, excel.esperado, "esperado");
    if (dEsp) difs.push(dEsp);

    if (esc.porcentajesReactivos && excel.porcentajesReactivos) {
      for (let i = 0; i < 12; i++) {
        const a = esc.porcentajesReactivos[i];
        const b = excel.porcentajesReactivos[i];
        const d = comparar(a, b, `reactivo ${i + 1}`, 0.1);
        if (d) difs.push(d);
      }
    } else if (esc.porcentajesReactivos?.length !== excel.porcentajesReactivos?.length) {
      difs.push({ label: "porcentajesReactivos (cantidad)", json: esc.porcentajesReactivos?.length, excel: excel.porcentajesReactivos?.length });
    }

    if (difs.length === 0) {
      console.log(`✅ ${cct}: coincide`);
      resumen.ok.push(cct);
    } else {
      console.log(`⚠️ ${cct}: ${difs.length} diferencia(s)`);
      difs.forEach((d) => console.log(`   - ${d.label}: JSON=${d.json}  Excel=${d.excel}`));
      resumen.diferencias.push({ cct, difs });
      totalDiferencias++;
    }
  }

  console.log("");
  console.log("--- Resumen ---");
  console.log("Coinciden:", resumen.ok.length);
  console.log("Con diferencias:", resumen.diferencias.length);
  if (resumen.diferencias.length > 0) {
    console.log("CCTs con diferencias:", resumen.diferencias.map((d) => d.cct).join(", "));
  }
}

main();
