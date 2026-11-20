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

## Add a service

1. Copy the shape of a small one (`services/support`): `index.js`, `config.js`, `models/`, `routes/`, and `package.json` with a `dev` script.
2. Add it to `SERVICES` in `services/gateway/src/config.js` (name and port).
3. Add it to the root `dev` script, to `docker-compose.yml` (its own `MONGO_URI` database) and to the `Dockerfile` copy list.

## Add a product site

1. Add the product to `packages/shared/src/data/products.js` (copy, steps, FAQ, status) and its colours to `PRODUCT_COLOURS` in `data/brand.js`. The contrast test tells you if its text colour is unreadable.
2. Its home page works at once. For a dashboard, add a component to `APPS` in `apps/web/src/features/products/ProductDashboardPage.jsx`, or sell priced services through `catalog/services.js` and it gets the orders dashboard.
3. Add an illustration name in `apps/web/src/data/site.js` (`productIllustration`).

## Add a service to sell

Add it to the catalogue data in `packages/shared/src/data/` (prices in rupees). It appears in the catalog API, on its product page and at checkout. Prices are only ever read on the server.

## Change a Bharat ID question

Edit `ID_SECTIONS` in `packages/shared/src/identity/form.js`. The form, the server's validation and the staff view all follow. Never store a full Aadhaar or bank account number; use `store` to keep only what is needed.

## Change a colour

Change `packages/shared/src/data/brand.js` (product colours) or the tokens at the top of `apps/web/src/styles/index.css` (masterbrand), and run `npm test`.
