# Implementation notes

## Data model (lib/db/schema.ts)
| Table | Purpose |
|---|---|
| sources, facts, disruptions, lanes, kv | Reference data seeded from `data/*.json` (quotes, URLs, statuses, routings, assumptions note) |
| dataset_versions | Versions of the verified dataset: provenance JSON (fetch time, revision ids per source, per-fact verified flag), `active` flag. v1 = seed with committed provenance |
| refreshes | Every refresh attempt: owner, ok, failures (which quote/fetch), provenance, activated version |
| decisions | Owner-scoped runs: inputs, assumptions used, full result (decision, lane snapshot, citations with revision/fetch time), dataset version id |
| owner_assumptions | Per-owner saved assumptions |
| rate_events | Sliding-window rate limiter (persists across restarts) |

## Endpoints
- `POST /api/decisions {laneId, poValue, windowDays, assumptions?}` -> 201 stored run. Assumptions merge: request over owner-saved over defaults.
- `GET /api/decisions`, `GET|DELETE /api/decisions/:id` (owner-scoped; other owners get 404).
- `GET|PUT|DELETE /api/assumptions` (PUT = patch over defaults, validated ranges).
- `POST /api/sources/refresh`, `GET /api/sources/refresh` (history). `GET /api/dataset`.
- Pages: `/` desk, `/briefs`, `/runs/:id`.

## Limits
Body cap 20KB (413). PO in (0, 1e9], window integer 1-120, assumption ranges validated (400). Decisions 60/h/owner, assumption writes 120/h/owner, refresh 2/h/owner plus a 6/h global ceiling and a single-flight lock (429/409).
Caveat: owner identity is an unsigned random UUID cookie; a client can mint fresh cookies, so per-owner limits are not a hard abuse barrier (hence the global refresh ceiling).

## Verification results (run 2026-11-17)
- `npm run build`, `npm test` (engine tests): pass; `tsc --noEmit` clean.
- `scripts/e2e.mts` against the running server: engine parity (deepStrictEqual of stored decision vs direct `decide()`) on sha-rtm and sha-lax, and with overridden assumptions; per-owner assumptions persisted and recorded; fresh cookie sees no runs and gets 404 on another owner's run GET/DELETE; validation 400s and 413; 429 on the 61st decision; real refresh against Wikipedia verified 13/13 quotes and activated a new dataset version; 3rd refresh attempt returned 429.
- Persistence: a run created before a server restart was fetched successfully after restart.
- `devibe_scan.py`: 0 high. Remaining medium findings are the status-chip pills, which the spec allows.
- Screenshots (from the running app): /tmp/lr2-desk.png, /tmp/lr2-decision.png, /tmp/lr2-mobile.png.

## Not done / known gaps
- Postgres via DATABASE_URL is not implemented (SQLite only).
- Refresh failure path was verified by code reading only; a live failed verification was not forced.
- Mobile saved-runs table scrolls horizontally rather than restacking.
