# Pirento

One account, one wallet and one identity across ten products: Legal, Black, Green, Intern, AI, Vault, One, Capital, Bharat ID and Giftox.

Built on the MERN stack as small services behind one gateway.

## Run it

```bash
npm install
npm run db      # MongoDB in Docker (or run your own on 127.0.0.1:27017)
npm run dev     # gateway, services and website
```

Open http://localhost:5173. Sign in with any email: outside production the 6-digit code is shown on screen (and emailed too if `SMTP_URL` is set). In production the code is only emailed, so `SMTP_URL` is required.

Full stack in containers:

```bash
cp .env.example .env   # set JWT_SECRET
docker compose up --build   # http://localhost:4000
```

## Layout

| Path                | What it is                                                                                    | Port |
| ------------------- | --------------------------------------------------------------------------------------------- | ---- |
| `apps/web`          | Website: React 19, Vite, Tailwind v4, GSAP + Lenis                                            | 5173 |
| `services/gateway`  | The only public entry. Rate limits, routes `/api/<service>`                                   | 4000 |
| `services/auth`     | Email OTP sign-in, JWT, profile. DB `pirento_auth`                                            | 4001 |
| `services/wallet`   | Balance and transactions in paise, atomic debits. DB `pirento_wallet`                         | 4002 |
| `services/catalog`  | Products, legal catalogue and service prices                                                  | 4003 |
| `services/orders`   | Checkout, wallet and Razorpay payments, staff workflow, completion codes. DB `pirento_orders` | 4004 |
| `services/identity` | Bharat ID applications, staff review, public verify. DB `pirento_identity`                    | 4005 |
| `services/learning` | Intern tracks, timed final exam, certificates. DB `pirento_learning`                          | 4006 |
| `services/vault`    | Files and passwords, AES-256-GCM at rest. DB `pirento_vault`                                  | 4007 |
| `services/support`  | Support tickets between customers and staff. DB `pirento_support`                             | 4008 |
| `services/ai`       | Pirento AI chat on Claude (`claude-opus-5-5`), saved chats, daily limit. DB `pirento_ai`      | 4009 |
| `packages/shared`   | Catalog data and the shared Express helpers every service uses                                | —    |

Each service owns its own database and talks to the others only over HTTP. Service-to-service calls go to `/internal/*` routes with a shared `INTERNAL_KEY`; the gateway never forwards those paths.

## Eleven sites, one account

`/` is the **Pirento Ecosystem** site. Each of the ten products is its own site in its own brand colour (taken from the original Pirento products), with its own home, navbar, footer wordmark and dashboard:

| Product         | Home         | Dashboard              | Colour    |
| --------------- | ------------ | ---------------------- | --------- |
| Pirento Legal   | `/legal`     | `/legal/dashboard`     | `#1D84FF` |
| Pirento Black   | `/black`     | `/black/dashboard`     | `#0E6BA8` |
| Pirento Green   | `/green`     | `/green/dashboard`     | `#0ADB94` |
| Pirento Intern  | `/intern`    | `/intern/dashboard`    | `#00B4D8` |
| Pirento AI      | `/ai`        | `/ai/dashboard`        | `#E71AFF` |
| Pirento Vault   | `/vault`     | `/vault/dashboard`     | `#7C3AED` |
| Pirento One     | `/one`       | `/one/dashboard`       | `#FF5722` |
| Pirento Capital | `/capital`   | `/capital/dashboard`   | `#DBAC72` |
| Bharat ID       | `/bharat-id` | `/bharat-id/dashboard` | `#F1C700` |
| Giftox          | `/giftox`    | `/giftox/dashboard`    | `#FF1066` |

The colour, button text colour, status pill, steps and FAQ for each site live in `packages/shared/src/data/products.js`; a test checks every button colour pair reaches WCAG AA (4.5:1). Service, checkout and sign-in pages take the colour of the product they belong to. Sign in is always in the navbar, phones included, and the sign-in email names the site you came from.

## Orders

1. A customer picks a priced Legal or Black service and answers the intake questions (`/checkout/:slug`).
2. The order is priced on the server and paid from the wallet, or by card/UPI through Razorpay when its keys are set.
3. Staff (role `staff` or `superadmin`) work the queue at `/staff`: start work, complete, or cancel. Cancelling a wallet-paid order refunds it.
4. A completed order gets a public code (`LGL-…`, `BLK-…`, `GRN-…`) that anyone can check at `/verify`.

Green tree sponsorship uses the same flow: each plantation drive is a service priced per tree, and the order carries a quantity.

## Identity, learning, vault, support

- **Bharat ID** (`/bharat-id/dashboard`): eight steps — contact, personal details, identity documents (PAN, Aadhaar with its Verhoeff checksum), address, occupation and income, bank account, nominee and emergency contact, then review with consent. Each step is saved on the server, so people can stop and come back. Only the last 4 digits of Aadhaar and the bank account are stored. Staff see every step and approve or reject with a reason; a rejected application is edited and submitted again. Approval issues a 10-digit ID (Verhoeff check digit, scrambled sequence) with a QR to its public verify page, which shows only a shortened name, and the card can be printed.
- **Intern** (`/intern/dashboard`): five tracks, 10 questions, 30 minutes, 60% to pass, one retake per 24 hours. Answers never leave the server. A pass issues a `PC-…` certificate.
- **Vault** (`/vault/dashboard`): files up to 5 MB (50 MB per user) and passwords, encrypted with AES-256-GCM using `VAULT_ENCRYPTION_KEY`. Pirento holds the key: this is not end-to-end encryption. Changing the key makes stored data unreadable.
- **Support** (`/support`): tickets with a message thread. Staff answer from the Tickets tab in `/staff`.

## AI, One, Giftox, Capital, admin

- **Pirento AI** (`/ai/dashboard`): a chat assistant that knows the catalog and its prices. It runs on `claude-opus-5-5` with streaming, a cached system prompt, low effort for short chat, and server-side refusal fallback. It is off until `ANTHROPIC_API_KEY` is set. Each account can send 30 messages a day.
- **Pirento One** (`/one/dashboard`): a partner gets a code (`P…`) and a link `/?ref=CODE`. Orders placed after opening that link are credited to the code. The partner sees the orders but never the client's details. Commission payout is not built.
- **Giftox**: six gift boxes from the old catalog, sold through the order flow with a quantity and a delivery address. Completion codes start `GFT-`.
- **Capital** (`/capital/dashboard`): an EMI calculator and a waitlist (it opens a support ticket). Pirento does not lend: that needs regulatory approval.
- **Admin** (`/admin`): one dashboard for staff and superadmins. Staff get the Orders, Bharat ID and Tickets queues; superadmins also get Overview (headline numbers, and paid orders per product in each product's colour) and People (roles). Changing a role ends that person's sessions. `/staff` redirects here.

### Sessions

Sign-in returns a 15-minute access token, kept only in the page's memory, and sets a 30-day refresh token in an httpOnly cookie scoped to `/api/auth`. The refresh token is stored hashed and replaced on every use. Signing out, or a role change, deletes it, so access ends within 15 minutes.

`/verify` checks all three kinds of code: a 10-digit Bharat ID, a `PC-` certificate, or an order completion code.

Wallet debits and refunds carry a reference, so a retried or parallel request never moves money twice. Razorpay payments are confirmed by signature, in the browser callback and in the webhook (`POST /api/orders/payments/razorpay/webhook`).

To get a superadmin locally, start with `SUPERADMIN_EMAILS=you@example.com npm run dev` and sign in with that email.

## Commands

```bash
npm test         # node:test in every workspace
npm run build    # website → apps/web/dist (the gateway serves it in production)
npm run format   # prettier
npm run e2e      # every service flow against a running stack (start it with SUPERADMIN_EMAILS=boss@example.com)
```

## Deploy

On one server with Docker:

1. Point your domain's DNS A record at the server.
2. `cp .env.example .env` and fill in `JWT_SECRET`, `INTERNAL_KEY`, `VAULT_ENCRYPTION_KEY` (long random strings, kept safe), `SMTP_URL` (sign-in codes are emailed), `DOMAIN`, and optionally the Razorpay and Anthropic keys.
3. `docker compose up -d --build`. Caddy gets the HTTPS certificate itself; the site is at `https://$DOMAIN`.

Back up the `mongo-data` volume. Losing `VAULT_ENCRYPTION_KEY` makes Vault data unreadable.

CI (`.github/workflows/ci.yml`) runs prettier, unit tests, the build and the full e2e suite against MongoDB on every push, and builds the Docker image.

## Design

Every page follows [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): forest and paper base, one marigold accent, Space Grotesk and Inter, numbered sections and quiet motion.

## Roadmap

| Phase | Scope                                                      | Status |
| ----- | ---------------------------------------------------------- | ------ |
| 1     | Gateway, auth, wallet, catalog, design system, public site | Done   |
| 2     | Orders and checkout (Razorpay), Legal and Black workflows  | Done   |
| 3     | Bharat ID, Green, Intern, Vault, support tickets           | Done   |
| 4     | AI, Capital, One, Giftox, admin panel, deployment          | Done   |

© Pirento Ecosystem Pvt. Ltd. · CIN U63121UP2023PTC188021
