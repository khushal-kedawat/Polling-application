# Pollit

**Polling, made elegant.** A full-stack platform for building single-choice polls, sharing them via public link, and watching responses arrive in real time.

> 🔗 **Live demo:** [pollit-v2fa.onrender.com](https://pollit-v2fa.onrender.com)
> 📦 **Repository:** [khushal-kedawat/Polling-application](https://github.com/khushal-kedawat/Polling-application)

---

## Highlights

- 🔐 **Auth-gated creation, public responses.** JWT-protected dashboard for creators; anonymous or authenticated response modes per poll.
- ⚡ **Real-time analytics.** Every submission streams to the creator dashboard over Socket.io rooms — no polling, no refresh.
- ⏳ **Auto-expiry.** Polls close at a creator-set deadline; late submissions return `410 Gone` server-side.
- 📢 **Publish results.** One click flips the public link from a response form to a final report — bar charts and counts visible to anyone.
- 🧪 **Validation, both sides.** Required questions enforced by Zod on the client and the server. Unique partial indexes prevent double-submits.
- 🐳 **Local Postgres in Docker.** One-command database setup for development.

---

## Tech Stack

| Layer | Tools |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn-style primitives (Radix UI), React Hook Form + Zod, Recharts, Socket.io Client |
| **Backend** | Node.js (ESM), Express, Socket.io, Drizzle ORM, JWT, bcryptjs |
| **Database** | PostgreSQL 16 |
| **Tooling** | Drizzle Kit (migrations), Docker Compose, concurrently |
| **Deployment** | Render (web service + managed Postgres) |

---

## Architecture

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│   React SPA (Vite)      │  HTTP   │   Express + Socket.io        │
│   - Auth context        │ ──────► │   - /api/auth                │
│   - React Router        │         │   - /api/polls (protected)   │
│   - Live poll UI        │   WS    │   - /api/p/:slug (public)    │
│                         │ ◄─────► │   - /socket.io (live updates)│
└─────────────────────────┘         └─────────────┬────────────────┘
                                                  │ Drizzle ORM
                                                  ▼
                                       ┌──────────────────────┐
                                       │   PostgreSQL         │
                                       │   users · polls      │
                                       │   questions · options│
                                       │   responses · answers│
                                       └──────────────────────┘
```

In **production**, Express serves the built React bundle from the same origin — one URL, zero CORS, WebSockets on the same host.

---

## Quick Start

### Prerequisites

- **Node.js ≥ 20**
- **Docker** + **Docker Compose** (Postgres runs in a container)
- **npm**

### Setup

```bash
# 1. Install all workspaces
npm run install:all

# 2. Create env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Start Postgres
npm run db:up

# 4. Generate + apply migrations
npm run db:generate
npm run db:migrate

# 5. Run dev (API on :4000, client on :5173)
npm run dev
```

Open [localhost:5173](http://localhost:5173).

### Postgres helpers

| Script | What it does |
|---|---|
| `npm run db:up` | Start Postgres container |
| `npm run db:down` | Stop container (data preserved) |
| `npm run db:logs` | Tail container logs |
| `npm run db:reset` | Stop, wipe volume, restart fresh |

Default DB credentials (mapped to host port `5433` to avoid clashes):

```
postgres://postgres:postgres@localhost:5433/polling
```

---

## Project Structure

```
polling-app/
├── client/                       # Vite + React SPA
│   ├── src/
│   │   ├── components/           # UI primitives + composite components
│   │   ├── pages/                # Route-level components
│   │   ├── context/              # AuthContext
│   │   ├── hooks/                # useAuth, usePollSocket
│   │   └── lib/                  # api, socket, validators
│   └── tailwind.config.js
├── server/                       # Express API + Socket.io
│   ├── src/
│   │   ├── db/                   # Drizzle schema + migrations runner
│   │   ├── routes/               # Express routers
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/           # auth, validation, error handler
│   │   ├── validators/           # Zod schemas
│   │   ├── services/             # analytics aggregation
│   │   ├── sockets/              # Socket.io setup
│   │   └── utils/                # jwt, bcrypt, slug
│   └── drizzle/                  # Generated SQL migrations
├── docker-compose.yml            # Postgres container
├── render.yaml                   # Render Blueprint
└── package.json                  # Root scripts (concurrently)
```

---

## Environment Variables

### `server/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Postgres connection string |
| `JWT_SECRET` | ✅ | — | Long random string for HS256 signing |
| `PORT` | — | `4000` | API port |
| `CLIENT_ORIGIN` | — | `http://localhost:5173` | CORS origin |
| `DATABASE_SSL` | — | — | Set `true` for hosted Postgres (Render, Neon, etc.) |
| `AUTO_MIGRATE` | — | — | When `true` *and* `NODE_ENV=production`, runs migrations on boot |
| `NODE_ENV` | — | — | `production` triggers static serving + auto-migrate |

### `client/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_URL` | — | same-origin | Override only if API is on a different host |
| `VITE_SOCKET_URL` | — | same-origin | Override only if Socket.io is on a different host |

---

## API Reference

All endpoints live under `/api`. Errors return `{ error, code?, details? }`.

### Auth

| Method | Path | Auth | Body |
|---|---|---|---|
| `POST` | `/auth/register` | — | `{ name, email, password }` → `{ user, token }` |
| `POST` | `/auth/login` | — | `{ email, password }` → `{ user, token }` |
| `GET`  | `/auth/me` | Bearer | → `{ user }` |

### Creator routes *(Bearer token required)*

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/polls` | List the caller's polls |
| `POST`   | `/polls` | Create poll with nested questions and options |
| `GET`    | `/polls/:id` | Full poll detail (creator view) |
| `PATCH`  | `/polls/:id` | Update title / description / expiry / mode |
| `DELETE` | `/polls/:id` | Delete poll + cascade |
| `POST`   | `/polls/:id/publish` | Make results public |
| `GET`    | `/polls/:id/analytics` | Aggregated counts |

### Public routes

| Method | Path | Behavior |
|---|---|---|
| `GET`  | `/p/:slug` | Returns poll + `state` (`open` / `expired` / `published`). Includes analytics when published. |
| `POST` | `/p/:slug/responses` | `{ respondentToken?, answers: [{questionId, selectedOptionId?}] }` |

---

## Database Schema

See [server/src/db/schema.js](server/src/db/schema.js).

| Table | Purpose |
|---|---|
| `users` | Account records (email, bcrypt hash) |
| `polls` | Poll metadata + `share_slug`, `expires_at`, `response_mode`, `is_published` |
| `questions` | Belongs to poll; `is_required`, `order_index` |
| `options` | Belongs to question; `text`, `order_index` |
| `responses` | One row per submission; nullable `respondent_user_id` or `respondent_token` |
| `answers` | One row per question per submission; nullable `selected_option_id` for skipped optionals |

**Key constraints:**

- Partial unique index on `responses(poll_id, respondent_user_id)` — one response per authenticated user.
- Partial unique index on `responses(poll_id, respondent_token)` — soft dedupe for anonymous responders.
- All foreign keys cascade on delete.

---

## Socket.io Protocol

- **Connect:** Client connects to the server origin with `auth: { token }` (optional, only needed for creator rooms).
- **Join a poll room:** `socket.emit('join_poll', { pollId, asCreator })`. The server verifies the JWT against the poll's `creator_id` if `asCreator` is `true`.

**Server emits:**

| Event | Payload | Triggered by |
|---|---|---|
| `poll:analytics` | `{ pollId, totalResponses, questions: [...] }` | New response submission |
| `poll:published` | `{ pollId }` | Creator clicks **Publish** |

Client emits `leave_poll` on unmount.

---

## Deployment — Render

This repo ships a [`render.yaml`](render.yaml) Blueprint that provisions:

- A **Web Service** running Express (serves API + built SPA on the same origin)
- A managed **Postgres** instance, auto-wired into `DATABASE_URL`

Migrations run automatically on every boot (`AUTO_MIGRATE=true`).

### One-click deploy

1. Push the repo to GitHub.
2. Sign in to [Render](https://dashboard.render.com) → **New** → **Blueprint**.
3. Point it at the GitHub repo → click **Apply**.
4. After the first deploy, copy the service URL and set the `CLIENT_ORIGIN` env var on the web service to that URL → save (~30s redeploy).

### Manual setup

If you'd rather wire it by hand, see the table below.

| Setting | Value |
|---|---|
| Build command | `npm install --prefix server && npm install --prefix client --include=dev && npm run build --prefix client` |
| Start command | `node server/src/server.js` |
| Health check path | `/api/health` |

Required env vars: `NODE_ENV=production`, `AUTO_MIGRATE=true`, `DATABASE_URL`, `DATABASE_SSL=true`, `JWT_SECRET`, `CLIENT_ORIGIN`.

> **Render gotchas**
> - Free web services sleep after 15 min idle (first request takes ~30s to wake).
> - Free Postgres deletes after 90 days — upgrade for longer-lived projects.
> - `--include=dev` in the build command is required because Render sets `NODE_ENV=production`, which would otherwise skip Vite.

---

## Verification (manual E2E)

After running `npm run dev` locally:

1. **Auth** — register two users (A in one browser, B in incognito).
2. **Create** — as A, build a poll with three questions (two required, one optional), 2-minute expiry, **anonymous** mode.
3. **Respond** — open `/p/:slug` in incognito; try submitting with a required question blank → frontend blocks. Answer required ones, skip the optional, submit → success.
4. **Real-time** — keep A's `/dashboard/polls/:id` open; submit another response in a third tab → analytics counter ticks up live.
5. **Auth mode** — create a second poll with **authenticated** mode. Anonymous submit returns `401`. B signs in, submits → success. B resubmits → `409`.
6. **Expiry** — wait past `expires_at` (or use a 30s expiry); submit returns `410`, public page shows "closed".
7. **Publish** — click **Publish** on poll #1 → the public link now renders bar-chart results instead of the form.

---

## Roadmap

Out of scope for this hackathon submission:

- Multi-select / free-text question types
- Email verification + password reset
- In-place question editing after responses exist (current behavior: locked, returns `409`)
- Server-side rate limiting + CAPTCHA

---

## License

MIT. Built for the hackathon.
