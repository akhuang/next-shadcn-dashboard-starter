# Repository Guidelines

## Project Structure & Module Organization

- Next.js app lives in `src/app`, with shared UI in `src/components` and feature slices in `src/features`.
- Utilities and state live in `src/lib` and `src/stores`, with shared values in `src/constants`.
- Tests sit alongside code in `src/__tests__`, cross-cutting integrations in `tests/`, and Playwright specs in `e2e/`.
- Prisma schema and seeds in `prisma/`; static assets in `public/`; automation scripts in `scripts/` and `scripts-dev/`; Excel fixtures in `data/` and `uploads/`; docs in `docs/`.

## Build, Test, and Development Commands

- `pnpm install` — sync dependencies; required before any other command.
- `pnpm dev` — run Next.js with Turbopack; use `pnpm dev:full` to also start Prisma and Excel monitors.
- `pnpm build && pnpm start` — production build and serve.
- `pnpm lint` / `pnpm lint:fix` — enforce eslint rules; pair with `pnpm format` or `pnpm format:check` when style drifts.
- `pnpm test` or `pnpm test:coverage` — run Vitest suites; `pnpm test:ui` is handy for debugging.
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed` — manage Prisma schema and sample data.
- `pnpm excel:setup` — refresh test Excel bundles when touching monitor scripts.

## Coding Style & Naming Conventions

- TypeScript throughout; keep modules in ES syntax with explicit exports.
- Follow Prettier defaults (2-space indent, trailing commas) and Tailwind class ordering via `prettier-plugin-tailwindcss`.
- Components and hooks use `PascalCase` filenames (`UserPanel.tsx`); utilities and stores stay `camelCase.ts`.
- Tests mirror source names (`feature.test.tsx`); shared helpers belong in `src/test/`.
- Prefer descriptive constants in `SCREAMING_SNAKE_CASE`; stash secrets in `.env` templates.

## Testing Guidelines

- Vitest with jsdom powers unit and integration checks; colocate fast suites near the code in `src/__tests__`.
- Broader scenarios live in `tests/`; E2E journeys use Playwright specs in `e2e/` governed by `playwright.config.ts`.
- Name tests by behaviour (`it('renders account summary')`) and pull fixtures from `src/test/factories`.
- Run `pnpm test:coverage` when touching dashboards or data sync; note any intentional gaps in PRs.

## Commit & Pull Request Guidelines

- Commit history follows Conventional Commit prefixes (`feat:`, `fix:`, `clean:`); group related changes into concise commits.
- Branches should reflect scope (`feature/excel-sync-fixes`), reference issues when available, and avoid WIP commits in PRs.
- PRs need: summary of changes, testing notes (`pnpm lint`, `pnpm test`), screenshots for UI shifts, and callouts for schema or Excel monitor impacts.
- Ensure migrations and generated files are included; describe rollback or config steps when they change.
