# Architecture Overview

## How scheduling works

There are no cron jobs anywhere in this system. Scheduling works entirely through **BullMQ delayed jobs**, backed by Redis:

1. When an email is scheduled (via the Compose form or API), a row is created in Postgres first, with `status: "scheduled"`. Postgres is the single source of truth for what needs to be sent.
2. A BullMQ job is added to the `email-queue` with a `delay` (in milliseconds) equal to the time between now and the desired send time, and a **deterministic `jobId`** equal to the email's own database ID.
3. Redis tracks the delay internally — no in-process timer (`setTimeout`, `setInterval`) is used anywhere. The Worker is simply notified by Redis when a job's delay has expired.
4. The Worker fetches the *latest* version of the email from Postgres (not from the job payload) before sending, so if the email were edited after scheduling, the most current data is always used.

## How persistence on restart is handled

This is the core non-negotiable requirement, and it's handled two ways:

1. **Redis persistence**: the Docker Redis container runs with `--appendonly yes`, which enables Redis's AOF (Append Only File) persistence mode. This means all queued/delayed jobs are written to disk, not just kept in memory — if the Redis container (or the whole machine) restarts, every job's data and remaining delay survives.
2. **Idempotency via deterministic job IDs**: every scheduled email uses its own database ID as the BullMQ `jobId`. BullMQ will not create a duplicate job with an ID that already exists, so even if a schedule request were retried, the same email can never be double-queued or sent twice.

This was manually verified: an email was scheduled, the Worker process was killed mid-wait (before its delay expired), then restarted — the email still sent at the correct original time, with no duplicate and no data loss.

## How rate limiting & concurrency are implemented

### Per-sender hourly rate limiting (Redis-backed, safe across multiple worker instances)

- Each sender has a configurable `maxEmailsPerHour` field in Postgres.
- Before sending, the Worker atomically increments a Redis counter keyed by `rate:<senderId>:<current-hour-window>` using Redis's `INCR` command. `INCR` is atomic at the Redis level, so even multiple concurrent workers incrementing the same counter simultaneously can never race or double-count.
- The key includes the current hour (e.g. `2026-08-30T14`) in its name, so counters naturally "reset" every hour — no manual reset logic needed. Keys expire automatically after 2 hours via `EXPIRE`, so old counters don't accumulate forever.
- If sending would exceed the sender's limit, the email is **not** dropped or marked as failed — instead, a new delayed job is queued to retry at the start of the next hour window, and the email's status remains `"scheduled"`.

### Minimum delay between sends

Enforced via BullMQ's built-in `limiter` option on the Worker (`{ max: 1, duration: MIN_DELAY_MS }`), configurable via the `MIN_DELAY_MS` environment variable (default: 2000ms / 2 seconds between sends, globally across the queue).

### Worker concurrency

Configurable via the `WORKER_CONCURRENCY` environment variable, passed directly to BullMQ's `Worker` constructor. Default: 5 concurrent jobs.

### Slack notification on rate-limit hit

- Real Slack OAuth (`chat:write` scope) — a "Connect Slack" button triggers an actual OAuth authorize flow; the resulting bot token is stored per-sender in Postgres.
- The moment a sender's hourly limit is hit, the Worker calls Slack's `chat.postMessage` API directly with that sender's stored token — this is a live API call, not a log line.
- If a sender hasn't connected Slack, the notification step is silently skipped (checked via a null token) — no crash, no blocking of the actual email-scheduling logic.

## Behavior under load (1000+ emails scenario)

The `/schedule-batch` endpoint accepts an array of recipients in one request and creates one Email row + one delayed BullMQ job per recipient, staggering each recipient's `scheduledTime` by the configured delay. Combined with the rate limiter and concurrency settings above, this means: even if 1000 emails were scheduled for the same moment, BullMQ + the Worker's concurrency cap ensure they're processed at a controlled rate, and any that would breach a sender's hourly cap are automatically deferred to the next hour rather than failing.

## Why the Worker runs inside the same process as the API in production

Render's free tier only supports web services, not standalone background workers. To keep hosting free, the BullMQ Worker is started in-process alongside the Express API (`import "./workers/emailWorker"` inside `index.ts`), rather than as a separate deployed service. Locally, both can still be run as separate processes (`npm run dev` for the API, `npm run worker` for the worker) if preferred — the worker logic itself is unchanged either way.
