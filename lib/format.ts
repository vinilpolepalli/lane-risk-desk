import type { Status } from './types';
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US');
export const STATUS_STYLE: Record<Status, { label: string; cls: string; dot: string }> = {
  suspended: { label: 'Scenario: unbookable', cls: 'text-bad border-bad/40', dot: '#b91c1c' },
  restricted: { label: 'Scenario: restricted', cls: 'text-caution border-caution/40', dot: '#c2410c' },
  elevated: { label: 'Scenario: elevated risk', cls: 'text-watch border-watch/40', dot: '#a16207' },
  normal: { label: 'Scenario: normal', cls: 'text-good border-good/40', dot: '#166534' },
};
export const fmtDate = (iso: string) => iso.slice(0, 16).replace('T', ' ') + ' UTC';
