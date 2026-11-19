import type { Decision, Status } from '@/lib/types';
import { STATUS_STYLE } from '@/lib/format';

export default function CorridorDiagram({ d, statuses }: { d: Decision; statuses: Record<string, Status> }) {
  const rows = d.all;
  const rowH = 60, W = 640, padX = 60, H = rows.length * rowH + 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Schematic corridor diagram comparing original and alternative routings. Not to scale.">
      {rows.map((e, i) => {
        const y = 28 + i * rowH;
        const wps = e.route.waypoints;
        const xs = wps.map((_, k) => padX + (k * (W - 2 * padX)) / (wps.length - 1));
        const rec = e.route.id === d.recommended.route.id, orig = i === 0;
        const col = rec ? '#9f1239' : orig ? '#596070' : '#a8adb8';
        return (
          <g key={e.route.id}>
            <line x1={xs[0]} x2={xs[xs.length - 1]} y1={y} y2={y} stroke={col} strokeWidth={rec ? 3 : 2} strokeDasharray={orig || rec ? '' : '5 5'} opacity={e.bookable ? 1 : 0.6} />
            {orig && !e.bookable && <line x1={W / 2 - 10} x2={W / 2 + 10} y1={y - 10} y2={y + 10} stroke="#b91c1c" strokeWidth={3} />}
            {wps.map((w, k) => {
              const st = w[1] && statuses[w[1]] ? STATUS_STYLE[statuses[w[1]]].dot : null;
              const end = k === 0 || k === wps.length - 1;
              return (
                <g key={k}>
                  <circle cx={xs[k]} cy={y} r={end ? 6 : 5} fill={st ?? (rec ? '#9f1239' : '#ffffff')} stroke={st ?? col} strokeWidth={2} />
                  <text x={xs[k]} y={y + 22} textAnchor={k === 0 ? 'start' : k === wps.length - 1 ? 'end' : 'middle'} fontSize={12} fill="#596070">{w[0]}</text>
                </g>
              );
            })}
            <text x={padX} y={y - 12} fontSize={12} fontWeight={600} fill={rec ? '#9f1239' : '#596070'}>{orig ? 'ORIGINAL · ' : rec ? 'RECOMMENDED · ' : ''}{e.route.label}</text>
            <text x={W - padX} y={y - 12} textAnchor="end" fontSize={12} fill={rec ? '#9f1239' : '#596070'}>{e.transitDays}d</text>
          </g>
        );
      })}
    </svg>
  );
}
