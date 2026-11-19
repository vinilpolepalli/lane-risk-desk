import type { Basis, Status } from '@/lib/types';
import { STATUS_STYLE } from '@/lib/format';

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-[11px] font-medium ${s.cls}`}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />{s.label}</span>;
}
const B = { cited: ['cited', 'text-ink border-ink/40'], derived: ['est. + cited Δ', 'text-mute border-mute/50'], estimate: ['estimate', 'text-mute border-line'] } as const;
export function BasisTag({ basis }: { basis: Basis }) {
  const [t, c] = B[basis];
  return <span className={`ml-1 rounded border px-1 text-[9px] uppercase tracking-wide align-middle ${c}`}>{t}</span>;
}
export function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="label">{title}</h2>{right}</div>
      {children}
    </section>
  );
}
export const btn = 'rounded-ctl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50';
export const btn2 = 'rounded-ctl border border-line bg-white px-3 py-2 text-sm text-ink hover:border-accent hover:text-accent disabled:opacity-50';
export const input = 'w-full rounded-ctl border border-line bg-white px-3 py-2 text-sm tabular-nums text-ink';
