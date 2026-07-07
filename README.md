# RAF Lenguaje — Secundarias Estatales

Aplicación Next.js para visualizar resultados del examen diagnóstico RAF Lenguaje de **Secundarias Estatales**, Hermosillo, Sonora.

## Inicio rápido

```bash
npm install
npm run dev
```

## Cargar resultados desde Excel

1. Editar `lib/raf-config.json` si necesitas cambiar el prefijo CCT (`cctPrefix`, actualmente `26DXX`)
2. Colocar archivos Excel:
- **Despegue 2025:** `data/excel/despegue-2025/*_actualizado.xlsx`
- **Aterrizaje 2026:** `data/excel/aterrizaje-2026/`
3. Generar JSON:

```bash
npm run build:data
```

4. Sincronizar usuarios por escuela:

```bash
npm run sync-auth-escuelas
```

5. Commit de `data/resultados.json` y `public/data/resultados.json`

## Despliegue

Ver [DEPLOY.md](./DEPLOY.md) para instrucciones de Vercel.

## Estructura

- `lib/raf-config.json` — Tipo de escuela, branding y prefijo CCT
- `data/excel/` — Archivos fuente (no se suben a producción si no hay Excel en Vercel)
- `data/resultados.json` — Datos procesados para la app
