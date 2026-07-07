#!/usr/bin/env node
/**
 * Informe de dificultad de los 30 reactivos del examen RAF Lenguaje.
 * Ordena del más fácil al más difícil con % acierto y % error.
 *
 * Uso: node scripts/informe-dificultad-reactivos.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "public", "data", "resultados.json");
const OUT_PATH = path.join(ROOT, "informe-reactivos-dificultad.md");

const NUM_REACTIVOS = 30;

/** Nivel al que pertenece cada reactivo (Raf_intrumento_niveles_final.xlsx - Hoja3) */
const NIVEL_POR_REACTIVO = {
  1: 1, 2: 3, 3: 1, 4: 1, 5: 2, 6: 1, 7: 2, 8: 3, 9: 1, 10: 2, 11: 2, 12: 2, 13: 3,
  14: 2, 15: 2, 16: 1, 17: 3, 18: 2, 19: 2, 20: 2, 21: 2, 22: 3, 23: 2, 24: 2, 25: 3,
  26: 3, 27: 3, 28: 3, 29: 4, 30: 4,
};

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const aciertos = new Array(NUM_REACTIVOS).fill(0);
  const totales = new Array(NUM_REACTIVOS).fill(0);

  for (const esc of data.escuelas || []) {
    for (const gr of esc.grupos || []) {
      for (const al of gr.alumnos || []) {
        const resp = al.respuestas || [];
        for (let i = 0; i < NUM_REACTIVOS; i++) {
          if (i < resp.length) {
            totales[i]++;
            if (resp[i] === "C") aciertos[i]++;
          }
        }
      }
    }
  }

  const totalAlumnos = totales[0] || 1;
  const reactivos = [];
  for (let i = 0; i < NUM_REACTIVOS; i++) {
    const total = totales[i] || 1;
    const ac = aciertos[i] || 0;
    const pctAcierto = Math.round((ac / total) * 1000) / 10;
    const pctError = Math.round(((total - ac) / total) * 1000) / 10;
    reactivos.push({
      num: i + 1,
      nivel: NIVEL_POR_REACTIVO[i + 1],
      aciertos: ac,
      errores: total - ac,
      total,
      pctAcierto,
      pctError,
    });
  }

  // Ordenar del más fácil al más difícil (mayor % acierto = más fácil)
  reactivos.sort((a, b) => b.pctAcierto - a.pctAcierto);

  const categorias = (pct) =>
    pct >= 80 ? "Muy fácil" : pct >= 60 ? "Fácil" : pct >= 40 ? "Medio" : pct >= 20 ? "Difícil" : "Muy difícil";

  let md = `# Informe de dificultad de reactivos - RAF Lenguaje (Español)

**Examen:** Lenguaje (30 reactivos)  
**Total de alumnos evaluados:** ${totalAlumnos.toLocaleString()}  
**Generado:** ${new Date().toLocaleString("es-MX")}

---

## Lista completa de los 30 reactivos (del más fácil al más difícil)

`;
  reactivos.forEach((r, idx) => {
    md += `${idx + 1}. **Reactivo ${r.num}** (Nivel ${r.nivel}) — ${r.pctAcierto}% acierto | ${r.pctError}% error — *${categorias(r.pctAcierto)}*\n`;
  });

  md += `
---

## Tabla detallada

| Pos | Reactivo | Nivel | % Acierto | % Error | Aciertos | Errores |
|-----|----------|-------|-----------|---------|----------|---------|
`;

  reactivos.forEach((r, idx) => {
    md += `| ${idx + 1} | ${r.num} | ${r.nivel} | **${r.pctAcierto}%** | ${r.pctError}% | ${r.aciertos.toLocaleString()} | ${(r.total - r.aciertos).toLocaleString()} |\n`;
  });

  md += `
---

## Explicación por reactivo (orden del más fácil al más difícil)

`;

  reactivos.forEach((r, idx) => {
    let explicacion = "";
    if (r.pctAcierto >= 80) {
      explicacion = `Reactivo muy fácil: la gran mayoría de los alumnos (${r.pctAcierto}%) respondió correctamente. Indica que el contenido evaluado está bien consolidado o que la pregunta era muy directa.`;
    } else if (r.pctAcierto >= 60) {
      explicacion = `Reactivo de dificultad media-baja: ${r.pctAcierto}% de aciertos. La mayoría de los alumnos domina este concepto, aunque hay margen de mejora.`;
    } else if (r.pctAcierto >= 40) {
      explicacion = `Reactivo de dificultad media: ${r.pctAcierto}% de aciertos. Casi la mitad de los alumnos tuvo dificultad. Conviene revisar la enseñanza de este contenido o la claridad de la pregunta.`;
    } else if (r.pctAcierto >= 20) {
      explicacion = `Reactivo difícil: solo ${r.pctAcierto}% de aciertos. La mayoría de los alumnos (${r.pctError}%) falló. Requiere refuerzo pedagógico o revisión del reactivo.`;
    } else {
      explicacion = `Reactivo muy difícil: ${r.pctAcierto}% de aciertos. Casi todos los alumnos respondieron incorrectamente. Prioridad alta para revisar contenido y estrategia didáctica.`;
    }
    md += `### ${idx + 1}. Reactivo ${r.num} (Nivel ${r.nivel}) — ${r.pctAcierto}% acierto / ${r.pctError}% error\n\n${explicacion}\n\n`;
  });

  md += `
---

## Resumen por nivel de dificultad

| Categoría | Reactivos | % Acierto promedio |
|-----------|-----------|---------------------|
`;

  const muyFacil = reactivos.filter((r) => r.pctAcierto >= 80);
  const facil = reactivos.filter((r) => r.pctAcierto >= 60 && r.pctAcierto < 80);
  const medio = reactivos.filter((r) => r.pctAcierto >= 40 && r.pctAcierto < 60);
  const dificil = reactivos.filter((r) => r.pctAcierto >= 20 && r.pctAcierto < 40);
  const muyDificil = reactivos.filter((r) => r.pctAcierto < 20);

  const avg = (arr) => (arr.length ? arr.reduce((s, r) => s + r.pctAcierto, 0) / arr.length : 0);
  md += `| Muy fácil (≥80%) | ${muyFacil.map((r) => r.num).join(", ") || "—"} | ${avg(muyFacil).toFixed(1)}% |\n`;
  md += `| Fácil (60-79%) | ${facil.map((r) => r.num).join(", ") || "—"} | ${avg(facil).toFixed(1)}% |\n`;
  md += `| Medio (40-59%) | ${medio.map((r) => r.num).join(", ") || "—"} | ${avg(medio).toFixed(1)}% |\n`;
  md += `| Difícil (20-39%) | ${dificil.map((r) => r.num).join(", ") || "—"} | ${avg(dificil).toFixed(1)}% |\n`;
  md += `| Muy difícil (<20%) | ${muyDificil.map((r) => r.num).join(", ") || "—"} | ${avg(muyDificil).toFixed(1)}% |\n`;

  fs.writeFileSync(OUT_PATH, md, "utf8");
  console.log("OK: Informe guardado en", OUT_PATH);
  console.log("  Total alumnos:", totalAlumnos.toLocaleString());
  console.log("  Más fácil: Reactivo", reactivos[0].num, `(${reactivos[0].pctAcierto}% acierto)`);
  console.log("  Más difícil: Reactivo", reactivos[reactivos.length - 1].num, `(${reactivos[reactivos.length - 1].pctAcierto}% acierto)`);
}

main();
