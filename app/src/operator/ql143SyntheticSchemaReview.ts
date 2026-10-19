import type { Ql142ExportDesign } from './ql142SyntheticEvidenceExportDesign';

export type Ql143Check = { id: string; status: 'pass' | 'blocked'; explanation: string };
export type Ql143Review = {
  build: 'QL-143';
  sourceBuild: 'QL-142';
  outcome: 'synthetic_schema_verified' | 'revision_required';
  checks: readonly Ql143Check[];
  passed: number;
  blocked: number;
  exportEnabled: false;
  canTransmit: false;
  warning: string;
};

const EXPECTED_FIELDS = ['schemaVersion', 'sourceBuild', 'classification', 'counts', 'sections.id', 'sections.area', 'sections.finding'] as const;
const PRIVATE_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  /\b(?:api[_-]?key|bearer|password|secret|access[_-]?token|authorization)\b/i
] as const;

function check(id: string, passing: boolean, explanation: string): Ql143Check {
  return { id, status: passing ? 'pass' : 'blocked', explanation };
}

// Fail closed. Review only in-memory synthetic data; do not serialize,
// download, upload or persist the proposed export.
export function reviewQl143SyntheticSchema(source: Ql142ExportDesign): Ql143Review {
  const allowed = source.allowedFields;
  const sections = source.preview.sections;
  const exactSchema = allowed.length === EXPECTED_FIELDS.length &&
    new Set(allowed).size === EXPECTED_FIELDS.length &&
    EXPECTED_FIELDS.every(field => allowed.includes(field));
  const sourceValid = source.build === 'QL-142' && source.mode === 'synthetic_design_only' &&
    source.valid && source.schemaVersion === 1 && source.format === 'application/json' &&
    source.preview.sourceBuild === 'QL-141' && source.preview.classification === 'synthetic_public';
  const countsValid = source.preview.counts.ready === 6 &&
    source.preview.counts.blocked === 0 && sections.length === 6 &&
    new Set(sections.map(section => section.id)).size === sections.length;
  const syntheticOnly = sections.every(section =>
    !!section.id && !!section.area && !!section.finding &&
    [section.id, section.area, section.finding].every(value =>
      !PRIVATE_PATTERNS.some(pattern => pattern.test(value))));
  const redactionBoundary = source.excludedFields.length >= 10 &&
    source.excludedFields.some(field => field.includes('phone')) &&
    source.excludedFields.some(field => field.includes('credentials')) &&
    source.excludedFields.every(field => !allowed.includes(field));
  const noRuntime = source.exportEnabled === false &&
    source.downloadEnabled === false && source.canTransmit === false;

  const checks = [
    check('ql143-source-contract', sourceValid, 'QL-142 source, mode, version, content type and synthetic classification'),
    check('ql143-schema-allowlist', exactSchema, 'Exactly seven unique allowed schema field paths; unknown fields fail'),
    check('ql143-section-reconciliation', countsValid, 'Exactly six unique synthetic sections and reconciled source counts'),
    check('ql143-sensitive-token-screen', syntheticOnly, 'Reject detectable emails, telephone numbers and credential indicators'),
    check('ql143-exclusion-boundary', redactionBoundary, 'Private source classes remain excluded from the schema'),
    check('ql143-no-export-runtime', noRuntime, 'Downloads, exports and transmission stay disabled')
  ] as const;
  const passed = checks.filter(item => item.status === 'pass').length;
  return {
    build: 'QL-143', sourceBuild: 'QL-142',
    outcome: passed === checks.length ? 'synthetic_schema_verified' : 'revision_required',
    checks, passed, blocked: checks.length - passed,
    exportEnabled: false, canTransmit: false,
    warning: 'Static review only. This screen does not authorize actual export, real evidence access, owner consent, storage or live communications.'
  };
}
