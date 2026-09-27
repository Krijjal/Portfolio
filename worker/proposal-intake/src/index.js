// Cloudflare Worker: receives the portfolio site's "Start a Project" form
// submissions, validates and rate-limits them, then forwards a plain-text
// summary to Telegram. This is intentionally a thin, stateless intake layer —
// it never generates a contract or PDF. All actual proposal generation stays
// in the telegram-codex-bot pipeline, reviewed by a human before anything
// goes out. See worker/proposal-intake/README.md for deployment steps.

const MAX_FIELD_LENGTHS = {
  name: 120,
  email: 254,
  company: 120,
  description: 4000,
  timeline: 120,
  referral: 200,
  notes: 2000,
};

const ALLOWED_BUDGETS = ["<2k", "2k-5k", "5k-10k", "10k-25k", "25k+", "not-sure"];
const MAX_MULTISELECT = 10;

// Phrases chosen to hit the contract wizard's own keyword regexes
// (detectModules/detectFactors in telegram-codex-bot/src/contractWizard.js)
// so a checked box reliably lands in the right scope bucket, instead of
// hoping a visitor's free text happens to use the right words.
const SERVICE_LABELS = {
  website: "Website design and development.",
  branding: "Branding and logo design (brand identity).",
  content: "Content writing and copywriting.",
  seo: "SEO and on-page optimization.",
  maintenance: "Ongoing maintenance and support.",
  ads: "Paid ads setup and management (Google/Meta ads).",
};

const INTEGRATION_LABELS = {
  booking: "Booking system integration.",
  payments: "Payment/checkout integration (Stripe/PayPal).",
  crm: "CRM integration.",
  api: "API integration.",
  ecommerce: "E-commerce / online store functionality.",
  dashboard: "Custom dashboard or portal.",
};

function sanitizeMultiselect(value, allowedLabels) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const key = String(item ?? "");
    if (allowedLabels[key] && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
    if (result.length >= MAX_MULTISELECT) break;
  }
  return result;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const MIN_FILL_TIME_MS = 3000;
const MAX_BODY_BYTES = 20_000;

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "x-content-type-options": "nosniff",
      ...corsHeaders(origin),
    },
  });
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveOrigin(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = allowedOrigins(env);
  return allowed.includes(origin) ? origin : allowed[0] || "null";
}

function clip(value, max) {
  return String(value ?? "").slice(0, max);
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function verifyTurnstile(token, secret, ip) {
  if (!secret) return true; // Turnstile is an optional extra layer, not the baseline defense.
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!res.ok) return false;
  const outcome = await res.json();
  return outcome.success === true;
}

async function checkRateLimit(kv, ip) {
  if (!kv) return true; // fail open only if KV isn't bound — deploy should always bind it.
  const key = `rl:${ip}`;
  const now = Date.now();
  const record = await kv.get(key, "json");

  if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
    await kv.put(key, JSON.stringify({ start: now, count: 1 }), {
      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;

  await kv.put(key, JSON.stringify({ start: record.start, count: record.count + 1 }), {
    expirationTtl: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.start)) / 1000),
  });
  return true;
}

// Builds a message that is BOTH the human-readable lead notification AND,
// pasted as-is into the bot after /contract, a valid brief for its wizard.
// The wizard (contractWizard.js: analyzeBrief/submitBrief) only regex-scans
// free text for keywords like "client:", "timeline:", "website", "branding"
// etc. — it never executes anything, so the extra metadata lines below are
// inert as far as its parser is concerned, verified against every pattern in
// detectModules/detectFactors/extractClientName/detectTimeline. Services and
// integrations are pre-selected checkboxes, not free text, so the wizard's
// scope detection lands correctly regardless of how the visitor phrases the
// description field.
function buildTelegramMessage({
  name,
  company,
  email,
  services,
  integrations,
  bilingual,
  premiumDesign,
  urgent,
  pageCount,
  budget,
  timeline,
  description,
  notes,
  referral,
  ip,
}) {
  const pageCountNum = Number(pageCount);
  const requirementLines = [
    bilingual ? "Bilingual / multilingual content required." : null,
    premiumDesign ? "Premium, high-end custom design direction requested." : null,
    urgent ? "Urgent / rush timeline requested." : null,
  ].filter(Boolean);

  return [
    "NEW WEB LEAD",
    "",
    "TWO SEPARATE steps, do not edit this message to add /contract to it:",
    "1) Send /contract to me as its own message and wait for my reply.",
    "2) THEN copy everything below this line and send it as a new message.",
    "------------------------------------------------",
    `Client: ${company || name}`,
    `Contact: ${name}${company ? ` (${company})` : ""}`,
    `Email: ${email}`,
    "",
    services.length ? "Services requested:" : null,
    ...services.map((key) => `- ${SERVICE_LABELS[key]}`),
    integrations.length ? "\nAlso needs:" : null,
    ...integrations.map((key) => `- ${INTEGRATION_LABELS[key]}`),
    "",
    "Project description:",
    description,
    "",
    ...requirementLines,
    Number.isFinite(pageCountNum) && pageCountNum > 0 ? `Approx. ${pageCountNum} pages.` : null,
    timeline ? `Timeline: ${timeline}.` : null,
    notes ? `Notes: ${notes}.` : null,
    "",
    `Budget range: ${budget}`,
    referral ? `Heard about via: ${referral}` : null,
    `Submitted: ${new Date().toISOString()}`,
    `IP (approx): ${ip}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export default {
  async fetch(request, env) {
    const origin = resolveOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, origin);
    }

    const requestOrigin = request.headers.get("origin") || "";
    if (!allowedOrigins(env).includes(requestOrigin)) {
      return json({ ok: false, error: "forbidden" }, 403, origin);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: "payload_too_large" }, 413, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400, origin);
    }

    // Honeypot: a field real visitors never see or fill in. Bots that fill
    // every field trip this. Report success so scrapers don't learn to skip it.
    if (payload.website) {
      return json({ ok: true }, 200, origin);
    }

    // Timing trap: a human needs at least a few seconds to fill this form out.
    const loadedAt = Number(payload.loadedAt || 0);
    if (!loadedAt || Date.now() - loadedAt < MIN_FILL_TIME_MS) {
      return json({ ok: true }, 200, origin);
    }

    const ip = request.headers.get("cf-connecting-ip") || "unknown";

    const turnstileOk = await verifyTurnstile(payload.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
    if (!turnstileOk) {
      return json({ ok: false, error: "verification_failed" }, 403, origin);
    }

    const withinLimit = await checkRateLimit(env.RATE_LIMIT_KV, ip);
    if (!withinLimit) {
      return json({ ok: false, error: "rate_limited" }, 429, origin);
    }

    const name = clip(payload.name, MAX_FIELD_LENGTHS.name).trim();
    const email = clip(payload.email, MAX_FIELD_LENGTHS.email).trim();
    const company = clip(payload.company, MAX_FIELD_LENGTHS.company).trim();
    const services = sanitizeMultiselect(payload.services, SERVICE_LABELS);
    const integrations = sanitizeMultiselect(payload.integrations, INTEGRATION_LABELS);
    const bilingual = payload.bilingual === true;
    const premiumDesign = payload.premiumDesign === true;
    const urgent = payload.urgent === true;
    const pageCount = clip(payload.pageCount, 6).trim();
    const description = clip(payload.description, MAX_FIELD_LENGTHS.description).trim();
    const timeline = clip(payload.timeline, MAX_FIELD_LENGTHS.timeline).trim();
    const budget = ALLOWED_BUDGETS.includes(payload.budget) ? payload.budget : "not-sure";
    const referral = clip(payload.referral, MAX_FIELD_LENGTHS.referral).trim();
    const notes = clip(payload.notes, MAX_FIELD_LENGTHS.notes).trim();

    if (!name || !isValidEmail(email) || !description || !services.length) {
      return json({ ok: false, error: "invalid_input" }, 400, origin);
    }

    const text = buildTelegramMessage({
      name,
      company,
      email,
      services,
      integrations,
      bilingual,
      premiumDesign,
      urgent,
      pageCount,
      budget,
      timeline,
      description,
      notes,
      referral,
      ip,
    });

    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        // No parse_mode — sent as plain text so nothing a visitor types can
        // break or inject Markdown/HTML formatting in the delivered message.
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      return json({ ok: false, error: "delivery_failed" }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  },
};
