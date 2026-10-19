import type { Ql143Review } from './ql143SyntheticSchemaReview';

export type Ql144Exception = {
  id: string;
  severity: 'review_required';
  reason: string;
  proposedCorrection: string;
  status: 'design_only_not_applied';
};
export type Ql144CorrectiveDesign = {
  build: 'QL-144';
  sourceBuild: 'QL-143';
  sourceReconciled: boolean;
  outcome: 'synthetic_review_only' | 'correction_plan_required';
  exceptions: readonly Ql144Exception[];
  inspectedChecks: number;
  passedChecks: number;
  blockedChecks: number;
  correctionApplied: false;
  exportEnabled: false;
  message: string;
};

const EXPECTED = [
  'ql143-source-contract', 'ql143-schema-allowlist',
  'ql143-section-reconciliation', 'ql143-sensitive-token-screen',
  'ql143-exclusion-boundary', 'ql143-no-export-runtime'
] as const;

const REMEDIATIONS: Record<string, string> = {
  'ql143-source-contract': 'Rebuild the contract from the approved public synthetic QL-142 design and reverify classification.',
  'ql143-schema-allowlist': 'Remove unexpected or duplicated fields; compare with exact approved schema.',
  'ql143-section-reconciliation': 'Regenerate a public-only fixture and independently recount unique section IDs.',
  'ql143-sensitive-token-screen': 'Replace the fixture with non-sensitive synthetic example text; require separate privacy review.',
  'ql143-exclusion-boundary': 'Restore excluded field classes and forbid any actual customer/provider evidence.',
  'ql143-no-export-runtime': 'Disable export, download and transmission; require a separate authorization process.'
};

// Pure read-only planning. No exceptions are recorded, persisted, resolved, or exported.
export function designQl144CorrectiveExceptions(source: Ql143Review): Ql144CorrectiveDesign {
  const ids = source.checks.map(check => check.id);
  const counts = source.checks.reduce((sum, check) => ({
    passed: sum.passed + Number(check.status === 'pass'),
    blocked: sum.blocked + Number(check.status === 'blocked')
  }), { passed: 0, blocked: 0 });
  const sourceReconciled = source.build === 'QL-143' &&
    source.sourceBuild === 'QL-142' &&
    source.checks.length === EXPECTED.length &&
    new Set(ids).size === EXPECTED.length &&
    EXPECTED.every(id => ids.includes(id)) &&
    counts.passed === source.passed && counts.blocked === source.blocked &&
    source.exportEnabled === false && source.canTransmit === false &&
    source.outcome === (counts.blocked === 0 ? 'synthetic_schema_verified' : 'revision_required');
  const failed = sourceReconciled ? source.checks.filter(check => check.status === 'blocked') : [];
  const exceptions: Ql144Exception[] = (sourceReconciled ? failed : [{
    id: 'ql144-invalid-source',
    status: 'blocked' as const,
    explanation: 'QL-143 source IDs, counts, outcome or no-export restrictions cannot be reconciled'
  }]).map(check => ({
    id: check.id,
    severity: 'review_required' as const,
    reason: check.explanation,
    proposedCorrection: REMEDIATIONS[check.id] ?? 'Stop the release and independently revalidate QL-143; do not infer a passing result.',
    status: 'design_only_not_applied' as const
  }));
  return {
    build: 'QL-144', sourceBuild: 'QL-143', sourceReconciled,
    outcome: exceptions.length === 0 ? 'synthetic_review_only' : 'correction_plan_required',
    exceptions,
    inspectedChecks: source.checks.length,
    passedChecks: counts.passed,
    blockedChecks: counts.blocked,
    correctionApplied: false, exportEnabled: false,
    message: 'Read-only exception planning; no real evidence, owner consent, private fields, corrected source writes, exports, downloads, transmissions or live Phone/SMS/AI activation.'
  };
}
