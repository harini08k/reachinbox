# Features Implemented

## Backend

- [x] TypeScript + Express.js API
- [x] BullMQ delayed jobs (no cron, no in-process timers)
- [x] PostgreSQL via Prisma ORM, with migrations
- [x] Real SMTP sending via Ethereal (Nodemailer)
- [x] Restart-safety (verified manually — see [ARCHITECTURE.md](./ARCHITECTURE.md))
- [x] Idempotency (deterministic job IDs, no duplicate sends)
- [x] Configurable Worker concurrency
- [x] Configurable minimum delay between sends (BullMQ limiter)
- [x] Per-sender hourly rate limiting (Redis atomic counters, safe across workers)
- [x] Auto-reschedule to next hour window on rate-limit hit (no drops, no permanent failures)
- [x] Real Slack OAuth + live `chat.postMessage` notification on rate-limit hit
- [x] Graceful no-op when a sender hasn't connected Slack
- [x] Live BullMQ dashboard (Bull Board) at `/admin/queues`
- [x] Full-text search via Elasticsearch (local dev), with automatic fallback to a Postgres `ILIKE`-based search when `ELASTICSEARCH_URL` isn't configured (used in the hosted deployment)
- [x] File attachments — base64-encoded client-side, stored as JSON on the Email row, decoded and attached via Nodemailer on send, downloadable from the email detail view

## Frontend

- [x] Real Google OAuth login (NextAuth.js) — redirects to dashboard on success
- [x] Dashboard: sidebar with live session data (name/email/avatar), Scheduled/Sent tabs with live counts pulled from the API
- [x] Compose modal: multiple recipients (typed chips + CSV upload), subject, rich text body (bold/italic/underline/lists/quote/strikethrough), configurable delay-between-emails and hourly-limit fields (wired directly to the real backend rate-limiter), file attachments, "Send Later" with quick-pick times and a custom date/time picker, sender dropdown
- [x] Scheduled / Sent list views with status badges, loading states, empty states
- [x] Email detail view (click any row) — sender info, timestamp, full body, downloadable attachments
- [x] Live search bar wired to the backend search endpoint
- [x] Slack "Connect" button — triggers the real OAuth authorize flow
