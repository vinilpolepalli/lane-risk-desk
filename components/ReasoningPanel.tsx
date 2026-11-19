import type { RouteEval, RunResult } from '@/lib/types';
import { money, fmtDate } from '@/lib/format';
import { BasisTag, StatusBadge } from './ui';
import CorridorDiagram from './CorridorDiagram';

function Side({ e, r, rec, status }: { e: RouteEval; r: RunResult; rec: boolean; status: React.ReactNode }) {
  const row = (k: string, v: React.ReactNode) => (<div className="flex justify-between gap-3 border-b border-line py-1.5 text-sm"><dt className="text-mute">{k}</dt><dd className="text-right tabular-nums">{v}</dd></div>);
  return (
    <div className={`rounded-card border p-4 ${rec ? 'border-accent' : 'border-line bg-ground'}`}>
      <div className="flex items-center justify-between gap-2"><span className={`label ${rec ? '!text-accent' : ''}`}>{rec ? 'Recommended' : 'Original routing'}</span>{status}</div>
      <div className="mt-2 text-lg font-semibold leading-snug">{e.route.label}</div>
      <dl className="mt-3">
        {row('Transit', <>{e.transitDays} days<BasisTag basis={e.route.daysBasis} />{e.disruptionDays > 0 && <span className="block text-[11px] text-mute">incl. +{e.disruptionDays}d disruption<BasisTag basis={r.lane.primaryDelayBasis} /></span>}</>)}
        {row('Vs. window', e.meetsWindow ? <span className="text-good">on time</span> : <span className="text-bad">{e.lateDays}d late</span>)}
        {row('Freight', <>{money(e.freight)}<BasisTag basis="estimate" /></>)}
        {row('Surcharge (expected)', <>{money(e.surchargeExpected)}<span className="block text-[11px] text-mute">exposure {money(e.surchargeExposure)}</span></>)}
        {row('Carrying cost', money(e.carrying))}
        {row('Late penalty', money(e.latePenalty))}
        {row('Total risk-cost', <b className="text-base">{money(e.total)}</b>)}
        {row('Book by', <>≥ {e.route.bookByDays}d before cargo-ready<BasisTag basis="estimate" /></>)}
      </dl>
    </div>
  );
}

export default function ReasoningPanel({ r, windowDays }: { r: RunResult; windowDays: number }) {
  const d = r.decision, good = d.costDelta <= 0;
  const driver = r.citations[0];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="text-xl font-semibold sm:text-2xl">{d.stay ? 'Hold original routing' : `Recommended: ${d.recommended.route.label}`}</div>
        {!d.stay && <span className={`rounded-ctl border bg-white px-2.5 py-1 text-xs font-medium ${good ? 'border-good/40 text-good' : 'border-bad/40 text-bad'}`}>{d.daysDelta === 0 ? 'same transit time' : d.daysDelta < 0 ? `${-d.daysDelta}d faster` : `${d.daysDelta}d longer`} · {good ? 'saves' : 'costs'} {money(Math.abs(d.costDelta))}</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Side e={d.primary} r={r} rec={false} status={d.primary.bookable ? <StatusBadge status={r.lane.status} /> : <span /* unslop-ignore: status chip */ className="rounded-full border border-bad/40 bg-white px-2 py-0.5 text-[11px] font-medium text-bad">Scenario: unbookable</span>} />
        {d.stay
          ? <div className="grid place-items-center rounded-card border border-accent p-6 text-center text-sm text-mute">Original routing is already the pick for this PO and window under the stated assumptions. An absence of a disruption entry is not an assurance.</div>
          : <Side e={d.recommended} r={r} rec status={<span className="rounded-ctl border border-accent/40 bg-white px-2 py-0.5 text-[11px] font-medium text-accent">Available in scenario</span>} />}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-card border border-line bg-ground p-4">
          <h3 className="label mb-2">Reasoning</h3>
          <ul className="list-disc space-y-1.5 pl-4 text-sm">
            {d.reasons.map((x, i) => <li key={i}>{x}</li>)}
            {!d.stay && <li>Expected surcharge {d.surchargeDelta <= 0 ? 'drops' : 'rises'} by {money(Math.abs(d.surchargeDelta))} (exposure {money(d.primary.surchargeExposure)} original vs {money(d.recommended.surchargeExposure)} recommended).</li>}
            <li>Window: {windowDays} days from departure. Scenario assumption: {r.disruption.headline}.</li>
          </ul>
        </div>
        <div className="rounded-card border border-line bg-ground p-4">
          <h3 className="label mb-2">Cited disruption fact driving this</h3>
          {!driver && <p className="text-sm text-mute">No cited disruption applies to this corridor. Transit figures remain estimates.</p>}
          <ol className="space-y-3 text-sm">{r.citations.slice(0, 3).map((c, i) => (
            <li key={c.id}>{c.text}
              <blockquote className="mt-1 border-l-2 border-accent/50 pl-2 font-mono text-[11px] text-mute">“{c.quote}”</blockquote>
              <div className="mt-1 text-[11px] text-mute">[{i + 1}] <a className="text-accent underline underline-offset-2" href={c.url} target="_blank" rel="noreferrer">{c.sourceTitle}</a> · rev {c.revisionId ?? 'n/a'} · fetched {fmtDate(c.fetchedAt)} · {c.verified ? 'quote verified' : 'not machine-verified'}</div>
            </li>))}</ol>
        </div>
      </div>
      <div className="mt-4 rounded-card border border-line p-4">
        <h3 className="label mb-2">Corridor schematic (not to scale)</h3>
        <div className="overflow-x-auto"><div className="min-w-[540px]"><CorridorDiagram d={d} statuses={r.disruptionStatus} /></div></div>
      </div>
      <p className="mt-3 text-[11px] text-mute">Costs combine freight (estimate), expected surcharge, capital carrying cost and late penalty, driven by the assumptions recorded with this run. Model output, not a quote or advice.</p>
    </div>
  );
}
