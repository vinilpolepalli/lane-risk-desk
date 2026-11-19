// End-to-end checks against a RUNNING server: node --experimental-strip-types scripts/e2e.mts [baseUrl]
// Also: `... persist <runId> <cookie>` checks a run survives a server restart.
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { decide, DEFAULT_ASSUMPTIONS as A } from '../lib/engine.ts';

const base = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://127.0.0.1:3111';
const { lanes } = JSON.parse(readFileSync(new URL('../data/lanes.json', import.meta.url), 'utf8'));
const L = (id: string) => lanes.find((l: any) => l.id === id);

async function owner() {
  const r = await fetch(base + '/api/decisions');
  const c = r.headers.get('set-cookie') ?? '';
  assert.match(c, /lr_uid=[0-9a-f-]{36}/); assert.match(c, /HttpOnly/i);
  return c.split(';')[0];
}
const call = (cookie: string, path: string, method = 'GET', body?: unknown, raw?: string) =>
  fetch(base + path, { method, headers: { cookie, 'content-type': 'application/json' }, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });

if (process.argv[2] === 'persist') {
  const [, , , id, cookie] = process.argv;
  const r = await call(cookie, `/api/decisions/${id}`); assert.equal(r.status, 200); console.log('persist ok', id); process.exit(0);
}

const A1 = await owner();
let ids: string[] = [];
for (const [laneId, poValue, windowDays] of [['sha-rtm', 240000, 45], ['sha-lax', 100000, 25]] as const) {
  const r = await call(A1, '/api/decisions', 'POST', { laneId, poValue, windowDays });
  assert.equal(r.status, 201); const j = await r.json(); ids.push(j.id);
  assert.deepStrictEqual(j.result.decision, decide(L(laneId), { poValue, windowDays }, A));
  assert.equal(j.result.datasetVersionId, 1 <= j.datasetVersionId ? j.datasetVersionId : 1);
  console.log(`parity ok ${laneId}: ${j.result.decision.recommended.route.id}, assumptions recorded`, Object.keys(j.assumptions).length);
}
// assumption override parity + recorded
{
  const over = { carryPctPerDay: 0.2, surchargePerFEU: { suspended: 3000 } };
  const r = await call(A1, '/api/decisions', 'POST', { laneId: 'sha-rtm', poValue: 500000, windowDays: 50, assumptions: over });
  const j = await r.json(); assert.equal(r.status, 201);
  const exp = { ...A, carryPctPerDay: 0.2, surchargePerFEU: { ...A.surchargePerFEU, suspended: 3000 } };
  assert.deepStrictEqual(j.assumptions, exp);
  assert.deepStrictEqual(j.result.decision, decide(L('sha-rtm'), { poValue: 500000, windowDays: 50 }, exp));
  console.log('override parity ok');
}
// persisted assumptions per owner
{
  const r = await call(A1, '/api/assumptions', 'PUT', { latePenaltyPctPerDay: 1 }); assert.equal(r.status, 200);
  const j = await (await call(A1, '/api/decisions', 'POST', { laneId: 'sha-rtm', poValue: 100000, windowDays: 40 })).json();
  assert.equal(j.assumptions.latePenaltyPctPerDay, 1);
  const B0 = await owner(); const g = await (await call(B0, '/api/assumptions')).json();
  assert.equal(g.assumptions.latePenaltyPctPerDay, A.latePenaltyPctPerDay); assert.equal(g.custom, false);
  await call(A1, '/api/assumptions', 'DELETE'); console.log('per-owner assumptions ok');
}
// isolation
const B = await owner();
assert.deepStrictEqual((await (await call(B, '/api/decisions')).json()).runs, []);
assert.equal((await call(B, `/api/decisions/${ids[0]}`)).status, 404);
assert.equal((await call(B, `/api/decisions/${ids[0]}`, 'DELETE')).status, 404);
assert.equal((await call(A1, `/api/decisions/${ids[0]}`)).status, 200);
console.log('isolation ok');
// validation + body cap
for (const bad of [{ laneId: 'sha-rtm', poValue: -5, windowDays: 30 }, { laneId: 'sha-rtm', poValue: 2e9, windowDays: 30 }, { laneId: 'sha-rtm', poValue: 1000, windowDays: 0 },
  { laneId: 'sha-rtm', poValue: 1000, windowDays: 121 }, { laneId: 'sha-rtm', poValue: '1000', windowDays: 30 }, { laneId: 'sha-rtm', poValue: 1000, windowDays: 30, assumptions: { bogus: 1 } }])
  assert.equal((await call(B, '/api/decisions', 'POST', bad)).status, 400);
assert.equal((await call(B, '/api/decisions', 'POST', { laneId: 'nope', poValue: 1000, windowDays: 30 })).status, 404);
assert.equal((await call(B, '/api/decisions', 'POST', undefined, JSON.stringify({ laneId: 'x'.repeat(21000) }))).status, 413);
console.log('validation + 413 ok');
// decision rate limit (fresh owner: 60 ok, 61st 429)
{
  const C = await owner(); let last = 0;
  for (let i = 0; i < 61; i++) { last = (await call(C, '/api/decisions', 'POST', { laneId: 'sha-lax', poValue: 1000 + i, windowDays: 30 })).status; if (i < 60) assert.equal(last, 201); }
  assert.equal(last, 429); console.log('decision rate limit ok (429 on 61st)');
}
// delete
assert.equal((await call(A1, `/api/decisions/${ids[1]}`, 'DELETE')).status, 200);
assert.equal((await call(A1, `/api/decisions/${ids[1]}`)).status, 404);
// real refresh then cap
{
  const D = await owner();
  const r = await call(D, '/api/sources/refresh', 'POST'); const j = await r.json();
  console.log('refresh status', r.status, j.ok ? `verified ${Object.keys(j.provenance.facts).length} quotes, dataset v${j.datasetVersionId}` : j.failures ?? j);
  assert.ok([200, 502].includes(r.status));
  assert.equal((await call(D, '/api/sources/refresh', 'POST')).status < 500, true);
  assert.equal((await call(D, '/api/sources/refresh', 'POST')).status, 429); console.log('refresh rate limit ok (429 on 3rd)');
}
console.log('KEEP', ids[0], A1);
