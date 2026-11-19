import { pgTable, text, integer, bigint, boolean, doublePrecision, index } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import type { Assumptions, Provenance, RunResult, Route, Status, Basis } from '../types';

/** JSON stored as TEXT, exactly like the SQLite schema's `text(..., { mode: 'json' })`. */
const jsonText = <T>() => customType<{ data: T; driverData: string }>({
  dataType: () => 'text',
  toDriver: (v) => JSON.stringify(v),
  fromDriver: (v) => JSON.parse(v),
});
const idCol = () => integer('id').primaryKey().generatedAlwaysAsIdentity();

export const sources = pgTable('sources', {
  id: text('id').primaryKey(), title: text('title').notNull(), publisher: text('publisher').notNull(), url: text('url').notNull(),
  apiTitle: text('api_title'), verify: boolean('verify').notNull(), note: text('note'),
});
export const facts = pgTable('facts', {
  id: text('id').primaryKey(), sourceId: text('source_id').notNull().references(() => sources.id),
  quote: text('quote').notNull(), text: text('text').notNull(),
});
export const disruptions = pgTable('disruptions', {
  id: text('id').primaryKey(), corridor: text('corridor').notNull(), status: text('status').$type<Status>().notNull(),
  effectiveDate: text('effective_date'), headline: text('headline').notNull(), statusNote: text('status_note').notNull(),
  factIds: jsonText<string[]>()('fact_ids').notNull(), sortOrder: integer('sort_order').notNull(),
});
export const lanes = pgTable('lanes', {
  id: text('id').primaryKey(), name: text('name').notNull(), origin: text('origin').notNull(), dest: text('dest').notNull(),
  disruptionId: text('disruption_id').notNull().references(() => disruptions.id), status: text('status').$type<Status>().notNull(),
  primaryDelayDays: integer('primary_delay_days').notNull(), primaryDelayBasis: text('primary_delay_basis').$type<Basis>().notNull(),
  primaryDelayFactId: text('primary_delay_fact_id'), routes: jsonText<Route[]>()('routes').notNull(),
  sortOrder: integer('sort_order').notNull(),
});
export const kv = pgTable('kv', { key: text('key').primaryKey(), value: text('value').notNull() });

export const refreshes = pgTable('refreshes', {
  id: idCol(), ownerId: text('owner_id').notNull(), startedAt: text('started_at').notNull(),
  ok: boolean('ok').notNull(), failures: jsonText<string[]>()('failures').notNull(),
  provenance: jsonText<Provenance>()('provenance').notNull(), datasetVersionId: integer('dataset_version_id'),
});
export const datasetVersions = pgTable('dataset_versions', {
  id: idCol(), createdAt: text('created_at').notNull(), kind: text('kind').$type<'seed' | 'refresh'>().notNull(),
  refreshId: integer('refresh_id'), provenance: jsonText<Provenance>()('provenance').notNull(),
  active: boolean('active').notNull(),
});
export const decisions = pgTable('decisions', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), laneId: text('lane_id').notNull(),
  poValue: doublePrecision('po_value').notNull(), windowDays: integer('window_days').notNull(),
  assumptions: jsonText<Assumptions>()('assumptions').notNull(),
  result: jsonText<RunResult>()('result').notNull(),
  datasetVersionId: integer('dataset_version_id').notNull().references(() => datasetVersions.id), createdAt: text('created_at').notNull(),
}, (t) => [index('decisions_owner_idx').on(t.ownerId, t.createdAt)]);
export const ownerAssumptions = pgTable('owner_assumptions', {
  ownerId: text('owner_id').primaryKey(), assumptions: jsonText<Assumptions>()('assumptions').notNull(), updatedAt: text('updated_at').notNull(),
});
export const rateEvents = pgTable('rate_events', {
  id: idCol(), ownerId: text('owner_id').notNull(), kind: text('kind').notNull(), at: bigint('at', { mode: 'number' }).notNull(),
}, (t) => [index('rate_idx').on(t.ownerId, t.kind, t.at)]);
