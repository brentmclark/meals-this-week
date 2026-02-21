# Meals This Week

Small private family meal-planning app built with Next.js (App Router, JavaScript), Postgres, and Prisma ORM.

## MVP implemented

- Weekly dinner board with per-day `quick` / `normal` flag
- Edit day meal + optional thaw reminder label and lead time
- Meal history search
- Staged meals backlog
- Kitchen display route (`/display`)
- Self-serve signup + login (email or username)
- Family management with manager/member roles and invites
- Email verification + password reset flows
- Rate limiting + account lockout for auth endpoints
- Reminder rows generated from day-level thaw reminder settings

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Configure auth:

Default behavior is DB-backed auth with self-serve signup on `/login`.
Set `APP_BASE_URL` to your app URL for verification/reset/invite links.

Optional legacy fallback (if you still want it): either `FAMILY_PASSCODE_HASH` or `AUTH_USERS_FILE` / `AUTH_USERS_JSON`.

4. Generate Prisma client and apply schema:

```bash
npm run db:generate
npm run db:migrate
```

5. Start dev server:

```bash
npm run dev
```

## Key routes

- `/` weekly planner
- `/day/:date` edit one day
- `/history` meal history
- `/staged` staged meals
- `/display` large kitchen view
- `/family` household members + invites
- `/verify-email` email verification landing
- `/reset-password` password reset landing

## Reminder delivery

`POST /api/reminders/run` marks due reminders as sent. In production, call this from a scheduler (Fly machine cron, DO cron, or GitHub Action), send `x-cron-secret`, and add an email provider in that handler.

## Fly + PlanetScale deploy

Use the interactive setup script to create/verify the Fly app, prompt for required values, set secrets, and deploy:

```bash
./scripts/setup-fly-planetscale.sh
```

The script will prompt for:

- Fly app name / org / region
- `DATABASE_URL` (PlanetScale Postgres connection string)
- App passcode (it hashes this into `FAMILY_PASSCODE_HASH`)
- `SESSION_SECRET`, `CRON_SECRET` (or auto-generate)
- Default household/user values

## Auth notes

- `/login` supports account creation directly in the app.
- Login identifier accepts either `email` or `username`.
- First local account created becomes `manager`; later local accounts default to `member`.
- Legacy auth (`AUTH_USERS_*` or `FAMILY_PASSCODE_HASH`) is still supported as fallback for compatibility.
- Managers can invite additional family accounts (parents/kids) into the same household.
- Invitees can sign up independently and join via invite token.
- Existing users can accept an invite after login from `/family`.
