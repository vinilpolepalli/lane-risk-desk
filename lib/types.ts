export type Status = 'suspended' | 'restricted' | 'elevated' | 'normal';
export type Basis = 'cited' | 'derived' | 'estimate';
export type Waypoint = [string] | [string, string];
export interface Route {
  id: string; kind: 'primary' | 'cape' | 'transship' | 'air'; label: string; waypoints: Waypoint[];
  baseDays: number; daysBasis: Basis; daysFactId?: string; freightPerFEU: number; surchargeStatus: Status; bookByDays: number;
}
export interface Lane {
  id: string; name: string; origin: string; dest: string; disruptionId: string; status: Status;
  primaryDelayDays: number; primaryDelayBasis: Basis; primaryDelayFactId?: string; routes: Route[];
}
export interface Assumptions {
  carryPctPerDay: number; latePenaltyPctPerDay: number; valuePerFEU: number; airFreightPctOfValue: number; freightScale: number;
  surchargePerFEU: Record<Status, number>; surchargeProbability: Record<Status, number>;
}
export interface Inputs { poValue: number; windowDays: number; }
export interface RouteEval {
  route: Route; transitDays: number; disruptionDays: number; lateDays: number; meetsWindow: boolean; bookable: boolean;
  freight: number; surchargeExpected: number; surchargeExposure: number; carrying: number; latePenalty: number; total: number;
}
export interface Decision {
  primary: RouteEval; recommended: RouteEval; all: RouteEval[]; stay: boolean;
  daysDelta: number; costDelta: number; surchargeDelta: number; reasons: string[];
}

export interface Provenance {
  fetchedAt: string;
  sources: Record<string, { status: 'fetched' | 'link-only' | 'error'; chars?: number; revisionId?: number; revisionTime?: string; error?: string }>;
  facts: Record<string, boolean>;
}
export interface CitedFact {
  id: string; text: string; quote: string; sourceTitle: string; publisher: string; url: string;
  revisionId: number | null; revisionTime: string | null; fetchedAt: string; verified: boolean;
}
export interface DisruptionRec {
  id: string; corridor: string; status: Status; effectiveDate: string | null; headline: string; statusNote: string; factIds: string[];
}
export interface RunResult {
  decision: Decision; lane: Lane; disruption: DisruptionRec; citations: CitedFact[];
  disruptionStatus: Record<string, Status>; datasetVersionId: number; assumptionsNote: string;
}
