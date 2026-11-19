import type { Assumptions, Decision, Inputs, Lane, Route, RouteEval, Status } from './types';

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  carryPctPerDay: 0.035,        // ~12.8%/yr cost of capital on inventory in transit
  latePenaltyPctPerDay: 0.5,    // % of PO value per day past the required window
  valuePerFEU: 80000,           // cargo value in one 40ft container
  airFreightPctOfValue: 9,      // air freight as % of PO value
  freightScale: 1,              // multiplier on all per-FEU sea freight estimates
  surchargePerFEU: { suspended: 1500, restricted: 800, elevated: 400, normal: 0 },
  surchargeProbability: { suspended: 0.8, restricted: 0.6, elevated: 0.4, normal: 0 },
};

const r0 = (n: number) => Math.round(n);
const usd = (n: number) => '$' + Math.abs(n).toLocaleString('en-US');

export function evaluateRoute(lane: Lane, route: Route, inp: Inputs, a: Assumptions): RouteEval {
  const isPrimary = route.kind === 'primary';
  const disruptionDays = isPrimary ? lane.primaryDelayDays : 0;
  const transitDays = route.baseDays + disruptionDays;
  const lateDays = Math.max(0, transitDays - inp.windowDays);
  const feus = Math.max(1, Math.ceil(inp.poValue / a.valuePerFEU));
  const freight = route.kind === 'air' ? (inp.poValue * a.airFreightPctOfValue) / 100 : route.freightPerFEU * a.freightScale * feus;
  const st: Status = route.surchargeStatus;
  const surchargeExposure = route.kind === 'air' ? 0 : a.surchargePerFEU[st] * feus;
  const surchargeExpected = surchargeExposure * a.surchargeProbability[st];
  const carrying = inp.poValue * (a.carryPctPerDay / 100) * transitDays;
  const latePenalty = inp.poValue * (a.latePenaltyPctPerDay / 100) * lateDays;
  return {
    route, transitDays, disruptionDays, lateDays, meetsWindow: lateDays === 0,
    bookable: !(isPrimary && lane.status === 'suspended'),
    freight: r0(freight), surchargeExpected: r0(surchargeExpected), surchargeExposure: r0(surchargeExposure),
    carrying: r0(carrying), latePenalty: r0(latePenalty), total: r0(freight + surchargeExpected + carrying + latePenalty),
  };
}

/** Deterministic: among bookable options prefer those meeting the window, then lowest total landed risk-cost. */
export function decide(lane: Lane, inp: Inputs, a: Assumptions): Decision {
  const all = lane.routes.map((r) => evaluateRoute(lane, r, inp, a));
  const primary = all[0];
  const pool = all.filter((e) => e.bookable);
  const feasible = pool.filter((e) => e.meetsWindow);
  const byCost = (xs: RouteEval[]) => [...xs].sort((x, y) => x.total - y.total)[0];
  const recommended = feasible.length
    ? byCost(feasible)
    : [...pool].sort((x, y) => x.lateDays - y.lateDays || x.total - y.total)[0];
  const stay = recommended.route.id === primary.route.id;
  const daysDelta = recommended.transitDays - primary.transitDays;
  const costDelta = recommended.total - primary.total;
  const surchargeDelta = recommended.surchargeExpected - primary.surchargeExpected;
  const reasons: string[] = [];
  if (!primary.bookable) reasons.push('Model rationale: original routing is treated as unbookable in this scenario, so it is excluded from selection.');
  if (!primary.meetsWindow) reasons.push(`Original routing lands ${primary.lateDays}d outside the ${inp.windowDays}-day window.`);
  if (stay) reasons.push('No alternative beats the original on window fit and total cost.');
  else {
    reasons.push(
      recommended.meetsWindow
        ? `${recommended.route.label} lands inside the ${inp.windowDays}-day window (${recommended.transitDays}d).`
        : `No option meets the window; ${recommended.route.label} minimises lateness (${recommended.lateDays}d late).`,
    );
    reasons.push(`${daysDelta === 0 ? 'Same transit time as original' : daysDelta < 0 ? `Saves ${-daysDelta}d` : `Adds ${daysDelta}d`} (original incl. disruption delay); total cost ${costDelta <= 0 ? 'down' : 'up'} ${usd(costDelta)}.`);
  }
  return { primary, recommended, all, stay, daysDelta, costDelta, surchargeDelta, reasons };
}
