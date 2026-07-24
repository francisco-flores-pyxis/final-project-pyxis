# VetLab — Consola de agenda veterinaria

SPA interna (recepción / staff) construida como lab de **React 19 core & hooks**.

## Stack

| Pieza | Versión |
|-------|---------|
| React | **19.2.x** (`^19.2.7`) |
| Vite | 8.x |
| TypeScript | strict |
| Router | react-router-dom 7 |
| Estilos | CSS Modules + design tokens (`src/styles/tokens.css`) |
| Datos | Mock API in-memory (`src/data/mockApi.ts`) |

## Setup

```bash
npm install
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173).

### Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck (`tsc -b`) + bundle de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run lint` | ESLint |
| `npm run preview` | Preview del build |

## Estructura

```
src/
  domain/models.ts     # Tipos del dominio
  data/seed.ts         # Dataset sembrado
  data/mockApi.ts      # Promises + latencia + cache
  styles/tokens.css    # Design tokens + theming
  layouts/             # Shell (topbar + sidebar)
  routes/              # React Router
  views/               # Pantallas (placeholders → features R01–R16)
  hooks/               # (R06+)
  context/             # (R05+)
  components/          # UI reutilizable (R09+)
```

## Mock API

- Lecturas memoizadas por clave (preparado para `use()` + Suspense).
- Mutaciones pueden fallar aleatoriamente: en `mockConfig.mutationFailRate` (default `0`; subir en R15).

## Requerimientos

Ver `Requirement/lab-react-core-veterinaria.md`. El andamiaje deja rutas placeholder listas para implementar R01 en adelante.
