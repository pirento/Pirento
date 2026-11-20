# CLAUDE.md

Notes for AI-assisted work on this repo. Read README.md first.

## Rules

- **Where things live:** read `docs/ARCHITECTURE.md` first, and `docs/HOW-TO.md` for the usual changes. One idea per file: pages and their parts in `apps/web/src/features/<area>/`, each service as `config.js`, `models/`, `routes/`, `lib/`.
- **Colours:** from the brand guidelines (`docs/BRAND_GUIDELINES.md`, Appendix A): register in `packages/shared/src/data/brand.js`, tokens in `apps/web/src/styles/index.css`. Product sites get their accent and dark via `useSiteTheme` (`apps/web/src/lib/site.js`). Keep `brand.test.js` passing.
- **Design is fixed.** Layout, type and motion follow `docs/DESIGN_SYSTEM.md`. Colours come only from the CSS tokens (`bg-paper`, `text-ink`, `bg-accent` …); never put a hex value in a component. Accent stays under ~5% of a screen. Never two dark (`inverse`) sections in a row, except contact → footer.
- **No invented facts.** Numbers, names, quotes and claims come from data files only. Stats are counted from the catalog (`apps/web/src/data/site.js`). Unbuilt products are labelled "Expected".
- **Copy lives in data.** Site text in `apps/web/src/data/site.js`; products and prices in `packages/shared/src/data/`. Components only render. The one runtime exception: the announcement banner and paused checkouts, set in admin → Site settings (catalog service).
- **New personal data** in a service: add it to that service's `/internal/forget`, so account deletion removes it.
- **Services stay separate.** One service = one folder in `services/`, its own Mongo database, reached only through the gateway at `/api/<name>`. Add a new one to `SERVICES` in `services/gateway/src/config.js`, the root `dev` script, `docker-compose.yml` and the `Dockerfile`.
- **Shared helpers:** `createApp`, `finish`, `validate(zod)`, `requireAuth`, `requireRole`, `ApiError`/`notFound`/`badInput`/`conflict`, `isId`, `nextSeq`, `encrypt`/`decrypt` from `@pirento/shared/server`. Express 5 catches async errors, so routes are plain `async` functions. Responses are always `{data}` or `{error: {code, message}}`.
- **Staff roles:** `support`, `finance`, `staff`, `superadmin`. Guard staff routes with `requireRole(...ACCESS.<area>)`; keep `ACCESS` and `ADMIN_SECTIONS` (`apps/web/src/features/admin/adminNav.js`) in step. Every staff change calls `audit(req, action, target)`.
- **Layouts:** dashboards and admin use `layout: 'app'` in `routes.jsx` (sidebar, no footer); sign-in uses `layout: 'auth'`.
- **Internal calls:** a service calls another with `callService(url, '/internal/…', body)`; the receiver guards with `requireInternal`. Never expose an `/internal` route without it.
- **Orders:** status moves only through `STAFF_TRANSITIONS` (`packages/shared/src/orders/rules.js`), with an update conditional on the old status. Intake answers are validated by `validateIntake` on the server.
- **Sequences:** order, ticket and Bharat ID numbers come from `nextSeq(name)` in `@pirento/shared/server`. Bharat IDs only through `bharatIdFromSeq`; validate with `isBharatId`.
- **Exam answers** (`@pirento/shared/exam`) are server-only. The web app must never import that module.
- **Encryption at rest** (Vault files and passwords, KYC videos) uses `encrypt`/`decrypt` from `@pirento/shared/server` (AES-256-GCM). Never return plaintext outside the routes made for it. KYC videos are deleted once an ID is approved.
- **Sessions:** never put the access token in storage. `authFetch` / `api` in `apps/web/src/lib/api/client.js` attach it and refresh once on a 401; use them for every call, binary ones included.
- **Claude calls** live only in `services/ai`. Model `claude-opus-5-5`; keep `SYSTEM` in `services/ai/src/lib/prompt.js` byte-stable (no dates or ids) so the prompt cache keeps hitting.
- **Effects:** wrap `useEffect` bodies in braces. An arrow that returns a value (e.g. `scrollIntoView`, which returns a Promise in new browsers) crashes React on unmount.
- **Layout check:** `html` has `overflow-x: clip`, so `scrollWidth` never shows overflow. Check element edges against the viewport instead.
- **Prices on screen:** read through `useService` / `useServicesFor` (`apps/web/src/lib/prices.jsx`) so admin price changes show; the orders service reads the live price from the catalog service.
- **Money:** stored in paise (integers) in the wallet service; debits use one atomic update with a `$gte` balance guard. Prices are read on the server; never trust an amount from the browser.
- **Motion:** pages call `usePageMotion(ref)`. Mark elements with `data-reveal`, hero extras with `data-hero-fade`, heading lines with `<Heading data-lines>`. All of it is skipped under reduced motion.
- **New page:** add one line to `apps/web/src/app/routes.jsx` above the `/:slug` product routes, call `usePageMeta`, keep one `<h1>`.
- **Bharat ID form:** steps and rules live once in `packages/shared/src/identity/form.js`; the browser and the identity service both validate with `validateSection`. Never store a full Aadhaar or account number.
- Shortcuts are marked `// shortcut: <limit>, <when to upgrade>`. Grep for them before launch.

- **Comments:** each file starts with one line saying what it is for; comment the why, not the what.
- **Tests:** run the e2e stack with `SUPERADMIN_EMAILS=boss@example.com SUPERADMIN_STAFF_ID=root.admin SUPERADMIN_PASSWORD=change-me-now-123 OTP_RESEND_SECONDS=0`.
- **Sign-in:** codes go through `lib/otp.js` in the auth service; the staff door answers every failure with the same message. Never return `passwordHash` (it is `select: false` and stripped in `toJSON`).

## Check before pushing

`npm test`, `npm run build`, `npm run e2e` (with the stack running), `npx prettier --check .`, and a look at 360px and 1440px in light and dark.
