import type { Assumptions, Status } from './types';
import { DEFAULT_ASSUMPTIONS } from './engine';

const STS: Status[] = ['suspended', 'restricted', 'elevated', 'normal'];
const RANGE: Record<string, [number, number]> = {
  carryPctPerDay: [0, 10], latePenaltyPctPerDay: [0, 20], valuePerFEU: [1000, 1e7], airFreightPctOfValue: [0, 100], freightScale: [0, 10],
};
const num = (v: unknown, lo: number, hi: number, name: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) throw new Error(`${name} must be a number between ${lo} and ${hi}`);
  return v;
};
export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Merge a partial assumptions object over a base; throws Error with a user-facing message on bad input. */
export function mergeAssumptions(base: Assumptions, patch: unknown): Assumptions {
  const out = clone(base);
  if (patch === undefined || patch === null) return out;
  if (typeof patch !== 'object' || Array.isArray(patch)) throw new Error('assumptions must be an object');
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (k in RANGE) { (out as unknown as Record<string, number>)[k] = num(v, RANGE[k][0], RANGE[k][1], k); continue; }
    if (k === 'surchargePerFEU' || k === 'surchargeProbability') {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(`${k} must be an object`);
      for (const [s, x] of Object.entries(v as Record<string, unknown>)) {
        if (!STS.includes(s as Status)) throw new Error(`${k}.${s} is not a status`);
        out[k][s as Status] = num(x, 0, k === 'surchargePerFEU' ? 100000 : 1, `${k}.${s}`);
      }
      continue;
    }
    throw new Error(`Unknown assumption: ${k}`);
  }
  return out;
}
export function parseInputs(b: unknown): { laneId: string; poValue: number; windowDays: number; assumptions: unknown } {
  if (typeof b !== 'object' || b === null || Array.isArray(b)) throw new Error('Body must be a JSON object');
  const o = b as Record<string, unknown>;
  if (typeof o.laneId !== 'string' || o.laneId.length > 40) throw new Error('laneId must be a string');
  const poValue = num(o.poValue, 0, 1e9, 'poValue');
  if (poValue <= 0) throw new Error('poValue must be positive');
  const windowDays = num(o.windowDays, 1, 120, 'windowDays');
  if (!Number.isInteger(windowDays)) throw new Error('windowDays must be an integer');
  return { laneId: o.laneId, poValue, windowDays, assumptions: o.assumptions };
}
export { DEFAULT_ASSUMPTIONS };
