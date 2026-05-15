# Pollit — Live Polling Platform

Full-stack polling app where users create single-choice polls, share a public link, and watch responses arrive in real time. Built for the hackathon.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, shadcn-style primitives (Radix UI), `react-hook-form` + Zod, Recharts, `socket.io-client`.
- **Backend:** Node.js, Express, Socket.io, Drizzle ORM, PostgreSQL, JWT auth, bcrypt.
- **Language:** JavaScript everywhere (ESM).

## Features

- Email + password auth with JWT (bearer token in `localStorage`).
- Authenticated users can create polls with multiple questions and 2–20 options each, mark any question required/optional, choose response mode (`anonymous` / `authenticated`), and set an `expiresAt` deadline.
- Public shareable link `/p/:slug`. Respondents see a clean form; mandatory questions are validated on **both** frontend and backend; optional ones can be left blank.
- Polls auto-close at `expiresAt` — submissions after the deadline return `410 Gone` and the public page shows a "closed" message.
- **Real-time:** every response triggers a `poll:analytics` broadcast over Socket.io to a `poll:{id}` room. Creator's dashboard updates live; once the creator publishes, the public page also reacts to live updates and `poll:published`.
- One-response-per-user enforced for authenticated mode (DB unique partial index). For anonymous polls, a per-browser nanoid token prevents accidental double-submits.
- **Publish results:** clicking *Publish* sets `is_published = true`; the public link now shows bar-chart results (recharts) instead of the form.
- Analytics REST endpoint and an aggregation service shared with the socket emitter — single source of truth.

## Repo Layout

```
polling-app/
├── client/             # Vite + React SPA
├── server/             # Express API + Socket.io
├── docker-compose.yml  # Postgres container
└── package.json        # root scripts (concurrently)
```

## Prerequisites

- Node.js ≥ 20
- Docker + Docker Compose (Postgres runs in a container)
- npm

## First-time setup

```bash
# 1. Install all workspaces
npm run install:all

# 2. Create envs
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env if you want to change DATABASE_URL / JWT_SECRET
# (defaults in .env.example match the Postgres container below)

# 3. Start Postgres (Docker)
npm run db:up

# 4. Generate + apply Drizzle migrations
npm run db:generate
npm run db:migrate
```

### Postgres (Docker) commands

| Script | Purpose |
|---|---|
| `npm run db:up` | Start Postgres in the background (`docker compose up -d postgres`) |
| `npm run db:down` | Stop Postgres (data preserved in the named volume) |
| `npm run db:logs` | Tail the container logs |
| `npm run db:reset` | Stop, **wipe the volume**, and start fresh — useful when iterating on schema |

Default credentials (set in `docker-compose.yml`):

- host `localhost`, port `5433` (mapped to container's 5432 to avoid clashing with a local Postgres on 5432)
- user `postgres`, password `postgres`, database `polling`
- connection string: `postgres://postgres:postgres@localhost:5433/polling`

## Run dev

```bash
npm run dev
```

- API: http://localhost:4000
- Web: http://localhost:5173
- Socket.io is auto-proxied through Vite during dev.

## Environment Variables

### `server/.env`

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Long random string for HS256 signing |
| `PORT` | API port (default 4000) |
| `CLIENT_ORIGIN` | CORS origin for the frontend (default http://localhost:5173) |
| `DATABASE_SSL` | Set to `true` if your host requires SSL (e.g. Render, Neon) |

### `client/.env`

| Var | Purpose |
|---|---|
| `VITE_API_URL` | Origin of the API (default http://localhost:4000) |
| `VITE_SOCKET_URL` | Origin of the Socket.io server (usually same as API) |

## API Surface

All under `/api`. Errors: `{ error, code?, details? }`.

### Auth
- `POST /auth/register` `{name, email, password}` → `{user, token}`
- `POST /auth/login` `{email, password}` → `{user, token}`
- `GET /auth/me` (Bearer) → `{user}`

### Creator (Bearer token required)
- `GET /polls`
- `POST /polls` — create with nested questions/options
- `GET /polls/:id`
- `PATCH /polls/:id`
- `DELETE /polls/:id`
- `POST /polls/:id/publish`
- `GET /polls/:id/analytics`

### Public
- `GET /p/:slug` — returns poll + `state` (`open` / `expired` / `published`); includes analytics when `published`.
- `POST /p/:slug/responses` `{ respondentToken?, answers: [{questionId, selectedOptionId?}] }`

## Socket.io Protocol

- Client connects to the server origin with optional `auth: { token }`.
- Emits `join_poll` `{pollId, asCreator}`; if `asCreator`, server verifies the JWT matches the poll owner.
- Server emits:
  - `poll:analytics` after each response (broadcast to the room).
  - `poll:published` when the creator publishes.
- Client emits `leave_poll` `{pollId}` on unmount.

## Database Schema

`users`, `polls`, `questions`, `options`, `responses`, `answers`. See [server/src/db/schema.js](server/src/db/schema.js).

- One response = one row in `responses` (a submission), plus N rows in `answers` (one per question, including skipped optionals as a row with `selected_option_id = NULL`).
- Partial unique indexes on `responses(poll_id, respondent_user_id)` and `(poll_id, respondent_token)` enforce single-submit per identity.

## Validation Rules

- Poll: ≥1 question, each question ≥2 options.
- `expiresAt`: must be in the future at creation time.
- Required questions: backend rejects submissions with `code: REQUIRED_MISSING` if missing.
- Authenticated-only polls: anonymous attempts return `401`.

## Deployment — Render (one-click via Blueprint)

This repo ships a [`render.yaml`](render.yaml) Blueprint that provisions:

- A **Web Service** running Express (serves both `/api/*` and the built React SPA — single origin, no CORS to manage)
- A managed **Postgres** database, auto-wired into `DATABASE_URL`

Migrations run automatically on every deploy (`AUTO_MIGRATE=true` in [server.js](server/src/server.js)).

### One-click deploy

1. Push this repo to a public GitHub repository.
2. Sign in at [dashboard.render.com](https://dashboard.render.com).
3. Click **New → Blueprint** and point it at your GitHub repo. Render will read `render.yaml` and propose the service + database.
4. Click **Apply**. The first build takes ~3–4 minutes (installs deps for both packages, builds the client bundle, then starts the server).
5. After the first deploy succeeds, open the service in Render, copy its URL (e.g. `https://pollit.onrender.com`), and set the `CLIENT_ORIGIN` env var on the web service to that exact URL. Click **Save changes** → triggers a quick redeploy.
6. Visit the URL — register an account, create a poll, share the `/p/:slug` link.

### Manual setup (if you skip the blueprint)

If you'd rather create resources by hand:

- **Postgres** — Render → New → PostgreSQL (free plan). Note the *Internal Database URL*.
- **Web Service** — Render → New → Web Service, point at the repo.
  - Build command: `npm install --prefix server && npm install --prefix client --include=dev && npm run build --prefix client` *(— `--include=dev` is needed because Render sets `NODE_ENV=production` during build, which would otherwise skip Vite)*
  - Start command: `node server/src/server.js`
  - Health check path: `/api/health`
  - Environment variables:
    | Var | Value |
    |---|---|
    | `NODE_ENV` | `production` |
    | `AUTO_MIGRATE` | `true` |
    | `DATABASE_URL` | *Internal Database URL* from your Postgres |
    | `DATABASE_SSL` | `true` |
    | `JWT_SECRET` | Any long random string |
    | `CLIENT_ORIGIN` | The service URL (set after first deploy) |

### How the unified deploy works

In production (`NODE_ENV=production`), Express serves [client/dist](client/) as static assets and falls back to `index.html` for any non-`/api/*` route — that handles React Router client-side routes (`/dashboard`, `/p/:slug`, …). The frontend hits `/api/*` and `/socket.io/*` on the same origin, so no `VITE_API_URL` / `VITE_SOCKET_URL` need to be set at build time.

### Render gotchas

- **Free Web Services sleep after 15 min of inactivity.** First request after sleep takes ~30s to spin up. Upgrade to a paid plan to keep it always-on.
- **Free Postgres expires after 90 days** and is deleted. For longer-lived submissions, upgrade or migrate data periodically.
- WebSockets work out of the box on Render web services — no extra config.

### Other platforms

- **Railway / Fly.io** — same unified-server shape works. Use the same build/start commands; set `NODE_ENV=production`, `AUTO_MIGRATE=true`, `DATABASE_URL`, `JWT_SECRET`. Set `DATABASE_SSL` based on the provider.
- **Vercel (FE) + Render (BE+DB)** — drop the unified server, build the client with `VITE_API_URL` / `VITE_SOCKET_URL` pointed at the Render backend URL, and set `CLIENT_ORIGIN` on the backend to the Vercel URL.

## Verification (manual E2E)

1. Register user A and (in another browser) user B.
2. As A, create a poll with 3 questions (Q1, Q2 required, Q3 optional), 2-minute expiry, **anonymous** mode.
3. Open `/p/:slug` in incognito and attempt to submit with Q1 blank — frontend blocks and backend would reject too.
4. Answer Q1, Q2, skip Q3, submit — success.
5. Open A's poll detail page; submit another anonymous response in a third tab — analytics tick up live.
6. Create a 2nd poll with **authenticated** mode; anonymous submit returns 401; B submits successfully; B submitting again returns 409.
7. Wait past `expiresAt` (or use a 30-second expiry) — public submit returns 410 and the page shows "closed".
8. Click **Publish** on poll #1 → the public link now renders the bar-chart results page.

## Out of Scope (known)

- Multi-select / free-text answers (spec is single-choice only).
- Email verification / password reset.
- Once a response exists, questions/options are immutable (PATCH-poll returns 409). Title/description/expiry/mode are editable.
- No application-level rate limiting — for production add an Express rate limiter and CAPTCHA.

## License

MIT — see this file's header in each source file for attribution. Hackathon submission.
