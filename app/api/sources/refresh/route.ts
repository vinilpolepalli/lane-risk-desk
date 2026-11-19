import { json, ownerId, rateHit, tooMany } from '@/lib/http';
import { runRefresh } from '@/lib/refresh';
import { listRefreshes } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function GET() { return json({ refreshes: await listRefreshes() }); }

/** External fetch: 2/hour/owner, plus a 6/hour global ceiling so fresh cookies cannot be used to hammer Wikipedia. */
export async function POST() {
  const owner = await ownerId();
  const g = await rateHit('*', 'refresh-global', 6);
  if (!g.ok) return tooMany(g.retryAfter);
  const rl = await rateHit(owner, 'refresh', 2);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const r = await runRefresh(owner);
  if (r.busy) return json({ error: 'A refresh is already running' }, 409);
  return json(r, r.ok ? 200 : 502);
}
