/**
 * RAF Lenguaje: Importa datos y genera public/data/resultados.json
 *
 * SOPORTA DOS FORMATOS:
 *
 * 1) Datos_transformados_PERFECTO_*.xlsx (archivo único con todas las escuelas)
 *    - Col_2 = CCT, Col_4 = GRUPO, Col_8 = NOMBRE_COMPLETO
 *    - Respuestas: Col_18, Col_22, Col_26, ... Col_134 (1/0 por pregunta 1-30)
 *    - Fórmula: col_idx = 16 + (pregunta-1)*4 + 2
 *
 * 2) *_actualizado.xlsx (un archivo por escuela en data/excel/)
 *    - Points1-30, Mark1-30 (Mark "C" = acierto)
 *
 * Niveles: 1 (1,3,4,6,9,16), 2 (5,7,10-12,14-15,18-21,23-24), 3 (2,8,13,17,22,25-28), 4 (29-30)
 * "Necesitan apoyo en Nivel X" = % en ese nivel < 50%
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXCEL_ROOT = path.join(ROOT, "data", "excel");
const DESPEGUE_DIR = path.join(EXCEL_ROOT, "despegue-2025");
const ATERRIZAJE_DIR = path.join(EXCEL_ROOT, "aterrizaje-2026");
const DATA_DIR = process.env.DATA_DIR || EXCEL_ROOT;
const DATA_FILE = process.env.DATA_FILE;
const OUT_DIR = path.join(ROOT, "public", "data");
const OUT_FILE = path.join(OUT_DIR, "resultados.json");
const DATA_JSON_PATH = path.join(ROOT, "data", "resultados.json");
const NOMBRES_ESCUELAS_PATH = path.join(ROOT, "data", "nombres-escuelas.json");
const RAF_CONFIG = JSON.parse(
  fs.readFileSync(path.join(ROOT, "lib", "raf-config.json"), "utf8")
);
function cctNumeroRegex() {
  const prefix = RAF_CONFIG.cctPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(prefix + "(\\d{4})", "i");
}

const EVALUACIONES = {
  despegue2025: {
    id: "despegue2025",
    nombre: "RAF Despegue 2025",
    nombreCorto: "Despegue 2025",
  },
  aterrizaje2026: {
    id: "aterrizaje2026",
    nombre: "RAF Aterrizaje 2026",
    nombreCorto: "Aterrizaje 2026",
  },
};

const NUM_REACTIVOS = 30;
const UMBRAL_NECESITA_APOYO = 50;

/** Reactivos por nivel (Raf_intrumento_niveles_final.xlsx - Hoja3) */
const NIVELES_PREGUNTAS = {
  1: [1, 3, 4, 6, 9, 16],           // Literal / inferencia muy cercana
  2: [5, 7, 10, 11, 12, 14, 15, 18, 19, 20, 21, 23, 24],  // Inferencia cercana
  3: [2, 8, 13, 17, 22, 25, 26, 27, 28],   // Inferencia profunda / global
  4: [29, 30],                       // Crítica / inferencia elaborada
};

/** Índices de columna para respuestas en formato Datos_transformados (0-based) */
function getColRespuesta(pregunta) {
  return 16 + (pregunta - 1) * 4 + 2;
}

function fixUtf8Mojibake(str) {
  if (typeof str !== "string") return str;
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

/**
 * Normaliza grupo desde columna E o Class.
 * - "Matutino - 1C" → 1CM, "Vespertino - 1A" → 1AV
 * - Z#EST#M1A, Z18EST20V1B → 1AM, 1BV (formato ZipGrade)
 * - V al inicio = vespertino (ej. V1G → 1GV)
 * - Sin V = matutino, agregar M (ej. 1A → 1AM, 1B → 1BM)
 */
function normalizarGrupo(grupo) {
  if (grupo == null || grupo === "") return "S/G";
  let s = String(grupo).toUpperCase().trim();
  // Formato "Matutino - 1C", "Vespertino - 1A" o "EST 06 Matutino - 1A"
  const turnoMatch = s.match(/(?:EST\s*\d+\s+)?(MATUTINO|VESPERTINO)\s*[-–]\s*([1-3][A-Z])$/i);
  if (turnoMatch) {
    const turno = turnoMatch[1].toUpperCase();
    const grupoBase = turnoMatch[2];
    s = turno === "VESPERTINO" ? `V${grupoBase}` : grupoBase;
  }
  // Formato ZipGrade: Z#EST#M1A, Z18EST20V1B → 1AM, 1BV
  const zipMatch = s.match(/Z\d+EST\d+(M|V)1([A-Z])$/i);
  if (zipMatch) {
    const turno = zipMatch[1].toUpperCase();
    const letra = zipMatch[2].toUpperCase();
    return turno === "M" ? `1${letra}M` : `1${letra}V`;
  }
  // Formato "EST 06 MAT" / "EST 06 VES" (un grupo por turno)
  const estMatch = s.match(/EST\s*\d+\s*(MAT|VES)$/i);
  if (estMatch) return estMatch[1].toUpperCase() === "VES" ? "1AV" : "1AM";
  // Ya tiene formato correcto: 1AM, 1BV, 2CM, etc.
  if (/^[1-3][A-Z][MV]$/.test(s)) return s;
  // Vespertino: V1G, V1H → 1GV, 1HV
  const vespertino = s.match(/^V([1-3])([A-Z])$/);
  if (vespertino) return `${vespertino[1]}${vespertino[2]}V`;
  // Matutino: 1A, 1B, 2C → 1AM, 1BM, 2CM
  const matutino = s.match(/^([1-3])([A-Z])$/);
  if (matutino) return `${matutino[1]}${matutino[2]}M`;
  return s.slice(0, 10);
}

/** Valida CCT SEP (ej. 26EES0001W, 26DES0036S, 26ETV0001B) */
function esCctValido(val) {
  if (!val || typeof val !== "string") return false;
  const s = String(val).trim().toUpperCase();
  return /^\d{2}[A-Z]{3}\d{4}[A-Z0-9]$/.test(s);
}

/** Parsea fila en formato Datos_transformados (array, Col_0 = index 0) */
function parsearFilaDatosTransformados(row) {
  const cct = row[2] != null ? String(row[2]).trim() : "";
  const grupoRaw = row[4] != null ? String(row[4]).trim() : "";
  const nombreCompleto = row[8] != null ? fixUtf8Mojibake(String(row[8]).trim()) : "";
  if (!esCctValido(cct) || !nombreCompleto) return null;

  const respuestas = [];
  for (let p = 1; p <= NUM_REACTIVOS; p++) {
    const col = getColRespuesta(p);
    const v = row[col];
    const num = Number(v);
    respuestas.push(!Number.isNaN(num) && num === 1 ? "C" : "X");
  }

  const pctN1 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[1]);
  const pctN2 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[2]);
  const pctN3 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[3]);
  const pctN4 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[4]);
  const pcts = [pctN1, pctN2, pctN3, pctN4];
  const nivelReforzarMas = pcts.indexOf(Math.min(...pcts)) + 1;
  const aciertosTotales = respuestas.filter((r) => r === "C").length;
  const nivelGeneral = aciertosTotales <= 13 ? 1 : aciertosTotales <= 21 ? 2 : aciertosTotales <= 26 ? 3 : 4;
  const porcentaje = (aciertosTotales / NUM_REACTIVOS) * 100;

  const partes = nombreCompleto.split(/\s+/);
  const apellido = partes.length > 1 ? partes.slice(0, -1).join(" ") : "";
  const nombre = partes.length > 1 ? partes[partes.length - 1] : nombreCompleto;

  return {
    cct,
    grupo: grupoRaw ? normalizarGrupo(grupoRaw) : "UNICO",
    nombre: nombre.slice(0, 50),
    apellido: apellido.slice(0, 50),
    porcentaje: Math.round(porcentaje * 10) / 10,
    nivelGeneral,
    porcentajeNivel1: pctN1,
    porcentajeNivel2: pctN2,
    porcentajeNivel3: pctN3,
    porcentajeNivel4: pctN4,
    nivelReforzarMas,
    respuestas,
  };
}

function calcularPctDesdeRespuestas(respuestas, preguntas) {
  let aciertos = 0;
  for (const p of preguntas) {
    if (respuestas[p - 1] === "C") aciertos++;
  }
  return preguntas.length > 0 ? Math.round((aciertos / preguntas.length) * 1000) / 10 : 0;
}

function procesarDatosTransformados(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  // Si la primera fila tiene CCT válido, no hay header; si no, saltar fila 0
  const skipFirst = raw[0] && raw[0].length > 2 && !esCctValido(raw[0][2]);
  const rows = (skipFirst ? raw.slice(1) : raw).filter((r) => r && r.length > 10);
  const alumnos = [];
  for (const row of rows) {
    const a = parsearFilaDatosTransformados(row);
    if (a) alumnos.push(a);
  }

  const porEscuela = new Map();
  for (const a of alumnos) {
    if (!porEscuela.has(a.cct)) porEscuela.set(a.cct, []);
    porEscuela.get(a.cct).push(a);
  }

  const escuelas = [];
  for (const [cct, alumnosEsc] of porEscuela) {
    const res = agregarEscuela(cct, alumnosEsc);
    if (res) escuelas.push(res);
  }
  return escuelas.sort((a, b) => a.cct.localeCompare(b.cct));
}

function agregarEscuela(cct, alumnosRaw) {
  const gruposSet = new Set();
  for (const a of alumnosRaw) {
    gruposSet.add(a.grupo);
  }
  const grupos = Array.from(gruposSet).filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  /** Necesitan apoyo en cada nivel = % en ese nivel < 50% (unificado con listas) */
  const n1Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel1 < UMBRAL_NECESITA_APOYO).length;
  const n2Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel2 < UMBRAL_NECESITA_APOYO).length;
  const n3Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel3 < UMBRAL_NECESITA_APOYO).length;
  const n4Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel4 < UMBRAL_NECESITA_APOYO).length;

  const aciertosEsc = new Array(NUM_REACTIVOS).fill(0);
  const totalesEsc = new Array(NUM_REACTIVOS).fill(0);
  const nivel1Count = alumnosRaw.filter((a) => a.nivelGeneral === 1).length;
  const nivel2Count = alumnosRaw.filter((a) => a.nivelGeneral === 2).length;
  const nivel3Count = alumnosRaw.filter((a) => a.nivelGeneral === 3).length;
  const nivel4Count = alumnosRaw.filter((a) => a.nivelGeneral === 4).length;

  for (const a of alumnosRaw) {
    for (let i = 0; i < NUM_REACTIVOS; i++) {
      if (a.respuestas[i] === "C") aciertosEsc[i]++;
      totalesEsc[i]++;
    }
  }
  const porcentajesEsc = aciertosEsc.map((a, i) =>
    totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
  );

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = alumnosRaw.filter((a) => a.grupo === nombreGrupo);
    const aciertosG = new Array(NUM_REACTIVOS).fill(0);
    const totalesG = new Array(NUM_REACTIVOS).fill(0);
    for (const a of alumnosGrupo) {
      for (let i = 0; i < NUM_REACTIVOS; i++) {
        if (a.respuestas[i] === "C") aciertosG[i]++;
        totalesG[i]++;
      }
    }
    const porcentajesG = aciertosG.map((a, i) =>
      totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
    );
    const n1G = alumnosGrupo.filter((a) => a.porcentajeNivel1 < UMBRAL_NECESITA_APOYO).length;
    const n2G = alumnosGrupo.filter((a) => a.porcentajeNivel2 < UMBRAL_NECESITA_APOYO).length;
    const n3G = alumnosGrupo.filter((a) => a.porcentajeNivel3 < UMBRAL_NECESITA_APOYO).length;
    const n4G = alumnosGrupo.filter((a) => a.porcentajeNivel4 < UMBRAL_NECESITA_APOYO).length;
    return {
      nombre: nombreGrupo,
      alumnos: alumnosGrupo.map((a) => ({
        nombre: a.nombre,
        apellido: a.apellido,
        grupo: a.grupo,
        porcentaje: a.porcentaje,
        nivelGeneral: a.nivelGeneral,
        porcentajeNivel1: a.porcentajeNivel1,
        porcentajeNivel2: a.porcentajeNivel2,
        porcentajeNivel3: a.porcentajeNivel3,
        porcentajeNivel4: a.porcentajeNivel4,
        nivelReforzarMas: a.nivelReforzarMas,
        respuestas: a.respuestas,
      })),
      porcentajesReactivos: porcentajesG,
      nivel1: alumnosGrupo.filter((a) => a.nivelGeneral === 1).length,
      nivel2: alumnosGrupo.filter((a) => a.nivelGeneral === 2).length,
      nivel3: alumnosGrupo.filter((a) => a.nivelGeneral === 3).length,
      nivel4: alumnosGrupo.filter((a) => a.nivelGeneral === 4).length,
      nivelReforzarMas1: n1G,
      nivelReforzarMas2: n2G,
      nivelReforzarMas3: n3G,
      nivelReforzarMas4: n4G,
      total: alumnosGrupo.length,
    };
  });

  return {
    cct,
    totalEstudiantes: alumnosRaw.length,
    porcentajesReactivos: porcentajesEsc,
    nivel1: nivel1Count,
    nivel2: nivel2Count,
    nivel3: nivel3Count,
    nivel4: nivel4Count,
    nivelReforzarMas1: n1Reforzar,
    nivelReforzarMas2: n2Reforzar,
    nivelReforzarMas3: n3Reforzar,
    nivelReforzarMas4: n4Reforzar,
    grupos: gruposResumen,
  };
}

/** Formato *_actualizado.xlsx (Points1-30, Mark1-30) o (Q1-Q30 con 1/0) */
function calcularPorcentajeNivel(row, preguntas) {
  const hasMark = row["Mark1"] != null;
  const hasQ = row["Q1"] != null;
  let aciertos = 0, total = 0;
  for (const i of preguntas) {
    if (hasMark) {
      const p = row[`Points${i}`];
      const m = row[`Mark${i}`];
      if (p == null || m == null) continue;
      const pv = Number(p);
      const mv = String(m).trim();
      if (Number.isNaN(pv)) continue;
      if (pv > 0 && mv === "C") { aciertos++; total++; } else if (pv === 0) total++;
    } else if (hasQ) {
      const v = row[`Q${i}`];
      if (v == null) continue;
      total++;
      if (Number(v) === 1 || String(v).trim() === "1") aciertos++;
    }
  }
  return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
}

function procesarEscuelaActualizado(filePath) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  const cct = path.basename(filePath, path.extname(filePath)).replace("_actualizado", "");
  if (!data.length) return null;

  const keys = Object.keys(data[0] || {});
  const hasQuizClass = keys.some((k) => k === "QuizClass");
  const hasClass = keys.some((k) => k === "Class");
  const grupoCol = hasQuizClass ? "QuizClass" : hasClass ? "Class" : null;
  const gruposSet = new Set();
  const dataConGrupo = grupoCol
    ? data.filter((row) => {
        const raw = fixUtf8Mojibake(String(row[grupoCol] ?? "").trim());
        return raw.length > 0;
      })
    : [];
  if (grupoCol && dataConGrupo.length < data.length) {
    const excluidos = data.length - dataConGrupo.length;
    if (excluidos > 0) console.warn(`  ${cct}: ${excluidos} alumnos sin grupo excluidos`);
  }
  const rows = (grupoCol ? dataConGrupo : data).map((row) => {
    const grupoRaw = grupoCol ? fixUtf8Mojibake(String(row[grupoCol] ?? "").trim()) : "";
    const grupo = grupoRaw ? normalizarGrupo(grupoRaw) : "UNICO";
    gruposSet.add(grupo);

    const pctN1 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[1]);
    const pctN2 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[2]);
    const pctN3 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[3]);
    const pctN4 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[4]);
    const respuestas = Array.from({ length: NUM_REACTIVOS }, (_, i) => {
      const m = row[`Mark${i + 1}`];
      const q = row[`Q${i + 1}`];
      if (m != null) return String(m).trim() === "C" ? "C" : "X";
      if (q != null) return Number(q) === 1 || String(q).trim() === "1" ? "C" : "X";
      return "X";
    });
    const aciertosTotales = respuestas.filter((r) => r === "C").length;
    const nivelGeneral = aciertosTotales <= 13 ? 1 : aciertosTotales <= 21 ? 2 : aciertosTotales <= 26 ? 3 : 4;
    const porcentaje = NUM_REACTIVOS > 0 ? Math.round((aciertosTotales / NUM_REACTIVOS) * 1000) / 10 : 0;

    const pcts = [pctN1, pctN2, pctN3, pctN4];
    const minIdx = pcts.indexOf(Math.min(...pcts));
    const nivelReforzarMas = (minIdx + 1);

    const firstName = row.FirstName ?? row["First Name"] ?? "";
    const lastName = row.LastName ?? row["Last Name"] ?? "";
    return {
      nombre: fixUtf8Mojibake(String(firstName).trim()).slice(0, 50),
      apellido: fixUtf8Mojibake(String(lastName).trim()).slice(0, 50),
      grupo,
      porcentaje,
      nivelGeneral,
      porcentajeNivel1: pctN1,
      porcentajeNivel2: pctN2,
      porcentajeNivel3: pctN3,
      porcentajeNivel4: pctN4,
      nivelReforzarMas,
      respuestas,
      necesitaApoyoNivel1: pctN1 < UMBRAL_NECESITA_APOYO,
      necesitaApoyoNivel2: pctN2 < UMBRAL_NECESITA_APOYO,
      necesitaApoyoNivel3: pctN3 < UMBRAL_NECESITA_APOYO,
      necesitaApoyoNivel4: pctN4 < UMBRAL_NECESITA_APOYO,
    };
  });

  const grupos = Array.from(gruposSet).filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  /** Necesitan apoyo en cada nivel = % en ese nivel < 50% (unificado con listas) */
  const n1Reforzar = rows.filter((r) => r.porcentajeNivel1 < UMBRAL_NECESITA_APOYO).length;
  const n2Reforzar = rows.filter((r) => r.porcentajeNivel2 < UMBRAL_NECESITA_APOYO).length;
  const n3Reforzar = rows.filter((r) => r.porcentajeNivel3 < UMBRAL_NECESITA_APOYO).length;
  const n4Reforzar = rows.filter((r) => r.porcentajeNivel4 < UMBRAL_NECESITA_APOYO).length;

  const aciertosEsc = new Array(NUM_REACTIVOS).fill(0);
  const totalesEsc = new Array(NUM_REACTIVOS).fill(0);
  let n1 = 0, n2 = 0, n3 = 0, n4 = 0;
  rows.forEach((r) => {
    for (let i = 0; i < NUM_REACTIVOS; i++) {
      if (r.respuestas[i] === "C") aciertosEsc[i]++;
      totalesEsc[i]++;
    }
    if (r.nivelGeneral === 1) n1++;
    else if (r.nivelGeneral === 2) n2++;
    else if (r.nivelGeneral === 3) n3++;
    else n4++;
  });
  const porcentajesEsc = aciertosEsc.map((a, i) =>
    totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
  );

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = rows.filter((r) => r.grupo === nombreGrupo);
    const aciertosG = new Array(NUM_REACTIVOS).fill(0);
    const totalesG = new Array(NUM_REACTIVOS).fill(0);
    alumnosGrupo.forEach((r) => {
      for (let i = 0; i < NUM_REACTIVOS; i++) {
        if (r.respuestas[i] === "C") aciertosG[i]++;
        totalesG[i]++;
      }
    });
    const porcentajesG = aciertosG.map((a, i) =>
      totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
    );
    return {
      nombre: nombreGrupo,
      alumnos: alumnosGrupo.map((r) => ({
        nombre: r.nombre,
        apellido: r.apellido,
        grupo: r.grupo,
        porcentaje: r.porcentaje,
        nivelGeneral: r.nivelGeneral,
        porcentajeNivel1: r.porcentajeNivel1,
        porcentajeNivel2: r.porcentajeNivel2,
        porcentajeNivel3: r.porcentajeNivel3,
        porcentajeNivel4: r.porcentajeNivel4,
        nivelReforzarMas: r.nivelReforzarMas,
        respuestas: r.respuestas,
      })),
      porcentajesReactivos: porcentajesG,
      nivel1: alumnosGrupo.filter((r) => r.nivelGeneral === 1).length,
      nivel2: alumnosGrupo.filter((r) => r.nivelGeneral === 2).length,
      nivel3: alumnosGrupo.filter((r) => r.nivelGeneral === 3).length,
      nivel4: alumnosGrupo.filter((r) => r.nivelGeneral === 4).length,
      nivelReforzarMas1: alumnosGrupo.filter((r) => r.porcentajeNivel1 < UMBRAL_NECESITA_APOYO).length,
      nivelReforzarMas2: alumnosGrupo.filter((r) => r.porcentajeNivel2 < UMBRAL_NECESITA_APOYO).length,
      nivelReforzarMas3: alumnosGrupo.filter((r) => r.porcentajeNivel3 < UMBRAL_NECESITA_APOYO).length,
      nivelReforzarMas4: alumnosGrupo.filter((r) => r.porcentajeNivel4 < UMBRAL_NECESITA_APOYO).length,
      total: alumnosGrupo.length,
    };
  });

  return {
    cct,
    totalEstudiantes: rows.length,
    porcentajesReactivos: porcentajesEsc,
    nivel1: n1,
    nivel2: n2,
    nivel3: n3,
    nivel4: n4,
    nivelReforzarMas1: n1Reforzar,
    nivelReforzarMas2: n2Reforzar,
    nivelReforzarMas3: n3Reforzar,
    nivelReforzarMas4: n4Reforzar,
    grupos: gruposResumen,
  };
}

/** Mapa número de escuela → CCT desde nombres-escuelas.json */
function buildNumEscuelaToCct() {
  const map = new Map();
  if (!fs.existsSync(NOMBRES_ESCUELAS_PATH)) return map;
  const nombres = JSON.parse(fs.readFileSync(NOMBRES_ESCUELAS_PATH, "utf8"));
  for (const cct of Object.keys(nombres)) {
    const m = cct.match(cctNumeroRegex());
    if (m) map.set(parseInt(m[1], 10), cct);
  }
  return map;
}

function cctDesdeCustomId(customId, numToCct) {
  if (!customId) return null;
  const s = String(customId).trim();
  const m = s.match(/Z\d+EST(\d+)(M|V)1([A-Z])$/i);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  return numToCct.get(num) ?? null;
}

function grupoDesdeCustomId(customId) {
  if (!customId) return "S/G";
  return normalizarGrupo(String(customId).trim());
}

/** Export ZipGrade combinado (FirstName, LastName, CustomID, Mark1-30) */
function procesarZipGradeCombinado(filePath, numToCct) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  const alumnos = [];
  let sinCct = 0;

  for (const row of data) {
    const firstName = row.FirstName ?? row["First Name"] ?? "";
    const lastName = row.LastName ?? row["Last Name"] ?? "";
    if (!String(firstName).trim() && !String(lastName).trim()) continue;

    const customId = row.CustomID ?? row.CustomId ?? "";
    const cct = cctDesdeCustomId(customId, numToCct);
    if (!cct) {
      sinCct++;
      continue;
    }
    const grupo = grupoDesdeCustomId(customId);

    const respuestas = Array.from({ length: NUM_REACTIVOS }, (_, i) => {
      const m = row[`Mark${i + 1}`];
      if (m != null) return String(m).trim() === "C" ? "C" : "X";
      const q = row[`Q${i + 1}`];
      if (q != null) return Number(q) === 1 || String(q).trim() === "1" ? "C" : "X";
      return "X";
    });

    const pctN1 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[1]);
    const pctN2 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[2]);
    const pctN3 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[3]);
    const pctN4 = calcularPctDesdeRespuestas(respuestas, NIVELES_PREGUNTAS[4]);
    const pcts = [pctN1, pctN2, pctN3, pctN4];
    const nivelReforzarMas = pcts.indexOf(Math.min(...pcts)) + 1;
    const aciertosTotales = respuestas.filter((r) => r === "C").length;
    const nivelGeneral = aciertosTotales <= 13 ? 1 : aciertosTotales <= 21 ? 2 : aciertosTotales <= 26 ? 3 : 4;
    const porcentaje = NUM_REACTIVOS > 0 ? Math.round((aciertosTotales / NUM_REACTIVOS) * 1000) / 10 : 0;

    alumnos.push({
      cct,
      grupo,
      nombre: fixUtf8Mojibake(String(firstName).trim()).slice(0, 50),
      apellido: fixUtf8Mojibake(String(lastName).trim()).slice(0, 50),
      porcentaje,
      nivelGeneral,
      porcentajeNivel1: pctN1,
      porcentajeNivel2: pctN2,
      porcentajeNivel3: pctN3,
      porcentajeNivel4: pctN4,
      nivelReforzarMas,
      respuestas,
    });
  }

  if (sinCct > 0) console.warn(`  ZipGrade: ${sinCct} alumnos sin CCT (CustomID no reconocido)`);

  const porEscuela = new Map();
  for (const a of alumnos) {
    if (!porEscuela.has(a.cct)) porEscuela.set(a.cct, []);
    porEscuela.get(a.cct).push(a);
  }

  const escuelas = [];
  for (const [cct, alumnosEsc] of porEscuela) {
    const res = agregarEscuela(cct, alumnosEsc);
    if (res) escuelas.push(res);
  }
  return escuelas.sort((a, b) => a.cct.localeCompare(b.cct));
}

function procesarDirectorioEscuelas(dir) {
  if (!fs.existsSync(dir)) return [];

  const datosTransformados = fs.readdirSync(dir).filter((f) => /Datos_transformados.*\.xlsx$/i.test(f));
  if (datosTransformados.length > 0) {
    const filePath = path.join(dir, datosTransformados[0]);
    console.log("  Datos_transformados:", filePath);
    return procesarDatosTransformados(filePath);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith("_actualizado.xlsx"));
  const escuelas = [];
  for (const f of files.sort()) {
    try {
      const res = procesarEscuelaActualizado(path.join(dir, f));
      if (res) escuelas.push(res);
    } catch (e) {
      console.error("  Error en", f, e.message);
    }
  }
  return escuelas;
}

function procesarAterrizaje2026(numToCct, totalEscuelasDespegue) {
  if (!fs.existsSync(ATERRIZAJE_DIR)) return null;

  const zipFiles = fs.readdirSync(ATERRIZAJE_DIR).filter((f) =>
    /quiz.*\.xlsx$/i.test(f) || /zipgrade.*\.xlsx$/i.test(f) || /full-combined.*\.xlsx$/i.test(f)
  );
  if (zipFiles.length === 0) return null;

  const filePath = path.join(ATERRIZAJE_DIR, zipFiles[0]);
  console.log("Procesando Aterrizaje 2026 (ZipGrade):", filePath);
  const escuelas = procesarZipGradeCombinado(filePath, numToCct);
  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  console.log(`  → ${escuelas.length} escuelas, ${totalAlumnos} alumnos`);

  return {
    ...EVALUACIONES.aterrizaje2026,
    escuelas,
    generado: new Date().toISOString(),
    parcial: escuelas.length < totalEscuelasDespegue,
  };
}

function main() {
  const numToCct = buildNumEscuelaToCct();
  let evaluaciones = {};

  if (DATA_FILE && fs.existsSync(DATA_FILE)) {
    console.log("Usando DATA_FILE:", DATA_FILE);
    const escuelas = procesarDatosTransformados(DATA_FILE);
    evaluaciones.despegue2025 = {
      ...EVALUACIONES.despegue2025,
      escuelas,
      generado: new Date().toISOString(),
    };
  } else {
    const despegueDir = fs.existsSync(DESPEGUE_DIR) ? DESPEGUE_DIR : DATA_DIR;
    console.log("Procesando Despegue 2025:", despegueDir);
    const escuelas2025 = procesarDirectorioEscuelas(despegueDir);
    const total2025 = escuelas2025.reduce((s, e) => s + e.totalEstudiantes, 0);
    console.log(`  → ${escuelas2025.length} escuelas, ${total2025} alumnos`);

    evaluaciones.despegue2025 = {
      ...EVALUACIONES.despegue2025,
      escuelas: escuelas2025,
      generado: new Date().toISOString(),
    };

    const aterrizaje = procesarAterrizaje2026(numToCct, escuelas2025.length);
    if (aterrizaje) evaluaciones.aterrizaje2026 = aterrizaje;
  }

  const out = { evaluaciones };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(DATA_JSON_PATH), { recursive: true });
  const outStr = JSON.stringify(out, null, 2);
  fs.writeFileSync(OUT_FILE, outStr, "utf8");
  fs.writeFileSync(DATA_JSON_PATH, outStr, "utf8");

  for (const [id, ev] of Object.entries(evaluaciones)) {
    const total = ev.escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
    const parcial = ev.parcial ? " (parcial)" : "";
    console.log(`OK ${id}: ${ev.escuelas.length} escuelas, ${total} alumnos${parcial}`);
  }
  console.log("→", OUT_FILE, "y", DATA_JSON_PATH);
}

main();
