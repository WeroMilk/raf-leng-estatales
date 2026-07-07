-- Esquema para escuelas, grupos y alumnos
-- Ejecutar antes de base_datos_escuelas.sql.txt

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

CREATE INDEX IF NOT EXISTS idx_grupos_escuela ON grupos(escuela_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_grupo ON alumnos(grupo_id);
