/**
 * Verifica que public/data/resultados.json coincida con los Excel *_actualizado.xlsx.
 * Compara por escuela: total alumnos, niveles, grupos, y cada alumno (nombre, apellido,
 * grupo, porcentaje, nivelGeneral, respuestas).
 *
 * Uso: node scripts/verificar-excel-actualizado.mjs "C:\Users\alfon\Downloads"
 *   o:  DATA_DIR="C:\ruta\a\excel" node scripts/verificar-excel-actualizado.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTADOS_PATH = path.join(ROOT, "public", "data", "resultados.json");

const EXCEL_DIR = process.env.DATA_DIR || process.argv[2] || path.join(ROOT, "data", "excel");

const NUM_REACTIVOS = 30;
const NIVELES_PREGUNTAS = {
  1: [1, 3, 4, 6, 9, 16],
  2: [5, 7, 10, 11, 12, 14, 15, 18, 19, 20, 21, 23, 24],
  3: [2, 8, 13, 17, 22, 25, 26, 27, 28],
  4: [29, 30],
};

const LETRA_GRUPO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function fixUtf8Mojibake(str) {
  if (typeof str !== "string") return str;
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

function normalizarGrupo(grupo) {
  if (grupo == null || grupo === "") return "S/G";
  const s = String(grupo).toUpperCase().trim();
  const mv = s.match(/([MV])(\d)([A-Z])/);
  if (mv) return `${mv[2]}${mv[3]}${mv[1]}`;
  if (/^[1-3][A-Z][MV]$/.test(s)) return s;
  const m = s.match(/M1([A-H])/);
  if (m) return `1${m[1]}M`;
  const v = s.match(/V1([A-H])/);
  if (v) return `1${v[1]}V`;
  const zNum = s.match(/^Z(\d)(\d)EST[\d]*(M|V)\d*$/);
  if (zNum) {
    const grado = zNum[1];
    const numGrupo = parseInt(zNum[2], 10);
    const turno = zNum[3];
    const letra = LETRA_GRUPO[numGrupo - 1] || LETRA_GRUPO[0];
    return `${grado}${letra}${turno}`;
  }
  const zLetra = s.match(/^Z\d+EST[\d]*(M|V)(\d)([A-Z])$/);
  if (zLetra) {
    const turno = zLetra[1];
    const grado = zLetra[2];
    const letra = zLetra[3];
    return `${grado}${letra}${turno}`;
  }
  return s.slice(0, 10);
}

function calcularPorcentajeNivel(row, preguntas) {
  let aciertos = 0, total = 0;
  for (const i of preguntas) {
    const p = row[`Points${i}`];
    const m = row[`Mark${i}`];
    if (p == null || m == null) continue;
    const pv = Number(p);
    const mv = String(m).trim();
    if (Number.isNaN(pv)) continue;
    if (pv > 0 && mv === "C") { aciertos++; total++; }
    else if (pv === 0) total++;
  }
  return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
}

function calcularPorcentajeTotal(row) {
  let aciertos = 0, total = 0;
  for (let i = 1; i <= NUM_REACTIVOS; i++) {
    const p = row[`Points${i}`];
    const m = row[`Mark${i}`];
    if (p == null || m == null) continue;
    const pv = Number(p);
    const mv = String(m).trim();
    if (Number.isNaN(pv)) continue;
    if (pv > 0 && mv === "C") { aciertos++; total++; }
    else if (pv === 0) total++;
  }
  return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
}

function respuesta(row, i) {
  const m = row[`Mark${i}`];
  return m != null && String(m).trim() ? String(m).trim() : "-";
}

/** Parsea un Excel *_actualizado.xlsx y devuelve la misma estructura que resultados.json */
function parsearExcel(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const first = wb.SheetNames[0];
  const sheet = wb.Sheets[first];
  const data = XLSX.utils.sheet_to_json(sheet);
  const cct = path.basename(filePath, path.extname(filePath)).replace("_actualizado", "");

  if (!data.length) return null;

  const hasQuizClass = Object.keys(data[0] || {}).some((k) => k === "QuizClass");
  const gruposSet = new Set();
  const rows = data.map((row) => {
    const grupoRaw = hasQuizClass ? fixUtf8Mojibake(String(row.QuizClass ?? "")) : "";
    const grupo = grupoRaw ? normalizarGrupo(grupoRaw) : "UNICO";
    gruposSet.add(grupo);

    const pctNivel1 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[1]);
    const pctNivel2 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[2]);
    const pctNivel3 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[3]);
    const pctNivel4 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[4]);
    const aciertosTotales = Array.from({ length: NUM_REACTIVOS }, (_, i) => respuesta(row, i + 1)).filter((r) => r === "C").length;
    const nivelGeneral = aciertosTotales <= 13 ? 1 : aciertosTotales <= 21 ? 2 : aciertosTotales <= 26 ? 3 : 4;
    const porcentaje = calcularPorcentajeTotal(row);

    return {
      nombre: fixUtf8Mojibake(String(row.FirstName ?? "")).slice(0, 50),
      apellido: fixUtf8Mojibake(String(row.LastName ?? "")).slice(0, 50),
      grupo,
      porcentaje,
      nivelGeneral,
      porcentajeNivel1: pctNivel1,
      porcentajeNivel2: pctNivel2,
      porcentajeNivel3: pctNivel3,
      porcentajeNivel4: pctNivel4,
      respuestas: Array.from({ length: NUM_REACTIVOS }, (_, i) => respuesta(row, i + 1)),
    };
  });

  const grupos = Array.from(gruposSet).filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = rows.filter((r) => r.grupo === nombreGrupo);
    return {
      nombre: nombreGrupo,
      alumnos: alumnosGrupo,
      total: alumnosGrupo.length,
      nivel1: alumnosGrupo.filter((r) => r.nivelGeneral === 1).length,
      nivel2: alumnosGrupo.filter((r) => r.nivelGeneral === 2).length,
      nivel3: alumnosGrupo.filter((r) => r.nivelGeneral === 3).length,
      nivel4: alumnosGrupo.filter((r) => r.nivelGeneral === 4).length,
    };
  });

  const nivel1 = rows.filter((r) => r.nivelGeneral === 1).length;
  const nivel2 = rows.filter((r) => r.nivelGeneral === 2).length;
  const nivel3 = rows.filter((r) => r.nivelGeneral === 3).length;
  const nivel4 = rows.filter((r) => r.nivelGeneral === 4).length;

  return {
    cct,
    totalEstudiantes: rows.length,
    nivel1,
    nivel2,
    nivel3,
    nivel4,
    grupos: gruposResumen,
  };
}

function compararAlumno(a, b, idx) {
  const difs = [];
  if (a.nombre !== b.nombre) difs.push({ campo: "nombre", json: a.nombre, excel: b.nombre });
  if (a.apellido !== b.apellido) difs.push({ campo: "apellido", json: a.apellido, excel: b.apellido });
  if (a.grupo !== b.grupo) difs.push({ campo: "grupo", json: a.grupo, excel: b.grupo });
  if (a.porcentaje !== b.porcentaje) difs.push({ campo: "porcentaje", json: a.porcentaje, excel: b.porcentaje });
  if (a.nivelGeneral !== b.nivelGeneral) difs.push({ campo: "nivelGeneral", json: a.nivelGeneral, excel: b.nivelGeneral });
  if (a.porcentajeNivel1 !== b.porcentajeNivel1) difs.push({ campo: "porcentajeNivel1", json: a.porcentajeNivel1, excel: b.porcentajeNivel1 });
  if (a.porcentajeNivel2 !== b.porcentajeNivel2) difs.push({ campo: "porcentajeNivel2", json: a.porcentajeNivel2, excel: b.porcentajeNivel2 });
  if (a.porcentajeNivel3 !== b.porcentajeNivel3) difs.push({ campo: "porcentajeNivel3", json: a.porcentajeNivel3, excel: b.porcentajeNivel3 });
  if (a.porcentajeNivel4 !== b.porcentajeNivel4) difs.push({ campo: "porcentajeNivel4", json: a.porcentajeNivel4, excel: b.porcentajeNivel4 });
  const respDiff = a.respuestas?.some((r, i) => r !== b.respuestas?.[i]);
  if (respDiff) difs.push({ campo: "respuestas", json: a.respuestas?.join(","), excel: b.respuestas?.join(",") });
  return difs.length ? { idx, alumno: `${a.nombre} ${a.apellido}`, difs } : null;
}

function main() {
  if (!fs.existsSync(EXCEL_DIR)) {
    console.error("No existe el directorio:", EXCEL_DIR);
    console.error("Uso: node scripts/verificar-excel-actualizado.mjs \"C:\\ruta\\a\\excel\"");
    process.exit(1);
  }

  const files = fs.readdirSync(EXCEL_DIR).filter((f) => f.endsWith("_actualizado.xlsx"));
  if (!files.length) {
    console.error("No se encontraron archivos *_actualizado.xlsx en", EXCEL_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(RESULTADOS_PATH)) {
    console.error("No existe public/data/resultados.json. Ejecuta antes: DATA_DIR=\"ruta\" npm run build:data");
    process.exit(1);
  }

  const resultados = JSON.parse(fs.readFileSync(RESULTADOS_PATH, "utf8"));
  const escuelasJson = resultados.escuelas || [];
  const cctEnJson = new Set(escuelasJson.map((e) => e.cct));

  console.log("=== Verificación Excel vs resultados.json ===\n");
  console.log("Directorio Excel:", EXCEL_DIR);
  console.log("Archivos Excel encontrados:", files.length);
  console.log("Escuelas en resultados.json:", escuelasJson.length);
  console.log("");

  let totalOk = 0;
  let totalErrores = 0;
  const resumen = { ok: [], errores: [] };

  for (const f of files.sort()) {
    const filePath = path.join(EXCEL_DIR, f);
    const cct = f.replace("_actualizado.xlsx", "");

    let excelData;
    try {
      excelData = parsearExcel(filePath);
    } catch (e) {
      console.log(`❌ ${cct}: Error al leer Excel - ${e.message}`);
      resumen.errores.push({ cct, error: `Error al leer: ${e.message}` });
      totalErrores++;
      continue;
    }

    if (!excelData) {
      console.log(`❌ ${cct}: Excel vacío`);
      resumen.errores.push({ cct, error: "Excel vacío" });
      totalErrores++;
      continue;
    }

    const escJson = escuelasJson.find((e) => e.cct === cct);
    if (!escJson) {
      console.log(`❌ ${cct}: No está en resultados.json (falta importar)`);
      resumen.errores.push({ cct, error: "No está en resultados.json" });
      totalErrores++;
      continue;
    }

    const difs = [];

    if (escJson.totalEstudiantes !== excelData.totalEstudiantes) {
      difs.push({ tipo: "totalEstudiantes", json: escJson.totalEstudiantes, excel: excelData.totalEstudiantes });
    }
    if (escJson.nivel1 !== excelData.nivel1) difs.push({ tipo: "nivel1", json: escJson.nivel1, excel: excelData.nivel1 });
    if (escJson.nivel2 !== excelData.nivel2) difs.push({ tipo: "nivel2", json: escJson.nivel2, excel: excelData.nivel2 });
    if (escJson.nivel3 !== excelData.nivel3) difs.push({ tipo: "nivel3", json: escJson.nivel3, excel: excelData.nivel3 });
    if (escJson.nivel4 !== excelData.nivel4) difs.push({ tipo: "nivel4", json: escJson.nivel4, excel: excelData.nivel4 });

    const alumnosJson = escJson.grupos?.flatMap((g) => g.alumnos) || [];
    const alumnosExcel = excelData.grupos?.flatMap((g) => g.alumnos) || [];

    if (alumnosJson.length !== alumnosExcel.length) {
      difs.push({ tipo: "cantidadAlumnos", json: alumnosJson.length, excel: alumnosExcel.length });
    }

    const alumnosConDifs = [];
    const n = Math.min(alumnosJson.length, alumnosExcel.length);
    for (let i = 0; i < n; i++) {
      const d = compararAlumno(alumnosJson[i], alumnosExcel[i], i);
      if (d) alumnosConDifs.push(d);
    }

    if (alumnosJson.length < alumnosExcel.length) {
      for (let i = n; i < alumnosExcel.length; i++) {
        alumnosConDifs.push({ idx: i, alumno: `${alumnosExcel[i].nombre} ${alumnosExcel[i].apellido}`, difs: [{ campo: "faltante", json: "—", excel: "en Excel" }] });
      }
    } else if (alumnosJson.length > alumnosExcel.length) {
      for (let i = n; i < alumnosJson.length; i++) {
        alumnosConDifs.push({ idx: i, alumno: `${alumnosJson[i].nombre} ${alumnosJson[i].apellido}`, difs: [{ campo: "faltante", json: "en JSON", excel: "—" }] });
      }
    }

    if (difs.length === 0 && alumnosConDifs.length === 0) {
      console.log(`✅ ${cct}: coincide (${excelData.totalEstudiantes} alumnos)`);
      resumen.ok.push(cct);
      totalOk++;
    } else {
      console.log(`⚠️ ${cct}: ${difs.length + alumnosConDifs.length} diferencia(s)`);
      difs.forEach((d) => console.log(`   - ${d.tipo}: JSON=${d.json}  Excel=${d.excel}`));
      alumnosConDifs.slice(0, 5).forEach((a) => {
        console.log(`   - Alumno ${a.idx} (${a.alumno}):`);
        a.difs.forEach((d) => console.log(`     ${d.campo}: JSON=${d.json}  Excel=${d.excel}`));
      });
      if (alumnosConDifs.length > 5) {
        console.log(`   ... y ${alumnosConDifs.length - 5} alumno(s) más con diferencias`);
      }
      resumen.errores.push({ cct, difs, alumnosConDifs });
      totalErrores++;
    }
  }

  const excelSinJson = files.filter((f) => !cctEnJson.has(f.replace("_actualizado.xlsx", "")));
  if (excelSinJson.length) {
    console.log("\n⚠️ Excel en disco pero NO en resultados.json:");
    excelSinJson.forEach((f) => console.log("   -", f.replace("_actualizado.xlsx", "")));
  }

  console.log("\n--- Resumen ---");
  console.log("✅ Coinciden:", totalOk);
  console.log("⚠️ Con diferencias:", totalErrores);
  if (resumen.errores.length > 0) {
    console.log("CCTs con diferencias:", resumen.errores.map((e) => e.cct).join(", "));
  }

  process.exit(totalErrores > 0 ? 1 : 0);
}

main();
