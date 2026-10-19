import type { Ql140HandoffPlanningReadinessDecisionReview } from './ql140HandoffPlanningReadinessDecisionReview';

export type Ql141Action = {
  id: string;
  area: string;
  action: string;
  evidence: string;
  status: 'ready_for_synthetic_review' | 'blocked';
  restriction: string;
};
export type Ql141HandoffActionMatrix = {
  build: 'QL-141';
  sourceBuild: 'QL-140';
  sourceValid: boolean;
  ready: number;
  blocked: number;
  items: readonly Ql141Action[];
  notice: string;
};

const EXPECTED_IDS = [
  'ql140-source-gate-integrity',
  'ql140-recompute-source-outcome',
  'ql140-owner-and-implementation-locks',
  'ql140-synthetic-packet-review',
  'ql140-owner-consent-and-capture-deferred',
  'ql140-private-data-exclusion',
  'ql140-live-provider-and-write-ban',
  'ql140-independent-follow-up-authorization'
] as const;

// Pure in-memory projection. No persistence, communication, permission or mutation.
export function buildQl141HandoffActionMatrix(source: Ql140HandoffPlanningReadinessDecisionReview): Ql141HandoffActionMatrix {
  const gates = source.handoffPlanningReadinessReviewItems;
  const actual = gates.reduce((total, gate) => ({
    passed: total.passed + Number(gate.status === 'pass'),
    review: total.review + Number(gate.status === 'review'),
    blocked: total.blocked + Number(gate.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });
  const sourceValid =
    source.build === 'QL-140' &&
    source.reviewedBuild === 'QL-139' &&
    gates.length === EXPECTED_IDS.length &&
    new Set(gates.map(gate => gate.id)).size === EXPECTED_IDS.length &&
    EXPECTED_IDS.every(id => gates.some(gate => gate.id === id && gate.status === 'pass')) &&
    source.handoffPlanningReadinessReviewSummary.passed === actual.passed &&
    source.handoffPlanningReadinessReviewSummary.review === actual.review &&
    source.handoffPlanningReadinessReviewSummary.blocked === actual.blocked &&
    actual.passed === 8 && actual.review === 0 && actual.blocked === 0 &&
    source.handoffPlanningReadinessReviewOutcome === 'ready_for_separate_synthetic_follow_up_planning_only' &&
    source.implementationPermission === 'not_granted' &&
    source.ownerDecisionStatus === 'readiness_decision_review_only_owner_not_approved' &&
    source.ledgerWriteStatus === 'planned_not_implemented' &&
    source.endpointImplementationStatus === 'not_implemented' &&
    source.browserWriteStatus === 'disabled';

  const specifications = [
    ['source-integrity', 'Evidence', 'Validate QL-140 gate IDs, results and independently recomputed counts', 'ql140-source-gate-integrity'],
    ['owner-questions', 'Owner handoff', 'Prepare synthetic owner questions; request no approval or signature', 'ql140-owner-consent-and-capture-deferred'],
    ['privacy', 'Privacy', 'Review field exclusions and retention questions without customer records', 'ql140-private-data-exclusion'],
    ['safe-read', 'Preview', 'Review synthetic packet and fallback display with no writes', 'ql140-synthetic-packet-review'],
    ['runtime', 'Communications', 'Keep calls, SMS, DTMF, callbacks, recordings and AI sends disabled', 'ql140-live-provider-and-write-ban'],
    ['release', 'Release', 'Confirm separate owner authorization and exact final-main CI checks', 'ql140-independent-follow-up-authorization']
  ] as const;
  const items: Ql141Action[] = specifications.map(([id, area, action, gateId]) => {
    const gate = gates.find(item => item.id === gateId);
    return {
      id, area, action,
      evidence: gate?.readinessFinding ?? 'Required source gate missing',
      status: sourceValid && gate?.status === 'pass' ? 'ready_for_synthetic_review' : 'blocked',
      restriction: 'Display only. No actual owner decision, storage, provider activity or production permission.'
    };
  });
  return {
    build: 'QL-141',
    sourceBuild: 'QL-140',
    sourceValid,
    ready: items.filter(item => item.status === 'ready_for_synthetic_review').length,
    blocked: items.filter(item => item.status === 'blocked').length,
    items,
    notice: 'QL-141 is a public/synthetic action matrix, not an approval or live handoff. Owner consent, persistence and all communications remain disabled.'
  };
}
