#!/usr/bin/env node
/**
 * Alimenta las 6 apps (estatales, generales, telesecundarias × lenguaje/matemáticas)
 * con datos Despegue 2025 + Aterrizaje 2026 desde los Excel combinados.
 */
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import {
  parseDespegue,
  parseAterrizaje,
  buildResultadosLeng,
  buildResultadosMat,
  buildNombresEscuelas,
} from "./parse-excel-todos.mjs";

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

const DEFAULTS = {
  despegue: path.join(process.env.USERPROFILE || "", "Downloads", "RAF Todos despegue.xlsx"),
  aterrizajeLeng: path.join(process.env.USERPROFILE || "", "Downloads", "Lenguaje Todos.xlsx"),
  aterrizajeMat: path.join(process.env.USERPROFILE || "", "Downloads", "Matemáticas Todos.xlsx"),
};

const TIPOS = [
  { folder: "ESTATALES", tipoId: "estatales" },
  { folder: "GENERALES", tipoId: "generales" },
  { folder: "TELESECUNDARIAS", tipoId: "telesecundarias" },
];

function parseArgs(argv) {
  const out = { ...DEFAULTS };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--despegue" && argv[i + 1]) out.despegue = argv[++i];
    else if (a === "--aterrizaje-leng" && argv[i + 1]) out.aterrizajeLeng = argv[++i];
    else if (a === "--aterrizaje-mat" && argv[i + 1]) out.aterrizajeMat = argv[++i];
  }
  return out;
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function syncAuth(appDir) {
  const script = path.join(appDir, "scripts", "sync-auth-escuelas.mjs");
  if (!fs.existsSync(script)) {
    console.warn("  sync-auth no encontrado:", script);
    return;
  }
  const r = spawnSync(process.execPath, [script], { cwd: appDir, stdio: "inherit" });
  if (r.status !== 0) console.warn("  sync-auth falló en", appDir);
}

function procesarApp({ folder, tipoId }, files) {
  const lengDir = path.join(ROOT, folder, "RAFleng");
  const matDir = path.join(ROOT, folder, "RAFmat");

  console.log(`\n=== ${folder} (${tipoId}) ===`);

  const desLeng = parseDespegue({ filePath: files.despegue, tipoId, materia: "leng" });
  const desMat = parseDespegue({ filePath: files.despegue, tipoId, materia: "mat" });
  const ateLeng = parseAterrizaje({ filePath: files.aterrizajeLeng, tipoId, materia: "leng" });
  const ateMat = parseAterrizaje({ filePath: files.aterrizajeMat, tipoId, materia: "mat" });

  console.log(
    `  Lenguaje  despegue: ${desLeng.escuelas.length} escuelas, ${desLeng.totalAlumnos} alumnos (${desLeng.filas} filas)`
  );
  console.log(
    `  Lenguaje  aterrizaje: ${ateLeng.escuelas.length} escuelas, ${ateLeng.totalAlumnos} alumnos (${ateLeng.filas} filas)`
  );
  console.log(
    `  Mat       despegue: ${desMat.escuelas.length} escuelas, ${desMat.totalAlumnos} alumnos (${desMat.filas} filas)`
  );
  console.log(
    `  Mat       aterrizaje: ${ateMat.escuelas.length} escuelas, ${ateMat.totalAlumnos} alumnos (${ateMat.filas} filas)`
  );

  const resultadosLeng = buildResultadosLeng(desLeng.escuelas, ateLeng.escuelas);
  const resultadosMat = buildResultadosMat(desMat.escuelas, ateMat.escuelas);

  const nombresEscuelas = buildNombresEscuelas(desLeng.escuelas);

  for (const [appDir, resultados, label] of [
    [lengDir, resultadosLeng, "RAFleng"],
    [matDir, resultadosMat, "RAFmat"],
  ]) {
    writeJson(path.join(appDir, "data", "resultados.json"), resultados);
    writeJson(path.join(appDir, "public", "data", "resultados.json"), resultados);
    console.log(`  OK ${label}: resultados.json escrito`);
    syncAuth(appDir);
  }

  writeJson(path.join(lengDir, "data", "nombres-escuelas.json"), nombresEscuelas);
  console.log(`  OK nombres-escuelas.json: ${Object.keys(nombresEscuelas).length} CCTs`);
}

function main() {
  const files = parseArgs(process.argv);

  for (const [key, p] of Object.entries(files)) {
    if (!fs.existsSync(p)) {
      console.error(`Archivo no encontrado (${key}):`, p);
      process.exit(1);
    }
  }

  console.log("Fuentes:");
  console.log("  Despegue:", files.despegue);
  console.log("  Aterrizaje Leng:", files.aterrizajeLeng);
  console.log("  Aterrizaje Mat:", files.aterrizajeMat);

  for (const tipo of TIPOS) {
    procesarApp(tipo, files);
  }

  console.log("\nListo: 6 apps actualizadas con despegue + aterrizaje.");
}

main();
