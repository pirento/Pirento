# How Pirento is built

Pirento is one website (`apps/web`) in front of small backend services (`services/*`). They share one package (`packages/shared`) for data, rules and server helpers. Every folder does one job, and every file holds one idea, so you can find things by name.

## The big picture

```
browser ──► gateway (:4000) ──► auth · wallet · catalog · orders · identity · learning · vault · support · ai · green
               │                   each with its own MongoDB database
               └── serves the built website in production
```

- The **gateway** is the only public entry. It rate-limits, refuses `/api/<service>/internal/*`, and forwards `/api/<service>/…` to that service.
- A **service** owns its data: its own Mongo database, except the wallet, whose money is in PostgreSQL. Redis (when set) is shared only as a cache and for rate limits. Nobody else reads a service's database. Another service that needs something calls its `/internal/*` route with the shared `INTERNAL_KEY` (example: orders → wallet for debits and refunds).
- Every response is `{data}` or `{error: {code, message}}`.
- **Staff roles**: `support`, `finance`, `staff` (operations), `superadmin`. `ACCESS` in `packages/shared/src/server/auth.js` says which roles use which area; each service guards its `/staff` routes with `requireRole(...ACCESS.<area>)`. Staff actions call `audit(req, action, target)`, which writes to the auth service's audit trail. Superadmins change roles, limit operations staff to some products (`products` in their token, applied by `productScope`), and suspend accounts.
- **Deleting an account** (auth `lib/forget.js`): refused while the wallet holds money; then identity, vault, ai and learning each get `/internal/forget`, and only then is the account anonymised. Orders, the ledger and tickets stay, tied to the anonymous account.

## Repository layout

```
apps/web/src
  main.jsx                 entry: styles, router, session, app shell
  app/                     App shell, route table (routes.jsx), page-change effects
  components/
    layout/                navbar, footer, app shell, command palette, preloader, cursor, contact block
    ui/                    Button, Tag, Heading/Section, Field, TextArea, Blocks
    illustrations/         the hand-drawn SVG scenes, one file per set (process, products, journeys, spots, family)
    PageHero.jsx, Illustration.jsx, ArtFigure.jsx
  features/<area>/         one folder per area of the product, pages and their parts
    ecosystem/  the Pirento home, the Products page, terms / privacy / refunds pages, 404
    about/      the group: the About page, and the family parts the home also shows (brand panels, decks, cards)
    products/   every product's home (layouts in designs.js, widgets/) and dashboard frame
    legal/  green/  identity/  business/  learning/  vault/  ai/  partner/  capital/   one product each
    auth/  account/  orders/  support/  verify/  admin/   shared across products
  lib/
    api/                   client (token + silent refresh), session, useApi
    format.js  motion.js  page.js  prices.jsx  links.js  productIcons.js  site.js (which product site you are on)
  data/                    site copy: site.js (pages), group.js (the company and its family), legal.js,
                           aiTools.js; art.test.js keeps every picture to one place
  styles/index.css         colour and type tokens
apps/web/public/brand      the Pirento logo and "t" mark (dark and light), square artwork, favicons and app icons

packages/shared/src
  index.js                 browser-safe exports
  data/                    raw data: products, brand colours, catalogue, prices, intake, exam bank,
                           and legalPages/ (every Legal service's page, one file per area)
  account/ catalog/ orders/ identity/ money/   rules shared by browser and server
  server/                  createApp, errors, env, auth, internal calls, validate, db, crypto, files, cache, razorpay

services/<name>/src
  index.js                 boots the service: createApp, mount routes, start
  config.js                everything read from the environment
  models/                  one Mongoose model per file
  routes/                  one Express router per area (public, staff, …)
  lib/                     pure logic, with its tests next to it
```

## Services

| Service  | Port | Owns                                                                                                   |
| -------- | ---- | ------------------------------------------------------------------------------------------------------ |
| gateway  | 4000 | routing, rate limits, serving the website                                                              |
| auth     | 4001 | accounts, email codes, sessions, roles                                                                 |
| wallet   | 4002 | balances (paise), the ledger, withdrawals, in PostgreSQL (SQL transactions)                            |
| catalog  | 4003 | products and prices (from `packages/shared`), admin edits and new services, site settings              |
| orders   | 4004 | checkout, payments, coupons, staff queue, codes, partner referrals                                     |
| identity | 4005 | Bharat ID: applications, Digio verification, verify, and Bharat ID for Business (API, keys, consents)  |
| learning | 4006 | Intern tracks, lessons, exams, certificates, openings, companies and the internship pipeline           |
| vault    | 4007 | encrypted records, files and passwords; Bharat ID unlock; nominee plan, check-ins and release          |
| support  | 4008 | tickets, contact-form enquiries                                                                        |
| ai       | 4009 | the Claude assistant                                                                                   |
| green    | 4010 | Pirento Green's carbon market: the price, credits held, buys, sells and credits grown by planted trees |

## The website

- `/` is the **Pirento Ecosystem** site; `/dashboard` is the shared dashboard (products, wallet, orders, profile).
- Each product is its own site: home at `/<slug>`, dashboard at `/<slug>/dashboard`. Every home has its own layout and a working widget (service search, rate card, exam facts, chat sample, spec sheet, referral path, EMI calculator, sample ID card, box strip), set in `features/products/designs.js`. `lib/site.js` works out the product from the URL; `useSiteTheme` swaps in that product's accent and dark colour.
- Three layouts (`app/App.jsx`): marketing pages get the navbar and footer; dashboards and admin get the app shell (`components/layout/AppLayout.jsx`, a sidebar, no footer); sign-in pages stand alone. Routes pick one with `layout` in `app/routes.jsx`.
- The app shell has a Ctrl/Cmd+K command palette (`components/layout/CommandPalette.jsx`) over pages, products and services.
- Admin is `/admin/<section>`; `features/admin/adminNav.js` lists the sections and the roles that see them.
- Accounts: `/register` (email + mobile codes → a sign-up ticket → user ID, password, terms). Sign-in at `/login` (codes by mobile, email or Bharat ID; user ID or email + password; Google) and `/admin/login` (staff ID + password); recovery at `/forgot-password` and `/forgot-user-id`. Codes for both channels go through the auth service's `lib/otp.js`; texts go out through `lib/sms.js` (`SMS_WEBHOOK_URL`). Email or Google sign-in never creates an account unless the terms are accepted. The auth service asks identity's `/internal/owner` who holds an issued Bharat ID and sends the code to that account's email; staff passwords are scrypt hashes; the first superadmin is seeded from the environment. Sessions: a 15-minute access token in memory plus a rotating refresh cookie; `lib/api/client.js` refreshes silently.

## Colours and type

Colours come from the **Pirento Ecosystem Consolidated Brand Guidelines** (`docs/BRAND_GUIDELINES.md`, Appendix A). The register lives in `packages/shared/src/data/brand.js`, and the CSS tokens in `apps/web/src/styles/index.css`. Text on an accent is picked by measured contrast (`textOn`), and a test keeps every pair at WCAG AA. Layout, motion and type follow `docs/DESIGN_SYSTEM.md`.

## Quality gates

`npm test` (unit tests next to the code), `npm run lint`, `npm run build`, `npm run e2e` (with the stack running), `npx prettier --check .`. CI runs all of them.
