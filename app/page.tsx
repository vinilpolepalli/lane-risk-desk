import Link from 'next/link';
import Desk from '@/components/Desk';
import { Panel } from '@/components/ui';
import { money, fmtDate } from '@/lib/format';
import { getOwnerAssumptions, listRuns, loadDataset } from '@/lib/repo';
import { ownerId } from '@/lib/http';
import { DEFAULT_ASSUMPTIONS } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const owner = await ownerId();
  const ds = await loadDataset();
  const runs = await listRuns(owner);
  const a = (await getOwnerAssumptions(owner))?.assumptions ?? DEFAULT_ASSUMPTIONS;
  return (
    <main>
      <div className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-semibold sm:text-3xl">Your TMS shows the news. Reroute decision desk shows the reroute.</h1>
        <p className="mt-2 text-sm text-mute">Pick a lane, enter a PO and window; a deterministic model scores the original routing against alternatives and cites the disruption behind it. Corridor statuses are scenario assumptions for illustration, not a live carrier feed. Data version v{ds.versionId}, sources fetched {fmtDate(ds.provenance.fetchedAt)}.</p>
      </div>
      <Desk lanes={ds.lanes} disruptions={ds.disruptions} initial={a} note={ds.note} />
      <div className="mt-6">
        <Panel title={`Saved decision runs (${runs.length})`}>
          {runs.length === 0 ? <p className="text-sm text-mute">No saved runs yet for this owner. Run a decision above.</p> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="label border-b border-line"><th className="py-2 pr-3 font-semibold">Lane</th><th className="pr-3 font-semibold">Recommendation</th><th className="pr-3 text-right font-semibold">Days Δ</th><th className="pr-3 text-right font-semibold">Cost Δ</th><th className="pr-3 font-semibold">Data</th><th className="font-semibold">When</th></tr></thead>
              <tbody>{runs.map((r) => { const d = r.result.decision; return (
                <tr key={r.id} className="border-b border-line">
                  <td className="py-2 pr-3"><Link className="text-accent underline underline-offset-2" href={`/runs/${r.id}`}>{r.result.lane.name}</Link><div className="text-[11px] text-mute">PO {money(r.poValue)} · {r.windowDays}d window</div></td>
                  <td className="pr-3">{d.stay ? 'Hold original' : d.recommended.route.label}</td>
                  <td className="pr-3 text-right">{d.daysDelta > 0 ? '+' : ''}{d.daysDelta}d</td>
                  <td className={`pr-3 text-right ${d.costDelta < 0 ? 'text-good' : d.costDelta > 0 ? 'text-bad' : ''}`}>{d.costDelta > 0 ? '+' : ''}{money(d.costDelta)}</td>
                  <td className="pr-3">v{r.datasetVersionId}</td><td className="text-mute">{fmtDate(r.createdAt)}</td></tr>); })}</tbody>
            </table></div>)}
        </Panel>
      </div>
    </main>
  );
}
