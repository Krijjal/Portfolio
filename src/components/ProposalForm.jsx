"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";

const PROJECT_TYPES = [
  { value: "website", label: "Website" },
  { value: "web-app", label: "Web app / SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "branding", label: "Branding / design" },
  { value: "seo", label: "SEO / performance" },
  { value: "other", label: "Something else" },
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

    setStatus("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: data.get("name")?.toString().trim() || "",
      email: data.get("email")?.toString().trim() || "",
      company: data.get("company")?.toString().trim() || "",
      projectType: data.get("projectType")?.toString() || "",
      description: data.get("description")?.toString().trim() || "",
      features: data.get("features")?.toString().trim() || "",
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
        <div>
          <label htmlFor="proposal-company" className={labelClass}>
            Company (optional)
          </label>
          <input id="proposal-company" name="company" type="text" maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor="proposal-type" className={labelClass}>
            Project type *
          </label>
          <select id="proposal-type" name="projectType" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select one
            </option>
            {PROJECT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      <div>
        <label htmlFor="proposal-features" className={labelClass}>
          Key features / deliverables (optional)
        </label>
        <textarea
          id="proposal-features"
          name="features"
          maxLength={2000}
          rows={3}
          placeholder="e.g. booking system, bilingual content, admin dashboard"
          className={inputClass}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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
        <div>
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
