# CRM Contable — Frontend

Interfaz del CRM Contable y Tributario. **React 18 + Vite + TypeScript + Tailwind + shadcn/ui**.

TanStack Query, tipos generados desde OpenAPI, RBAC en UI (`ProtectedRoute`/`Can`),
modo claro/oscuro, dashboard gerencial (Recharts), kanban de oportunidades (dnd-kit).

## Desarrollo local

```bash
npm install
cp .env.example .env          # VITE_API_URL apunta al backend (incluye /api/v1)
npm run dev                   # http://localhost:5173

npm run build                 # tsc -b && vite build
npm run lint                  # eslint
npm test                      # vitest
npm run gen:api               # regenera tipos desde el OpenAPI del backend
```

## Variables de entorno

- `VITE_API_URL` — URL del backend desplegado, p.ej. `https://api.midominio.com/api/v1`.

## Despliegue

SPA estática: `npm run build` genera `dist/`. Sírvela en cualquier hosting estático
(Vercel, Netlify, Cloudflare Pages, S3+CloudFront) con fallback a `index.html` para
el routing del lado del cliente. El [`Dockerfile`](Dockerfile) corre el dev server;
para producción usa el build estático.

## Estructura

- `src/app/` — App, router, providers
- `src/components/` — UI (shadcn), layout, auth, charts
- `src/features/` — por dominio (auth, prospects, opportunities, clients, dashboard, emails, admin)
- `src/api/` — cliente HTTP + tipos generados de OpenAPI
