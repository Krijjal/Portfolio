# Full Spectrum Audit: Karim Alrajjal Portfolio (krijjal.github.io/Portfolio)

**Date**: 2026-11-16
**Mode**: Repo Health (plus checks against the live site)
**Source**: `main` @ 71e8a99, live at https://krijjal.github.io/Portfolio/
**Lenses Run**: 8/10
**Lenses Skipped**: Backend Engineer (no Rust/Tauri; skipped at the user's choice, so Worker findings sit under Production Readiness and Structural), DX Engineer (skipped at the user's choice)

**How this was checked**: every file under `src/`, `worker/`, the configs and the CI workflow was read in full. On the live site I probed the pages and SEO files with curl, measured in the in-app browser (LCP, JS weight, number of h1s, mobile overflow, nav indicator behaviour), computed WCAG contrast for the brand tokens, scanned for unreferenced assets and ran `next lint`. The proposal form was **not** submitted, so nothing was sent to Telegram. Worker behaviour comes from reading the code.

---

## Master Verdict: APPROVE WITH CHANGES

The site is well built: tokens are consistent, reduced motion is handled almost everywhere, metadata and canonicals are correct, CI is green, and the Worker is careful about origins, input sizes and injection. The must-fix items cluster in one place that matters most commercially, the **Start a Project intake pipeline**. As it stands it can **silently lose leads** (Telegram's 4096-character cap, a spam check that trusts the client's clock) and points failed submissions to an email address the site never shows. Outside the form, there are three visible problems: the nav highlight goes stale, the inner pages have no `<h1>`, and on first load content stays hidden until JavaScript runs while multi-MB screenshots download (LCP measured at 5.9s).

## Verdict by Lens

| # | Lens | Verdict | Critical | Recommendations |
|---|------|---------|----------|-----------------|
| 1 | Design Engineer | APPROVE WITH CHANGES | 1 | 6 |
| 2 | UX Engineer | APPROVE WITH CHANGES | 3 | 6 |
| 3 | Frontend Engineer | APPROVE WITH CHANGES | 2 | 6 |
| 4 | Backend Engineer | Skipped | – | – |
| 5 | Structural Engineer | APPROVE WITH CHANGES | 0 | 6 |
| 6 | Repo Maintainer | APPROVE WITH CHANGES | 0 | 7 |
| 7 | Production Readiness | NEEDS REWORK (intake pipeline only) | 4 | 7 |
| 8 | DX Engineer | Skipped | – | – |
| 9 | Performance Engineer | APPROVE WITH CHANGES | 2 | 5 |
| 10 | Accessibility Engineer | APPROVE WITH CHANGES | 2 | 6 |

## All Critical Issues (Must Fix)

| # | Issue | Lens(es) | File(s) | Impact | Fix |
|---|-------|----------|---------|--------|-----|
| C1 | Telegram rejects messages over 4096 chars. Description (4000) + notes (2000) + the fixed header easily exceed that, so `sendMessage` returns 400 and the Worker returns 502 | Prod, UX | `worker/proposal-intake/src/index.js` (`buildTelegramMessage`, `MAX_FIELD_LENGTHS`) | The most detailed (= most serious) leads fail. The visitor sees a generic error, and after 3 retries they are rate-limited | Split the message into ≤4000-char chunks and send them in order, or truncate description/notes to fit and attach the full text as a `sendDocument` .txt. Also lower the client `maxLength`s so the total fits |
| C2 | The timing trap compares the server's `Date.now()` with the client-supplied `loadedAt`. If the visitor's clock runs ahead by more than (fill time − 3s), the submission is dropped **while returning `{ok:true}`** | Prod, UX | `index.js` (timing check ~L161), `ProposalForm.jsx` (`loadedAtRef`) | Real leads vanish with no trace and the visitor sees "Got it, thanks." It is also trivially bypassed by bots, which can send an old timestamp | Send `elapsedMs` from the client (`performance.now()` at submit minus at mount) and check `elapsedMs >= 3000` on the server. Never fake success without logging the drop |
| C3 | The error fallback says "email me directly", but `site.email` is empty and no email appears anywhere on the site | UX, Prod | `ProposalForm.jsx` (error copy), `src/data/site.js` (`email: ""`), `ContactCTA.jsx` | A visitor whose submission failed hits a dead end. Telegram is the only lead channel | Set `site.email` (or a contact alias) and render it inside the form's error state as a `mailto:` link. Otherwise change the copy to point at LinkedIn |
| C4 | The nav's sliding indicator never hides on routes outside `mainNav`. On `/` and `/start-a-project` it keeps highlighting the previous page (verified live: About → Home leaves "About" highlighted) | Frontend, Design, UX | `src/components/Navbar.jsx` (`positionIndicator`, early `return` when no `activeEl`) | Wrong "you are here" cue on the two most important pages | When `activeEl` is missing, set `indicator.style.opacity = "0"` (or animate it to 0) before returning |
| C5 | Inner pages have no `<h1>` (verified live: `/work` has 0). `SectionHeading` always renders `<h2>` | A11y, Design | `SectionHeading.jsx`, every `src/app/*/page.jsx` except home and start-a-project | Screen reader users lose the page title in heading navigation. It also weakens on-page SEO | Add an `as` prop (`as="h1"`) to `SectionHeading` and use it for the first heading on each inner page |
| C6 | Content is CSS-hidden until hydration + anime.js (`.hero-item`, `.page-enter`, `.stagger-item` start at `opacity:0`), and the first-visit splash covers the page for about 1.8s | Perf, Design, UX | `globals.css`, `HeroSequence.jsx`, `template.jsx`, `Splash.jsx` | LCP measured 5.9s on a first visit. With no JS (or a JS error), inner pages are blank | Start the CSS visible and add the hidden start state only under a `.js` class set by an inline head script. Shorten the splash or drop it from the critical path |
| C7 | Unoptimised screenshots: `cham-clinic.jpg` is **3.2 MB** (featured #2 on /work), `oppolia-online` 1.26 MB, `tarta-de-amor` 1.24 MB, `hadiha` 0.8 MB, about 9 MB in total on /work. `images.unoptimized: true` means none of them are ever resized | Perf | `public/projects/*`, `next.config.mjs` | Slow /work on mobile data and wasted bandwidth | Pre-encode to WebP/AVIF at 1600px and 960px (target ≤200 KB each) with a build script (sharp) and use `srcset`, or use `next-image-export-optimizer` |
| C8 | Form errors are not announced or associated with fields. With `noValidate`, an empty name, email, description or budget goes to the server and comes back as the same generic "Something went wrong" | A11y, UX | `ProposalForm.jsx` | Visitors (and screen reader users especially) can't tell what to fix. Each attempt also uses up one of the 3/hour rate-limit slots | Validate required fields on the client with per-field messages, `aria-invalid` and `aria-describedby`. Put the summary in `role="alert"`, move focus to the first invalid field, and map the server's `invalid_input` / `rate_limited` errors to specific copy |

## Cross-Cutting Concerns

| Concern | Flagged By | Root Cause | Unified Fix |
|---------|-----------|------------|-------------|
| Intake pipeline can lose leads silently and has no backstop | Prod, UX, Structural, A11y | Telegram is the only sink. The Worker fakes success on spam checks, logs nothing, has no fallback store, and the client shows a single generic error | (1) Fix C1/C2. (2) On delivery failure, write the payload to KV/R2 and return 502. (3) Log every drop and failure with `console.error` (visible in Workers Logs). (4) Show the error mapped by type with a real email fallback |
| Hidden start states + long intro animations | Perf, Design, UX, A11y | Visibility is coupled to JavaScript running, and the splash plus hero timeline stack on first load | Progressive enhancement: visible by default, animated only when JS is present and motion is allowed. Cap the first-visit intro at about 600ms |
| Route/enum lists maintained by hand in several places | Structural, Repo, UX | `mainNav`/`footerNav`, `sitemap.js` paths, `HomeExplore` blurbs; form `SERVICES` ↔ Worker `SERVICE_LABELS` ↔ the bot's regexes in another repo | One route registry (`src/data/routes.js` with label, href, blurb, inSitemap, inNav). One `scope.json` imported by both the form and the Worker |
| anime.js effects without cleanup | Frontend, Perf | `StaggerReveal`, `ImpactStatValue` and `template.jsx` create animations/`onScroll` observers and never `revert()` | Return `() => anim.revert()` from each effect, as `HeroSequence` already does |
| Off-token / native UI in a dark-only theme | Design, A11y | No `color-scheme: dark`, no `accent-color`, error uses `text-red-500`, input borders at 1.34:1 | Add `color-scheme: dark` on `html`, `accent-color: var(--color-accent)`, a `--color-danger` token, and a stronger `--color-border-input` (≥3:1) |
| Dead assets and code | Repo, Perf, Structural | `SparksBackground.jsx` + `.sparks-*` CSS, `InnerPage` no-op, unused `screenshots` arrays (mShots URLs), 15 unreferenced files in `public/` (~1.2 MB), dead Clearbit fallbacks | One cleanup PR (list in the Repo Maintainer section) |

## All Recommendations

| # | Recommendation | Lens | File(s) | Fix |
|---|---------------|------|---------|-----|
| R1 | Start a Project is linked only from the bottom of the home page | UX | `nav.js`, `Navbar.jsx`, `Services.jsx`, `Footer.jsx` | Add a primary "Start a Project" button in the header and footer. Point the Services cards at it (they currently go to LinkedIn) |
| R2 | Sitemap lists non-canonical URLs without a trailing slash (each one redirects with a 301) and omits `/start-a-project` | Prod, Structural | `src/app/sitemap.js` | Generate from the route registry with trailing slashes, and include `/start-a-project/` |
| R3 | `robots.txt` at `/Portfolio/robots.txt` is ignored by crawlers (robots must sit at the host root, and `krijjal.github.io/robots.txt` returns 404). The `Host:` line is non-standard | Prod | `src/app/robots.js` | Submit the sitemap in Google Search Console. Drop `host`. A custom domain or a `krijjal.github.io` user-site repo would fix it properly |
| R4 | No OG/Twitter image (`ogImage: ""`) while `twitter:card` is `summary_large_image` | Design, Prod | `site.js` | Add a 1200×630 `/og.png` and point `ogImage` at it |
| R5 | Rate limit is counted before validation and before delivery | Prod | `index.js` | Validate first, and count only successful deliveries (or failed-and-stored ones) |
| R6 | Telegram `fetch` has no try/catch or timeout. A network error throws, the response is a 500 without CORS headers, and the browser reports it as a CORS failure | Prod | `index.js` | Wrap the call in try/catch with `AbortSignal.timeout(8000)` and return a `json(..., 502, origin)` |
| R7 | Visitor free text sits inside a message that is later pasted into the contract wizard, so a visitor can write `Client:` / `timeline:` lines that the bot's regexes may pick up | Structural, Prod | `buildTelegramMessage` | Prefix each free-text line (e.g. `> `) or put free text after an explicit `--- visitor text ---` fence that the wizard ignores |
| R8 | CI runs Node 20 (end of life since April 2026) and runs no lint/build check before deploying | Prod, Repo | `.github/workflows/deploy.yml` | Use `node-version: 22` (or 24). Add `npm run lint` before the build |
| R9 | Worker deployment is manual. `ALLOWED_ORIGIN` is hard-coded to the github.io origin | Prod | `wrangler.toml`, README | Document the redeploy step for any domain change, or add a `wrangler deploy` workflow with an API token secret |
| R10 | Footer year is frozen at build time | Frontend | `Footer.jsx` | Acceptable for a static export. Either remove the year or make sure a yearly rebuild happens |
| R11 | Navbar indicator is measured before Bank Gothic loads (`display: swap`), so widths can shift after the font swaps in | Frontend | `Navbar.jsx` | Re-run `positionIndicator` on `document.fonts.ready` and use a `ResizeObserver` on the nav |
| R12 | Logo fallback goes to Clearbit, which is retired. If a local logo fails, the second failure leaves a broken image | Frontend, Repo | `ProjectCaseStudy.jsx`, `EmployerLogo.jsx`, data `logoUrl` | Remove `logoUrl` and render nothing (or initials) when the local logo fails |
| R13 | One `.tsx` file in a JS project. TypeScript is only a transitive dependency and there is no tsconfig in the repo | Repo, Frontend | `BlueSparksCanvas.tsx` | Rename to `.jsx` (drop the type annotations) or add `typescript` + `tsconfig.json` deliberately |
| R14 | Canvas animation runs a continuous rAF loop with `shadowBlur` and full-viewport `screen` blending on desktop, up to 130 particles | Perf | `BlueSparksCanvas.tsx` | Pause on `visibilitychange`/blur, cap at 30fps, pre-render one blurred sprite and `drawImage` it instead of `shadowBlur` |
| R15 | Fonts ship as TTF/OTF (~57 KB), and all three weights are preloaded | Perf | `src/fonts`, `layout.jsx` | Convert to WOFF2 (roughly 40% smaller). Preload only the weight used above the fold |
| R16 | 13 identical "Live Demo" links and "Case Study" buttons | A11y | `ProjectCaseStudy.jsx` | Add visually hidden context: `Live site<span class="sr-only"> for {name}</span>`. Rename "Live Demo" to "Live site" (these are production sites) |
| R17 | Mobile menu: no Escape to close, and focus is not moved in or restored | A11y, UX | `Navbar.jsx` | Close on Escape and return focus to the toggle button. Optionally close on outside click |
| R18 | Input/checkbox borders are 1.34:1 against the surface (WCAG 1.4.11 needs 3:1) | A11y, Design | `ProposalForm.jsx`, `globals.css` | Add a `--color-border-strong` token (e.g. `#4a5263`) for form controls |
| R19 | Success state replaces the form and focus falls to `<body>` | A11y, UX | `ProposalForm.jsx` | Give the success panel `tabIndex={-1}` + `role="status"` and focus it after it mounts |
| R20 | Worker README still describes "project type" as an enum (replaced by checkboxes) | Repo | `worker/proposal-intake/README.md` | Update the protections list |
| R21 | No root README describing how to run, edit content and deploy | Repo | repo root | Add a short README (dev, content in `src/data`, deploy, Worker link) |

---

# Lens Reports

---

## 1. Design Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
A dark-only marketing/portfolio site with a single type family (Bank Gothic), a Graphite Ink / Indigo token set in `globals.css`, and anime.js entrance motion. This review covers how tokens are applied, interactive states, and motion quality across the site.

### Files Reviewed
| File | Visual Role | Risk |
|------|-------------|------|
| `src/app/globals.css` | Tokens, type scale, motion start states | Medium |
| `src/components/Navbar.jsx` | Header, sliding active indicator | High |
| `src/components/Splash.jsx`, `HeroSequence.jsx`, `template.jsx`, `StaggerReveal.jsx`, `Reveal.jsx` | Motion system | Medium |
| `src/components/ProjectCaseStudy.jsx`, `EmployerLogo.jsx`, `lib/projectLogo.js` | Cards, logo treatments | Low |
| `src/components/ProposalForm.jsx` | Form controls | Medium |
| `src/components/BlueSparksCanvas.tsx` | Ambient background | Low |
| `Hero.jsx`, `Impact.jsx`, `Services.jsx`, `ContactCTA.jsx`, `Footer.jsx`, `SectionHeading.jsx`, `SectionShell.jsx` | Layout primitives | Low |

### Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | Sliding nav indicator stays visible on routes outside `mainNav` (`/`, `/start-a-project`) and highlights the previously visited item (verified live) | `Navbar.jsx` | Contradictory active state at the very top of every page | Hide the indicator (opacity 0) when there is no `activeEl` |

### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| 1 | No `color-scheme: dark` and no `accent-color`. Tailwind v4 without the forms plugin ignores `rounded border text-[accent] focus:ring` on native checkboxes | `globals.css`, `ProposalForm.jsx` | Checkboxes, the `<select>` dropdown and scrollbars render in the OS light style inside a dark page | `html { color-scheme: dark; accent-color: var(--color-accent); }` |
| 2 | Off-token colours: `text-red-500` (form error), `#8B93A7` / `rgba(178,184,199)` hard-coded in the canvas, `#7c6cff` repeated in `--color-accent-hover` | `ProposalForm.jsx`, `BlueSparksCanvas.tsx`, `globals.css` | Fragments the token system the file header promises ("never hardcode hex") | Add `--color-danger`. Read particle colour from `--color-text-muted` via `getComputedStyle`. Write hover as `color-mix(in oklch, var(--color-accent) 85%, white)` |
| 3 | Form control borders use `--color-border` (#2a303c, 1.34:1 on surface) | `ProposalForm.jsx` | Inputs barely read as fields | Add a stronger border token for controls |
| 4 | Content flashes, then the splash appears: the splash only mounts after hydration, so the SSR page paints first | `Splash.jsx` | Visible flash of content before the intro, which undercuts the intended moment | Render the overlay in the SSR markup, gated by a pre-hydration inline script that checks sessionStorage and reduced motion, or drop the splash |
| 5 | Radius drift: CTAs are mostly `rounded-full`, but "See case studies" uses `--radius-md` and logo chips use `rounded-md` (not a token) | `Impact.jsx`, `ProjectCaseStudy.jsx`, `EmployerLogo.jsx` | Small inconsistency between button families | Standardise CTAs on `rounded-full` and chips on `--radius-sm` |
| 6 | No social preview image | `site.js` | Shared links render as bare text cards | 1200×630 brand OG image |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | `transition-all` on project cards → `transition-[transform,box-shadow]` | Avoids animating unrelated properties |
| 2 | Tabular numbers on the impact count-up (`tabular-nums`) | Stops width jitter while counting |
| 3 | A shared `Button` primitive (`primary`/`secondary`) | The same 200-char class strings are repeated about 12 times |

### Design System Compliance
Tokens are centralised and used consistently through `var(--color-*)` in nearly every component, and the type scale (`text-hero`, `text-section-head`, `text-lead`, `text-tag`) is applied with discipline. Fragmentation is limited to the error red, the canvas colours and the native form controls, which never got dark-theme styling.

### Visual State Coverage
| Component/Element | Hover | Focus | Active | Disabled | Loading | Empty | Error | Dark Mode |
|-------------------|-------|-------|--------|----------|---------|-------|-------|-----------|
| Primary CTA (pill) | ✅ | ✅ (global outline) | – | ✅ (submit only) | ✅ "Sending..." | – | – | ✅ |
| Nav links (desktop) | ✅ | ✅ | ⚠️ indicator stale off-nav | – | – | – | – | ✅ |
| Mobile menu items | ✅ | ✅ | ✅ | – | – | – | – | ✅ |
| Project card | ✅ lift + glow | ✅ (inner controls) | – | – | – | – | – | ✅ |
| Case Study toggle | ✅ | ✅ | ✅ chevron | – | – | – | – | ✅ |
| Logo chip | – | ✅ | – | – | – | – | ⚠️ broken image after Clearbit fallback | ✅ |
| Form inputs | – | ✅ border accent | – | – | – | – | ❌ no field error state | ⚠️ low-contrast border |
| Checkboxes / select | – | ⚠️ native | ✅ | – | – | – | ❌ | ❌ light native styling |
| Form status | – | – | – | – | ✅ | – | ⚠️ red text only | ✅ |

### Verdict Details
- Design Token Fidelity: CONCERNS (minor off-token colours)
- Visual State Coverage: CONCERNS (form error states, nav indicator)
- Dark Mode Parity: CONCERNS (native controls, no `color-scheme`)
- Animation Quality: PASS (transform/opacity only, custom easing, reduced motion respected) with a CONCERN on total intro length
- Visual Consistency: PASS

---

## 2. UX Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
Visitors land on the home page, browse proof (Work, Impact, Experience) and should convert through Start a Project. The browse path is clear. The conversion path is hard to find and fails badly when something goes wrong.

### User Journey Map
1. **Trigger**: a visitor arrives from LinkedIn/search → first visit plays the splash for about 1.8s. **WARN** (delay before anything is usable; content flashes first)
2. **Orient**: hero + "View Projects" CTA + Explore grid. **OK**
3. **Browse proof**: /work cards with an expandable Case Study. **OK** (progressive disclosure works). Nav highlight is wrong on Home. **WARN**
4. **Decide to engage**: the only path to Start a Project is the ContactCTA at the bottom of the home page. The header has LinkedIn only, and Services cards say "Talk on LinkedIn". **WARN**
5. **Fill the form**: clear labels, sensible grouping. **OK**
6. **Submit with a missing field** (`noValidate`): the server rejects it and the visitor sees "Something went wrong… email me directly". **FAIL** (no indication what's wrong, and no email exists)
7. **Submit a long brief**: >4096 chars → Telegram rejects → same generic error. **FAIL**
8. **Submit with a clock running ahead**: "Got it, thanks" shown, lead dropped. **FAIL** (false success)
9. **Success**: clear expectation ("follow up by email within a couple of business days"). **OK**

### Critical Issues (Must Fix)
| # | Issue | Step in Journey | Impact on User | Fix |
|---|-------|----------------|----------------|-----|
| 1 | Error fallback references an email that doesn't exist on the site | 6–7 | Dead end, lost lead | Show a real `mailto:` in the error state |
| 2 | Generic error for validation, rate-limit and delivery failures alike | 6 | The visitor can't fix the problem and retries until rate-limited | Client-side per-field validation. Map server error codes to specific copy |
| 3 | False success (timing trap with client clock) and hard failure on long briefs | 7–8 | Visitor believes they reached you, or gives up | See C1/C2 |

### Recommendations
| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | Start a Project is hard to find | Fewer conversions | Header CTA button, footer link, Services cards → `/start-a-project` |
| 2 | Required checkbox group (`services`) gives no inline cue until submit | Avoidable error | Mark the group required in the legend and validate inline on submit with focus moved to the group |
| 3 | Form input is lost on accidental navigation | Frustration on a long form | Persist a draft to `sessionStorage` on input. Clear it on success |
| 4 | Mobile menu can't be dismissed with Escape or an outside tap | Minor friction | Add both |
| 5 | Splash on first visit delays the first meaningful view | Bounce risk for impatient visitors | Shorten it to ≤600ms or remove it |
| 6 | "Live Demo" for production client sites | Mislabels real sites as demos | "Visit site" / "Live site" |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Add a deep-link anchor per case study (`/work/#tbz`) | Lets you share one project |
| 2 | Show expected response time near the submit button | Sets expectations before commitment |

### Interaction Consistency Check
Disclosure patterns (Case Study toggle, mobile menu) are consistent and use `aria-expanded`. CTAs are consistent pills. The inconsistency is in conversion: three different "contact" destinations (LinkedIn icon in the header, "Talk on LinkedIn" in Services, Start a Project in ContactCTA) with no single primary action.

### Verdict Details
- Discoverability: CONCERNS
- Flow Completeness: PASS (happy path)
- Error Recovery: CONCERNS
- Feedback & Status: CONCERNS (false success path)
- Consistency: CONCERNS (contact destinations)

---

## 3. Frontend Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
Next.js 15.5 App Router static export, React 19, JS (one TSX file), Tailwind v4, anime.js v4. There is no global state. Client components are limited to Navbar, Splash, the motion wrappers, ProposalForm, ProjectCaseStudy, EmployerLogo, SkipLink and the canvas.

### Files Reviewed
| File | Frontend Role | Risk |
|------|--------------|------|
| `Navbar.jsx` | Route-aware indicator, mobile menu | High |
| `StaggerReveal.jsx`, `ImpactStatValue.jsx`, `template.jsx`, `HeroSequence.jsx`, `Splash.jsx`, `Reveal.jsx` | Animation effects | Medium |
| `ProposalForm.jsx` | Form state, fetch, Turnstile loader | Medium |
| `ProjectCaseStudy.jsx`, `EmployerLogo.jsx` | Image fallbacks | Low |
| `BlueSparksCanvas.tsx` | rAF loop | Low |
| `layout.jsx`, `page.jsx`, `lib/seo.js` | Metadata | Low |

### Critical Issues (Must Fix)
| # | Issue | File(s) | Why It Breaks | Code Fix |
|---|-------|---------|---------------|----------|
| 1 | Indicator keeps its last position/opacity when `itemRefs.get(pathname)` is undefined | `Navbar.jsx` L40–42 | Stale highlight on `/`, `/start-a-project` (verified) | `if (!activeEl) { if (indicator) indicator.style.opacity = "0"; return; }` |
| 2 | Visibility is tied to hydration: `.page-enter`/`.hero-item`/`.stagger-item` start at `opacity:0` in CSS, and only JS reveals them | `globals.css`, `template.jsx`, `HeroSequence.jsx`, `StaggerReveal.jsx` | No-JS or a JS error leaves the content invisible, and LCP waits for hydration | Gate the start states on `html.js` (set by an inline `<script>` in `<head>`), or animate from visible with `opacity: [0,1]` only after mount |

### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| 1 | `animate(..., { autoplay: onScroll(...) })` never reverted | `StaggerReveal.jsx`, `ImpactStatValue.jsx`, `template.jsx` | ScrollObservers for unmounted nodes pile up across client navigations, and StrictMode dev doubles them | `const a = animate(...); return () => a.revert();` |
| 2 | Indicator measured before the web font swaps in | `Navbar.jsx` | Widths change after `font-display: swap` | `document.fonts.ready.then(() => positionIndicator(false))` + `ResizeObserver` |
| 3 | Clearbit fallback (retired service). A second `onError` leaves a broken `<img>` | `ProjectCaseStudy.jsx`, `EmployerLogo.jsx` | Broken image in production if a local file is renamed | Drop `logoUrl` and hide the chip on failure |
| 4 | `ProjectCaseStudy` is a whole client component for one toggle | `ProjectCaseStudy.jsx` | Ships 13 cards' worth of markup in the hydration payload | Use a server component with a small `<CaseStudyToggle>` client island, or native `<details>/<summary>` (zero JS) |
| 5 | `eslint-disable react-hooks/exhaustive-deps` twice | `template.jsx`, `ImpactStatValue.jsx` | Hides real deps (`isHome`, `parsed`) | Compute inside the effect or memoise `parsed` and list deps |
| 6 | Mixed TS/JS with no tsconfig | `BlueSparksCanvas.tsx` | The build depends on a transitive `typescript` install | Convert to `.jsx` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Import anime.js submodules (`animejs/animation`, `animejs/timeline`) | Smaller client chunk |
| 2 | Move the Turnstile `<script>` to `next/script` with `strategy="lazyOnload"` | Dedupes on remount |

### Render Path Analysis
The app has no shared state, so renders come from route changes (Template remounts per route, and Navbar re-runs its pathname effects), local `open` toggles (Navbar, ProjectCaseStudy) and form `status`. Re-renders are cheap and localised, and nothing needs memoising. The expensive work happens outside React: the canvas rAF loop (every frame), anime.js timelines, and the scroll observers that are never released. The real render-path cost is first paint: content waits for hydration before it is visible.

### Type Safety Assessment
JS-only apart from the canvas. The data files (`projects.js`, `experience.js`) have no schema, so a missing `stack` array would crash `ProjectCaseStudy` (`project.stack.map`). JSDoc `@typedef`s or a tiny build-time assertion over `projects` would catch content typos. The form ↔ Worker payload is an untyped contract (see Structural).

### Verdict Details
- Component Architecture: PASS
- State Management: PASS
- Type Safety: CONCERNS (untyped content data)
- Rendering Performance: CONCERNS (hydration-gated visibility)
- Bundle Impact: CONCERNS (whole-card client components, full anime import)

---

## 4. Backend Engineer

**Skipped** — no Rust/Tauri in this repo, and skipped at the user's choice. The Cloudflare Worker was reviewed under Production Readiness (failure modes) and Structural (contract coupling).

---

## 5. Structural Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
Three-part system: a static Next site (GitHub Pages) → Cloudflare Worker (validation, rate limiting) → Telegram, which a human then pastes into `telegram-codex-bot`'s contract wizard (a separate repo). Content is data-driven from `src/data/*`.

### Files Reviewed
| File | Structural Role | Layer | Risk |
|------|----------------|-------|------|
| `src/data/*.js` | Content source of truth | Data | Low |
| `src/data/nav.js`, `src/app/sitemap.js`, `HomeExplore.jsx` | Route definitions (×3) | Data/UI | Medium |
| `ProposalForm.jsx` | Client side of the intake contract | UI | Medium |
| `worker/proposal-intake/src/index.js` | Intake service | Edge | High |
| `lib/seo.js`, `layout.jsx`, `page.jsx` | Metadata | App | Low |

### Critical Issues (Must Fix)
None structurally blocking.

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | Service/integration enums are triplicated across form, Worker and the bot's regexes (another repo), synced only by comments | A label edit silently stops scope detection in contract generation | `worker/proposal-intake/src/scope.json` imported by the form and the Worker, plus a small test that every label matches the bot's `detectModules` patterns |
| 2 | Telegram message is both a human notification and machine input to the wizard, with visitor text interleaved | Data and control share one channel, so visitor text can spoof parsed fields | Fence visitor text, or have the Worker emit a separate machine block (`#brief` JSON) that the wizard reads |
| 3 | Routes defined in 3 places (`mainNav`/`footerNav`, `sitemap.js`, `HomeExplore.blurbs`) | Adding a page means editing 3–4 files. `/start-a-project` already drifted out of the sitemap | `src/data/routes.js` with `{href,label,blurb,nav,footer,sitemap}` |
| 4 | `withBase` duplicated (`projects.js`, `experience.js`, `Footer.jsx`, `layout.jsx`) | Base-path logic scattered | `src/lib/asset.js` exporting `withBase` |
| 5 | Root metadata duplicated in `layout.jsx`, `page.jsx` and `seo.js` | Three places to update OG fields | Have `layout.jsx` and `page.jsx` call `pageMetadata` |
| 6 | Logo rendering implemented twice (`next/image` in ProjectCaseStudy, `<img>` in EmployerLogo) | Divergent fallbacks | One `LogoChip` component |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Remove the `InnerPage` no-op wrapper (its comment describes padding it no longer adds) | Misleading abstraction |
| 2 | Keep the Worker in its own package (as now), but add a root npm script `worker:deploy` | Discoverability |

### Dependency Map
```
src/data/{site,nav,projects,experience,impact,services,skills}.js
      │ (pure data, no imports except env BASE_PATH)
      ▼
src/components/*  ──► src/lib/{motion,seo,impactCounter,projectLogo}.js
      │                         ▲
      ▼                         │
src/app/*/page.jsx ─────────────┘
      │
ProposalForm.jsx ──HTTP POST (JSON, untyped)──► Worker index.js ──► Telegram API
      │ (SERVICES list)                             │ (SERVICE_LABELS)
      └────────── must match ───────────────────────┘
                                                    └── text format must match ──► telegram-codex-bot (other repo, regex)
```
Concerning arrows: the two "must match" edges have no shared artifact or test.

### Boundary Crossing Analysis
| Crossing | From -> To | Clean? | Notes |
|----------|-----------|--------|-------|
| Site → Worker | `fetch(site.proposalEndpoint)` | Mostly | Origin-locked, size-capped. Payload shape is implicit |
| Worker → Telegram | Bot API `sendMessage` | ⚠️ | No timeout/try, no length handling |
| Telegram → Contract wizard | Human copy/paste | ⚠️ | Format coupling, spoofable fields |
| Data → UI | Static imports | ✅ | Clean, one-directional |

### Verdict Details
- Dependency Direction: PASS
- Module Coupling: CONCERNS (cross-repo implicit contract)
- Cohesion: PASS
- Layer Boundaries: PASS
- Change Propagation: CONCERNS (routes, enums)

---

## 6. Repo Maintainer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
A tidy codebase with clear folders (`app`, `components`, `data`, `lib`), path aliases and lint passing (1 warning). Health issues come from leftovers: dead files and assets, template comments, and a missing root README.

### Files Reviewed
| File | Convention Status | Risk |
|------|------------------|------|
| `src/components/SparksBackground.jsx` | Dead (no importers) | Low |
| `globals.css` `.sparks-bg`, `.sparks-canvas` | Dead CSS | Low |
| `src/components/InnerPage.jsx` | No-op, stale comment | Low |
| `src/data/projects.js` `screenshots` | Unused field with external mShots URLs | Low |
| `public/` (15 files) | Unreferenced | Low |
| `BlueSparksCanvas.tsx` | Only TS file | Low |
| `package.json` | `next lint` + legacy `eslintConfig` | Medium |
| `worker/proposal-intake/README.md` | Stale ("project type" enum) | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | Unreferenced public assets (~1.2 MB): `OPPOLIA ONLINE LOGO.png`, `chamclinic.png`, `oppoliaksa.png`, `logos/Kraken (1).svg`, `logos/elite logo (1).svg`, `logos/cashcup-sports.png`, `logos/gravity-wrestling.png`, `logos/oppolia-online.png`, `logos/kr-lockup-black.svg`, `logos/kr-mark-black.svg`, `logos/kr-mark.svg`, `projects/elite-edition.jpg` (666 KB), `projects/kraken.jpg`, `projects/oppolia-ksa.jpg` | Repo and deploy bloat, confusing duplicates | Delete (keep the brand masters in a `design/` folder outside `public/` if needed) |
| 2 | Filenames with spaces/parentheses | URL-encoding pitfalls | kebab-case all assets |
| 3 | Dead `SparksBackground.jsx` + CSS, no-op `InnerPage`, unused `screenshots` | Misleads future edits | Remove |
| 4 | `next lint` is deprecated in Next 15.5 and removed in 16. ESLint 9 with a legacy `eslintConfig` block | Will break on upgrade | Migrate to `eslint.config.mjs` (flat) and run `eslint .` |
| 5 | Two `eslint-disable` suppressions | Hidden dependency bugs | Fix the deps (see Frontend R5) |
| 6 | No root README or LICENSE | Onboarding and reuse clarity | Add a README (dev/content/deploy/Worker) |
| 7 | "CUSTOMIZE:" template comments throughout `src/data` | Reads as unfinished template | Replace with real descriptions |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Add `knip` or `unimported` to CI | Catches dead files automatically |
| 2 | Shared `Button`/`Pill` component | About 12 duplicated class strings |

### Convention Compliance Checklist
| Convention | Status | Notes |
|-----------|--------|-------|
| File placement | ✅ | Clear `app/components/data/lib` split |
| Naming conventions | ⚠️ | Components PascalCase ✅. Public assets mixed (spaces, parens, duplicates) |
| Barrel exports | N/A | Direct imports throughout, consistently |
| Import ordering | ✅ | External → alias → relative |
| Type imports separated | N/A | JS project |
| Path aliases used | ✅ | `@/` everywhere for cross-folder imports |
| No dead code left | ❌ | See recommendations 1 and 3 |
| Structured logging | ⚠️ | The Worker logs nothing |
| No lint suppressions | ⚠️ | 2 × exhaustive-deps |
| CLAUDE.md / README present | ❌ | No root README. The Worker README is good |

### Reuse Opportunities
`withBase` → one helper. `pageMetadata` → reuse in the layout and home page. `projectLogoStyles` already exists, so build one `LogoChip` on top of it. A route registry can feed nav, footer, sitemap and HomeExplore.

### Verdict Details
- File Organization: PASS
- Naming Consistency: CONCERNS (assets)
- Import Hygiene: PASS
- Code Reuse: CONCERNS
- Lint Compliance: PASS (1 warning: `<img>` in EmployerLogo, intentional and commented)

---

## 7. Production Readiness

**Verdict**: NEEDS REWORK (scoped to the intake pipeline; the static site itself is production-ready)

### Plan Summary
The static site deploys reliably (the last 5 CI runs succeeded, about 1 minute each). The lead pipeline (form → Worker → Telegram) has failure modes that lose data without anyone noticing.

### Files Reviewed
| File | Production Role | Risk |
|------|----------------|------|
| `worker/proposal-intake/src/index.js` | Lead intake | High |
| `worker/proposal-intake/wrangler.toml` | Origins, KV binding | Medium |
| `ProposalForm.jsx` | Client submit/error handling | High |
| `.github/workflows/deploy.yml` | Site CI/CD | Medium |
| `next.config.mjs` | Base path / export | Low |
| `src/app/robots.js`, `sitemap.js` | Crawl config | Medium |

### Critical Issues (Must Fix)
| # | Issue | File(s) | Production Failure Mode | Fix |
|---|-------|---------|------------------------|-----|
| 1 | Message > 4096 chars | `index.js` | Telegram 400 → 502 → lead lost | Chunk or truncate (C1) |
| 2 | Timing trap trusts the client clock and fakes success | `index.js`, `ProposalForm.jsx` | Silent drop with success UI | Send `elapsedMs` instead (C2) |
| 3 | No backstop when Telegram fails (token revoked, chat changed, API outage) | `index.js` | Every lead fails until someone notices. Nothing is stored | On failure `RATE_LIMIT_KV.put("lead:"+ts, payload, {expirationTtl: 30d})` (or a dedicated KV/R2), then return 502. Optional Cloudflare email-routing fallback |
| 4 | No error visibility | `index.js` | You cannot tell how many leads were dropped as spam, rejected or failed | `console.error`/`console.log` structured lines for each branch, with Workers Logs enabled (`[observability] enabled = true` in wrangler.toml) |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | Telegram `fetch` has no try/catch or timeout | Network errors become a 500 without CORS, so the client sees an opaque failure | try/catch + `AbortSignal.timeout(8000)` |
| 2 | Rate limit counted before validation and delivery | Honest retries after an error lock the visitor out | Validate first, count on success |
| 3 | KV rate limit is read-modify-write (eventually consistent) | Burst submissions can exceed 3/hour | Acceptable as a soft limit. Note it in the README, or use Cloudflare's Rate Limiting binding |
| 4 | `ALLOWED_ORIGIN` hard-coded. Git history shows custom-domain attempts | Moving to a custom domain makes every submission return 403 | Add the domain list ahead of time and document it in the site README |
| 5 | CI on Node 20 (EOL) with no lint gate | Supply-chain/security updates. A broken page could deploy | Node 22/24 + `npm run lint` |
| 6 | robots.txt not at the host root; sitemap URLs non-canonical and missing a page | Crawl config is ineffective | Search Console sitemap submission and a trailing-slash sitemap |
| 7 | No uptime/health check on the Worker | A broken deploy goes unnoticed | `GET /health` returning `{ok:true, telegram: configured}`, watched by a free uptime monitor |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Turnstile site key ready but off | Fine as the baseline. Enable it if spam appears |
| 2 | Include a `submissionId` in both the response and the Telegram message | Lets you trace a visitor's complaint to a log line |

### Failure Mode Analysis
| Scenario | What Fails | User Impact | Recovery | Plan Handles It? |
|----------|-----------|-------------|----------|-------------------|
| Long brief (>~3.7k chars) | Telegram 400 | Generic error, retries hit the rate limit | None | ❌ |
| Visitor clock ahead | Timing trap | False "Got it" | None | ❌ |
| Telegram token revoked / API down | sendMessage | Generic error, lead lost | None | ❌ |
| Network error to Telegram | Uncaught throw | Browser reports a CORS error | None | ❌ |
| Missing required field | Server 400 | Generic error, quota consumed | Manual | ⚠️ |
| Bot fills honeypot | Silent success | – | – | ✅ |
| KV unbound | Rate limit fails open | – | – | ✅ (documented) |
| Site moves to custom domain | Origin check 403 | Form broken | Redeploy the Worker | ⚠️ manual |
| GitHub Pages outage | Site down | – | Wait | N/A |
| Local logo 404 | Falls back to Clearbit (dead) | Broken image | – | ⚠️ |

### Environment Checklist
| Concern | Dev | Prod | Gap? |
|---------|-----|------|------|
| File paths | `basePath` "" | `/Portfolio` via `GITHUB_REPOSITORY` | ✅ handled by `withBase` |
| Network | Worker URL shared | Same | ⚠️ the dev origin `localhost` is not in `ALLOWED_ORIGIN`, so form testing locally returns 403 |
| Permissions | – | Pages `id-token` | ✅ |
| Config | `site.js` constants | Same | ⚠️ `email`, `ogImage` empty |
| Build output | `out/` | Pages artifact | ✅ |

### Verdict Details
- E2E Flow: CONCERNS
- Error Recovery: CONCERNS
- Data Integrity: CONCERNS (leads can be lost)
- Environment Parity: PASS (base-path handling is solid)
- Observability: CONCERNS (none)

---

## 8. DX Engineer

**Skipped** — skipped at the user's choice. The closest maintainability points (README, lint migration, Worker deploy docs) are under Repo Maintainer and Production Readiness.

---

## 9. Performance Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
A static site, so the costs are on the network (images, fonts, JS), the first-paint critical path (hydration-gated visibility, splash), and sustained CPU/GPU (canvas loop).

### Files Reviewed
| File | Performance Role | Risk |
|------|-----------------|------|
| `public/projects/*` | Largest payload | High |
| `globals.css` + motion components | Critical render path | High |
| `Splash.jsx` | First-visit blocking overlay | Medium |
| `BlueSparksCanvas.tsx` | Continuous rAF | Medium |
| `layout.jsx` / `src/fonts` | Font loading | Low |
| `StaggerReveal.jsx`, `ImpactStatValue.jsx` | Observer lifecycle | Low |

### Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | LCP measured at 5.9s (first visit, `/start-a-project`, desktop). Text is `opacity:0` until hydration + anime, and the splash adds about 1.8s | `globals.css`, `HeroSequence.jsx`, `template.jsx`, `Splash.jsx` | Poor Core Web Vitals, which matters for an SEO-focused portfolio | Visible-by-default CSS. Intro ≤600ms, or remove it |
| 2 | Uncompressed, unresized screenshots (3.2 MB, 1.26 MB, 1.24 MB, 0.8 MB…; about 9 MB on /work) | `public/projects/*` | Slow /work on mobile, high data use | WebP/AVIF at 960/1600px, ≤200 KB each, `srcset` |

### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| 1 | Canvas: continuous 60fps, `shadowBlur` per particle, `save/restore` per particle, full-viewport `screen` blend | `BlueSparksCanvas.tsx` | Constant GPU/battery cost while reading | Pre-rendered sprite, 30fps cap, pause on `visibilitychange`/blur, stop after N seconds idle |
| 2 | Observers never reverted | `StaggerReveal.jsx`, `ImpactStatValue.jsx` | Listeners accumulate per navigation | `revert()` in cleanup |
| 3 | TTF/OTF fonts, 3 weights preloaded (~57 KB) | `src/fonts`, `layout.jsx` | Larger than WOFF2 and competes with LCP | WOFF2 + preload one weight |
| 4 | 160 KB JS (18 chunks) for a content site | client components | Hydration cost on mid-range phones | `<details>` for case studies, anime submodule imports, drop the splash |
| 5 | `/work` HTML 135 KB (all case-study panels inline + RSC payload) | `ProjectCaseStudy.jsx` | Larger document | Server-render the cards and keep a small toggle island |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | `fetchpriority="high"` on the first project image on /work | Faster above-fold image |
| 2 | Lighthouse CI budget in GitHub Actions | Prevents regressions |

### Resource Budget
| Resource | Current | After Fixes | Concern? |
|----------|---------|-----------|----------|
| Network calls per action | 1 POST per form submit | Same | No |
| Event listeners added | resize ×2, rAF loop, N scroll observers per page (not released) | Released on unmount | Yes (minor) |
| Memory growth per hour | Small observer growth per navigation | Flat | Minor |
| Startup (LCP) | ~5.9s first visit | Target <2.5s | Yes |
| Page weight /work | ~9 MB images (lazy) | <1.5 MB | Yes |
| JS | ~160 KB transfer | ~110 KB | Minor |

### Hot Path Analysis
The per-frame hot path is the canvas: for each of up to 130 particles it runs `save()`, sets `shadowBlur`, draws an arc and calls `restore()`, plus a full-screen radial gradient fill. On desktop GPUs this is affordable but never idle. Mobile already reduces it (no shadow, fewer particles, DPR cap), which is good. Scroll-driven work is limited to anime `onScroll` observers, which fire once. The critical first-load path is: HTML → CSS (content hidden) → 18 JS chunks → hydrate → anime timeline → visible, with the splash on top on first visit.

### Verdict Details
- Memory Management: PASS (minor observer leak)
- Network Efficiency: CONCERNS (images)
- I/O Patterns: PASS
- Startup Impact: CONCERNS (LCP)
- Long-Session Stability: PASS (canvas is bounded, though always running)

---

## 10. Accessibility Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
A good baseline: skip link, landmarks (`header`/`nav`/`main`/`footer`), labelled form controls, `aria-expanded` disclosures, `aria-current` nav, reduced motion respected (canvas, splash, hero, reveals, counters). Text contrast passes AA (muted on bg 6.28:1, accent on elevated 4.61:1, button text 5.01:1). The gaps are heading structure and form feedback.

### Files Reviewed
| File | A11y Role | Risk |
|------|----------|------|
| `SectionHeading.jsx`, inner `page.jsx` files | Heading hierarchy | High |
| `ProposalForm.jsx` | Form errors/status | High |
| `Navbar.jsx` | Nav, mobile disclosure | Medium |
| `ProjectCaseStudy.jsx` | Repeated links/buttons | Medium |
| `SkipLink.jsx`, `layout.jsx` | Skip link, `<main tabIndex=-1>` | Low |
| `Splash.jsx` | Overlay | Low |

### Critical Issues (Must Fix)
| # | Issue | WCAG Criterion | File(s) | Impact | Fix |
|---|-------|---------------|---------|--------|-----|
| 1 | No `<h1>` on /work, /about, /impact, /skills, /experience, /services | 1.3.1, 2.4.6 | `SectionHeading.jsx`, pages | Heading navigation has no page title | `as="h1"` for the first heading per page |
| 2 | Form errors not announced or linked to fields. Success replaces the form and focus drops to `<body>` | 3.3.1, 3.3.3, 4.1.3 | `ProposalForm.jsx` | Screen reader users don't learn that submission failed or succeeded | `role="alert"` summary, `aria-invalid` + `aria-describedby` per field, focus the first error. Focus a `role="status"` success panel |

### Recommendations
| # | Issue | WCAG Criterion | Fix |
|---|-------|---------------|-----|
| 1 | 13× "Live Demo" and 13× "Case Study" with identical names | 2.4.4 | Add a visually hidden project name |
| 2 | Logo link's accessible name is "X logo" (describes the image, not the destination) | 2.4.4 | `alt={`Visit ${name}`}`, or `aria-hidden` the logo link (the Live site link already exists) |
| 3 | Form control borders 1.34:1 | 1.4.11 | ≥3:1 border token |
| 4 | Mobile menu: no Escape, no focus return | 2.1.1 (best practice) | Escape closes and returns focus to the toggle |
| 5 | Required checkbox group conveyed only by "*" in the legend | 3.3.2 | "(required)" text in the legend and an error on the fieldset |
| 6 | Splash overlay is `aria-hidden` but keyboard focus can reach the content behind it during the ~1.8s intro | 2.4.3 | Set `inert` on `main` and the header while the splash is active, or shorten it |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Indicate links that open in a new tab (visually hidden "(opens in new tab)") | Predictability |
| 2 | Larger footer nav targets (currently 13px text links) | Touch comfort (2.5.8 passes, but tight) |

### Keyboard Navigation Walkthrough
| Step | Action | Expected Focus | Expected Announcement | Plan Handles? |
|------|--------|---------------|----------------------|---------------|
| 1 | Tab on load | Skip link appears | "Skip to content, link" | ✅ |
| 2 | Enter on skip link | `<main>` | Main landmark | ✅ |
| 3 | Shift+Tab to header | Home logo link | "Karim Alrajjal home, link" | ✅ |
| 4 | Tab through nav | Each item, current page marked | "About, link, current page" | ✅ |
| 5 | Mobile: Enter on menu button | Button, menu opens | "Toggle menu, expanded" | ✅ (focus stays on the button) |
| 6 | Mobile: Escape | Menu closes, focus on the button | "collapsed" | ❌ |
| 7 | /work: Tab to "Case Study" | Button | "Case Study, button, collapsed" (×13 identical) | ⚠️ |
| 8 | Enter | Panel revealed | "expanded" | ✅ |
| 9 | Form: Tab through fields | Each labelled field | Label + "required" | ✅ |
| 10 | Submit with missing fields | First invalid field | Error message | ❌ (generic text, not announced) |
| 11 | Submit successfully | Success message | "Got it, thanks" | ❌ (focus lost) |

### ARIA Checklist
| Element | Role | Label | States | Keyboard | Notes |
|---------|------|-------|--------|----------|-------|
| Skip link | link | "Skip to content" | – | ✅ | Good |
| Primary nav | navigation | "Primary" | `aria-current` | ✅ | Indicator is `aria-hidden` ✅ |
| Mobile toggle | button | "Toggle menu" | `aria-expanded`, `aria-controls` | ⚠️ no Escape | – |
| Case Study toggle | button | "Case Study" | `aria-expanded`, `aria-controls` | ✅ | Name not unique |
| KR mark / canvas / splash | – | `aria-hidden` | – | – | ✅ decorative |
| Form inputs | textbox/select/checkbox | `<label for>` | `required` | ✅ | No `aria-invalid` |
| Honeypot | – | `aria-hidden` + `tabIndex=-1` | – | – | ✅ |
| Form status | – | – | – | – | ❌ needs `role="alert"` / `role="status"` |

### Verdict Details
- Screen Reader Compatibility: CONCERNS (headings, form status)
- Keyboard Navigation: PASS (minor Escape gap)
- Focus Management: CONCERNS (form success/error)
- Color Contrast: PASS for text, CONCERNS for control borders
- Motion Sensitivity: PASS
