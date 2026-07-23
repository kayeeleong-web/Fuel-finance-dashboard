# Fuel Finance — Client Dashboard

One Next.js app per client: Clerk-gated sign-in, then a single product with four tabs
— **KPI Report** (the default landing view), **Dashboard**, **Reports**, **Custom**.
There is no separate "portal" repo — this app IS the portal; see `CLAUDE.md` for the
full architecture note and why.

Read `CLAUDE.md` before doing any work here, especially before touching UI or the data
layer — it points at `docs/design-rules.md` and `docs/functionality-spec.md`, which are
the actual standard, not this file.

## Files

- `package.json` — dependencies (Next.js, React, `@clerk/nextjs`, `googleapis`)
- `middleware.js` — blocks every route until the visitor signs in with Clerk
- `app/layout.js` — wraps the app in `<ClerkProvider>`, imports `globals.css`
- `app/page.js` — fetches all data once (via `getDataSource()`) and renders `<DashboardApp>`
- `app/globals.css` — Fuel design tokens + every shared component class
- `components/` — the tab shell (Topbar/TabNav/Footer) and the 4 tab panels
- `lib/data/` — the `DataSource` abstraction (Google Sheets today, QBO stubbed) — see `lib/data/README.md`
- `lib/calc/` — deterministic chart math for the Dashboard tab
- `config/client.config.example.ts` — copy to `client.config.ts` per client
- `docs/` — `design-rules.md`, `functionality-spec.md`, `reference-build.html`
- `.env.local.example` — which environment variables are needed

## One-time setup (per new client repo)

1. **Use this template** on GitHub to create the client's repo (e.g. `fuel-acme-dashboard`).
2. Copy `config/client.config.example.ts` → `config/client.config.ts`, fill in `name`/`slug`.
3. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application** (one
   Clerk application per client keeps their users fully separate from other clients).
   Copy the **Publishable key** and **Secret key**.
4. In Clerk → **Users**, invite whoever needs access: the client's contact(s), the
   assigned FM, their team lead, the CSM.
5. Build the client's Google Sheet using the fixed tabs documented in
   `lib/data/sources/googleSheets.ts` and `lib/data/README.md` (`KPI_Report`, `PL`, `CF`,
   `BS`, `Dashboard_Data`, `Custom_Reports_Index`).
6. Create a **dedicated** Google Service Account for this client (never reuse another
   client's), share the Sheet with it as Viewer, and get its email + base64-encoded
   private key.
7. Set env vars locally (`.env.local`, copy from `.env.local.example`) and on Vercel:
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
   `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.

## Deploying to Vercel

1. Import the repo into Vercel (Add New → Project). Framework preset — **Next.js**
   (auto-detected).
2. Add the environment variables from step 7 above before the first deploy.
3. Add the client's domain: Project → **Settings → Domains** → add
   `{slug}.fuelfinance.me`, using the same `slug` from `config/client.config.ts` (e.g.
   `acme` → `acme.fuelfinance.me`). Never leave a client on the default `*.vercel.app`
   domain. Vercel shows the DNS record it needs (usually a CNAME to
   `cname.vercel-dns.com`) — add that record wherever fuelfinance.me's DNS is managed;
   Vercel verifies automatically once it propagates.
4. Deploy.

## What the client sees

Opening the URL shows Clerk's own sign-in screen first — only invited emails get in,
enforced server-side by `middleware.js` (and again at the page level in `app/page.js`,
per Clerk's current guidance to check "as close to the resource as possible," not
middleware alone). Once signed in, they land on KPI Report and can switch to Dashboard /
Reports / Custom without a page reload — all data loads once, up front.

## Updating data

The dashboard reads live from the client's Google Sheet (5-minute cache, see
`lib/data/README.md`) — editing the Sheet and waiting is normally enough. No redeploy
needed for data changes; only a code/design change requires committing and letting
Vercel rebuild.

## Note on Vercel's own Password Protection

Not needed — Clerk is the access gate. Leave Vercel's Deployment Protection off to
avoid a double login.
