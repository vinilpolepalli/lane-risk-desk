import { and, desc, eq } from 'drizzle-orm';
import { getDb, type Schema } from './db';
import type { CitedFact, DisruptionRec, Lane, Provenance, Status } from './types';

export interface Dataset {
  versionId: number; kind: 'seed' | 'refresh'; createdAt: string; provenance: Provenance;
  lanes: Lane[]; disruptions: DisruptionRec[]; sources: (Schema['sources']['$inferSelect'])[]; facts: (Schema['facts']['$inferSelect'])[]; note: string;
}

export async function loadDataset(versionId?: number): Promise<Dataset> {
  const { orm: db, t } = await getDb();
  const [v] = await db.select().from(t.datasetVersions).where(versionId ? eq(t.datasetVersions.id, versionId) : eq(t.datasetVersions.active, true));
  const lanes = (await db.select().from(t.lanes).orderBy(t.lanes.sortOrder)).map((l) => ({
    id: l.id, name: l.name, origin: l.origin, dest: l.dest, disruptionId: l.disruptionId, status: l.status,
    primaryDelayDays: l.primaryDelayDays, primaryDelayBasis: l.primaryDelayBasis, primaryDelayFactId: l.primaryDelayFactId ?? undefined, routes: l.routes,
  })) as Lane[];
  const disruptions = (await db.select().from(t.disruptions).orderBy(t.disruptions.sortOrder)).map(({ sortOrder: _o, ...d }) => d) as DisruptionRec[];
  const note = (await db.select().from(t.kv).where(eq(t.kv.key, 'assumptionsNote')))[0]?.value ?? '';
  return { versionId: v.id, kind: v.kind, createdAt: v.createdAt, provenance: v.provenance, lanes, disruptions, sources: await db.select().from(t.sources), facts: await db.select().from(t.facts), note };
}

export function citeFact(ds: Dataset, id: string): CitedFact {
  const f = ds.facts.find((x) => x.id === id)!;
  const src = ds.sources.find((x) => x.id === f.sourceId)!;
  const ps = ds.provenance.sources[src.id];
  return {
    id, text: f.text, quote: f.quote, sourceTitle: src.title, publisher: src.publisher, url: src.url,
    revisionId: ps?.revisionId ?? null, revisionTime: ps?.revisionTime ?? null, fetchedAt: ds.provenance.fetchedAt, verified: ds.provenance.facts[id] === true,
  };
}
/** Facts for a lane: the cited delay fact first (it drives the engine), then the corridor's facts. */
export function laneFactIds(lane: Lane, d: DisruptionRec): string[] {
  return [...(lane.primaryDelayFactId ? [lane.primaryDelayFactId] : []), ...d.factIds.filter((x) => x !== lane.primaryDelayFactId)];
}
export const statusMap = (ds: Dataset) => Object.fromEntries(ds.disruptions.map((d) => [d.id, d.status])) as Record<string, Status>;

export async function listRefreshes() { const { orm, t } = await getDb(); return orm.select().from(t.refreshes).orderBy(desc(t.refreshes.id)).limit(20); }
export async function listRuns(owner: string) { const { orm, t } = await getDb(); return orm.select().from(t.decisions).where(eq(t.decisions.ownerId, owner)).orderBy(desc(t.decisions.createdAt)); }
export async function getRun(owner: string, id: string) { const { orm, t } = await getDb(); return (await orm.select().from(t.decisions).where(and(eq(t.decisions.id, id), eq(t.decisions.ownerId, owner))))[0]; }
export async function getOwnerAssumptions(owner: string) { const { orm, t } = await getDb(); return (await orm.select().from(t.ownerAssumptions).where(eq(t.ownerAssumptions.ownerId, owner)))[0]; }
