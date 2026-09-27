"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";

// Keep these value/label pairs in sync with worker/proposal-intake/src/index.js
// (ALLOWED_SERVICES / ALLOWED_INTEGRATIONS) — the worker re-validates server-side
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

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]";
const labelClass = "block text-sm font-medium text-[var(--color-text)]";
const checkboxRowClass = "flex items-center gap-2.5 text-sm text-[var(--color-text)]";
const checkboxClass =
  "h-4 w-4 shrink-0 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]";

function CheckboxGroup({ legend, name, options, columns = 2 }) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className={`mt-2 grid gap-x-6 gap-y-2 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => (
          <label key={option.value} className={checkboxRowClass}>
            <input type="checkbox" name={name} value={option.value} className={checkboxClass} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ProposalForm() {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const loadedAtRef = useRef(0);

  useEffect(() => {
    loadedAtRef.current = Date.now();
  }, []);

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

  async function handleSubmit(event) {
    event.preventDefault();

    if (!site.proposalEndpoint) {
      setStatus("error");
      setErrorMessage("This form isn't connected yet — email me directly instead.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const services = data.getAll("services").map((value) => value.toString());

    if (!services.length) {
      setStatus("error");
      setErrorMessage("Select at least one service under “What do you need?”");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const payload = {
      name: data.get("name")?.toString().trim() || "",
      email: data.get("email")?.toString().trim() || "",
      company: data.get("company")?.toString().trim() || "",
      services,
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
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong sending that — try again or email me directly.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center">
        <p className="text-lg font-semibold text-[var(--color-text)]">Got it, thanks.</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          I&apos;ll review the details and follow up by email within a couple of business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Honeypot: hidden from real visitors, catches simple bots that fill every field. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="proposal-website">Leave this field empty</label>
        <input id="proposal-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="proposal-name" className={labelClass}>
            Name *
          </label>
          <input id="proposal-name" name="name" type="text" required maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor="proposal-email" className={labelClass}>
            Email *
          </label>
          <input id="proposal-email" name="email" type="email" required maxLength={254} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="proposal-company" className={labelClass}>
            Company (optional)
          </label>
          <input id="proposal-company" name="company" type="text" maxLength={120} className={inputClass} />
        </div>
      </div>

      <CheckboxGroup legend="What do you need? *" name="services" options={SERVICES} />

      <div>
        <label htmlFor="proposal-description" className={labelClass}>
          What are you trying to build? *
        </label>
        <textarea
          id="proposal-description"
          name="description"
          required
          maxLength={4000}
          rows={5}
          placeholder="Goals, audience, must-have functionality..."
          className={inputClass}
        />
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
            min={1}
            max={999}
            placeholder="e.g. 5"
            className={inputClass}
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
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="proposal-budget" className={labelClass}>
            Budget range *
          </label>
          <select id="proposal-budget" name="budget" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select one
            </option>
            {BUDGETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="proposal-notes" className={labelClass}>
          Anything else? (optional)
        </label>
        <textarea id="proposal-notes" name="notes" maxLength={2000} rows={3} className={inputClass} />
      </div>

      <div>
        <label htmlFor="proposal-referral" className={labelClass}>
          How did you hear about me? (optional)
        </label>
        <input id="proposal-referral" name="referral" type="text" maxLength={200} className={inputClass} />
      </div>

      {site.turnstileSiteKey ? (
        <div
          className="cf-turnstile"
          data-sitekey={site.turnstileSiteKey}
          data-callback="__onProposalTurnstileVerified"
        />
      ) : null}

      {status === "error" ? <p className="text-sm text-red-500">{errorMessage}</p> : null}

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
