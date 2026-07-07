#!/usr/bin/env node
/**
 * Fusiona datos del Excel "Buscador de Escuelas en Línea" con public/data/resultados.json.
 * Añade a cada escuela los campos: nombre, turno, domicilio, teléfono, colonia, localidad, municipio, etc.
 *
 * Uso:
 *   node scripts/merge-buscador-escuelas.mjs
 *   node scripts/merge-buscador-escuelas.mjs "C:\Users\...\Buscador de Escuelas en Linea.xlsx"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESULTADOS_PUBLIC = path.join(ROOT, "public", "data", "resultados.json");
const RESULTADOS_DATA = path.join(ROOT, "data", "resultados.json");
const NOMBRES_ESCUELAS = path.join(ROOT, "data", "nombres-escuelas.json");

const DEFAULT_EXCEL =
  process.env.BUSCADOR_EXCEL ||
  path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "Buscador de Escuelas en Linea.xlsx");

const COLUMNAS = [
  "CCT",
  "NOMBRE",
  "TURNO",
  "NIVEL EDUCATIVO",
  "ZONA",
  "DOMICILIO",
  "TELÉFONO",
  "COLONIA",
  "LOCALIDAD",
  "MUNICIPIO",
  "ALUMNOS",
];

/** Corrige texto UTF-8 leído como Latin-1 (ej. PEÃA → PEÑA) y errores ortográficos (RAE). */
function fixUtf8Mojibake(str) {
  if (typeof str !== "string") return str;
  let s = str.replace(/\bMUÑZ\b/gi, "MUÑOZ").replace(/\bMUÃOZ\b/gi, "MUÑOZ");
  if (s !== str) return s;
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

function buildMapFromExcel(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rows.length < 2) return new Map();
  const headerRow = rows[1].map((h) => (h != null ? fixUtf8Mojibake(String(h).trim()).toUpperCase() : ""));
  const idx = {};
  COLUMNAS.forEach((col) => {
    const i = headerRow.indexOf(col.toUpperCase());
    if (i >= 0) idx[col] = i;
  });
  const map = new Map();
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const cct = row[idx["CCT"]] != null ? String(row[idx["CCT"]]).trim() : "";
    if (!cct) continue;
    const get = (col) => {
      const j = idx[col];
      if (j == null) return undefined;
      const v = row[j];
      const s = v != null && v !== "" ? String(v).trim() : undefined;
      return s != null ? fixUtf8Mojibake(s) : undefined;
    };
    map.set(cct, {
      nombre: get("NOMBRE"),
      turno: get("TURNO"),
      nivelEducativo: get("NIVEL EDUCATIVO"),
      zona: get("ZONA"),
      domicilio: get("DOMICILIO"),
      telefono: get("TELÉFONO"),
      colonia: get("COLONIA"),
      localidad: get("LOCALIDAD"),
      municipio: get("MUNICIPIO"),
    });
  }
  return map;
}

function loadNombresOficiales() {
  if (!fs.existsSync(NOMBRES_ESCUELAS)) return {};
  return JSON.parse(fs.readFileSync(NOMBRES_ESCUELAS, "utf8"));
}

function main() {
  const excelPath = process.argv[2] || DEFAULT_EXCEL;
  if (!fs.existsSync(excelPath)) {
    console.error("No se encontró el Excel:", excelPath);
    console.error("Uso: node scripts/merge-buscador-escuelas.mjs [ruta/al/Buscador de Escuelas en Linea.xlsx]");
    process.exit(1);
  }

  const resultadosPath = fs.existsSync(RESULTADOS_DATA)
    ? RESULTADOS_DATA
    : fs.existsSync(RESULTADOS_PUBLIC)
      ? RESULTADOS_PUBLIC
      : null;
  if (!resultadosPath) {
    console.error("No existe data/resultados.json ni public/data/resultados.json. Ejecuta antes npm run build:data");
    process.exit(1);
  }

  const buscadorMap = buildMapFromExcel(excelPath);
  const nombresOficiales = loadNombresOficiales();
  console.log("CCTs en Buscador:", buscadorMap.size);
  console.log("Nombres oficiales:", Object.keys(nombresOficiales).length);

  const resultados = JSON.parse(fs.readFileSync(resultadosPath, "utf8"));
  let merged = 0;
  for (const esc of resultados.escuelas || []) {
    const info = buscadorMap.get(esc.cct);
    if (info) {
      esc.buscador = info;
      merged++;
    }
    const nombreOficial = nombresOficiales[esc.cct];
    if (nombreOficial) {
      esc.buscador = { ...esc.buscador, nombre: nombreOficial };
    }
  }

  const outStr = JSON.stringify(resultados, null, 2);
  fs.mkdirSync(path.dirname(RESULTADOS_DATA), { recursive: true });
  fs.mkdirSync(path.dirname(RESULTADOS_PUBLIC), { recursive: true });
  fs.writeFileSync(RESULTADOS_DATA, outStr, "utf8");
  fs.writeFileSync(RESULTADOS_PUBLIC, outStr, "utf8");
  console.log("Escuelas en resultados:", (resultados.escuelas || []).length);
  console.log("Escuelas actualizadas con datos del Buscador:", merged);
  console.log("Guardado: data/resultados.json y public/data/resultados.json");
}

main();
