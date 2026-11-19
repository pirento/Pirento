# Pirento

One account, one wallet and one identity across ten products: Legal, Black, Green, Intern, AI, Vault, One, Capital, Bharat ID and Giftox.

Built on the MERN stack as small services behind one gateway.

## Run it

```bash
npm install
npm run db      # MongoDB in Docker (or run your own on 127.0.0.1:27017)
npm run dev     # gateway, services and website
```

Open http://localhost:5173. Sign in with any email: outside production the 6-digit code is shown on screen.

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
| `packages/shared`   | Catalog data and the shared Express helpers every service uses                                | —    |

Each service owns its own database and talks to the others only over HTTP. Service-to-service calls go to `/internal/*` routes with a shared `INTERNAL_KEY`; the gateway never forwards those paths.

## Orders

1. A customer picks a priced Legal or Black service and answers the intake questions (`/checkout/:slug`).
2. The order is priced on the server and paid from the wallet, or by card/UPI through Razorpay when its keys are set.
3. Staff (role `staff` or `superadmin`) work the queue at `/staff`: start work, complete, or cancel. Cancelling a wallet-paid order refunds it.
4. A completed order gets a public code (`LGL-…`, `BLK-…`, `GRN-…`) that anyone can check at `/verify`.

Green tree sponsorship uses the same flow: each plantation drive is a service priced per tree, and the order carries a quantity.

## Identity, learning, vault, support

- **Bharat ID** (`/bharat-id`): a customer applies with name, date of birth, state and PAN; staff approve or reject with a reason. Approval issues a 10-digit ID (Verhoeff check digit, scrambled sequence) with a QR to its public verify page, which shows only a shortened name.
- **Intern** (`/intern`): five tracks, 10 questions, 30 minutes, 60% to pass, one retake per 24 hours. Answers never leave the server. A pass issues a `PC-…` certificate.
- **Vault** (`/vault`): files up to 5 MB (50 MB per user) and passwords, encrypted with AES-256-GCM using `VAULT_ENCRYPTION_KEY`. Pirento holds the key: this is not end-to-end encryption. Changing the key makes stored data unreadable.
- **Support** (`/support`): tickets with a message thread. Staff answer from the Tickets tab in `/staff`.

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

## Design

Every page follows [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): forest and paper base, one marigold accent, Space Grotesk and Inter, numbered sections and quiet motion.

## Roadmap

| Phase | Scope                                                      | Status   |
| ----- | ---------------------------------------------------------- | -------- |
| 1     | Gateway, auth, wallet, catalog, design system, public site | Done     |
| 2     | Orders and checkout (Razorpay), Legal and Black workflows  | Done     |
| 3     | Bharat ID, Green, Intern, Vault, support tickets           | Now      |
| 4     | AI, Capital, One, Giftox, admin panel, deployment          | Expected |

© Pirento Ecosystem Pvt. Ltd. · CIN U63121UP2023PTC188021
