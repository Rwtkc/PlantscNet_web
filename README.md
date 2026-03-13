# PlantscNet Web

PlantscNet is a plant single-cell network portal for browsing species- and sample-level regulatory resources, searching TF-target relationships, downloading prepared result bundles, and sending project contact requests.

## Stack

- Frontend: Vite, React 19, TypeScript, React Router 7, D3
- Backend: Express 5, Nodemailer
- Map: AMap JS API
- Process manager: PM2

## Main Modules

- `Home`: portal overview and summary charts
- `Browse`: species/sample exploration, metadata tables, network preview, relation pagination
- `Search`: TF/Target search inside one species
- `Download`: per-species download bundles
- `Contact`: AMap location card and contact request form
- `Help`: module-oriented usage guide

## Repository Layout

```text
src/                    frontend application
server/                 express backend and data access
public-static/          static assets copied into dist
dist/                   production build output
ecosystem.config.cjs    PM2 config for deployment
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Start frontend:

```bash
pnpm dev
```

Start backend locally:

```bash
pnpm dev:server
```

Useful commands:

```bash
pnpm typecheck
pnpm build
pnpm format
```

## Build

```bash
pnpm build
```

The build output is written to `dist/`.

## Deployment Notes

- Current frontend production build targets the subpath `/PlantScNet/`.
- The frontend uses hash routing in production-like deployment, so URLs are of the form `#/home`, `#/browse`, etc.
- Current production API access is configured in `src/app/base.ts`.
- Static deployment uses `public-static/` instead of `public/`, so large archival data files under `public/data/` are not copied into `dist/`.
- Apache fallback support is generated into `dist/.htaccess` during build.

## Backend

Backend entry:

```text
server/index.js
```

Default runtime:

- host: `0.0.0.0`
- port: `1116`

Important API groups:

- `/api/health`
- `/api/browse/*`
- `/api/search/*`
- `/api/download/*`
- `/api/contact/request`

## Data Directories

The backend reads prepared files from the deployment filesystem. The exact roots can be controlled by environment variables or fallback directories used by the server code.

Typical directories include:

- `data/`
- `feather_file/`
- `meme_file/`
- `tf_list/`
- `final_regulatory_file/`

Species currently included:

- `ath`, `bra`, `fve`, `gar`, `ghi`, `gly`, `osa`, `ptr`, `sly`, `zea`

## PM2

The repository includes `ecosystem.config.cjs`. A typical restart command on the deployment host is:

```bash
pm2 restart PlantScNet_server
```

## Notes

- Some contact/map/mail values are currently configured directly in source for the active deployment workflow.
- If deployment behavior changes, review:
  - `vite.config.ts`
  - `src/app/base.ts`
  - `server/app.js`
  - `server/lib/contact-mail.js`
