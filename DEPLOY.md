# Despliegue en Vercel — RAF Lenguaje | E.S.E.

Proyecto: **Secundarias Estatales** (Lenguaje)

Repositorio sugerido: `WeroMilk/raf-leng-estatales`

## Variables de entorno (obligatorias)

| Variable | Descripción |
|----------|-------------|
| `AUTH_SECRET` | String aleatorio de al menos 16 caracteres (único por proyecto) |
| `AUTH_SUPER_PASSWORD` | (Opcional) Contraseña del super usuario en texto plano |

## Pasos

1. Importar el repo en [Vercel](https://vercel.com) → Framework: **Next.js**
2. Añadir `AUTH_SECRET` en Settings → Environment Variables
3. Asegurar que `lib/auth-data.json` está en el repositorio
4. Redeploy tras configurar variables

## Cargar datos desde Excel

1. Colocar archivos Excel en `data/excel/` (ver README.md)
2. Ejecutar `npm run build:data`
3. Ejecutar `npm run sync-auth-escuelas`
4. Commit y push de `data/resultados.json` y `public/data/resultados.json`

## Prefijo CCT

Editar `lib/raf-config.json` → campo `cctPrefix` cuando conozcas el prefijo oficial de Secundarias Estatales.
