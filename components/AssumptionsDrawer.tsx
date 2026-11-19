'use client';
import { useEffect, useState } from 'react';
import type { Assumptions, Status } from '@/lib/types';
import { btn, btn2 } from './ui';

export default function AssumptionsDrawer({ open, onClose, a, set, note }: { open: boolean; onClose: () => void; a: Assumptions; set: (a: Assumptions) => void; note: string }) {
  const [msg, setMsg] = useState('');
  useEffect(() => { if (open) setMsg(''); }, [open]);
  const num = (label: string, v: number, on: (n: number) => void, step: number, unit: string) => (
    <label className="flex items-center justify-between gap-3 py-1.5 text-sm"><span>{label}</span>
      <span className="flex items-center gap-1"><input type="number" step={step} min={0} value={v} onChange={(e) => on(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded-ctl border border-line bg-white px-2 py-1 text-right tabular-nums" /><span className="w-12 text-xs text-mute">{unit}</span></span></label>);
  const sts: Status[] = ['suspended', 'restricted', 'elevated'];
  async function save() {
    const r = await fetch('/api/assumptions', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) });
    const j = await r.json(); setMsg(r.ok ? 'Saved for this owner.' : j.error);
  }
  async function reset() {
    const r = await fetch('/api/assumptions', { method: 'DELETE' }); const j = await r.json(); set(j.assumptions); setMsg('Reset to defaults.');
  }
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} aria-hidden />}
      <aside role="dialog" aria-label="Assumptions" aria-hidden={!open} className={`fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-line bg-white p-5 transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Assumptions</h2><button onClick={onClose} className={btn2}>Close</button></div>
        <p className="mt-2 text-xs text-mute">Assumptions, not sourced data. Saved per owner; each decision run records the values it used. {note}</p>
        <h3 className="label mt-4">Cost model</h3>
        {num('Carrying cost', a.carryPctPerDay, (n) => set({ ...a, carryPctPerDay: n }), 0.005, '% /day')}
        {num('Late penalty', a.latePenaltyPctPerDay, (n) => set({ ...a, latePenaltyPctPerDay: n }), 0.05, '% /day')}
        {num('Cargo value per FEU', a.valuePerFEU, (n) => set({ ...a, valuePerFEU: n || 1000 }), 1000, 'USD')}
        {num('Air freight', a.airFreightPctOfValue, (n) => set({ ...a, airFreightPctOfValue: n }), 0.5, '% PO')}
        {num('Sea freight scale', a.freightScale, (n) => set({ ...a, freightScale: n }), 0.05, 'x')}
        <h3 className="label mt-4">Surcharge exposure per FEU, by corridor status</h3>
        {sts.map((s) => num(`${s[0].toUpperCase() + s.slice(1)} amount`, a.surchargePerFEU[s], (n) => set({ ...a, surchargePerFEU: { ...a.surchargePerFEU, [s]: n } }), 50, 'USD'))}
        <h3 className="label mt-4">Probability surcharge applies</h3>
        {sts.map((s) => num(`${s[0].toUpperCase() + s.slice(1)} prob.`, a.surchargeProbability[s], (n) => set({ ...a, surchargeProbability: { ...a.surchargeProbability, [s]: Math.min(1, n) } }), 0.05, '0 to 1'))}
        <div className="mt-5 flex gap-2"><button onClick={save} className={btn}>Save</button><button onClick={reset} className={btn2}>Reset to defaults</button></div>
        {msg && <p className="mt-2 text-xs text-mute" role="status">{msg}</p>}
      </aside>
    </>
  );
}
