# Procesamiento del Examen RAF Lenguaje

## Estructura del Excel (Book1.xlsx)

| Columnas | Contenido |
|----------|-----------|
| **A-O** (0-14) | Datos del alumno |
| A | RAF |
| B | Lenguaje |
| C | CCT (ej. 26DST0001P) |
| D | Nombre escuela |
| E | Grupo (1A, 1B, 1G, etc.) |
| I | Nombre completo del alumno |
| **K** | **Aciertos totales** (fuente confiable) |
| M | Calificación (aciertos × 2.5) |
| **P-AX** (15-44) | 30 reactivos del examen |

### Lógica de los reactivos
- `1` = correcto
- `0` = incorrecto  
- `A`, `B`, `C` = opción elegida (se compara con la clave de respuestas)

## Niveles (Escalera cognitiva completa)

| Nivel | Aciertos | Reactivos | Descriptor |
|-------|----------|-----------|------------|
| 1 | 0-13 | 1, 3, 4, 6, 9, 16 | Lector Emergente |
| 2 | 14-21 | 5, 7, 10-12, 14-15, 18-21, 23-24 | Lector con Comprensión Funcional |
| 3 | 22-26 | 2, 8, 13, 17, 22, 25-28 | Lector Interpretativo |
| 4 | 27-30 | 29, 30 | Lector Estratégico |

## Uso del script

```bash
# Procesar Book1.xlsx (ruta por defecto: Downloads)
npm run procesar-examen

# Especificar ruta del Excel
EXCEL_PATH="C:\ruta\al\archivo.xlsx" npm run procesar-examen

# Usar clave de respuestas personalizada (opcional)
# Crear data/clave-lenguaje.txt con las 30 respuestas correctas, una por línea o separadas por coma
# Ejemplo: A, A, A, C, C, C, ...
CLAVE_PATH="data/clave-lenguaje.txt" npm run procesar-examen
```

## Salidas generadas

1. **`public/data/resultados.json`** – Formato compatible con la app (escuelas, grupos, alumnos con nivel)
2. **`public/data/niveles-alumnos.csv`** – Reporte por alumno con: CCT, Grupo, Nombre, Aciertos, Calificación, Nivel, Descriptor, NecesitaApoyo por nivel

## Base de datos (escuelas, grupos, alumnos)

El archivo `base_datos_escuelas.sql.txt` contiene los INSERT para escuelas, grupos y alumnos.

### Esquema (scripts/schema-escuelas.sql)
```sql
CREATE TABLE escuelas (id, nombre, clave_cct);
CREATE TABLE grupos (id, nombre, escuela_id);
CREATE TABLE alumnos (id, nombre, grupo_id);
```

### Importar a SQLite
```bash
# Opción 1: Con better-sqlite3
npm install better-sqlite3
node scripts/importar-base-escuelas.mjs

# Opción 2: Manual
sqlite3 data/escuelas.db < scripts/schema-escuelas.sql
# Luego ejecutar base_datos_escuelas.sql.txt (puede requerir preprocesado por saltos de línea)
```
