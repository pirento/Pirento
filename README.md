# Pirento Ecosystem

One account, one wallet and one identity across ten products: Pirento Legal, Black, Green, Intern, AI, Vault, One, Capital, Bharat ID and Giftox. Each product is its own site in its own brand colours; `/` is the Pirento Ecosystem site.

Built on the MERN stack as small services behind one gateway.

| Read this                                            | For                                                    |
| ---------------------------------------------------- | ------------------------------------------------------ |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | How it fits together, where every file lives           |
| [docs/HOW-TO.md](docs/HOW-TO.md)                     | Adding a page, a route, a service, a product, a colour |
| [docs/BRAND_GUIDELINES.md](docs/BRAND_GUIDELINES.md) | Brand colours and rules (source of the colour tokens)  |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)       | Layout, type, motion and components                    |
| [CLAUDE.md](CLAUDE.md)                               | House rules for anyone (or any AI) changing the code   |

## Run it

```bash
npm install
npm run db      # MongoDB in Docker (or run your own on 127.0.0.1:27017)
npm run dev     # gateway, every service and the website
```

Open http://localhost:5173. Sign in with any email: outside production the 6-digit code is shown on screen (and emailed too if `SMTP_URL` is set). To get a superadmin, start with `SUPERADMIN_STAFF_ID=root.admin SUPERADMIN_PASSWORD=<10+ characters> npm run dev` and sign in at `/admin/login` (or set `SUPERADMIN_EMAILS=you@example.com` and use the email code).

```bash
npm test         # unit tests, next to the code they check
npm run build    # website → apps/web/dist
npm run e2e      # every flow against a running stack (start it with SUPERADMIN_EMAILS=boss@example.com SUPERADMIN_STAFF_ID=root.admin SUPERADMIN_PASSWORD=change-me-now-123 OTP_RESEND_SECONDS=0)
npm run format   # prettier
```

## What it does

- **Create an account** (`/register`): name, email and mobile → a code to each → a user ID (or your email as the user ID), a password and acceptance of the [Terms](/terms) (`/terms`, versioned by `TERMS_VERSION`).
- **Sign in** (`/login`, in the colours of the site you came from): a code by **mobile**, **email** or **Bharat ID** (in that order), or **user ID + password** below; Google when `GOOGLE_CLIENT_ID` is set. **Forgot password** (`/forgot-password`: code to your email, new password) and **forgot user ID** (`/forgot-user-id`: emailed, never shown). Wrong passwords slow down 1s, 2s, 4s…
- **Staff** sign in only at `/admin/login` (not linked from customer pages) with a staff ID and password issued by a superadmin; failures are audited. The first superadmin comes from `SUPERADMIN_STAFF_ID` + `SUPERADMIN_PASSWORD`.
- **Pirento Ecosystem home** (`/`): pick any product in the hero to preview its site, what one account gives you, the ten products grouped by need, Legal search.
- **Pirento Ecosystem dashboard** (`/dashboard`): a greeting with one plain line of what needs you, the wallet card with its balance history, open orders, spend this month, Bharat ID and certificates, "pick up where you left off" (pay, read a reply, finish your ID), one activity timeline across products, spend by product, a get-started checklist and every product as an app. Wallet (`/wallet`) and Account (`/account`) have their own pages. Press Ctrl/Cmd+K anywhere in the app to jump to any product, page or service.
- **Product sites** at `/<product>` with dashboards at `/<product>/dashboard`, each in the product's dark and accent colours from the brand guidelines, with its own home layout and a working widget in the hero (search Legal services, Black rate card, Green tree calculator, Capital EMI calculator and more).
- **Orders**: server-priced checkout for Legal, Black, Green (trees) and Giftox (gift boxes), paid from the wallet or Razorpay, worked by staff, finished with a public code (`LGL-`, `BLK-`, `GRN-`, `GFT-`).
- **Bharat ID**: seven saved steps (Aadhaar checked by checksum, only its last 4 digits kept), a 20-second **video KYC** where you say your name and a one-time code, then review and consent. Staff watch the video and approve or reject; the video is deleted once the ID is issued. A 10-digit ID with a QR verify page.
- **Intern** exam and certificates, **Vault** encrypted files and passwords, **AI** assistant on Claude, **One** partner referrals, **Capital** EMI calculator and waitlist, **Support** tickets.
- **Admin** (`/admin/<section>`), each staff role seeing only its sections (support, finance, staff = operations, superadmin):
  - Work: orders (take one, hand it back, note to the customer), Bharat ID review, tickets (take one, team-only notes), Intern openings and applications, Capital waitlist.
  - People: users (orders, wallet, ID, role, product scope, suspend), team and workload, account deletion requests.
  - Money: payments ledger, wallet adjustments, withdrawals to UPI, discount codes, Pirento One partners.
  - Records: certificates, services and prices, site settings (announcement banner, pause a product's checkout), audit trail of every staff action.
- **Account**: withdraw wallet money to UPI, apply a discount code at checkout, ask for your account to be deleted.
- **Verify** (`/verify`): any Bharat ID, certificate or completion code.

## Configuration

Copy `.env.example` to `.env`. Required in production: `JWT_SECRET`, `INTERNAL_KEY`, `VAULT_ENCRYPTION_KEY`, `KYC_ENCRYPTION_KEY` (long random strings; changing the last two makes stored data unreadable), `SMTP_URL` (sign-in codes are only emailed), `DOMAIN`. Optional: Razorpay keys (card/UPI), `ANTHROPIC_API_KEY` (the AI assistant).

## Deploy

On one server with Docker: point your domain's DNS at it, fill `.env`, then `docker compose up -d --build`. Caddy gets the HTTPS certificate itself. Back up the `mongo-data` volume. CI runs prettier, tests, the build, the full e2e suite and a Docker build on every push.

© Venturecore Solutions Private Limited (Pirento Ecosystem is its brand) · CIN U63121UP2023PTC188021
