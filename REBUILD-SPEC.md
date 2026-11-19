# Lane Risk Desk v2 - high-fidelity rebuild spec

Rebuild this static demo into a real working product with a live backend. Maps to Ekho Labs (ekholabs.com, YC S26): prescriptive reroute decisions for freight teams - "Your TMS shows the news. Ekho shows the reroute." Lane Risk Desk turns a cited disruption event into a concrete reroute decision with reasoning, and now keeps working state: refreshed sources, saved decision runs, per-owner assumptions, decision audit.

Do not deploy, do not git commit, do not push. No paid services or API keys.

## Architecture
- Next.js App Router + TypeScript + Tailwind, SERVER runtime (remove output:'export').
- Drizzle ORM: SQLite (lanerisk.db) dev; Postgres via DATABASE_URL prod.
- Keep lib/engine.ts as the deterministic core (it is good and unit-tested) - same math, now server-side, with engine unit tests still passing (npm test).
- Keep the existing data model and provenance discipline (data/disruptions.json, lanes.json, sources.json as the SEED) - port into DB tables with an explicit seed migration. Estimates stay tagged estimate; cited facts stay cited with source URL + verbatim quote + revision id.

## Product workflow (fitted to THIS product)
1. Home = decision desk: lane picker with corridor status badges + the decision form (PO value, required window) above the fold. Below: the owner's saved decision runs (newest first) with lane, recommendation, days/cost delta, and data-version stamp.
2. Run a decision: POST /api/decisions {laneId, poValue, windowDays, assumptions?}. Server runs the engine against the CURRENT disruption dataset, stores the run + full reasoning + the dataset version id, returns it. Reasoning panel: original vs recommended, days, cost delta, surcharge exposure, and the cited disruption fact driving it - with the citation.
3. Disruption briefs page: each corridor with status, effective date, cited facts (quote + source link + Wikipedia revision id + fetch time), and the honest-limits panel (what is estimate, what is cited, what analogy was applied) - carry the current README honesty notes into the UI.
4. Source refresh: POST /api/sources/refresh re-fetches the Wikipedia extracts, re-verifies every quote VERBATIM, stores a provenance record (fetch time, revision ids, per-quote verified flag), and only swaps the active dataset if ALL quotes verify; otherwise keeps the old dataset and shows the failure honestly (which quote failed). Refresh history visible. Rate-limited hard (external fetch).
5. Assumptions drawer: carrying cost %/day, surcharge amounts - editable per owner, persisted, labeled as assumptions; every decision run records the assumption values it used.
6. Decision run detail: full reasoning, citations, dataset version, assumptions used, timestamp. Deletable (confirm).

## Truthfulness bar
- Every estimate labeled estimate in data and UI; every cited fact carries quote + source + revision + fetch time.
- Absence of a disruption entry is not an assurance - keep the Transpacific "hold" demonstration and its caveat.
- If a refresh fails verification, the UI shows the last-good dataset version and the failure - never silent stale.
- Footer: "Demo built by Vinil Polepalli - sources cited per disruption. Independent demo; not affiliated with or endorsed by Ekho Labs. Estimates are labeled; not logistics advice."

## Abuse and isolation controls
- Owner cookie (lr_uid, httpOnly); runs/assumptions owner-scoped; cross-owner 403/404.
- Rate limits: 2 source refreshes/hour/owner (external fetch), 60 decision runs/hour, 413 at 20KB; inputs validated (positive numbers, sane caps: PO <= 1e9, window 1-120 days).

## UI bar
- Light theme, near-white ground, hairlines, small-caps labels, tabular nums, system stack; mono only for quotes/log-style panels.
- Brand accent: deep crimson #9f1239 (hover #881337). Deliberate: risk-desk character for a disruption tool, outside the indigo/violet band, not cream/serif/sage, distinct from sibling demos (navy/teal/bronze). Comment the rationale in tailwind.config.ts. Semantic green/red only for cost-delta direction and status.
- Pills only for status chips; buttons 8px, cards 10px, inputs 8px; no gradients, no emoji icons, no hero+3-cards, no amber-50 fills. Schematic corridor SVG kept (it is good), restyled light.
- Layout fitted to a decision desk, not a clone of sibling demos. Mobile: stacked, original-vs-recommended becomes stacked cards.

## Definition of done
- npm run build + npm test pass.
- Real end-to-end: run server, run a decision on two lanes through the API, verify the engine output matches the same inputs against the engine directly (unit-level parity), verify runs persist across restart, owner isolation (fresh cookie sees empty), refresh endpoint verifies quotes and writes provenance (run it once for real), rate limit 429 after cap.
- python3 ~/unslop/devibe_scan.py . - zero high or justified unslop-ignore comments.
- README (architecture, run, provenance discipline preserved) + IMPLEMENTATION.md (data model, endpoints, verification results).
- Screenshots to /tmp: lr2-desk.png, lr2-decision.png, lr2-mobile.png (390px) from the RUNNING app.
