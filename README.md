# PlantscNet

PlantscNet is a React + TypeScript web portal scaffolded with Vite and managed by pnpm.
It includes six core modules:

- Home
- Browse
- Search
- Download
- Contact
- Help

## Tech Stack

- React 19
- TypeScript
- Vite 7
- React Router 7
- ESLint (type-aware) + Prettier
- Vitest + Testing Library

## Quick Start

```bash
pnpm install
pnpm dev
```

Open the local URL shown in terminal (usually `http://localhost:5173`).

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
pnpm format
pnpm format:check
```

## Project Structure

```txt
src/
  app/           # router + static module content
  components/    # shared UI components
  layouts/       # app shell and navigation layout
  pages/         # route-level module pages
  styles/        # design tokens and global styles
  test/          # test setup
  types/         # shared TypeScript types
```

## Engineering Notes

- Route modules are loaded with `React.lazy` for smaller initial bundles.
- Type-aware linting is enabled through `typescript-eslint` strict configs.
- Alias `@/*` maps to `src/*` in both Vite and TypeScript configs.
