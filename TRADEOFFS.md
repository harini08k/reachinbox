# Assumptions, Shortcuts & Trade-offs

- **Auth is intentionally simplified for this assignment's scope.** There's no full multi-user account system tying a logged-in Google user to a specific `Sender` record — the sidebar shows the real logged-in Google identity, but the sender used for sending/rate-limiting is selected from a small hardcoded dropdown (two test senders). A production version would map each authenticated user to their own sender identity.

- **Rich text editor** uses the browser's built-in `contentEditable` + `document.execCommand()` rather than a dedicated library (e.g. TipTap). This is a deprecated browser API; it works reliably for the formatting options shown, but a production app would use a maintained rich-text library instead.

- **Elasticsearch is local-only.** Hosting a free, permanent Elasticsearch instance proved impractical within the time available (Bonsai's signup flow no longer surfaced a free tier at the time of building this; other options are trial-based, not permanent). The hosted deployment automatically falls back to a Postgres `ILIKE`-based search (see `emailIndexer.ts` / the `/search-emails` route) when `ELASTICSEARCH_URL` is unset. Locally, real Elasticsearch indexing and fuzzy multi-field search is fully implemented and demoed in the video.

- **Slack OAuth is fully functional in local development** — real authorize flow, real token storage, real `chat.postMessage` delivery, verified in the demo video (including finding and fixing a real `not_in_channel` bug along the way). On the hosted deployment, the Slack app is configured as a single-workspace app (not distributed), and the free-tier hosting stack (Render + Upstash) occasionally surfaces `ECONNRESET` during the OAuth callback — this doesn't affect core email scheduling, rate limiting, or persistence, all of which are verified working on the hosted version.

- **Render's free tier** only supports web services, not standalone background workers, so the BullMQ Worker is started in-process alongside the Express API rather than as a separate deployed service. Locally, both can still be run as separate processes if preferred.

- **Render's free tier sleeps after ~15 minutes of inactivity**, causing a 30–60 second cold-start delay on the first request after idle time. This is a hosting-tier characteristic, not an application bug.

- **CSV upload** for bulk recipients expects a simple two-column format (`email,name` per row, no header row assumed) — parsed client-side with PapaParse.
