import type { Ql141HandoffActionMatrix } from './ql141HandoffActionMatrix';

export type Ql142ExportDesign = {
  build: 'QL-142';
  mode: 'synthetic_design_only';
  valid: boolean;
  fileNameProposal: string;
  format: 'application/json';
  schemaVersion: 1;
  allowedFields: readonly string[];
  excludedFields: readonly string[];
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  preview: {
    sourceBuild: 'QL-141';
    classification: 'synthetic_public';
    counts: { ready: number; blocked: number };
    sections: readonly { id: string; area: string; finding: string }[];
  };
  warning: string;
};

// Static design preview; never serializes or accesses live customer or provider evidence.
export function designQl142SyntheticEvidenceExport(source: Ql141HandoffActionMatrix): Ql142ExportDesign {
  const ids = source.items.map(item => item.id);
  const valid = source.build === 'QL-141' && source.sourceBuild === 'QL-140' &&
    source.sourceValid && source.blocked === 0 && source.ready === 6 &&
    source.items.length === 6 && new Set(ids).size === 6 &&
    source.items.every(item => item.status === 'ready_for_synthetic_review');
  return {
    build: 'QL-142',
    mode: 'synthetic_design_only',
    valid,
    fileNameProposal: 'ql142-synthetic-evidence-preview.json',
    format: 'application/json',
    schemaVersion: 1,
    allowedFields: ['schemaVersion', 'sourceBuild', 'classification', 'counts', 'sections.id', 'sections.area', 'sections.finding'],
    excludedFields: ['customer identity', 'phone numbers', 'email addresses', 'provider credentials', 'message bodies', 'recordings', 'call logs', 'SMS logs', 'AI prompts', 'consent records', 'private owner decisions'],
    exportEnabled: false,
    downloadEnabled: false,
    canTransmit: false,
    preview: {
      sourceBuild: 'QL-141',
      classification: 'synthetic_public',
      counts: { ready: valid ? source.ready : 0, blocked: valid ? 0 : source.items.length },
      sections: valid ? source.items.map(item => ({ id: item.id, area: item.area, finding: item.evidence })) : []
    },
    warning: valid
      ? 'Design-only preview; no file is generated, saved, downloaded or transmitted. Separate owner authorization, privacy review and release gates remain mandatory.'
      : 'Source validation failed; evidence export design has no eligible sections. No export, download or transmission is permitted.'
  };
}
