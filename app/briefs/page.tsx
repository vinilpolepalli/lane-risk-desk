import { Panel, StatusBadge } from '@/components/ui';
import { RefreshButton } from '@/components/RunActions';
import { citeFact, listRefreshes, loadDataset } from '@/lib/repo';
import { fmtDate } from '@/lib/format';
import { HONEST_LIMITS } from '@/lib/limits';

export const dynamic = 'force-dynamic';

export default async function Briefs() {
  const ds = await loadDataset();
  const refreshes = await listRefreshes();
  const last = refreshes[0];
  const staleFailure = last && !last.ok && last.startedAt > ds.provenance.fetchedAt;
  return (
    <main className="mt-6 space-y-5">
      <div><h1 className="text-2xl font-semibold">Disruption briefs</h1>
        <p className="mt-1 text-sm text-mute">Active dataset v{ds.versionId} ({ds.kind}), sources fetched {fmtDate(ds.provenance.fetchedAt)}. Every cited fact carries its quote, source, Wikipedia revision id and fetch time.</p></div>
      {staleFailure && (
        <div role="alert" className="rounded-card border border-bad/40 bg-white p-4 text-sm"><b className="text-bad">Latest refresh failed verification ({fmtDate(last.startedAt)}).</b> The last-good dataset v{ds.versionId} is still active.
          <ul className="mt-1 list-disc pl-5 text-mute">{last.failures.map((f) => <li key={f}>{f}</li>)}</ul></div>)}
      <Panel title="Source refresh" right={<span className="text-[11px] text-mute">2 per hour per owner</span>}>
        <RefreshButton />
        <h3 className="label mt-4 mb-2">Refresh history</h3>
        {refreshes.length === 0 ? <p className="text-sm text-mute">No refreshes run yet; v{ds.versionId} is the seed dataset with its committed provenance.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="label border-b border-line"><th className="py-2 font-semibold">When</th><th className="font-semibold">Result</th><th className="font-semibold">Dataset</th><th className="font-semibold">Revisions</th></tr></thead>
            <tbody>{refreshes.map((r) => (
              <tr key={r.id} className="border-b border-line align-top"><td className="py-2 pr-3">{fmtDate(r.startedAt)}</td>
                <td className={`pr-3 ${r.ok ? 'text-good' : 'text-bad'}`}>{r.ok ? `All ${Object.keys(r.provenance.facts).length} quotes verified` : r.failures.join('; ')}</td>
                <td className="pr-3">{r.datasetVersionId ? `v${r.datasetVersionId} activated` : 'unchanged'}</td>
                <td className="font-mono text-[11px] text-mute">{Object.entries(r.provenance.sources).filter(([, s]) => s.revisionId).map(([k, s]) => `${k}:${s.revisionId}`).join(' ')}</td></tr>))}</tbody></table></div>)}
      </Panel>
      {ds.disruptions.map((d) => (
        <Panel key={d.id} title={d.corridor} right={<StatusBadge status={d.status} />}>
          <p className="text-base font-medium">{d.headline}</p>
          <p className="mt-1 text-sm text-mute">{d.effectiveDate ? `Scenario effective date ${d.effectiveDate}. ` : ''}{d.statusNote}</p>
          {d.factIds.length === 0 && <p className="mt-3 text-sm text-mute">No cited event. Transit figures remain estimates. Absence of an entry is not an assurance.</p>}
          <ul className="mt-3 space-y-3">{d.factIds.map((id) => { const f = citeFact(ds, id); return (
            <li key={id} className="rounded-card border border-line bg-ground p-3 text-sm">
              <p>{f.text}</p>
              <blockquote className="mt-1.5 border-l-2 border-accent/50 pl-2 font-mono text-[11px] text-mute">“{f.quote}”</blockquote>
              <p className="mt-1.5 text-[11px] text-mute"><a className="text-accent underline underline-offset-2" href={f.url} target="_blank" rel="noreferrer">{f.sourceTitle}</a> · {f.publisher} · revision {f.revisionId ?? 'n/a'} ({f.revisionTime ?? 'n/a'}) · fetched {fmtDate(f.fetchedAt)} · {f.verified ? 'quote verified verbatim' : 'NOT verified'}</p>
            </li>); })}</ul>
        </Panel>))}
      <Panel title="Honest limits: what is estimate, cited, or analogy">
        <ul className="list-disc space-y-1.5 pl-5 text-sm">{Object.values(HONEST_LIMITS).map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-3 text-[11px] text-mute">Primary-source pointer: <a className="text-accent underline underline-offset-2" href="https://pancanal.com/en/" target="_blank" rel="noreferrer">Panama Canal Authority advisories</a> (link only).</p>
      </Panel>
    </main>
  );
}
