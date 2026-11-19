import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Panel } from '@/components/ui';
import ReasoningPanel from '@/components/ReasoningPanel';
import { DeleteRun } from '@/components/RunActions';
import { ownerId } from '@/lib/http';
import { getRun } from '@/lib/repo';
import { fmtDate, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const run = await getRun(await ownerId(), (await params).id);
  if (!run) notFound();
  const a = run.assumptions;
  const rows: [string, string][] = [
    ['Carrying cost', `${a.carryPctPerDay} %/day`], ['Late penalty', `${a.latePenaltyPctPerDay} %/day`], ['Cargo value per FEU', money(a.valuePerFEU)],
    ['Air freight', `${a.airFreightPctOfValue} % of PO`], ['Sea freight scale', `x${a.freightScale}`],
    ...(['suspended', 'restricted', 'elevated'] as const).map((s): [string, string] => [`Surcharge ${s}`, `${money(a.surchargePerFEU[s])}/FEU at p=${a.surchargeProbability[s]}`]),
  ];
  return (
    <main className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/" className="text-sm text-accent underline underline-offset-2">Back to desk</Link>
          <h1 className="mt-1 text-2xl font-semibold">{run.result.lane.name}</h1>
          <p className="text-sm text-mute">PO {money(run.poValue)} · {run.windowDays}-day window · dataset v{run.datasetVersionId} · run {fmtDate(run.createdAt)}</p></div>
        <DeleteRun id={run.id} />
      </div>
      <Panel title="Decision reasoning"><ReasoningPanel r={run.result} windowDays={run.windowDays} /></Panel>
      <div className="mt-5"><Panel title="Assumptions used (not sourced data)">
        <dl className="grid gap-x-8 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between border-b border-line py-1.5 text-sm"><dt className="text-mute">{k}</dt><dd className="tabular-nums">{v}</dd></div>)}</dl>
        <p className="mt-2 text-[11px] text-mute">{run.result.assumptionsNote}</p>
      </Panel></div>
    </main>
  );
}
