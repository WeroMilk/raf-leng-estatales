/**
 * Parser compartido para Excel RAF "Todos" (despegue + aterrizaje).
 * Usado por build-all-todos.mjs para alimentar las 6 apps.
 */
import { createRequire } from "module";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findWorkspaceRoot(fromDir) {
  let dir = fromDir;
  for (let i = 0; i < 6; i++) {
    if (
      fs.existsSync(path.join(dir, "ESTATALES", "RAFleng")) &&
      fs.existsSync(path.join(dir, "GENERALES", "RAFleng")) &&
      fs.existsSync(path.join(dir, "TELESECUNDARIAS", "RAFleng"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return fromDir;
}

const ROOT = findWorkspaceRoot(path.resolve(__dirname, ".."));
const require = createRequire(
  fs.existsSync(path.join(__dirname, "..", "package.json"))
    ? path.join(__dirname, "..", "package.json")
    : path.join(ROOT, "ESTATALES", "RAFleng", "package.json")
);
const XLSX = require("xlsx");

const NUM_REACTIVOS_LENG = 30;
const NUM_REACTIVOS_MAT = 12;
const UMBRAL_NECESITA_APOYO = 50;

const NIVELES_PREGUNTAS = {
  1: [1, 3, 4, 6, 9, 16],
  2: [5, 7, 10, 11, 12, 14, 15, 18, 19, 20, 21, 23, 24],
  3: [2, 8, 13, 17, 22, 25, 26, 27, 28],
  4: [29, 30],
};

const AREA_POR_TIPO = {
  estatales: "estatales",
  generales: "generales",
  telesecundarias: "telesecundarias",
};

const META = {
  despegue: {
    leng: { id: "despegue2025", nombre: "RAF Despegue 2025", nombreCorto: "Despegue 2025" },
    mat: { id: "despegue-2025", nombre: "RAF Despegue 2025", nombreCorto: "Despegue 2025" },
  },
  aterrizaje: {
    leng: { id: "aterrizaje2026", nombre: "RAF Aterrizaje 2026", nombreCorto: "Aterrizaje 2026" },
    mat: { id: "aterrizaje-2026", nombre: "RAF Aterrizaje 2026", nombreCorto: "Aterrizaje 2026" },
  },
};

export function fixUtf8Mojibake(str) {
  if (typeof str !== "string") return str;
  if (!/Ã[\x80-\xBF]/.test(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

export function esCctSEP(s) {
  if (typeof s !== "string") return false;
  const t = s.trim().toUpperCase();
  return /^\d{2}[A-Z]{3}\d{4}[A-Z0-9]$/.test(t);
}

export function esCctTecnicas(cct) {
  return String(cct || "").trim().toUpperCase().startsWith("26DST");
}

export function normalizarArea(area) {
  return String(area || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function areaCoincideTipo(area, tipoId) {
  const esperada = AREA_POR_TIPO[tipoId];
  if (!esperada) return false;
  const a = normalizarArea(area);
  if (a === "tecnicas" || a === "tecnica") return false;
  return a === esperada;
}

export function normalizarGrupo(grupo) {
  if (grupo == null || grupo === "") return "UNICO";
  let s = String(grupo).toUpperCase().trim();
  if (s === "S" || s === "S/G") return "UNICO";
  const turnoMatch = s.match(/(?:EST\s*\d+\s+)?(MATUTINO|VESPERTINO)\s*[-–]\s*([1-3][A-Z])$/i);
  if (turnoMatch) {
    const turno = turnoMatch[1].toUpperCase();
    const grupoBase = turnoMatch[2];
    s = turno === "VESPERTINO" ? `V${grupoBase}` : grupoBase;
  }
  const zipMatch = s.match(/Z\d+EST\d+(M|V)1([A-Z])$/i);
  if (zipMatch) {
    const turno = zipMatch[1].toUpperCase();
    const letra = zipMatch[2].toUpperCase();
    return turno === "M" ? `1${letra}M` : `1${letra}V`;
  }
  const estMatch = s.match(/EST\s*\d+\s*(MAT|VES)$/i);
  if (estMatch) return estMatch[1].toUpperCase() === "VES" ? "1AV" : "1AM";
  if (/^[1-3][A-Z][MV]$/.test(s)) return s;
  const vespertino = s.match(/^V([1-3])([A-Z])$/);
  if (vespertino) return `${vespertino[1]}${vespertino[2]}V`;
  const matutino = s.match(/^([1-3])([A-Z])$/);
  if (matutino) return `${matutino[1]}${matutino[2]}M`;
  const m = s.match(/M1([A-H])/);
  if (m) return `1${m[1]}M`;
  const v = s.match(/V1([A-H])/);
  if (v) return `1${v[1]}V`;
  return s.slice(0, 10) || "UNICO";
}

export function extraerCctDesdeQuizName(quizName) {
  const q = String(quizName || "").trim();
  if (!q) return null;
  const zip = q.match(/^2RAF[ML]26([A-Z]{3})(\d{4})([MV])1[A-Z]$/i);
  if (zip) return `26${zip[1].toUpperCase()}${zip[2]}${zip[3].toUpperCase()}`;
  const matches = [...q.matchAll(/(\d{2}[A-Z]{3}\d{4}[A-Z0-9])/gi)];
  if (!matches.length) return null;
  const cct = matches[matches.length - 1][1].toUpperCase();
  return esCctSEP(cct) ? cct : null;
}

export function parsearNombre(row) {
  const firstName = fixUtf8Mojibake(String(row.FirstName ?? row["First Name"] ?? "").trim());
  const lastName = fixUtf8Mojibake(String(row.LastName ?? row["Last Name"] ?? "").trim());
  if (firstName || lastName) {
    return { nombre: (firstName || lastName).slice(0, 50), apellido: lastName.slice(0, 50) };
  }
  const sid = fixUtf8Mojibake(String(row.StudentID ?? "").trim());
  if (sid && sid !== "0") {
    const partes = sid.split("/").map((p) => p.trim()).filter(Boolean);
    if (partes.length >= 3) {
      return {
        apellido: `${partes[0]} ${partes[1]}`.slice(0, 50),
        nombre: partes.slice(2).join(" ").slice(0, 50),
      };
    }
    if (partes.length === 2) {
      return { apellido: partes[0].slice(0, 50), nombre: partes[1].slice(0, 50) };
    }
    if (partes.length === 1) {
      const tokens = partes[0].split(/\s+/);
      if (tokens.length > 1) {
        return {
          apellido: tokens.slice(0, -1).join(" ").slice(0, 50),
          nombre: tokens[tokens.length - 1].slice(0, 50),
        };
      }
      return { nombre: partes[0].slice(0, 50), apellido: "" };
    }
  }
  return null;
}

function calcularPctDesdeRespuestas(respuestas, preguntas) {
  let aciertos = 0;
  for (const p of preguntas) {
    if (respuestas[p - 1] === "C") aciertos++;
  }
  return preguntas.length > 0 ? Math.round((aciertos / preguntas.length) * 1000) / 10 : 0;
}

function calcularPorcentajeNivel(row, preguntas) {
  let aciertos = 0;
  let total = 0;
  for (const i of preguntas) {
    const p = row[`Points${i}`];
    const m = row[`Mark${i}`];
    if (p == null || m == null) continue;
    const pv = Number(p);
    const mv = String(m).trim();
    if (Number.isNaN(pv)) continue;
    if (pv > 0 && mv === "C") {
      aciertos++;
      total++;
    } else if (pv === 0) total++;
  }
  return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
}

function extraerRespuestasLeng(row) {
  return Array.from({ length: NUM_REACTIVOS_LENG }, (_, i) => {
    const m = row[`Mark${i + 1}`];
    if (m != null) return String(m).trim() === "C" ? "C" : "X";
    const q = row[`Q${i + 1}`];
    if (q != null) return Number(q) === 1 || String(q).trim() === "1" ? "C" : "X";
    return "X";
  });
}

function obtenerNivelMat(porcentaje) {
  if (porcentaje == null) return "REQUIERE APOYO";
  if (porcentaje <= 50) return "REQUIERE APOYO";
  if (porcentaje <= 80) return "EN DESARROLLO";
  return "ESPERADO";
}

function calcularPorcentajeMat(row) {
  let aciertos = 0;
  let total = 0;
  for (let i = 1; i <= NUM_REACTIVOS_MAT; i++) {
    const p = row[`Points${i}`];
    const m = row[`Mark${i}`];
    if (p == null || m == null) continue;
    const pv = Number(p);
    const mv = String(m).trim();
    if (Number.isNaN(pv)) continue;
    if (pv > 0 && mv === "C") {
      aciertos++;
      total++;
    } else if (pv === 0) total++;
  }
  return total > 0 ? Math.round((aciertos / total) * 1000) / 10 : 0;
}

function extraerMarcasMat(row) {
  return Array.from({ length: NUM_REACTIVOS_MAT }, (_, i) => {
    const idx = i + 1;
    const p = row[`Points${idx}`];
    const m = row[`Mark${idx}`];
    if (p == null || m == null) return "-";
    const pv = Number(p);
    if (Number.isNaN(pv)) return "-";
    const mv = String(m).trim().toUpperCase();
    return mv === "C" || mv === "X" ? mv : "-";
  });
}

function respuestaMat(row, i) {
  const val = row[`Stu${i}`];
  if (val != null && String(val).trim()) {
    const s = String(val).trim().toUpperCase();
    if (/^[ABCD]$/.test(s)) return s;
  }
  const m = row[`Mark${i}`];
  return m != null && String(m).trim() ? String(m).trim() : "-";
}

function parsearAlumnoLeng(row, grupo, placeholder) {
  const respuestas = extraerRespuestasLeng(row);
  const pctN1 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[1]);
  const pctN2 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[2]);
  const pctN3 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[3]);
  const pctN4 = calcularPorcentajeNivel(row, NIVELES_PREGUNTAS[4]);
  const pcts = [pctN1, pctN2, pctN3, pctN4];
  const nivelReforzarMas = pcts.indexOf(Math.min(...pcts)) + 1;
  const aciertosTotales = respuestas.filter((r) => r === "C").length;
  const nivelGeneral =
    aciertosTotales <= 13 ? 1 : aciertosTotales <= 21 ? 2 : aciertosTotales <= 26 ? 3 : 4;
  const porcentaje =
    NUM_REACTIVOS_LENG > 0 ? Math.round((aciertosTotales / NUM_REACTIVOS_LENG) * 1000) / 10 : 0;
  const parsed = parsearNombre(row);
  const nombre = parsed?.nombre || placeholder.nombre;
  const apellido = parsed?.apellido || placeholder.apellido;
  return {
    nombre,
    apellido,
    grupo,
    porcentaje,
    nivelGeneral,
    porcentajeNivel1: pctN1,
    porcentajeNivel2: pctN2,
    porcentajeNivel3: pctN3,
    porcentajeNivel4: pctN4,
    nivelReforzarMas,
    respuestas,
  };
}

function agregarEscuelaLeng(cct, alumnosRaw) {
  const grupos = [...new Set(alumnosRaw.map((a) => a.grupo))].filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  const n1Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel1 < UMBRAL_NECESITA_APOYO).length;
  const n2Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel2 < UMBRAL_NECESITA_APOYO).length;
  const n3Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel3 < UMBRAL_NECESITA_APOYO).length;
  const n4Reforzar = alumnosRaw.filter((a) => a.porcentajeNivel4 < UMBRAL_NECESITA_APOYO).length;

  const aciertosEsc = new Array(NUM_REACTIVOS_LENG).fill(0);
  const totalesEsc = new Array(NUM_REACTIVOS_LENG).fill(0);
  let n1 = 0, n2 = 0, n3 = 0, n4 = 0;

  for (const a of alumnosRaw) {
    for (let i = 0; i < NUM_REACTIVOS_LENG; i++) {
      if (a.respuestas[i] === "C") aciertosEsc[i]++;
      totalesEsc[i]++;
    }
    if (a.nivelGeneral === 1) n1++;
    else if (a.nivelGeneral === 2) n2++;
    else if (a.nivelGeneral === 3) n3++;
    else n4++;
  }

  const porcentajesEsc = aciertosEsc.map((a, i) =>
    totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
  );

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = alumnosRaw.filter((a) => a.grupo === nombreGrupo);
    const aciertosG = new Array(NUM_REACTIVOS_LENG).fill(0);
    const totalesG = new Array(NUM_REACTIVOS_LENG).fill(0);
    for (const a of alumnosGrupo) {
      for (let i = 0; i < NUM_REACTIVOS_LENG; i++) {
        if (a.respuestas[i] === "C") aciertosG[i]++;
        totalesG[i]++;
      }
    }
    const porcentajesG = aciertosG.map((a, i) =>
      totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
    );
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
      nivelReforzarMas1: alumnosGrupo.filter((a) => a.porcentajeNivel1 < UMBRAL_NECESITA_APOYO).length,
      nivelReforzarMas2: alumnosGrupo.filter((a) => a.porcentajeNivel2 < UMBRAL_NECESITA_APOYO).length,
      nivelReforzarMas3: alumnosGrupo.filter((a) => a.porcentajeNivel3 < UMBRAL_NECESITA_APOYO).length,
      nivelReforzarMas4: alumnosGrupo.filter((a) => a.porcentajeNivel4 < UMBRAL_NECESITA_APOYO).length,
      total: alumnosGrupo.length,
    };
  });

  return {
    cct,
    totalEstudiantes: alumnosRaw.length,
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

function construirEscuelaMat(cct, rows) {
  const grupos = [...new Set(rows.map((r) => r._grupo))].filter(Boolean).sort();
  if (!grupos.length) grupos.push("UNICO");

  const aciertosEsc = new Array(NUM_REACTIVOS_MAT).fill(0);
  const totalesEsc = new Array(NUM_REACTIVOS_MAT).fill(0);
  let req = 0, des = 0, esp = 0;

  rows.forEach((r) => {
    for (let i = 1; i <= NUM_REACTIVOS_MAT; i++) {
      const p = r[`Points${i}`];
      const m = r[`Mark${i}`];
      if (p != null && m != null) {
        const pv = Number(p);
        if (!Number.isNaN(pv)) {
          if (pv > 0 && String(m).trim() === "C") aciertosEsc[i - 1]++;
          totalesEsc[i - 1]++;
        }
      }
    }
    if (r._nivel === "REQUIERE APOYO") req++;
    else if (r._nivel === "EN DESARROLLO") des++;
    else esp++;
  });

  const porcentajesEsc = aciertosEsc.map((a, i) =>
    totalesEsc[i] > 0 ? Math.round((a / totalesEsc[i]) * 1000) / 10 : 0
  );

  const gruposResumen = grupos.map((nombreGrupo) => {
    const alumnosGrupo = rows.filter((r) => r._grupo === nombreGrupo);
    const aciertosG = new Array(NUM_REACTIVOS_MAT).fill(0);
    const totalesG = new Array(NUM_REACTIVOS_MAT).fill(0);
    alumnosGrupo.forEach((r) => {
      for (let i = 1; i <= NUM_REACTIVOS_MAT; i++) {
        const p = r[`Points${i}`];
        const m = r[`Mark${i}`];
        if (p != null && m != null) {
          const pv = Number(p);
          if (!Number.isNaN(pv)) {
            if (pv > 0 && String(m).trim() === "C") aciertosG[i - 1]++;
            totalesG[i - 1]++;
          }
        }
      }
    });
    const porcentajesG = aciertosG.map((a, i) =>
      totalesG[i] > 0 ? Math.round((a / totalesG[i]) * 1000) / 10 : 0
    );
    const reqG = alumnosGrupo.filter((r) => r._nivel === "REQUIERE APOYO").length;
    const desG = alumnosGrupo.filter((r) => r._nivel === "EN DESARROLLO").length;
    const espG = alumnosGrupo.filter((r) => r._nivel === "ESPERADO").length;
    return {
      nombre: nombreGrupo,
      alumnos: alumnosGrupo.map((r) => ({
        nombre: r._nombre,
        apellido: r._apellido,
        grupo: r._grupo,
        porcentaje: r._porcentaje,
        nivel: r._nivel,
        respuestas: r._respuestas,
        marcas: r._marcas,
      })),
      porcentajesReactivos: porcentajesG,
      requiereApoyo: reqG,
      enDesarrollo: desG,
      esperado: espG,
      total: alumnosGrupo.length,
    };
  });

  return {
    cct,
    totalEstudiantes: rows.length,
    porcentajesReactivos: porcentajesEsc,
    requiereApoyo: req,
    enDesarrollo: des,
    esperado: esp,
    grupos: gruposResumen,
  };
}

function leerHoja(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { type: "file" });
  const name =
    sheetName ||
    wb.SheetNames.find((s) => /lenguaje/i.test(s)) ||
    wb.SheetNames.find((s) => /matem/i.test(s)) ||
    wb.SheetNames[0];
  if (!wb.Sheets[name]) {
    throw new Error(`Hoja "${name}" no encontrada en ${filePath}. Hojas: ${wb.SheetNames.join(", ")}`);
  }
  return XLSX.utils.sheet_to_json(wb.Sheets[name]);
}

function obtenerGrupoDespegue(row, materia) {
  const raw =
    materia === "leng"
      ? row.Grupo2 ?? row.QuizClass ?? row.Grupo
      : row.Grupo ?? row.QuizClass ?? row.Grupo2;
  const s = fixUtf8Mojibake(String(raw ?? "").trim());
  if (!s || s === "s") return "UNICO";
  return normalizarGrupo(s);
}

function obtenerGrupoAterrizaje(row) {
  const raw = fixUtf8Mojibake(String(row.QuizClass ?? row.Grupo ?? row.Grupo2 ?? "").trim());
  if (!raw || raw.toLowerCase() === "s") return "UNICO";
  return normalizarGrupo(raw);
}

function obtenerCctDespegue(row) {
  const cct = String(row.CCT ?? "").trim().toUpperCase();
  return esCctSEP(cct) ? cct : null;
}

function obtenerCctAterrizaje(row) {
  const direct = String(row.CCT ?? "").trim().toUpperCase();
  if (esCctSEP(direct)) return direct;
  return extraerCctDesdeQuizName(row.QuizName ?? row["Source.Name"]);
}

function filtrarFilas(data, tipoId) {
  return data.filter((row) => {
    const area = row["Área"] ?? row.Area ?? "";
    if (!areaCoincideTipo(area, tipoId)) return false;
    const cct = String(row.CCT ?? extraerCctDesdeQuizName(row.QuizName) ?? "").toUpperCase();
    if (esCctTecnicas(cct)) return false;
    return true;
  });
}

function procesarLeng(data, tipoId, modo, obtenerCct, obtenerGrupo) {
  const filas = filtrarFilas(data, tipoId);
  const porEscuela = new Map();
  const contadores = new Map();
  let omitidos = 0;

  for (const row of filas) {
    const cct = obtenerCct(row);
    if (!cct || esCctTecnicas(cct)) {
      omitidos++;
      continue;
    }
    const grupo = obtenerGrupo(row);
    const key = `${cct}|${grupo}`;
    const n = (contadores.get(key) || 0) + 1;
    contadores.set(key, n);
    const alumno = parsearAlumnoLeng(row, grupo, {
      nombre: `Alumno ${n}`,
      apellido: "",
    });
    if (!porEscuela.has(cct)) porEscuela.set(cct, []);
    porEscuela.get(cct).push(alumno);
  }

  const escuelas = [...porEscuela.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cct, alumnos]) => agregarEscuelaLeng(cct, alumnos));

  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  return { escuelas, totalAlumnos, omitidos, filas: filas.length };
}

function procesarMat(data, tipoId, obtenerCct, obtenerGrupo) {
  const filas = filtrarFilas(data, tipoId);
  const porEscuela = new Map();
  const contadores = new Map();
  let omitidos = 0;

  for (const row of filas) {
    const cct = obtenerCct(row);
    if (!cct || esCctTecnicas(cct)) {
      omitidos++;
      continue;
    }
    const grupo = obtenerGrupo(row);
    const key = `${cct}|${grupo}`;
    const n = (contadores.get(key) || 0) + 1;
    contadores.set(key, n);
    const parsed = parsearNombre(row);
    const porcentaje = calcularPorcentajeMat(row);
    const processed = {
      ...row,
      _grupo: grupo,
      _nombre: parsed?.nombre || `Alumno ${n}`,
      _apellido: parsed?.apellido || "",
      _porcentaje: porcentaje,
      _nivel: obtenerNivelMat(porcentaje),
      _respuestas: Array.from({ length: NUM_REACTIVOS_MAT }, (_, i) => respuestaMat(row, i + 1)),
      _marcas: extraerMarcasMat(row),
    };
    if (!porEscuela.has(cct)) porEscuela.set(cct, []);
    porEscuela.get(cct).push(processed);
  }

  const escuelas = [...porEscuela.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cct, rows]) => construirEscuelaMat(cct, rows));

  const totalAlumnos = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  return { escuelas, totalAlumnos, omitidos, filas: filas.length };
}

export function parseDespegue({ filePath, tipoId, materia }) {
  const sheet = materia === "leng" ? "Lenguaje" : "Matemáticas";
  const data = leerHoja(filePath, sheet);
  if (materia === "leng") {
    return procesarLeng(data, tipoId, "despegue", obtenerCctDespegue, (row) =>
      obtenerGrupoDespegue(row, "leng")
    );
  }
  return procesarMat(data, tipoId, obtenerCctDespegue, (row) => obtenerGrupoDespegue(row, "mat"));
}

export function parseAterrizaje({ filePath, tipoId, materia }) {
  const sheet = materia === "leng" ? "Lenguaje Todos" : "Matemáticas Todos";
  const data = leerHoja(filePath, sheet);
  if (materia === "leng") {
    return procesarLeng(data, tipoId, "aterrizaje", obtenerCctAterrizaje, obtenerGrupoAterrizaje);
  }
  return procesarMat(data, tipoId, obtenerCctAterrizaje, obtenerGrupoAterrizaje);
}

export function buildResultadosLeng(despegueEscuelas, aterrizajeEscuelas) {
  const generado = new Date().toISOString();
  return {
    evaluaciones: {
      despegue2025: {
        ...META.despegue.leng,
        escuelas: despegueEscuelas,
        generado,
      },
      aterrizaje2026: {
        ...META.aterrizaje.leng,
        escuelas: aterrizajeEscuelas,
        generado,
        parcial: aterrizajeEscuelas.length < despegueEscuelas.length,
      },
    },
  };
}

export function buildResultadosMat(despegueEscuelas, aterrizajeEscuelas) {
  return {
    evaluaciones: [
      {
        ...META.despegue.mat,
        escuelas: despegueEscuelas,
      },
      {
        ...META.aterrizaje.mat,
        escuelas: aterrizajeEscuelas,
        parcial: aterrizajeEscuelas.length < despegueEscuelas.length,
      },
    ],
    generado: new Date().toISOString(),
  };
}

export function buildNombresEscuelas(escuelas) {
  const out = {};
  for (const esc of escuelas) {
    out[esc.cct] = esc.cct;
  }
  return out;
}
