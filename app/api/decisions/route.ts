import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/db';
import { json, ownerId, rateHit, readJson, tooMany } from '@/lib/http';
import { citeFact, getOwnerAssumptions, laneFactIds, listRuns, loadDataset, statusMap } from '@/lib/repo';
import { mergeAssumptions, parseInputs, DEFAULT_ASSUMPTIONS } from '@/lib/validate';
import { decide } from '@/lib/engine';
import type { RunResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const owner = await ownerId();
  return json({ runs: await listRuns(owner) });
}

export async function POST(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  let inp, assumptions;
  try {
    inp = parseInputs(body.body);
    const saved = (await getOwnerAssumptions(owner))?.assumptions ?? DEFAULT_ASSUMPTIONS;
    assumptions = mergeAssumptions(saved, inp.assumptions);
  } catch (e) { return json({ error: (e as Error).message }, 400); }
  const ds = await loadDataset();
  const lane = ds.lanes.find((l) => l.id === inp.laneId);
  if (!lane) return json({ error: 'Unknown laneId' }, 404);
  const rl = await rateHit(owner, 'decision', 60);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const disruption = ds.disruptions.find((d) => d.id === lane.disruptionId)!;
  const result: RunResult = {
    decision: decide(lane, { poValue: inp.poValue, windowDays: inp.windowDays }, assumptions), lane, disruption,
    citations: laneFactIds(lane, disruption).map((id) => citeFact(ds, id)), disruptionStatus: statusMap(ds), datasetVersionId: ds.versionId, assumptionsNote: ds.note,
  };
  const { orm, t } = await getDb();
  const [row] = await orm.insert(t.decisions).values({
    id: randomUUID(), ownerId: owner, laneId: lane.id, poValue: inp.poValue, windowDays: inp.windowDays, assumptions, result,
    datasetVersionId: ds.versionId, createdAt: new Date().toISOString(),
  }).returning();
  return json(row, 201);
}
