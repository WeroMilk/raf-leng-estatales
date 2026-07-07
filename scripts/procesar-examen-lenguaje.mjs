/**
 * Procesa Book1.xlsx (examen RAF Lenguaje) y genera reporte por alumno:
 * - Nivel (1-4) para saber cómo apoyar
 * - Calificación general
 * - Aciertos/errores por reactivo
 *
 * Estructura Excel:
 * - Columnas A-O (0-14): datos alumno
 *   - A: RAF, B: Lenguaje, C: CCT, D: escuela, E: grupo, I: nombre completo
 *   - K: aciertos totales (fuente confiable), M: calificación (aciertos*2.5)
 * - Columnas P-AX (15-44): 30 reactivos
 *   - 1 = correcto, 0 = incorrecto, A/B/C = opción elegida (se compara con clave)
 *
 * Niveles: 1 (0-13), 2 (14-21), 3 (22-26), 4 (27-30) - Escalera cognitiva completa
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXCEL_PATH = process.env.EXCEL_PATH || path.join("C:", "Users", "alfon", "Downloads", "Book1.xlsx");
const CLAVE_PATH = process.env.CLAVE_PATH || path.join(ROOT, "data", "clave-lenguaje.txt");
const OUT_DIR = path.join(ROOT, "public", "data");
const OUT_JSON = path.join(OUT_DIR, "resultados.json");
const OUT_CSV = path.join(OUT_DIR, "niveles-alumnos.csv");

const NUM_REACTIVOS = 30;
const NIVELES_PREGUNTAS = {
  1: [1, 3, 4, 6, 9, 16],
  2: [5, 7, 10, 11, 12, 14, 15, 18, 19, 20, 21, 23, 24],
  3: [2, 8, 13, 17, 22, 25, 26, 27, 28],
  4: [29, 30],
};

const DESCRIPTORES_NIVEL = {
  1: "Lector Emergente (0-13 aciertos)",
  2: "Lector con Comprensión Funcional (14-21)",
  3: "Lector Interpretativo (22-26)",
  4: "Lector Estratégico (27-30)",
};

/** Cargar clave desde archivo (una letra por línea o separadas por coma) o inferir */
function cargarClave(rows) {
  if (fs.existsSync(CLAVE_PATH)) {
    const content = fs.readFileSync(CLAVE_PATH, "utf8").trim();
    const partes = content.split(/[\s,]+/).map((s) => s.trim().toUpperCase());
    if (partes.length >= NUM_REACTIVOS) {
      console.log("Usando clave desde", CLAVE_PATH);
      return partes.slice(0, NUM_REACTIVOS);
    }
  }
  const ordenados = [...rows].sort((a, b) => (b.aciertosK || 0) - (a.aciertosK || 0));
  const top = ordenados.slice(0, Math.min(500, Math.floor(ordenados.length * 0.3)));
  const clave = [];
  for (let i = 0; i < NUM_REACTIVOS; i++) {
    const frec = { A: 0, B: 0, C: 0, "1": 0 };
    for (const r of top) {
      const v = r.reactivos[i];
      const s = String(v).trim().toUpperCase();
      if (s === "1" || s === "A" || s === "B" || s === "C") frec[s === "1" ? "1" : s]++;
    }
    const best = ["A", "B", "C"].reduce((a, b) => (frec[a] >= frec[b] ? a : b));
    clave.push(best);
  }
  return clave;
}

function esCorrecto(val, clave, idx) {
  const v = String(val).trim().toUpperCase();
  if (v === "1") return true;
  if (v === "0") return false;
  if (["A", "B", "C"].includes(v)) return v === clave[idx];
  return false;
}

function normalizarGrupo(grupo) {
  if (grupo == null || grupo === "") return "S/G";
  const s = String(grupo).toUpperCase().trim();
  if (/^[1-3][A-Z][MV]$/.test(s)) return s;
  const vespertino = s.match(/^V([1-3])([A-Z])$/);
  if (vespertino) return `${vespertino[1]}${vespertino[2]}V`;
  const matutino = s.match(/^([1-3])([A-Z])$/);
  if (matutino) return `${matutino[1]}${matutino[2]}M`;
  return s.slice(0, 10);
}

function fixUtf8(str) {
  if (typeof str !== "string") return str;
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

function procesarExcel(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const rows = raw.filter((r) => r && r.length >= 45 && r[2] && /^\d{2}DST/.test(String(r[2]).trim()));
  const alumnos = rows.map((row) => {
    const grupoRaw = row[4] != null ? String(row[4]).trim() : "";
    const nombre = fixUtf8(String(row[8] || "").trim());
    const aciertosK = Number(row[10]);
    const califM = row[12] != null ? Number(row[12]) : (aciertosK / NUM_REACTIVOS) * 100;
    const reactivos = row.slice(15, 45);
    return {
      cct: String(row[2]).trim(),
      grupo: grupoRaw ? normalizarGrupo(grupoRaw) : "UNICO",
      nombre,
      apellido: "",
      aciertosK: Number.isNaN(aciertosK) ? 0 : aciertosK,
      califM,
      reactivos,
    };
  });

  const clave = cargarClave(alumnos);
  const UMBRAL = 50;

  const resultado = alumnos.map((a) => {
    const respuestas = [];
    for (let i = 0; i < NUM_REACTIVOS; i++) {
      respuestas.push(esCorrecto(a.reactivos[i], clave, i) ? "C" : "X");
    }
    const aciertosCalc = respuestas.filter((r) => r === "C").length;
    const aciertos = a.aciertosK >= 0 && !Number.isNaN(a.aciertosK) ? a.aciertosK : aciertosCalc;
    const porcentaje = Math.round((aciertos / NUM_REACTIVOS) * 1000) / 10;
    const nivelGeneral = aciertos <= 13 ? 1 : aciertos <= 21 ? 2 : aciertos <= 26 ? 3 : 4;

    const pctN1 = calcularPct(respuestas, NIVELES_PREGUNTAS[1]);
    const pctN2 = calcularPct(respuestas, NIVELES_PREGUNTAS[2]);
    const pctN3 = calcularPct(respuestas, NIVELES_PREGUNTAS[3]);
    const pctN4 = calcularPct(respuestas, NIVELES_PREGUNTAS[4]);

    return {
      cct: a.cct,
      grupo: a.grupo,
      nombre: a.nombre,
      apellido: a.apellido,
      aciertos,
      calificacion: porcentaje,
      nivelGeneral,
      descriptorNivel: DESCRIPTORES_NIVEL[nivelGeneral],
      porcentajeNivel1: pctN1,
      porcentajeNivel2: pctN2,
      porcentajeNivel3: pctN3,
      porcentajeNivel4: pctN4,
      respuestas,
      necesitaApoyoNivel1: pctN1 < UMBRAL,
      necesitaApoyoNivel2: pctN2 < UMBRAL,
      necesitaApoyoNivel3: pctN3 < UMBRAL,
      necesitaApoyoNivel4: pctN4 < UMBRAL,
    };
  });

  return { alumnos: resultado, clave };
}

function calcularPct(respuestas, preguntas) {
  let aciertos = 0;
  for (const p of preguntas) {
    if (respuestas[p - 1] === "C") aciertos++;
  }
  return preguntas.length > 0 ? Math.round((aciertos / preguntas.length) * 1000) / 10 : 0;
}

function agregarEscuela(cct, alumnosEsc) {
  const gruposSet = new Set();
  for (const a of alumnosEsc) gruposSet.add(a.grupo);
  const grupos = Array.from(gruposSet).filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  const n1 = alumnosEsc.filter((a) => a.nivelGeneral === 1).length;
  const n2 = alumnosEsc.filter((a) => a.nivelGeneral === 2).length;
  const n3 = alumnosEsc.filter((a) => a.nivelGeneral === 3).length;
  const n4 = alumnosEsc.filter((a) => a.nivelGeneral === 4).length;

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = alumnosEsc.filter((a) => a.grupo === nombreGrupo);
    return {
      nombre: nombreGrupo,
      alumnos: alumnosGrupo.map((a) => ({
        nombre: a.nombre,
        apellido: a.apellido,
        grupo: a.grupo,
        porcentaje: a.calificacion,
        nivelGeneral: a.nivelGeneral,
        porcentajeNivel1: a.porcentajeNivel1,
        porcentajeNivel2: a.porcentajeNivel2,
        porcentajeNivel3: a.porcentajeNivel3,
        porcentajeNivel4: a.porcentajeNivel4,
        respuestas: a.respuestas,
      })),
      porcentajesReactivos: new Array(NUM_REACTIVOS).fill(0).map((_, i) => {
        const total = alumnosGrupo.length;
        const aciertos = alumnosGrupo.filter((a) => a.respuestas[i] === "C").length;
        return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
      }),
      nivel1: alumnosGrupo.filter((a) => a.nivelGeneral === 1).length,
      nivel2: alumnosGrupo.filter((a) => a.nivelGeneral === 2).length,
      nivel3: alumnosGrupo.filter((a) => a.nivelGeneral === 3).length,
      nivel4: alumnosGrupo.filter((a) => a.nivelGeneral === 4).length,
      necesitaApoyoNivel1: alumnosGrupo.filter((a) => a.necesitaApoyoNivel1).length,
      necesitaApoyoNivel2: alumnosGrupo.filter((a) => a.necesitaApoyoNivel2).length,
      necesitaApoyoNivel3: alumnosGrupo.filter((a) => a.necesitaApoyoNivel3).length,
      necesitaApoyoNivel4: alumnosGrupo.filter((a) => a.necesitaApoyoNivel4).length,
      total: alumnosGrupo.length,
    };
  });

  return {
    cct,
    totalEstudiantes: alumnosEsc.length,
    porcentajesReactivos: new Array(NUM_REACTIVOS).fill(0).map((_, i) => {
      const total = alumnosEsc.length;
      const aciertos = alumnosEsc.filter((a) => a.respuestas[i] === "C").length;
      return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
    }),
    nivel1: n1,
    nivel2: n2,
    nivel3: n3,
    nivel4: n4,
    necesitaApoyoNivel1: alumnosEsc.filter((a) => a.necesitaApoyoNivel1).length,
    necesitaApoyoNivel2: alumnosEsc.filter((a) => a.necesitaApoyoNivel2).length,
    necesitaApoyoNivel3: alumnosEsc.filter((a) => a.necesitaApoyoNivel3).length,
    necesitaApoyoNivel4: alumnosEsc.filter((a) => a.necesitaApoyoNivel4).length,
    grupos: gruposResumen,
  };
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error("No se encontró el archivo:", EXCEL_PATH);
    console.error("Usa EXCEL_PATH=... para especificar la ruta.");
    process.exit(1);
  }

  console.log("Procesando:", EXCEL_PATH);
  const { alumnos, clave } = procesarExcel(EXCEL_PATH);

  const porEscuela = new Map();
  for (const a of alumnos) {
    if (!porEscuela.has(a.cct)) porEscuela.set(a.cct, []);
    porEscuela.get(a.cct).push(a);
  }

  const escuelas = [];
  for (const [cct, alumnosEsc] of porEscuela) {
    escuelas.push(agregarEscuela(cct, alumnosEsc));
  }
  escuelas.sort((a, b) => a.cct.localeCompare(b.cct));

  const out = { escuelas, generado: new Date().toISOString() };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), "utf8");
  console.log("OK:", escuelas.length, "escuelas →", OUT_JSON);

  const csv = [
    "CCT,Grupo,Nombre,Aciertos,Calificacion,Porcentaje,Nivel,DescriptorNivel,NecesitaApoyoN1,NecesitaApoyoN2,NecesitaApoyoN3,NecesitaApoyoN4",
    ...alumnos.map(
      (a) =>
        `${a.cct},${a.grupo},"${(a.nombre + " " + a.apellido).replace(/"/g, '""')}",${a.aciertos},${a.calificacion},${a.calificacion}%,${a.nivelGeneral},"${a.descriptorNivel}","${a.necesitaApoyoNivel1}","${a.necesitaApoyoNivel2}","${a.necesitaApoyoNivel3}","${a.necesitaApoyoNivel4}"`
    ),
  ].join("\n");
  fs.writeFileSync(OUT_CSV, "\uFEFF" + csv, "utf8");
  console.log("CSV reporte por alumno →", OUT_CSV);

  const n1 = alumnos.filter((a) => a.nivelGeneral === 1).length;
  const n2 = alumnos.filter((a) => a.nivelGeneral === 2).length;
  const n3 = alumnos.filter((a) => a.nivelGeneral === 3).length;
  const n4 = alumnos.filter((a) => a.nivelGeneral === 4).length;
  console.log("\nResumen por nivel:");
  console.log("  Nivel 1 (Lector Emergente):", n1);
  console.log("  Nivel 2 (Lector con Comprensión Funcional):", n2);
  console.log("  Nivel 3 (Lector Interpretativo):", n3);
  console.log("  Nivel 4 (Lector Estratégico):", n4);
  console.log("\nClave inferida (respuestas correctas):", clave.join(", "));
}

main();
