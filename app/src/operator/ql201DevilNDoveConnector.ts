import { inboxForOrganization } from './ql192InboxFixtures';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import type { OrganizationId } from './ql191Organizations';

export type MakerRequestKind = 'custom_order' | 'commission';
export interface MakerIntakeFixture {
  id: string;
  organizationId: 'devilndove';
  threadId: string;
  kind: MakerRequestKind;
  project: string;
  technique: string;
  materialNote: string;
  deadlineNote: string;
  reviewNote: string;
}

/** Fictional examples only. No product/order, Etsy, inventory or media provider is contacted. */
export const makerIntakeFixtures: readonly MakerIntakeFixture[] = [
  {
    id: 'dnd-demo-custom-1', organizationId: 'devilndove', threadId: 'dnd-web',
    kind: 'custom_order', project: 'Custom resin colour combination', technique: 'Resin colour design',
    materialNote: 'Teal-and-gold reference colours; formulation unconfirmed', deadlineNote: 'No requested date supplied',
    reviewNote: 'Review colour sample, material inventory, safety and client design approval before any quote.'
  },
  {
    id: 'dnd-demo-commission-1', organizationId: 'devilndove', threadId: 'dnd-voicemail',
    kind: 'commission', project: 'Wax-carved ring commission', technique: 'Lost-wax design inquiry',
    materialNote: 'Metal, ring size and wax requirements not supplied', deadlineNote: 'No delivery date supplied',
    reviewNote: 'Confirm design, ring size, alloy, costs and estimated lead time with the maker.'
  }
] as const;

export interface MakerHandoffPreview {
  reference: string;
  threadId: string;
  sourceSubject: string;
  kind: MakerRequestKind;
  project: string;
  technique: string;
  materialNote: string;
  deadlineNote: string;
  reviewNote: string;
  review: 'maker_approval_required';
  quote: 'not_created';
  stock: 'not_reserved';
  production: 'not_started';
  media: 'not_imported';
  listing: 'not_published';
  payment: 'not_requested';
  communication: 'not_sent';
}

export type MakerHandoffResult =
  | { ok: true; preview: MakerHandoffPreview }
  | { ok: false; reason: 'wrong_organization' | 'unknown_sample' | 'source_disallowed' };

/** Read-only allowlist mapper; no external API, storage, publish or approval path. */
export function previewMakerHandoff(organizationId: OrganizationId, contract: ConnectorContract, fixtureId: string): MakerHandoffResult {
  if (organizationId !== 'devilndove' || contract !== connectorContracts.devilndove || contract.organizationId !== organizationId || contract.state !== 'mock_only') {
    return { ok: false, reason: 'wrong_organization' };
  }
  const fixture = makerIntakeFixtures.find((item) => item.id === fixtureId && item.organizationId === 'devilndove');
  if (!fixture) return { ok: false, reason: 'unknown_sample' };
  const thread = inboxForOrganization('devilndove').find((item) => item.id === fixture.threadId && item.organizationId === organizationId && contract.approvedChannels.includes(item.channel));
  if (!thread) return { ok: false, reason: 'source_disallowed' };
  return { ok: true, preview: {
    reference: `DEMO-${fixture.id.toUpperCase()}`, threadId: thread.id, sourceSubject: thread.subject,
    kind: fixture.kind, project: fixture.project, technique: fixture.technique,
    materialNote: fixture.materialNote, deadlineNote: fixture.deadlineNote, reviewNote: fixture.reviewNote,
    review: 'maker_approval_required', quote: 'not_created', stock: 'not_reserved', production: 'not_started',
    media: 'not_imported', listing: 'not_published', payment: 'not_requested', communication: 'not_sent'
  } };
}
