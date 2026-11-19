# CLAUDE.md

Notes for AI-assisted work on this repo. Read README.md first.

## Rules

- **Design is fixed.** Follow `docs/DESIGN_SYSTEM.md` exactly. Colours come only from the CSS tokens in `apps/web/src/index.css` (`bg-paper`, `text-ink`, `bg-accent` …); never put a hex value in a component. Accent stays under ~5% of a screen. Never two dark (`inverse`) sections in a row, except contact → footer.
- **No invented facts.** Numbers, names, quotes and claims come from data files only. Stats are counted from the catalog (`apps/web/src/data/site.js`). Unbuilt products are labelled "Expected".
- **Copy lives in data.** Site text in `apps/web/src/data/site.js`; products and prices in `packages/shared/src/data/`. Components only render.
- **Services stay separate.** One service = one folder in `services/`, its own Mongo database, reached only through the gateway at `/api/<name>`. Add a new one to `ROUTES` in `services/gateway/src/index.js`, the root `dev` script and `docker-compose.yml`.
- **Shared helpers:** `createApp`, `finish`, `validate(zod)`, `requireAuth`, `ApiError` from `@pirento/shared/server`. Responses are always `{data}` or `{error: {code, message}}`.
- **Money:** stored in paise (integers) in the wallet service; debits use one atomic update with a `$gte` balance guard. Prices are read on the server; never trust an amount from the browser.
- **Motion:** pages call `usePageMotion(ref)`. Mark elements with `data-reveal`, hero extras with `data-hero-fade`, heading lines with `<Heading data-lines>`. All of it is skipped under reduced motion.
- **New page:** add the route in `apps/web/src/main.jsx`, call `usePageMeta`, keep one `<h1>`.
- Shortcuts are marked `// shortcut: <limit>, <when to upgrade>`. Grep for them before launch.

## Check before pushing

`npm test`, `npm run build`, `npx prettier --check .`, and a look at 360px and 1440px in light and dark.
