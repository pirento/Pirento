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

Open http://localhost:5173. Sign in with any email: outside production the 6-digit code is shown on screen (and emailed too if `SMTP_URL` is set). To get a superadmin, start with `SUPERADMIN_EMAILS=you@example.com npm run dev` and sign in with that email.

```bash
npm test         # unit tests, next to the code they check
npm run build    # website → apps/web/dist
npm run e2e      # every flow against a running stack (start it with SUPERADMIN_EMAILS=boss@example.com OTP_RESEND_SECONDS=0)
npm run format   # prettier
```

## What it does

- **Sign-in** by emailed code (`/login`, staff at `/admin/login`). First sign-in asks your name. Sessions: 15-minute access token in memory, rotating refresh cookie.
- **Pirento Ecosystem dashboard** (`/dashboard`): every product with its live status, the wallet, recent orders, your profile.
- **Product sites** at `/<product>` with dashboards at `/<product>/dashboard`, each in the product's dark and accent colours from the brand guidelines.
- **Orders**: server-priced checkout for Legal, Black, Green (trees) and Giftox (gift boxes), paid from the wallet or Razorpay, worked by staff, finished with a public code (`LGL-`, `BLK-`, `GRN-`, `GFT-`).
- **Bharat ID**: seven saved steps (Aadhaar checked by checksum, only its last 4 digits kept), a 20-second **video KYC** where you say your name and a one-time code, then review and consent. Staff watch the video and approve or reject; the video is deleted once the ID is issued. A 10-digit ID with a QR verify page.
- **Intern** exam and certificates, **Vault** encrypted files and passwords, **AI** assistant on Claude, **One** partner referrals, **Capital** EMI calculator and waitlist, **Support** tickets.
- **Admin** (`/admin`): queues for orders, Bharat ID and tickets; superadmins also get an overview and roles.
- **Verify** (`/verify`): any Bharat ID, certificate or completion code.

## Configuration

Copy `.env.example` to `.env`. Required in production: `JWT_SECRET`, `INTERNAL_KEY`, `VAULT_ENCRYPTION_KEY`, `KYC_ENCRYPTION_KEY` (long random strings; changing the last two makes stored data unreadable), `SMTP_URL` (sign-in codes are only emailed), `DOMAIN`. Optional: Razorpay keys (card/UPI), `ANTHROPIC_API_KEY` (the AI assistant).

## Deploy

On one server with Docker: point your domain's DNS at it, fill `.env`, then `docker compose up -d --build`. Caddy gets the HTTPS certificate itself. Back up the `mongo-data` volume. CI runs prettier, tests, the build, the full e2e suite and a Docker build on every push.

© Pirento Ecosystem Pvt. Ltd. · CIN U63121UP2023PTC188021
