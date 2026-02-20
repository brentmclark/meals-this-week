# Meals This Week

Small private family meal-planning app built with Next.js (App Router, JavaScript), Postgres, and Prisma ORM.

## MVP implemented

- Weekly dinner board with per-day `quick` / `normal` flag
- Edit day meal + optional thaw reminder label and lead time
- Meal history search
- Staged meals backlog
- Kitchen display route (`/display`)
- Shared passcode auth (or optional multi-user auth)
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

3. Configure auth (pick one):

Single shared passcode (existing behavior), example with passcode `family-dinner`:

```bash
echo -n 'family-dinner' | shasum -a 256
```

Copy the hash into `FAMILY_PASSCODE_HASH`.

Optional multi-user auth:

```bash
cp auth-users.example.json auth-users.json
```

Then in `.env.local`, set:

```bash
AUTH_USERS_FILE=./auth-users.json
```

Each entry in `auth-users.json` needs a `passcodeHash` (sha256 of that user's passcode), for example:

```bash
echo -n 'alex-passcode' | shasum -a 256
```

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

## Reminder delivery

`POST /api/reminders/run` marks due reminders as sent. In production, call this from a scheduler (Fly machine cron, DO cron, or GitHub Action), send `x-cron-secret`, and add an email provider in that handler.

## Multi-user notes

- If `AUTH_USERS_JSON` or `AUTH_USERS_FILE` is set, login switches to multi-user mode and requires `User` + `Passcode`.
- `User` can be either `login` or `email`.
- On first login, each configured user is upserted into the DB automatically.
- If no multi-user env is set, the app falls back to `FAMILY_PASSCODE_HASH`.
