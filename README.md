# Dartmouth Dining Email Subscription Portal

A web app that lets Dartmouth students subscribe to daily emails of the breakfast, lunch, and dinner menus at FoCo, Collis, and the Hop.

> DALI Lab API Challenge submission. Combines three integrations: the **Dartmouth Dining API**, **Google OAuth**, and **Gmail SMTP**.

## Deployed link

_TBD_

## Demo

_Screenshots / GIF coming soon._

## Local setup

### Prerequisites

- [Bun](https://bun.com) 1.2+
- Postgres 14+ running locally
- A Google Cloud project with an OAuth 2.0 Client ID (Web application)
- A Google account with 2-Step Verification on, plus an [App Password](https://myaccount.google.com/apppasswords) for Gmail

### Steps

```bash
# 1. Clone
git clone <this-repo>
cd dartmouth-hugh

# 2. Install dependencies
cd backend
bun install
cd ../frontend
bun install
cd ..

# 3. Create the database
createdb dartmouth_hugh

# 4. Configure backend
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, GOOGLE_CLIENT_ID, GMAIL_USER, GMAIL_APP_PASSWORD, FRONTEND_ORIGIN

# 5. Apply Prisma migrations
cd backend
bun run db:migrate
cd ..

# 6. Configure frontend
cp frontend/.env.local.example frontend/.env.local
# Fill in NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_API_URL
```

Run the dev servers in separate terminals:

```bash
# Terminal 1
cd backend
bun run dev

# Terminal 2
cd frontend
bun run dev
```

Backend listens on `:4000`, frontend on `:3000`.

## Architecture

- **Frontend**: Next.js 15 (App Router) + TypeScript, statically exported.
- **Backend**: Bun + Express + TypeScript, single instance. Layered like `xrds-signout-backend` (`app.ts` / `config.ts` / `database.ts` / `routes.ts` + `controllers/` + `middleware/` + `services/`).
- **Database**: Postgres via **Prisma**. Schema in `backend/prisma/schema.prisma`; migrations under `backend/prisma/migrations/`.
- **Auth**: in-memory only — Google ID token sent as `Authorization: Bearer` on every request, verified server-side, and restricted to verified `@dartmouth.edu` accounts. No cookies, no sessions.
- **Scheduler**: `node-cron` jobs at 07:00 / 11:00 / 17:00 ET fetch the menu and send one email per meal with subscribers in BCC.

## Learning Journey

_To be filled in during/after the build._

## Technical Rationale

_To be filled in during/after the build._

## AI Usage

_To be filled in during/after the build._
