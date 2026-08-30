# ReachInbox Scheduler

A production-grade email scheduler service + dashboard, built for the ReachInbox Software Development Intern assignment. Schedules emails for future delivery using BullMQ delayed jobs (no cron), enforces per-sender hourly rate limits with Redis-backed atomic counters, survives server restarts without losing or duplicating jobs, and notifies a connected Slack workspace live when a rate limit is hit.

**Live demo:** https://reachinbox-kohl-alpha.vercel.app
**Backend API:** https://reachinbox-backend-vy4q.onrender.com

> Note: the hosted backend is on Render's free tier, which sleeps after ~15 minutes of inactivity. The first request after a period of idle time may take 30–60 seconds to respond while it wakes up. This does not happen on the local setup.

📄 **More detail:**
- [Architecture Overview](./ARCHITECTURE.md) — how scheduling, persistence, rate limiting, and concurrency actually work under the hood
- [Features Implemented](./FEATURES.md) — full backend + frontend checklist
- [Assumptions, Shortcuts & Trade-offs](./TRADEOFFS.md) — honest notes on what was simplified and why

---

## Tech Stack

**Backend:** TypeScript, Express.js, BullMQ, Redis, PostgreSQL (Prisma ORM), Nodemailer (Ethereal SMTP), Elasticsearch (local only), Slack OAuth, Bull Board

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, NextAuth.js (Google OAuth)

**Infra:** Docker Compose (local Postgres + Redis + Elasticsearch)

**Hosting (free tier):** Vercel (frontend), Render (backend + worker, merged into a single process), Neon (Postgres), Upstash (Redis)

---

## Running Locally

### Prerequisites
- Node.js 18+
- Docker Desktop
- A Slack workspace + Slack App (only needed if testing Slack notifications)
- A Google Cloud OAuth client (only needed if testing Google login)

### 1. Clone and start infrastructure

```bash
git clone <this-repo-url>
cd reachinbox-scheduler
docker compose up -d
```

This starts Postgres and Redis in Docker, both with persistent volumes so data survives container restarts. (Elasticsearch is optional locally — see `docker-compose.yml`; add it back if you want real local full-text search.)

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=4000
DATABASE_URL="postgresql://reachinbox:reachinbox_pass@localhost:5432/reachinbox?schema=public"
REDIS_URL=redis://localhost:6379

# Ethereal Email (fake SMTP for testing) — see setup instructions below
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASS=your_ethereal_password

# Slack OAuth (optional — only needed to test Slack notifications)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:4000/slack/oauth/callback

# Rate limiting / concurrency (all configurable, no hardcoding)
MIN_DELAY_MS=2000
WORKER_CONCURRENCY=5

# Optional — omit this entirely to fall back to Postgres-based search
ELASTICSEARCH_URL=http://localhost:9200
```

Run migrations and start the server:

```bash
npx prisma migrate dev
npm run dev
```

This single command starts **both** the Express API and the BullMQ worker (they run in the same process — see [Architecture Overview]([./ARCHITECTURE.md](https://github.com/harini08k/reachinbox/blob/main/ARCHITECTURE.md)) for why). You should see:

```
Email worker started, waiting for jobs...
Server running on http://localhost:4000
```

### 3. Seed test senders

The app needs at least one `Sender` row to schedule emails against. Open Prisma Studio and create a couple of rows manually:

```bash
npx prisma studio
```

In the `Sender` table, add rows like:
- `name: "Your Name", email: "you@example.com", maxEmailsPerHour: 200`

### 4. Setting up Ethereal Email

Ethereal is a free, fake SMTP service for testing — emails never actually deliver anywhere, but you get a shareable preview link showing exactly what was "sent."

1. Go to https://ethereal.email/create
2. Click to generate a new test account (no signup required)
3. Copy the generated **email** and **password** into `ETHEREAL_USER` / `ETHEREAL_PASS` in your `.env`
4. Host/port are already set correctly above (`smtp.ethereal.email`, `587`)

Every email the worker sends will log a `Preview URL` in the terminal — open it to see the rendered email.

### 5. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=any_random_string
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For Google OAuth: create a project at https://console.cloud.google.com, configure the OAuth consent screen, and create an OAuth Client ID (Web application) with redirect URI `http://localhost:3000/api/auth/callback/google`.

Start the frontend:

```bash
npm run dev
```

Visit `http://localhost:3000/login`.

### 6. (Optional) Bull Board — live queue dashboard

Once the backend is running, visit:

```
http://localhost:4000/admin/queues
```

Shows real-time job status (waiting, active, delayed, completed, failed) for the email queue.

---

## Repo Structure

```
reachinbox-scheduler/
├── backend/           # Express API + BullMQ worker (single process)
├── frontend/          # Next.js dashboard
├── docker-compose.yml # Local Postgres + Redis
└── docs/
    ├── ARCHITECTURE.md
    ├── FEATURES.md
    └── TRADEOFFS.md
```


---

Built as a submission for the ReachInbox / Outbox Labs Software Development Intern assessment.
