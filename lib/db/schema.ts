import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import type { Assumptions, Provenance, RunResult, Route, Status, Basis } from '../types';

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(), title: text('title').notNull(), publisher: text('publisher').notNull(), url: text('url').notNull(),
  apiTitle: text('api_title'), verify: integer('verify', { mode: 'boolean' }).notNull(), note: text('note'),
});
export const facts = sqliteTable('facts', {
  id: text('id').primaryKey(), sourceId: text('source_id').notNull().references(() => sources.id),
  quote: text('quote').notNull(), text: text('text').notNull(),
});
export const disruptions = sqliteTable('disruptions', {
  id: text('id').primaryKey(), corridor: text('corridor').notNull(), status: text('status').$type<Status>().notNull(),
  effectiveDate: text('effective_date'), headline: text('headline').notNull(), statusNote: text('status_note').notNull(),
  factIds: text('fact_ids', { mode: 'json' }).$type<string[]>().notNull(), sortOrder: integer('sort_order').notNull(),
});
export const lanes = sqliteTable('lanes', {
  id: text('id').primaryKey(), name: text('name').notNull(), origin: text('origin').notNull(), dest: text('dest').notNull(),
  disruptionId: text('disruption_id').notNull().references(() => disruptions.id), status: text('status').$type<Status>().notNull(),
  primaryDelayDays: integer('primary_delay_days').notNull(), primaryDelayBasis: text('primary_delay_basis').$type<Basis>().notNull(),
  primaryDelayFactId: text('primary_delay_fact_id'), routes: text('routes', { mode: 'json' }).$type<Route[]>().notNull(),
  sortOrder: integer('sort_order').notNull(),
});
export const kv = sqliteTable('kv', { key: text('key').primaryKey(), value: text('value').notNull() });

export const refreshes = sqliteTable('refreshes', {
  id: integer('id').primaryKey({ autoIncrement: true }), ownerId: text('owner_id').notNull(), startedAt: text('started_at').notNull(),
  ok: integer('ok', { mode: 'boolean' }).notNull(), failures: text('failures', { mode: 'json' }).$type<string[]>().notNull(),
  provenance: text('provenance', { mode: 'json' }).$type<Provenance>().notNull(), datasetVersionId: integer('dataset_version_id'),
});
export const datasetVersions = sqliteTable('dataset_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }), createdAt: text('created_at').notNull(), kind: text('kind').$type<'seed' | 'refresh'>().notNull(),
  refreshId: integer('refresh_id'), provenance: text('provenance', { mode: 'json' }).$type<Provenance>().notNull(),
  active: integer('active', { mode: 'boolean' }).notNull(),
});
export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), laneId: text('lane_id').notNull(),
  poValue: real('po_value').notNull(), windowDays: integer('window_days').notNull(),
  assumptions: text('assumptions', { mode: 'json' }).$type<Assumptions>().notNull(),
  result: text('result', { mode: 'json' }).$type<RunResult>().notNull(),
  datasetVersionId: integer('dataset_version_id').notNull().references(() => datasetVersions.id), createdAt: text('created_at').notNull(),
}, (t) => [index('decisions_owner_idx').on(t.ownerId, t.createdAt)]);
export const ownerAssumptions = sqliteTable('owner_assumptions', {
  ownerId: text('owner_id').primaryKey(), assumptions: text('assumptions', { mode: 'json' }).$type<Assumptions>().notNull(), updatedAt: text('updated_at').notNull(),
});
export const rateEvents = sqliteTable('rate_events', {
  id: integer('id').primaryKey({ autoIncrement: true }), ownerId: text('owner_id').notNull(), kind: text('kind').notNull(), at: integer('at').notNull(),
}, (t) => [index('rate_idx').on(t.ownerId, t.kind, t.at)]);
export type LaneRow = typeof lanes.$inferSelect;
