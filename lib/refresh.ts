import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { loadDataset } from './repo';
import type { Provenance } from './types';

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
let running = false;

/** Re-fetch Wikipedia extracts, verify every quote verbatim, record provenance. Swap the active dataset only if ALL quotes verify. */
export async function runRefresh(owner: string) {
  if (running) return { busy: true as const };
  running = true;
  try {
    const ds = await loadDataset();
    const prov: Provenance = { fetchedAt: new Date().toISOString(), sources: {}, facts: {} };
    const failures: string[] = [];
    for (const s of ds.sources) {
      if (!s.verify) { prov.sources[s.id] = { status: 'link-only' }; continue; }
      const api = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|revisions&rvprop=ids|timestamp&explaintext=1&format=json&redirects=1&titles=${encodeURIComponent(s.apiTitle ?? '')}`;
      const mine = ds.facts.filter((f) => f.sourceId === s.id);
      try {
        const r = await fetch(api, { headers: { 'User-Agent': 'lane-risk-desk/2.0 (independent demo; source verification)' }, signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const page = Object.values((await r.json()).query.pages)[0] as { extract?: string; revisions?: { revid: number; timestamp: string }[] };
        const text = norm(page.extract ?? '');
        prov.sources[s.id] = { status: 'fetched', chars: text.length, revisionId: page.revisions?.[0]?.revid, revisionTime: page.revisions?.[0]?.timestamp };
        for (const f of mine) {
          const ok = text.includes(norm(f.quote));
          prov.facts[f.id] = ok;
          if (!ok) failures.push(`${f.id}: quote not found verbatim in "${s.title}"`);
        }
      } catch (e) {
        prov.sources[s.id] = { status: 'error', error: String(e) };
        for (const f of mine) prov.facts[f.id] = false;
        failures.push(`${s.id}: fetch failed (${String(e)})`);
      }
    }
    const ok = failures.length === 0;
    const db = await getDb();
    return await db.tx(async ({ orm: tx, t }) => {
      const [ref] = await tx.insert(t.refreshes).values({ ownerId: owner, startedAt: prov.fetchedAt, ok, failures, provenance: prov, datasetVersionId: null }).returning();
      let versionId: number | null = null;
      if (ok) {
        await tx.update(t.datasetVersions).set({ active: false }).where(eq(t.datasetVersions.active, true));
        versionId = (await tx.insert(t.datasetVersions).values({ createdAt: prov.fetchedAt, kind: 'refresh', refreshId: ref.id, provenance: prov, active: true }).returning())[0].id;
        await tx.update(t.refreshes).set({ datasetVersionId: versionId }).where(eq(t.refreshes.id, ref.id));
      }
      return { busy: false as const, ok, failures, refreshId: ref.id, datasetVersionId: versionId, provenance: prov };
    });
  } finally { running = false; }
}
