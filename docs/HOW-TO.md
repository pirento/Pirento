# How to change things

Short recipes for the changes we make most. Each one names every place to touch.

## Add a page

1. Write it in `apps/web/src/features/<area>/<Name>Page.jsx`. Call `usePageMeta`, keep one `<h1>`, and use `PageHero` and the `components/ui` parts.
2. Add one line to `apps/web/src/app/routes.jsx`, above the `/:slug` product routes.
3. If it needs an account, start with `const {redirect, user} = useSignedIn();` and `if (redirect) return redirect;`.

## Add an API route to a service

1. Put it in the right router under `services/<name>/src/routes/`: public, customer (`requireAuth`) or staff (`requireRole(...STAFF)`).
2. Validate the body with `validate(zodSchema)`. Throw `ApiError` (or `notFound`, `badInput`, `conflict`) for anything the caller should read.
3. New data? Add a model in `models/`, one per file.
4. Add a check to `scripts/e2e.mjs`.

## Add an admin section

1. Add it to `ADMIN_SECTIONS` in `apps/web/src/features/admin/adminNav.js` (id, label, icon, intro, roles).
2. Write the component in `features/admin/` and add it to `SECTIONS` in `features/admin/sections.jsx`.
3. Its API goes on the owning service's `/staff` routes, guarded by `requireRole(...ACCESS.<area>)`; add the area to `ACCESS` in `packages/shared/src/server/auth.js` if it is new. Call `audit(req, 'thing.done', target)` for anything that changes data.

## Add a service

1. Copy the shape of a small one (`services/support`): `index.js`, `config.js`, `models/`, `routes/`, and `package.json` with a `dev` script.
2. Add it to `SERVICES` in `services/gateway/src/config.js` (name and port).
3. Add it to the root `dev` script, to `docker-compose.yml` (its own `MONGO_URI` database) and to the `Dockerfile` copy list.

## Add a product site

1. Add the product to `packages/shared/src/data/products.js` (copy, steps, FAQ, status) and its colours to `PRODUCT_COLOURS` in `data/brand.js`. The contrast test tells you if its text colour is unreadable.
2. Its home page works at once. For a dashboard, add a component to `APPS` in `apps/web/src/features/products/ProductDashboardPage.jsx`, or sell priced services through `catalog/services.js` and it gets the orders dashboard.
3. Give it a layout in `apps/web/src/features/products/designs.js`: a hero (`split`, `split-reverse`, `center`, `editorial`), a working widget from `features/products/widgets/`, a features layout (`bento`, `rows`, `cards`), a how-it-works layout (`steps`, `timeline`), and `covers` if the widget already is the prices or how-it-works section. Pick a mix no other site has.
4. Add an illustration name in `apps/web/src/data/site.js` (`productIllustration`); the bento layout shows it.
5. When it has a logo: put `logo.png` (light backgrounds), `logo-light.png` (its dark panels), `mark.png`, `mark-light.png` and the favicons (`favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`) in `apps/web/public/brand/<slug>/`, and add one line to `ART` in `components/layout/PirentoLogo.jsx`. Its navbar, footer, sidebar, sign-in pages and browser tab pick it up.

## Add a service to sell

Add it to the catalogue data in `packages/shared/src/data/` (prices in rupees). It appears in the catalog API, on its product page and at checkout. Prices are only ever read on the server.

## Change a Bharat ID question

Edit `ID_SECTIONS` in `packages/shared/src/identity/form.js`. The form, the server's validation and the staff view all follow. Never store a full Aadhaar or bank account number; use `store` to keep only what is needed.

## Change the About page or a team photo

People, the company story, the Foundation, the ventures and the bodies alongside live in `apps/web/src/data/group.js`; the home page and `/about` only render it. To add a photo, put it in `apps/web/public/team/` and set that person's `photo`; until then they show initials. When a portfolio domain goes live, change its `href`.

## Change a price

In admin → Services & prices (finance or superadmin): set a new price, reset it, or take a service off sale. The base price stays in `packages/shared/src/data/`; the catalog service keeps the change, the orders service charges it, and the website shows it through `lib/prices.jsx`. Use `useService` / `useServicesFor` from there, never `getService` directly, when showing a price.

## Change a colour

Change `packages/shared/src/data/brand.js` (product colours) or the tokens at the top of `apps/web/src/styles/index.css` (masterbrand), and run `npm test`.
