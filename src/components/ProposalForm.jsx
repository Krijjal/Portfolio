"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";

// Keep these value/label pairs in sync with worker/proposal-intake/src/index.js
// (SERVICE_LABELS / INTEGRATION_LABELS) — the worker re-validates server-side
// regardless, but the lists should match so nothing silently gets dropped.
const SERVICES = [
  { value: "website", label: "Website design and development" },
  { value: "branding", label: "Branding / logo design" },
  { value: "content", label: "Content writing / copywriting" },
  { value: "seo", label: "SEO / on-page optimization" },
  { value: "maintenance", label: "Ongoing maintenance and support" },
  { value: "ads", label: "Paid ads setup and management" },
];

const INTEGRATIONS = [
  { value: "booking", label: "Booking system" },
  { value: "payments", label: "Payments / checkout" },
  { value: "crm", label: "CRM integration" },
  { value: "api", label: "API integration" },
  { value: "ecommerce", label: "E-commerce / online store" },
  { value: "dashboard", label: "Custom dashboard or portal" },
];

const BUDGETS = [
  { value: "<2k", label: "Under $2,000" },
  { value: "2k-5k", label: "$2,000 - $5,000" },
  { value: "5k-10k", label: "$5,000 - $10,000" },
  { value: "10k-25k", label: "$10,000 - $25,000" },
  { value: "25k+", label: "$25,000+" },
  { value: "not-sure", label: "Not sure yet" },
];

const LIMITS = { description: 3000, notes: 1000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Order matters: the first invalid field in this list receives focus.
const FIELD_ORDER = ["name", "email", "services", "description", "budget"];

const SERVER_MESSAGES = {
  invalid_input: "Some details didn't come through. Check the highlighted fields and try again.",
  rate_limited: "You've sent a few requests in the last hour. Please wait a little, or reach me directly below.",
  verification_failed: "The spam check didn't pass. Refresh the page and try once more.",
  payload_too_large: "That's a lot of detail. Please shorten the description or notes and resend.",
  delivery_failed: "Your request reached me but couldn't be delivered right now. Please try again in a minute.",
};
const GENERIC_MESSAGE = "Something went wrong sending that. Please try again in a minute.";

const inputBase =
  "mt-1.5 w-full rounded-xl border bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]";
const inputClass = (invalid) =>
  `${inputBase} ${invalid ? "border-[var(--color-danger)]" : "border-[var(--color-border-strong)]"}`;
const labelClass = "block text-sm font-medium text-[var(--color-text)]";
const checkboxRowClass = "flex items-center gap-2.5 text-sm text-[var(--color-text)]";
const checkboxClass = "h-4 w-4 shrink-0";
const errorTextClass = "mt-1.5 text-sm text-[var(--color-danger)]";

function validate(form) {
  const data = new FormData(form);
  const errors = {};
  if (!data.get("name")?.toString().trim()) errors.name = "Enter your name.";
  const email = data.get("email")?.toString().trim() || "";
  if (!email) errors.email = "Enter your email so I can reply.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email, like name@company.com.";
  if (!data.getAll("services").length) errors.services = "Choose at least one service.";
  if (!data.get("description")?.toString().trim()) errors.description = "Tell me a little about the project.";
  if (!data.get("budget")) errors.budget = "Choose a budget range (“Not sure yet” is fine).";
  return errors;
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className={errorTextClass}>
      {message}
    </p>
  );
}

function CheckboxGroup({ legend, name, options, error }) {
  const errorId = `${name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {options.map((option, i) => (
          <label key={option.value} className={checkboxRowClass}>
            <input
              type="checkbox"
              name={name}
              value={option.value}
              className={checkboxClass}
              data-first-of={i === 0 ? name : undefined}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

function DirectContact() {
  if (site.email) {
    return (
      <a href={`mailto:${site.email}`} className="font-semibold text-[var(--color-text)] underline underline-offset-4">
        {site.email}
      </a>
    );
  }
  return (
    <a
      href={site.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-[var(--color-text)] underline underline-offset-4"
    >
      message me on LinkedIn
    </a>
  );
}

export function ProposalForm() {
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const loadedAtRef = useRef(0);
  const mountedAtRef = useRef(0);
  const formRef = useRef(null);
  const successRef = useRef(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    loadedAtRef.current = Date.now();
    mountedAtRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (!site.turnstileSiteKey) return undefined;

    window.__onProposalTurnstileVerified = (token) => setTurnstileToken(token);

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete window.__onProposalTurnstileVerified;
    };
  }, []);

  function focusField(name) {
    const form = formRef.current;
    if (!form) return;
    const target =
      name === "services" ? form.querySelector('[data-first-of="services"]') : form.elements.namedItem(name);
    target?.focus?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!site.proposalEndpoint) {
      setStatus("error");
      setSubmitMessage("This form isn't connected yet.");
      return;
    }

    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    const firstInvalid = FIELD_ORDER.find((key) => fieldErrors[key]);
    if (firstInvalid) {
      setStatus("idle");
      setSubmitMessage("");
      focusField(firstInvalid);
      return;
    }

    const data = new FormData(form);
    setStatus("submitting");
    setSubmitMessage("");

    const payload = {
      name: data.get("name")?.toString().trim() || "",
      email: data.get("email")?.toString().trim() || "",
      company: data.get("company")?.toString().trim() || "",
      services: data.getAll("services").map((value) => value.toString()),
      integrations: data.getAll("integrations").map((value) => value.toString()),
      bilingual: data.get("bilingual") === "on",
      premiumDesign: data.get("premiumDesign") === "on",
      urgent: data.get("urgent") === "on",
      pageCount: data.get("pageCount")?.toString().trim() || "",
      description: data.get("description")?.toString().trim() || "",
      timeline: data.get("timeline")?.toString().trim() || "",
      budget: data.get("budget")?.toString() || "",
      referral: data.get("referral")?.toString().trim() || "",
      notes: data.get("notes")?.toString().trim() || "",
      website: data.get("website")?.toString() || "",
      // Time on page measured with the page's own monotonic clock, so a visitor's
      // wrong system clock can't make a real submission look like a bot.
      elapsedMs: Math.round(performance.now() - mountedAtRef.current),
      // Kept for workers deployed before elapsedMs existed; remove once the new worker is live.
      loadedAt: loadedAtRef.current,
      turnstileToken,
    };

    try {
      const res = await fetch(site.proposalEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) {
        throw new Error(result.error || "request_failed");
      }
      setStatus("success");
      form.reset();
      setTurnstileToken("");
    } catch (error) {
      setStatus("error");
      setSubmitMessage(SERVER_MESSAGES[error.message] ?? GENERIC_MESSAGE);
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center outline-none"
      >
        <p className="text-lg font-semibold text-[var(--color-text)]">Got it, thanks.</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          I&apos;ll review the details and follow up by email within a couple of business days.
        </p>
      </div>
    );
  }

  const describedBy = (name) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Honeypot: hidden from real visitors, catches simple bots that fill every field. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="proposal-website">Leave this field empty</label>
        <input id="proposal-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">Fields marked * are required.</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="proposal-name" className={labelClass}>
            Name *
          </label>
          <input
            id="proposal-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={120}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className={inputClass(errors.name)}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="proposal-email" className={labelClass}>
            Email *
          </label>
          <input
            id="proposal-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            className={inputClass(errors.email)}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="proposal-company" className={labelClass}>
            Company (optional)
          </label>
          <input
            id="proposal-company"
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={120}
            className={inputClass(false)}
          />
        </div>
      </div>

      <CheckboxGroup legend="What do you need? *" name="services" options={SERVICES} error={errors.services} />

      <div>
        <label htmlFor="proposal-description" className={labelClass}>
          What are you trying to build? *
        </label>
        <textarea
          id="proposal-description"
          name="description"
          required
          maxLength={LIMITS.description}
          rows={5}
          placeholder="Goals, audience, must-have functionality..."
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describedBy("description")}
          className={inputClass(errors.description)}
        />
        <FieldError id="description-error" message={errors.description} />
      </div>

      <CheckboxGroup legend="Does this need any of these?" name="integrations" options={INTEGRATIONS} />

      <fieldset>
        <legend className={labelClass}>A few more details</legend>
        <div className="mt-2 space-y-2">
          <label className={checkboxRowClass}>
            <input type="checkbox" name="bilingual" className={checkboxClass} />
            Needs bilingual / multilingual content
          </label>
          <label className={checkboxRowClass}>
            <input type="checkbox" name="premiumDesign" className={checkboxClass} />
            Wants a premium, high-end custom design direction
          </label>
          <label className={checkboxRowClass}>
            <input type="checkbox" name="urgent" className={checkboxClass} />
            Urgent / rush timeline
          </label>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="proposal-pages" className={labelClass}>
            Approx. number of pages (optional)
          </label>
          <input
            id="proposal-pages"
            name="pageCount"
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            placeholder="e.g. 5"
            className={inputClass(false)}
          />
        </div>
        <div>
          <label htmlFor="proposal-timeline" className={labelClass}>
            Desired timeline (optional)
          </label>
          <input
            id="proposal-timeline"
            name="timeline"
            type="text"
            maxLength={120}
            placeholder="e.g. launch by March"
            className={inputClass(false)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="proposal-budget" className={labelClass}>
            Budget range *
          </label>
          <select
            id="proposal-budget"
            name="budget"
            required
            defaultValue=""
            aria-invalid={errors.budget ? true : undefined}
            aria-describedby={describedBy("budget")}
            className={inputClass(errors.budget)}
          >
            <option value="" disabled>
              Select one
            </option>
            {BUDGETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError id="budget-error" message={errors.budget} />
        </div>
      </div>

      <div>
        <label htmlFor="proposal-notes" className={labelClass}>
          Anything else? (optional)
        </label>
        <textarea
          id="proposal-notes"
          name="notes"
          maxLength={LIMITS.notes}
          rows={3}
          className={inputClass(false)}
        />
      </div>

      <div>
        <label htmlFor="proposal-referral" className={labelClass}>
          How did you hear about me? (optional)
        </label>
        <input id="proposal-referral" name="referral" type="text" maxLength={200} className={inputClass(false)} />
      </div>

      {site.turnstileSiteKey ? (
        <div
          className="cf-turnstile"
          data-sitekey={site.turnstileSiteKey}
          data-callback="__onProposalTurnstileVerified"
        />
      ) : null}

      <div>
        {status === "error" ? (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-bg-elevated)] p-4 text-sm leading-relaxed text-[var(--color-text)] outline-none"
          >
            <p>{submitMessage}</p>
            <p className="mt-1 text-[var(--color-text-muted)]">
              Prefer to skip the form? <DirectContact />.
            </p>
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : "Request a Proposal"}
      </button>
    </form>
  );
}
