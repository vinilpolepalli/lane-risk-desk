/** Postgres bootstrap DDL, mirroring drizzle/0000_*.sql (SQLite). JSON stays TEXT; epoch millis are BIGINT. */
export const PG_DDL = [
  `CREATE TABLE IF NOT EXISTS "dataset_versions" ("id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, "created_at" TEXT NOT NULL, "kind" TEXT NOT NULL, "refresh_id" INTEGER, "provenance" TEXT NOT NULL, "active" BOOLEAN NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "decisions" ("id" TEXT PRIMARY KEY, "owner_id" TEXT NOT NULL, "lane_id" TEXT NOT NULL, "po_value" DOUBLE PRECISION NOT NULL, "window_days" INTEGER NOT NULL, "assumptions" TEXT NOT NULL, "result" TEXT NOT NULL, "dataset_version_id" INTEGER NOT NULL REFERENCES "dataset_versions"("id"), "created_at" TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "decisions_owner_idx" ON "decisions" ("owner_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "disruptions" ("id" TEXT PRIMARY KEY, "corridor" TEXT NOT NULL, "status" TEXT NOT NULL, "effective_date" TEXT, "headline" TEXT NOT NULL, "status_note" TEXT NOT NULL, "fact_ids" TEXT NOT NULL, "sort_order" INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "sources" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "publisher" TEXT NOT NULL, "url" TEXT NOT NULL, "api_title" TEXT, "verify" BOOLEAN NOT NULL, "note" TEXT)`,
  `CREATE TABLE IF NOT EXISTS "facts" ("id" TEXT PRIMARY KEY, "source_id" TEXT NOT NULL REFERENCES "sources"("id"), "quote" TEXT NOT NULL, "text" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "kv" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "lanes" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "origin" TEXT NOT NULL, "dest" TEXT NOT NULL, "disruption_id" TEXT NOT NULL REFERENCES "disruptions"("id"), "status" TEXT NOT NULL, "primary_delay_days" INTEGER NOT NULL, "primary_delay_basis" TEXT NOT NULL, "primary_delay_fact_id" TEXT, "routes" TEXT NOT NULL, "sort_order" INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "owner_assumptions" ("owner_id" TEXT PRIMARY KEY, "assumptions" TEXT NOT NULL, "updated_at" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "rate_events" ("id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, "owner_id" TEXT NOT NULL, "kind" TEXT NOT NULL, "at" BIGINT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "rate_idx" ON "rate_events" ("owner_id", "kind", "at")`,
  `CREATE TABLE IF NOT EXISTS "refreshes" ("id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, "owner_id" TEXT NOT NULL, "started_at" TEXT NOT NULL, "ok" BOOLEAN NOT NULL, "failures" TEXT NOT NULL, "provenance" TEXT NOT NULL, "dataset_version_id" INTEGER)`,
];
