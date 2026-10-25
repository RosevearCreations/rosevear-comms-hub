import type { OrganizationId } from './ql191Organizations';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import { buildMockReviewQueue, type MockReviewQueueItem } from './ql204HandoffReviewQueue';

export const mockReviewSteps = [
  { id: 'read_source', label: 'Reviewed fictional source details' },
  { id: 'identify_gaps', label: 'Identified questions for staff' },
  { id: 'check_scope', label: 'Checked which service rules need verification' }
] as const;
export type MockReviewStepId = (typeof mockReviewSteps)[number]['id'];
export interface MockReviewDraft {
  note: string;
  proposedReply: string;
  steps: readonly MockReviewStepId[];
}
export const emptyMockReviewDraft: Readonly<MockReviewDraft> = { note: '', proposedReply: '', steps: [] };

/** Enforce bounded browser-only demo text; this is not a saving API. */
export function normalizeMockReviewDraft(draft: MockReviewDraft): MockReviewDraft {
  return {
    note: draft.note.slice(0, 500),
    proposedReply: draft.proposedReply.slice(0, 800),
    steps: mockReviewSteps.map((step) => step.id).filter((id) => draft.steps.includes(id))
  };
}

export function mockReviewReadiness(draft: MockReviewDraft): { prepared: boolean; missing: readonly string[] } {
  const missing = [
    ...mockReviewSteps.filter((step) => !draft.steps.includes(step.id)).map((step) => step.label),
    ...(draft.note.trim() ? [] : ['Internal rehearsal note']),
    ...(draft.proposedReply.trim() ? [] : ['Proposed reply draft'])
  ];
  return { prepared: missing.length === 0, missing };
}

export type MockDeskEligibility =
  | { ok: true; item: MockReviewQueueItem }
  | { ok: false; reason: 'organization_mismatch' | 'sample_not_allowed' };

/** An item must be produced by the exact, still-eligible company connector before a desk can open. */
export function eligibleMockReviewDesk(organizationId: OrganizationId, contract: ConnectorContract, item: MockReviewQueueItem): MockDeskEligibility {
  if (connectorContracts[organizationId] !== contract || item.organizationId !== organizationId) return { ok: false, reason: 'organization_mismatch' };
  const queue = buildMockReviewQueue(organizationId, contract);
  if (!queue.ok) return { ok: false, reason: 'organization_mismatch' };
  const allowed = queue.items.find((entry) => entry.id === item.id && entry.reference === item.reference && entry.threadId === item.threadId);
  return allowed ? { ok: true, item: allowed } : { ok: false, reason: 'sample_not_allowed' };
}
