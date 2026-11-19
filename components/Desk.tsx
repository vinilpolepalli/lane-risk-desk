'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Assumptions, DisruptionRec, Lane, RunResult } from '@/lib/types';
import { Panel, StatusBadge, btn, btn2, input } from './ui';
import ReasoningPanel from './ReasoningPanel';
import AssumptionsDrawer from './AssumptionsDrawer';
import Link from 'next/link';

export default function Desk({ lanes, disruptions, initial, note }: { lanes: Lane[]; disruptions: DisruptionRec[]; initial: Assumptions; note: string }) {
  const router = useRouter();
  const [laneId, setLaneId] = useState(lanes[0].id);
  const lane = lanes.find((l) => l.id === laneId)!;
  const [po, setPo] = useState(240000);
  const [windows, setWindows] = useState<Record<string, number>>({});
  const windowDays = windows[laneId] ?? Math.min(120, lane.routes[0].baseDays + lane.primaryDelayDays + 4);
  const [a, setA] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState<{ id: string; result: RunResult; windowDays: number } | null>(null);
  const status = (l: Lane) => disruptions.find((d) => d.id === l.disruptionId)?.status ?? l.status;

  async function run() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/decisions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ laneId, poValue: po, windowDays, assumptions: a }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error ?? 'Request failed'); return; }
      setRes({ id: j.id, result: j.result, windowDays: j.windowDays });
      router.refresh();
    } catch { setErr('Network error'); } finally { setBusy(false); }
  }

  return (
    <div className="mt-6">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Lane and corridor status">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Lane">
            {lanes.map((l) => (
              <button key={l.id} role="radio" aria-checked={l.id === laneId} onClick={() => setLaneId(l.id)}
                className={`flex flex-col items-start gap-1.5 rounded-ctl border px-3 py-2 text-left text-sm ${l.id === laneId ? 'border-accent bg-white ring-1 ring-accent' : 'border-line hover:border-mute'}`}>
                <span className="font-medium">{l.name}</span><StatusBadge status={status(l)} />
              </button>))}
          </div>
        </Panel>
        <Panel title="Decision" right={<button onClick={() => setOpen(true)} className={btn2}>Assumptions</button>}>
          <label className="block text-sm">PO value (USD)
            <input type="number" min={1} max={1e9} step={5000} value={po} onChange={(e) => setPo(Number(e.target.value) || 0)} className={`${input} mt-1`} /></label>
          <label className="mt-3 block text-sm">Required window (days from departure): <b>{windowDays}</b>
            <input type="range" min={3} max={120} value={windowDays} onChange={(e) => setWindows({ ...windows, [laneId]: Number(e.target.value) })} className="mt-2 w-full accent-accent" /></label>
          <p className="mt-1 text-[11px] text-mute">Default = original transit incl. disruption + 4d (estimate).</p>
          <button onClick={run} disabled={busy || po <= 0 || po > 1e9} className={`${btn} mt-3 w-full`}>{busy ? 'Running...' : 'Run decision'}</button>
          {err && <p className="mt-2 text-sm text-bad" role="alert">{err}</p>}
        </Panel>
      </div>
      {res && (
        <div className="mt-5"><Panel title={`Decision run · ${res.result.lane.name} · data v${res.result.datasetVersionId}`} right={<Link href={`/runs/${res.id}`} className="text-sm text-accent underline underline-offset-2">Open run detail</Link>}>
          <ReasoningPanel r={res.result} windowDays={res.windowDays} /></Panel></div>
      )}
      <AssumptionsDrawer open={open} onClose={() => setOpen(false)} a={a} set={setA} note={note} />
    </div>
  );
}
