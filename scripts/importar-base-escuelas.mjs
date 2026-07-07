/**
 * Crea la base de datos SQLite e importa escuelas, grupos y alumnos
 * desde base_datos_escuelas.sql.txt
 *
 * Uso: node scripts/importar-base-escuelas.mjs
 * Requiere: npm install better-sqlite3
 *
 * O manualmente con sqlite3:
 *   sqlite3 data/escuelas.db < scripts/schema-escuelas.sql
 *   (el archivo base_datos tiene formato con saltos de línea que puede requerir preprocesado)
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SQL_ORIGINAL = process.env.SQL_ESCUELAS || path.join("C:", "Users", "alfon", "Downloads", "base_datos_escuelas.sql.txt");
const DB_PATH = path.join(ROOT, "data", "escuelas.db");

try {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS escuelas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      clave_cct TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS grupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      escuela_id INTEGER NOT NULL,
      FOREIGN KEY (escuela_id) REFERENCES escuelas(id)
    );
    CREATE TABLE IF NOT EXISTS alumnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      grupo_id INTEGER NOT NULL,
      FOREIGN KEY (grupo_id) REFERENCES grupos(id)
    );
    DELETE FROM alumnos;
    DELETE FROM grupos;
    DELETE FROM escuelas;
  `);

  const content = fs.readFileSync(SQL_ORIGINAL, "utf8");
  const statements = content
    .replace(/\r\n/g, "\n")
    .replace(/\n\s+/g, " ")
    .split(/(?=INSERT INTO)/i)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("INSERT INTO"));

  let ok = 0,
    err = 0;
  for (const st of statements) {
    try {
      db.exec(st);
      ok++;
    } catch (e) {
      err++;
      if (err <= 3) console.error("Error en:", st.slice(0, 80) + "...", e.message);
    }
  }

  const escuelas = db.prepare("SELECT COUNT(*) as n FROM escuelas").get();
  const grupos = db.prepare("SELECT COUNT(*) as n FROM grupos").get();
  const alumnos = db.prepare("SELECT COUNT(*) as n FROM alumnos").get();

  db.close();
  console.log("OK:", escuelas.n, "escuelas,", grupos.n, "grupos,", alumnos.n, "alumnos →", DB_PATH);
  if (err > 0) console.log("  Errores:", err, "de", statements.length);
} catch (e) {
  if (e.code === "MODULE_NOT_FOUND") {
    console.log("Instala better-sqlite3: npm install better-sqlite3");
    console.log("O ejecuta manualmente: sqlite3 data/escuelas.db < scripts/schema-escuelas.sql");
  } else {
    throw e;
  }
}
