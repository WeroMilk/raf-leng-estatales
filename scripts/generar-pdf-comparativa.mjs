/**
 * PDF comparativa RAF Lenguaje — una hoja horizontal, layout aireado.
 * Solo caracteres ASCII (Helvetica no soporta Δ, −, etc.).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAF_CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "lib", "raf-config.json"), "utf8")
);
function cctNumeroRegex() {
  const prefix = RAF_CONFIG.cctPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(prefix + "(\\d{4})", "i");
}
const ROOT = path.join(__dirname, "..");

const PAGE = { w: 842, h: 595, m: 28, gap: 14, pad: 14 };

function txtCentered(doc, text, bx, by, bw, bh, opts = {}) {
  const size = opts.size ?? 8;
  const color = opts.color ?? C.text;
  const bold = opts.bold ?? false;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
  const tw = doc.widthOfString(text);
  const th = size * 1.2;
  const tx = bx + Math.max(0, (bw - tw) / 2);
  const ty = by + Math.max(0, (bh - th) / 2);
  doc.fillColor(color).text(text, tx, ty, { lineBreak: false });
}

const ESCUELA_A_ZONA = {};

const C = {
  sonora: "#7a2533",
  year2025: "#2563eb",
  year2026: "#15803d",
  nivel1: "#fca5a5",
  nivel2: "#fcd34d",
  nivel3: "#86efac",
  nivel4: "#93c5fd",
  text: "#1a1a1a",
  muted: "#64748b",
  border: "#e2e8f0",
  panel: "#f8fafc",
  white: "#ffffff",
  up: "#15803d",
  down: "#dc2626",
  highlight: "#fffbeb",
  highlightBorder: "#fde68a",
};

const NIVEL_NOMBRES = {
  1: { corto: "N1", lineas: ["Emergente"] },
  2: { corto: "N2", lineas: ["Comprension", "Funcional"] },
  3: { corto: "N3", lineas: ["Interpretativo"] },
  4: { corto: "N4", lineas: ["Estrategico"] },
};

function txtBlock(doc, text, x, y, opts = {}) {
  const { size = 7.5, color = C.text, bold = false, width, lineGap = 1 } = opts;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color);
  doc.text(text, x, y, { width, lineGap, lineBreak: true });
  return doc.y - y;
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function getNumeroEscuela(cct) {
  const m = cct.match(cctNumeroRegex());
  return m ? parseInt(m[1], 10) : null;
}

function getZonaPorCct(cct) {
  const num = getNumeroEscuela(cct);
  return num != null ? (ESCUELA_A_ZONA[num] ?? null) : null;
}

function resumenDesdeEscuelas(escuelas) {
  const total = escuelas.reduce((s, e) => s + e.totalEstudiantes, 0);
  const nivel1 = escuelas.reduce((s, e) => s + (e.nivel1 ?? 0), 0);
  const nivel2 = escuelas.reduce((s, e) => s + (e.nivel2 ?? 0), 0);
  const nivel3 = escuelas.reduce((s, e) => s + (e.nivel3 ?? 0), 0);
  const nivel4 = escuelas.reduce((s, e) => s + (e.nivel4 ?? 0), 0);
  return {
    total,
    nivel1,
    nivel2,
    nivel3,
    nivel4,
    pctN1: total ? Math.round((nivel1 / total) * 100) : 0,
    pctN2: total ? Math.round((nivel2 / total) * 100) : 0,
    pctN3: total ? Math.round((nivel3 / total) * 100) : 0,
    pctN4: total ? Math.round((nivel4 / total) * 100) : 0,
  };
}

function calcularDeltaPct(a, b) {
  return {
    nivel1: b.pctN1 - a.pctN1,
    nivel2: b.pctN2 - a.pctN2,
    nivel3: b.pctN3 - a.pctN3,
    nivel4: b.pctN4 - a.pctN4,
  };
}

function pctNivelEscuela(escuela, campo) {
  if (!escuela?.totalEstudiantes) return null;
  return Math.round(((escuela[campo] ?? 0) / escuela.totalEstudiantes) * 100);
}

function varLabelPct(d) {
  if (d === 0) return "0%";
  return d > 0 ? `+${d}%` : `${d}%`;
}

function formatFecha(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", {
    timeZone: "America/Hermosillo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function panel(doc, x, y, w, h, opts = {}) {
  const { fill = C.white, stroke = C.border, r = 8 } = opts;
  doc.roundedRect(x, y, w, h, r).fill(fill);
  if (stroke) doc.roundedRect(x, y, w, h, r).strokeColor(stroke).lineWidth(0.6).stroke();
}

function txt(doc, text, x, y, opts = {}) {
  const { size = 8, color = C.muted, bold = false, width, align = "left", lineGap = 0 } = opts;
  doc
    .fillColor(color)
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(size)
    .text(text, x, y, width != null ? { width, align, lineGap } : undefined);
}

function agruparPorZona(ccts) {
  const map = new Map();
  for (const cct of ccts) {
    const z = getZonaPorCct(cct);
    if (z == null) continue;
    if (!map.has(z)) map.set(z, []);
    map.get(z).push(cct);
  }
  for (const arr of map.values()) arr.sort();
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function generarLecturaPrograma(r25, r26, deltaPct, parcial) {
  const pctAlto25 = r25.pctN3 + r25.pctN4;
  const pctAlto26 = r26.pctN3 + r26.pctN4;
  const varPctAlto = pctAlto26 - pctAlto25;

  const avanceNivelesAltos = deltaPct.nivel3 + deltaPct.nivel4 > 0;
  const bajaNivelesBajos = deltaPct.nivel1 + deltaPct.nivel2 < 0;
  const hayAvance = varPctAlto > 0 && avanceNivelesAltos;

  let veredicto;
  let colorVeredicto;
  if (hayAvance && bajaNivelesBajos) {
    veredicto = "El programa muestra avance";
    colorVeredicto = C.up;
  } else if (hayAvance) {
    veredicto = "Hay senales de avance";
    colorVeredicto = C.up;
  } else if (varPctAlto === 0 && deltaPct.nivel3 === 0 && deltaPct.nivel4 === 0) {
    veredicto = "Sin cambio relevante aun";
    colorVeredicto = C.muted;
  } else {
    veredicto = "Revisar resultados por escuela";
    colorVeredicto = C.down;
  }

  const parrafos = [
    `De Despegue 2025 a Aterrizaje 2026, los alumnos en niveles altos (N3+N4) pasaron del ${pctAlto25}% al ${pctAlto26}% del total evaluado.`,
    `En puntos porcentuales: N3 ${varLabelPct(deltaPct.nivel3)} y N4 ${varLabelPct(deltaPct.nivel4)}; N1 ${varLabelPct(deltaPct.nivel1)} y N2 ${varLabelPct(deltaPct.nivel2)}. Esto sugiere que mas estudiantes avanzaron hacia comprension lectora mas profunda.`,
    parcial
      ? "Los datos de 2026 son parciales; conviene completar la evaluacion en todas las escuelas para confirmar la tendencia."
      : "La tendencia general es favorable: el RAF Lenguaje esta ayudando a mover alumnos hacia niveles mas altos.",
  ];

  return { veredicto, colorVeredicto, parrafos };
}

function drawLecturaAt(doc, x, y, w, h, lectura) {
  panel(doc, x, y, w, h);
  const p = PAGE.pad;
  const ix = x + p;
  const iw = w - p * 2;
  const bottom = y + h - p;

  txt(doc, "Lectura general", ix, y + p, { size: 8.5, bold: true, color: C.text });
  txt(doc, lectura.veredicto, ix, y + p + 13, { size: 8.5, bold: true, color: lectura.colorVeredicto, width: iw });

  let ly = y + p + 28;
  lectura.parrafos.forEach((parrafo) => {
    if (ly >= bottom - 6) return;
    const usado = txtBlock(doc, parrafo, ix, ly, { size: 6.5, color: C.text, width: iw, lineGap: 0.5 });
    ly += usado + 4;
  });
}

function drawHeader(doc, generado) {
  const { m } = PAGE;
  doc.save().rect(0, 0, PAGE.w, 40).fill(C.sonora).restore();
  txt(doc, "Comparativa RAF Lenguaje", m, 11, { size: 14, color: "#ffffff", bold: true });
  txt(doc, "Despegue 2025 vs Aterrizaje 2026  |  `${RAF_CONFIG.nombrePlural}`  |  Primer grado", m, 26, {
    size: 8,
    color: "#ffffff",
  });
  txt(doc, formatFecha(generado), PAGE.w - m - 130, 26, { size: 8, color: "#ffffff", width: 130, align: "right" });
}

function drawYearCard(doc, x, y, w, h, { title, color, r }) {
  panel(doc, x, y, w, h);
  const p = PAGE.pad;
  const ix = x + p;
  const iw = w - p * 2;

  // Zona 1: titulo (14px)
  txt(doc, title, ix, y + p, { size: 8.5, color, bold: true });

  txtCentered(doc, "Distribucion %", ix, y + p + 16, iw, 22, { size: 11, color: C.muted, bold: true });

  const chipH = 28;
  const chipY = y + h - p - chipH;
  const chipGap = 3;
  const chipW = (iw - chipGap * 3) / 4;

  [1, 2, 3, 4].forEach((n, i) => {
    const cx = ix + i * (chipW + chipGap);
    doc.roundedRect(cx, chipY, chipW, chipH, 4).fill(C[`nivel${n}`]);
    txtCentered(doc, `${r[`pctN${n}`]}%`, cx, chipY + 1, chipW, 14, { size: 8, color: "#ffffff", bold: true });
    txtCentered(doc, `N${n}`, cx, chipY + 14, chipW, 13, { size: 6, color: "#ffffff" });
  });
}

function drawDeltaPanel(doc, x, y, w, h, deltaPct) {
  panel(doc, x, y, w, h, { fill: C.panel });
  const p = PAGE.pad;
  txt(doc, "Cambio 2026 - 2025 (pp)", x + p, y + p, { size: 8.5, bold: true, color: C.text });

  const items = [
    { n: 1, d: deltaPct.nivel1 },
    { n: 2, d: deltaPct.nivel2 },
    { n: 3, d: deltaPct.nivel3 },
    { n: 4, d: deltaPct.nivel4 },
  ];
  const gap = 6;
  const boxW = (w - p * 2 - gap * 3) / 4;
  const titleH = 20;
  const labelH = 28;
  const boxY = y + p + titleH;
  const boxH = y + h - p - boxY;

  items.forEach(({ n, d }, i) => {
    const bx = x + p + i * (boxW + gap);
    const lab = NIVEL_NOMBRES[n];
    panel(doc, bx, boxY, boxW, boxH, { fill: C.white, r: 6 });
    const color = d > 0 ? C.up : d < 0 ? C.down : C.muted;
    txtCentered(doc, varLabelPct(d), bx, boxY + 2, boxW, boxH - labelH - 2, { size: 11, color, bold: true });

    let ly = boxY + boxH - labelH + 2;
    txtCentered(doc, lab.corto, bx, ly, boxW, 9, { size: 6.5, color: C.text, bold: true });
    ly += 9;
    lab.lineas.forEach((linea) => {
      txtCentered(doc, linea, bx, ly, boxW, 8, { size: 5.5, color: C.muted });
      ly += 8;
    });
  });
}

function drawStackedAt(doc, px, py, pw, ph, r25, r26) {
  const topPad = 6;
  const yearLblH = 11;
  const legH = 14;
  const axisW = 18;
  const barW = 30;
  const gap = 22;
  const barH = Math.max(ph - topPad - yearLblH - legH - 6, 20);
  const baseY = py + topPad;
  const startX = px + axisW + (pw - axisW - (barW * 2 + gap)) / 2;

  txt(doc, "100%", px + 2, baseY - 1, { size: 5, color: C.muted });
  txt(doc, "0%", px + 6, baseY + barH - 6, { size: 5, color: C.muted });

  function stack(sx, r, yearLabel, yearColor) {
    let cy = baseY + barH;
    [4, 3, 2, 1].forEach((n) => {
      const sh = (r[`pctN${n}`] / 100) * barH;
      cy -= sh;
      doc.rect(sx, cy, barW, sh).fill(C[`nivel${n}`]);
    });
    doc.rect(sx, baseY, barW, barH).strokeColor(C.border).lineWidth(0.5).stroke();
    txtCentered(doc, yearLabel, sx, baseY + barH + 1, barW, yearLblH, { size: 6.5, color: yearColor, bold: true });
  }

  stack(startX, r25, "2025", C.year2025);
  stack(startX + barW + gap, r26, "2026", C.year2026);

  const legY = baseY + barH + yearLblH + 3;
  let lx = px + (pw - 4 * 28) / 2;
  [1, 2, 3, 4].forEach((n) => {
    doc.roundedRect(lx, legY, 7, 7, 1).fill(C[`nivel${n}`]);
    txt(doc, `N${n}`, lx + 9, legY, { size: 6, color: C.muted });
    lx += 28;
  });
}

function drawLevelCompareAt(doc, px, py, pw, ph, r25, r26) {
  const p = 10;
  const headerH = 12;
  const rowH = 13;
  const labelW = 20;
  const pctW = 22;
  const gap = 5;
  const barW = (pw - p * 2 - labelW - pctW * 2 - gap * 3) / 2;
  const barH = 8;

  doc.roundedRect(px + p, py + 2, 7, 7, 1).fill(C.year2025);
  txt(doc, "2025", px + p + 10, py + 2, { size: 6, color: C.text });
  doc.roundedRect(px + p + 32, py + 2, 7, 7, 1).fill(C.year2026);
  txt(doc, "2026", px + p + 42, py + 2, { size: 6, color: C.text });

  const startY = py + headerH + 2;

  [1, 2, 3, 4].forEach((n, i) => {
    const rowY = startY + i * rowH;
    const p25 = r25[`pctN${n}`];
    const p26 = r26[`pctN${n}`];

    doc.roundedRect(px + p, rowY + 2, 7, 7, 1).fill(C[`nivel${n}`]);
    txt(doc, `N${n}`, px + p + 9, rowY + 2, { size: 6, color: C.text, bold: true });

    const b25x = px + p + labelW;
    const pct25x = b25x + barW + 2;
    const b26x = pct25x + pctW + gap;
    const pct26x = b26x + barW + 2;

    doc.roundedRect(b25x, rowY + 3, barW, barH, 2).fill("#eef2f7");
    const f25 = Math.max((p25 / 100) * barW, p25 > 0 ? 2 : 0);
    if (f25 > 0) doc.roundedRect(b25x, rowY + 3, f25, barH, 2).fill(C.year2025);
    txtCentered(doc, `${p25}%`, pct25x, rowY, pctW, rowH, { size: 6, color: C.year2025, bold: true });

    doc.roundedRect(b26x, rowY + 3, barW, barH, 2).fill("#eef2f7");
    const f26 = Math.max((p26 / 100) * barW, p26 > 0 ? 2 : 0);
    if (f26 > 0) doc.roundedRect(b26x, rowY + 3, f26, barH, 2).fill(C.year2026);
    txtCentered(doc, `${p26}%`, pct26x, rowY, pctW, rowH, { size: 6, color: C.year2026, bold: true });
  });
}

function drawSchoolTableColumn(doc, x, y, w, filas) {
  const cols = [
    { label: "ST", ratio: 0.18 },
    { label: "Zn", ratio: 0.14 },
    { label: "N3 25", ratio: 0.18 },
    { label: "N3 26", ratio: 0.18 },
    { label: "D N3", ratio: 0.18 },
  ];
  const rowH = 14;
  const headerH = 16;
  const pad = 3;
  const usable = w - pad * 2;
  const colWidths = cols.map((c) => Math.floor(usable * c.ratio));

  doc.roundedRect(x, y, w, headerH, 3).fill("#eef2f7");
  let hx = x + pad;
  cols.forEach((c, i) => {
    txtCentered(doc, c.label, hx, y, colWidths[i], headerH, { size: 6.5, color: C.text, bold: true });
    hx += colWidths[i];
  });

  filas.forEach((f, idx) => {
    const ry = y + headerH + idx * rowH;
    if (idx % 2 === 1) doc.rect(x + 1, ry, w - 2, rowH).fill("#fafbfc");

    let cx = x + pad;
    const num = getNumeroEscuela(f.cct);
    const cells = [num ?? "-", f.zona ?? "-", f.pct25 ?? "-", f.pct26 ?? "-", f.d3 ?? "-"];
    cells.forEach((val, ci) => {
      let color = C.text;
      if (ci === 4 && f.d3val != null) color = f.d3val > 0 ? C.up : f.d3val < 0 ? C.down : C.muted;
      txtCentered(doc, String(val), cx, ry, colWidths[ci], rowH, { size: 7.5, color });
      cx += colWidths[ci];
    });
  });
}

function drawSinglePage(doc, ctx) {
  const { r25, r26, deltaPct, lectura, filas, generado } = ctx;
  const { m, gap } = PAGE;
  const innerW = PAGE.w - m * 2;

  drawHeader(doc, generado);

  /* Fila 1: resumen */
  const row1Y = 52;
  const cardH = 102;
  const cardW = 215;
  const deltaW = innerW - cardW * 2 - gap;

  drawYearCard(doc, m, row1Y, cardW, cardH, {
    title: "Despegue 2025",
    color: C.year2025,
    r: r25,
  });
  drawYearCard(doc, m + cardW + gap, row1Y, cardW, cardH, {
    title: "Aterrizaje 2026",
    color: C.year2026,
    r: r26,
  });
  drawDeltaPanel(doc, m + (cardW + gap) * 2, row1Y, deltaW, cardH, deltaPct);

  /* Fila 2: graficas + destacados */
  const row2Y = row1Y + cardH + gap;
  const row2H = 130;
  const chart1W = 185;
  const chart2W = 258;
  const destW = innerW - chart1W - chart2W - gap * 2;
  const chartContentY = row2Y + 24;
  const chartContentH = row2H - 28;

  panel(doc, m, row2Y, chart1W, row2H);
  txt(doc, "Distribucion % por nivel", m + PAGE.pad, row2Y + PAGE.pad, { size: 8, bold: true, color: C.text });
  drawStackedAt(doc, m, chartContentY, chart1W, chartContentH, r25, r26);

  panel(doc, m + chart1W + gap, row2Y, chart2W, row2H);
  txt(doc, "Comparacion % por nivel", m + chart1W + gap + PAGE.pad, row2Y + PAGE.pad, {
    size: 8,
    bold: true,
    color: C.text,
  });
  drawLevelCompareAt(doc, m + chart1W + gap, chartContentY, chart2W, chartContentH, r25, r26);

  drawLecturaAt(doc, m + chart1W + chart2W + gap * 2, row2Y, destW, row2H, lectura);

  /* Fila 3: tabla escuelas (mas grande, sin grafica de zonas) */
  const row3Y = row2Y + row2H + gap;
  const footH = 22;
  const row3H = PAGE.h - row3Y - footH;
  panel(doc, m, row3Y, innerW, row3H);
  txt(doc, "Listado de escuelas - comparativa 2025 vs 2026", m + PAGE.pad, row3Y + PAGE.pad, {
    size: 9,
    bold: true,
    color: C.text,
  });

  const tableY = row3Y + PAGE.pad + 18;
  const colGap = 16;
  const colW = (innerW - PAGE.pad * 2 - colGap * 2) / 3;
  const perCol = Math.ceil(filas.length / 3);
  const chunks = [filas.slice(0, perCol), filas.slice(perCol, perCol * 2), filas.slice(perCol * 2)];

  chunks.forEach((chunk, i) => {
    if (chunk.length === 0) return;
    drawSchoolTableColumn(doc, m + PAGE.pad + i * (colW + colGap), tableY, colW, chunk);
  });

  /* Footer */
  const footY = PAGE.h - footH + 4;
  doc.strokeColor(C.border).moveTo(m, footY).lineTo(PAGE.w - m, footY).stroke();
  txt(
    doc,
    "N1 Lector Emergente  |  N2 Comprension Funcional  |  N3 Lector Interpretativo  |  N4 Lector Estrategico",
    m,
    footY + 6,
    { size: 6.5, color: C.muted, width: innerW - 100 }
  );
  txt(doc, "RAF Lenguaje - Sonora", PAGE.w - m - 90, footY + 6, { size: 6.5, color: C.muted, width: 90, align: "right" });
}

function main() {
  const data = loadJson("data/resultados.json");
  const nombres = loadJson("data/nombres-escuelas.json");

  const ev25 = data.evaluaciones?.despegue2025;
  const ev26 = data.evaluaciones?.aterrizaje2026;
  if (!ev25 || !ev26) {
    console.error("Faltan evaluaciones despegue2025 o aterrizaje2026");
    process.exit(1);
  }

  const escuelas25 = ev25.escuelas ?? [];
  const escuelas26 = ev26.escuelas ?? [];
  const parcial = ev26.parcial ?? false;
  const generado = ev26.generado ?? ev25.generado;

  const r25 = resumenDesdeEscuelas(escuelas25);
  const r26 = resumenDesdeEscuelas(escuelas26);
  const deltaPct = calcularDeltaPct(r25, r26);

  const map25 = new Map(escuelas25.map((e) => [e.cct, e]));
  const map26 = new Map(escuelas26.map((e) => [e.cct, e]));
  const ccts = [...new Set([...map25.keys(), ...map26.keys()])].sort();

  const filas = ccts.map((cct) => {
    const e25 = map25.get(cct);
    const e26 = map26.get(cct);
    const pct25 = pctNivelEscuela(e25, "nivel3");
    const pct26 = pctNivelEscuela(e26, "nivel3");
    const d3val = pct25 != null && pct26 != null ? pct26 - pct25 : null;
    return {
      cct,
      nombre: nombres[cct] ?? cct,
      zona: getZonaPorCct(cct),
      pct25: pct25 != null ? `${pct25}%` : "-",
      pct26: pct26 != null ? `${pct26}%` : "-",
      d3: d3val != null ? varLabelPct(d3val) : "-",
      d3val,
    };
  });

  const outDir = path.join(ROOT, "public", "documentos");
  fs.mkdirSync(outDir, { recursive: true });
  const outFiles = [
    "raf-comparativa-2025-2026.pdf",
    "lenguaje-raf-comparativa-2025-2026.pdf",
  ];
  const outPath = path.join(outDir, outFiles[0]);

  const doc = new PDFDocument({ size: [PAGE.w, PAGE.h], margin: 0, autoFirstPage: true });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  drawSinglePage(doc, {
    r25,
    r26,
    deltaPct,
    lectura: generarLecturaPrograma(r25, r26, deltaPct, parcial),
    filas,
    map25,
    map26,
    generado,
  });

  doc.end();

  stream.on("finish", () => {
    for (const name of outFiles) {
      const target = path.join(outDir, name);
      if (target !== outPath) fs.copyFileSync(outPath, target);
      console.log(`OK -> ${target}`);
    }
    console.log(`  1 hoja horizontal - ${escuelas25.length} escuelas 2025 - ${escuelas26.length} escuelas 2026`);
    console.log(
      `  Cambio (pp): N1 ${varLabelPct(deltaPct.nivel1)}, N2 ${varLabelPct(deltaPct.nivel2)}, N3 ${varLabelPct(deltaPct.nivel3)}, N4 ${varLabelPct(deltaPct.nivel4)}`
    );
  });
}

main();
