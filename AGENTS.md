# Repository Guidelines

CodeNinjaVik is an AI product marketplace: a Vite/React frontend plus a Vercel serverless
API for license management, device activation, and push notifications.

## Project Structure & Module Organization

- `src/` — React + TypeScript frontend. `src/pages/` are route-level views, `src/components/ui/`
  is the shadcn/ui primitive library (Radix-based), `src/components/` holds feature components.
  `src/integrations/supabase/` and `src/integrations/backend/` wrap Supabase and the `/api` calls.
- `api/` — Vercel serverless functions (plain Node, not part of the Vite build). `api/_middleware/`
  handles CORS/security headers, JWT auth, admin-key auth, and rate limiting; `api/_services/` and
  `api/_utils/` hold shared business logic (license plans, FCM, Supabase client). `api/[...path].js`
  is a catch-all returning JSON 404s for unmatched API routes. See `api/README.md` for the full
  endpoint list, required env vars, and response shape (`{ success, message, data|error_code }`).
- `supabase/` — `migrations/` (timestamped SQL, applied in order) and `functions/` (Supabase Edge
  Functions for Razorpay orders, contact email, Telegram notifications — deployed separately from
  Vercel).
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`, `components.json`).

## Build, Test, and Development Commands

- `npm run dev` / `npm run start` — run the Vite dev server.
- `npm run build` — production build to `dist/` (what Vercel deploys via `vercel.json`).
- `npm run build:dev` — development-mode build (unminified, for debugging build output).
- `npm run preview` — serve the built `dist/` locally.
- `npm run lint` — ESLint over the whole repo.
- No test suite is configured in this repository.

## Coding Style & Naming Conventions

- TypeScript is intentionally loose: `strictNullChecks`, `noImplicitAny`, and unused-var checks are
  all disabled (`tsconfig.json`, `eslint.config.js`) — don't add stricter lint rules without reason.
- ESLint config (`eslint.config.js`) extends `@eslint/js` recommended + `typescript-eslint`
  recommended, plus `react-hooks` and `react-refresh` plugin rules.
- Frontend components are `.tsx`, PascalCase filenames (e.g. `ProductCard.tsx`); hooks are
  camelCase prefixed with `use` (e.g. `useCurrency.ts`).
- API handlers are plain `.js` (CommonJS-free ESM), one file per route, importing shared helpers
  from `api/_utils/` and `api/_middleware/`.
- Styling via Tailwind CSS; shadcn/ui component conventions apply in `src/components/ui/`
  (`components.json`: style `default`, base color `slate`, CSS variables enabled).

## Testing Guidelines

There is no automated test framework in this repo. Verify changes manually: `npm run dev` for the
frontend, and exercise API routes locally or via a Vercel preview deployment. Always run
`npm run lint` before committing.

## Commit & Pull Request Guidelines

Recent history is dominated by terse messages (`Changes`, `Lovable update`, `Update README.md`)
with occasional descriptive ones (`Fixed Vercel 404 on /api/*`, `Fixed security scan issues`,
`Added notification APIs & UI`). Prefer the descriptive style — a short imperative summary of what
changed and why — over generic messages. No PR template is present in this repository.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
