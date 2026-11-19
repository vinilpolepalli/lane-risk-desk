import { getDb } from '@/lib/db';
import { json, ownerId, rateHit, readJson, tooMany } from '@/lib/http';
import { getOwnerAssumptions } from '@/lib/repo';
import { DEFAULT_ASSUMPTIONS, mergeAssumptions } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const a = await getOwnerAssumptions(await ownerId());
  return json({ assumptions: a?.assumptions ?? DEFAULT_ASSUMPTIONS, custom: !!a, label: 'Editable assumptions, not sourced data' });
}
export async function PUT(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  let merged;
  try { merged = mergeAssumptions(DEFAULT_ASSUMPTIONS, body.body); } catch (e) { return json({ error: (e as Error).message }, 400); }
  const rl = await rateHit(owner, 'assumptions', 120);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const updatedAt = new Date().toISOString();
  const { orm, t } = await getDb();
  await orm.insert(t.ownerAssumptions).values({ ownerId: owner, assumptions: merged, updatedAt })
    .onConflictDoUpdate({ target: t.ownerAssumptions.ownerId, set: { assumptions: merged, updatedAt } });
  return json({ assumptions: merged, custom: true });
}
export async function DELETE() {
  const { eq } = await import('drizzle-orm');
  const owner = await ownerId();
  const { orm, t } = await getDb();
  await orm.delete(t.ownerAssumptions).where(eq(t.ownerAssumptions.ownerId, owner));
  return json({ assumptions: DEFAULT_ASSUMPTIONS, custom: false });
}
