import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { json, ownerId } from '@/lib/http';
import { getRun } from '@/lib/repo';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const run = await getRun(await ownerId(), (await params).id);
  return run ? json(run) : json({ error: 'Not found' }, 404);
}
export async function DELETE(_: Request, { params }: Ctx) {
  const owner = await ownerId(); const { id } = await params;
  const { orm, t } = await getDb();
  const res = await orm.delete(t.decisions).where(and(eq(t.decisions.id, id), eq(t.decisions.ownerId, owner))).returning({ id: t.decisions.id });
  return res.length ? json({ deleted: id }) : json({ error: 'Not found' }, 404);
}
