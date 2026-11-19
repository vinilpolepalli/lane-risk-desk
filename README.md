# Lane Risk Desk v2

Independent demo of a reroute decision layer ("Your TMS shows the news. Ekho shows the reroute."). Pick a lane, enter a PO value and required window; a deterministic TypeScript engine scores the original routing and each alternative, recommends one, and explains it with cited disruption facts. v2 adds a live backend: saved decision runs, per-owner assumptions, source refresh with verbatim quote re-verification, and a decision audit.

Independent demo by Vinil Polepalli; not affiliated with or endorsed by Ekho Labs. Estimates are labeled; not logistics advice.

## Architecture
- Next.js 15 App Router + TypeScript + Tailwind, server runtime (no static export).
- Drizzle ORM on SQLite (`lanerisk.db`, better-sqlite3). Migrations in `drizzle/` run at startup, followed by an explicit seed (`lib/db/seed.ts`) that ports `data/*.json` into tables and creates dataset version 1.
- `lib/engine.ts` is the unchanged deterministic core, now called server-side from `POST /api/decisions`.
- Owner isolation via an httpOnly `lr_uid` cookie issued by `middleware.ts`.
- **Postgres is not implemented.** If `DATABASE_URL` is a `postgres://` URL the app throws at first DB access. `DATABASE_URL=file:/path.db` selects a different SQLite file.

## Run
```
npm install
npm run build && npm start     # http://localhost:3000  (set LR_INSECURE_COOKIE=1 if serving production over plain http)
npm run dev
npm test                       # engine unit tests
npm run e2e                    # against a running server on :3111 (see IMPLEMENTATION.md)
```
No keys, no paid services. The only external call is the Wikipedia API during source refresh.

## Provenance discipline (preserved)
- `data/sources.json` holds each cited fact: verbatim quote, source URL. Facts are shown with quote, source link, Wikipedia revision id and fetch time.
- Refresh (`POST /api/sources/refresh`, button on `/briefs`) re-fetches the Wikipedia extracts, checks every quote verbatim, stores a provenance record, and swaps the active dataset only if ALL quotes verify. On failure the last-good version stays active and `/briefs` shows which quote failed.
- Estimates stay tagged estimate in data and UI. The only cited number the engine uses is the ~10-day Cape penalty; Mumbai-Felixstowe and Jebel Ali apply it by analogy (tagged estimate).
- Transpacific has no disruption entry and demonstrates "hold". Absence of an entry is not an assurance.
- Corridor statuses are editorial scenario assumptions, not a live feed.

## Decision engine
`transit = base days + disruption days (original only)`; `late = max(0, transit - window)`; `total = freight + expected surcharge + carrying + late penalty`. Suspended original routings are not bookable. Selection: cheapest bookable route meeting the window, else least late, then cheapest. Assumptions (carrying %/day, surcharge amounts and probabilities, etc.) are editable per owner and recorded on every run.

See `IMPLEMENTATION.md` for the data model, endpoints and verification results.
