import type { Provenance } from '../types';
import lanesJson from '../../data/lanes.json';
import disruptionsJson from '../../data/disruptions.json';
import sourcesJson from '../../data/sources.json';
import provenanceJson from '../../data/provenance.json';
import { sql } from 'drizzle-orm';
import type { Db } from './index';

/** Explicit seed migration: data/*.json -> tables, plus dataset version 1 stamped with the committed provenance.json. */
export async function seedIfEmpty(db: Db) {
  await db.tx(async (c) => {
    const s = c.t; const tx = c.orm;
    if (c.kind === 'postgres') await (tx as unknown as { execute(q: unknown): Promise<unknown> }).execute(sql`SELECT pg_advisory_xact_lock(7316401)`); // serialize concurrent first boots
    if ((await tx.select().from(s.datasetVersions).limit(1)).length) return;
    for (const x of sourcesJson.sources) {
      await tx.insert(s.sources).values({ id: x.id, title: x.title, publisher: x.publisher, url: x.url, apiTitle: (x as { apiTitle?: string }).apiTitle ?? null, verify: x.verify, note: (x as { note?: string }).note ?? null });
    }
    for (const f of sourcesJson.facts) await tx.insert(s.facts).values(f);
    for (const [i, d] of disruptionsJson.entries()) await tx.insert(s.disruptions).values({ ...d, status: d.status as never, sortOrder: i });
    for (const [i, l] of lanesJson.lanes.entries()) await tx.insert(s.lanes).values({
      id: l.id, name: l.name, origin: l.origin, dest: l.dest, disruptionId: l.disruptionId, status: l.status as never,
      primaryDelayDays: l.primaryDelayDays, primaryDelayBasis: l.primaryDelayBasis as never, primaryDelayFactId: l.primaryDelayFactId ?? null,
      routes: l.routes as never, sortOrder: i,
    });
    await tx.insert(s.kv).values({ key: 'assumptionsNote', value: lanesJson.assumptionsNote });
    const p = provenanceJson as unknown as { retrievedAt: string; sources: Provenance["sources"]; facts: Record<string, boolean> };
    await tx.insert(s.datasetVersions).values({
      createdAt: p.retrievedAt, kind: 'seed', refreshId: null, active: true,
      provenance: { fetchedAt: p.retrievedAt, sources: p.sources, facts: p.facts },
    });
  });
}
