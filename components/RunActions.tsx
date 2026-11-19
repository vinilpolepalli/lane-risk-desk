'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn2 } from './ui';

export function DeleteRun({ id }: { id: string }) {
  const router = useRouter(); const [err, setErr] = useState('');
  async function del() {
    if (!window.confirm('Delete this decision run? This cannot be undone.')) return;
    const r = await fetch(`/api/decisions/${id}`, { method: 'DELETE' });
    if (r.ok) { router.push('/'); router.refresh(); } else setErr('Delete failed');
  }
  return <span><button onClick={del} className={`${btn2} !border-bad/40 !text-bad`}>Delete run</button>{err && <span className="ml-2 text-sm text-bad">{err}</span>}</span>;
}

export function RefreshButton() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  async function go() {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/sources/refresh', { method: 'POST' }); const j = await r.json();
      if (r.status === 429) setMsg(`Rate limited: try again in ${Math.ceil(j.retryAfterSeconds / 60)} min.`);
      else if (j.ok) setMsg(`Verified all quotes; dataset v${j.datasetVersionId} is now active.`);
      else setMsg(j.failures ? 'Verification failed; the previous dataset stays active.' : j.error ?? 'Refresh failed');
      router.refresh();
    } catch { setMsg('Network error'); } finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-3"><button onClick={go} disabled={busy} className={btn2}>{busy ? 'Fetching and verifying...' : 'Refresh sources'}</button>{msg && <span className="text-sm" role="status">{msg}</span>}</div>;
}
