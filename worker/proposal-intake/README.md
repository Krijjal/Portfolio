# Proposal Intake Worker

Receives submissions from the portfolio's "Start a Project" form and forwards
them to Telegram. Deployed separately from the portfolio site itself because
the site is a static export (GitHub Pages) with no server of its own.

This worker never generates a contract or PDF — it only validates, rate-limits,
and relays. Actual proposal generation stays entirely inside
`telegram-codex-bot`, reviewed by a human before anything is sent to a client.

## The bridge into the bot (no bot.js changes needed)

`telegram-codex-bot`'s contract wizard (`src/contractWizard.js`) only ever
takes one free-text "brief" message and regex-scans it for client name,
project type, timeline, etc. (`analyzeBrief`/`submitBrief`) — it doesn't care
where that text came from. So the Telegram message this worker sends is
deliberately formatted to double as a valid brief:

1. You receive the "NEW WEB LEAD" message in Telegram (from your own bot).
2. Reply `/contract` to the bot.
3. Paste the entire lead message back as your next message.

The wizard's regexes only look for specific keywords (`client:`, `timeline:`,
`website`, `branding`, etc.) — the extra metadata lines (budget, referral, IP,
timestamp) are harmless noise to its parser, so there's no need to trim
anything before pasting. Verified against every pattern in
`detectModules`/`detectFactors`/`extractClientName`/`detectTimeline`.

The bot only responds to your own Telegram user ID (`AUTHORIZED_USER_ID` in
its `.env`), so nothing about this bridge changes who can actually drive the
wizard — a lead notification landing in your chat is not the same as anyone
being able to trigger contract generation.

## One-time setup

```bash
cd worker/proposal-intake
npm install
npx wrangler login
```

Create the KV namespace used for per-IP rate limiting:

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

Copy the `id` it prints into `wrangler.toml` under `[[kv_namespaces]]`.

Set the secrets (never commit these — they're stored encrypted by Cloudflare, not in this repo):

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
# optional, only if you set up Cloudflare Turnstile:
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Update `ALLOWED_ORIGIN` in `wrangler.toml` to your real deployed domain (comma-separate multiple origins if needed, e.g. a custom domain plus the github.io URL).

## Deploy

```bash
npm run deploy
```

Wrangler prints the worker's URL (`https://kr-proposal-intake.<your-subdomain>.workers.dev`). Put that URL into the portfolio site's `src/data/site.js` as `proposalEndpoint`.

## What it protects against

- **Origin allowlist** — only requests from your configured domain are accepted; everything else gets a 403 before any processing.
- **Honeypot field** — a hidden `website` field real visitors never fill in; bots that auto-fill every field trip it and get a silent fake-success.
- **Timing trap** — rejects submissions completed in under 3 seconds (faster than a human can plausibly fill the form). Time on page is measured by the page itself (`elapsedMs`, a monotonic clock), so a visitor whose system clock is wrong is never mistaken for a bot. `loadedAt` is accepted only as a fallback for pages built before `elapsedMs` existed.
- **Per-IP rate limiting** — 3 submissions/hour/IP via Cloudflare KV.
- **Payload size cap** — rejects bodies over 20KB before parsing.
- **Field allowlisting + length caps** — every field is clipped to a max length; the service/integration checkboxes and budget are validated against fixed lists, anything else is dropped or falls back to a safe default. Fields are validated before the rate limit is counted, so fixing a typo doesn't burn an hourly slot.
- **Plain-text Telegram delivery** — messages are sent with no `parse_mode`, so nothing a visitor types can inject Telegram Markdown/HTML formatting.
- **Optional Cloudflare Turnstile** — wire in a site key on the form + secret key here for CAPTCHA-grade bot defense if spam becomes a real problem; the worker works without it (defenses above are the baseline, not a fallback).
- **No secrets ever reach the browser** — the bot token and chat ID exist only as Worker secrets, never in the site's client-side bundle.

## Delivery and failure handling

- **Long briefs** are split on line boundaries into numbered messages (`(1/2)`, `(2/2)`), each under Telegram's 4096-character limit. Paste all parts, in order, after `/contract`.
- **Telegram down or misconfigured** (revoked token, wrong chat ID, outage): the lead is parked in KV for 30 days instead of being lost, and the visitor still sees a success message. List and read parked leads with:

  ```bash
  npx wrangler kv key list --binding RATE_LIMIT_KV --prefix lead:
  npx wrangler kv key get --binding RATE_LIMIT_KV "lead:<key>"
  ```

- **Logs**: every drop (honeypot, too fast), rejection (invalid input, Turnstile, rate limit), delivery and failure is logged as one JSON line. `[observability]` is enabled in `wrangler.toml`, so they appear in the Cloudflare dashboard under Workers Logs, or live with `npx wrangler tail`.
- **Deploy order**: the site sends both `elapsedMs` and `loadedAt`, so the site and the worker can be deployed in either order. Redeploy the worker with `npm run deploy` after changing `src/index.js`.

## Known limitation

Rate limiting uses Cloudflare KV, which is eventually consistent across
regions — a determined attacker distributing requests across many edge
locations could exceed the nominal 3/hour/IP limit by a small margin. This is
an accepted tradeoff for a free, zero-maintenance lead form; if this ever
becomes a real target, upgrade the limiter to Durable Objects (still free tier
at this volume) for strict consistency.
