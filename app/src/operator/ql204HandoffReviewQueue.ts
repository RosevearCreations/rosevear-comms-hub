import { inboxForOrganization } from './ql192InboxFixtures';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import type { OrganizationId } from './ql191Organizations';
import { rosieIntakeFixtures, previewRosieHandoff } from './ql200RosieConnector';
import { makerIntakeFixtures, previewMakerHandoff } from './ql201DevilNDoveConnector';
import { campIntakeFixtures, previewCampHandoff } from './ql202CampConnector';
import { ywInquiryFixtures, previewYwHandoff, ywModuleLabels } from './ql203YwConnector';

export interface MockReviewQueueItem {
  id: string;
  organizationId: OrganizationId;
  reference: string;
  threadId: string;
  subject: string;
  title: string;
  category: string;
  reviewPrompt: string;
  priority: 'normal' | 'high';
  review: 'staff_required';
  externalActions: 'disabled';
}
export type MockReviewQueueResult =
  | { ok: true; items: readonly MockReviewQueueItem[]; heldSamples: number }
  | { ok: false; reason: 'organization_mismatch' };

/** Compose existing fictional adapters into one company-scoped, browser-only review queue. */
export function buildMockReviewQueue(organizationId: OrganizationId, contract: ConnectorContract): MockReviewQueueResult {
  if (connectorContracts[organizationId] !== contract || contract.organizationId !== organizationId || contract.state !== 'mock_only') {
    return { ok: false, reason: 'organization_mismatch' };
  }
  const items: MockReviewQueueItem[] = [];
  let heldSamples = 0;
  function add(id: string, threadId: string, reference: string, title: string, category: string, reviewPrompt: string) {
    const source = inboxForOrganization(organizationId).find((thread) => thread.id === threadId && thread.organizationId === organizationId && contract.approvedChannels.includes(thread.channel));
    if (!source) { heldSamples++; return; }
    items.push({ id, organizationId, reference, threadId: source.id, subject: source.subject, title, category, reviewPrompt,
      priority: source.priority, review: 'staff_required', externalActions: 'disabled' });
  }
  if (organizationId === 'rosiedazzlers') for (const fixture of rosieIntakeFixtures) {
    const result = previewRosieHandoff(organizationId, contract, fixture.id);
    if (result.ok) add(fixture.id, result.preview.sourceId, result.preview.reference, result.preview.service, fixture.kind === 'quote_request' ? 'Quote inquiry' : 'Booking question', result.preview.additionalDetails);
    else heldSamples++;
  }
  if (organizationId === 'devilndove') for (const fixture of makerIntakeFixtures) {
    const result = previewMakerHandoff(organizationId, contract, fixture.id);
    if (result.ok) add(fixture.id, result.preview.threadId, result.preview.reference, result.preview.project, fixture.kind === 'commission' ? 'Commission' : 'Custom order', result.preview.reviewNote);
    else heldSamples++;
  }
  if (organizationId === 'icamp') for (const fixture of campIntakeFixtures) {
    const result = previewCampHandoff(organizationId, contract, fixture.campgroundId, fixture.id);
    if (result.ok) add(fixture.id, result.preview.threadId, result.preview.reference, result.preview.topic, fixture.kind === 'guest_service' ? 'Guest services' : 'Reservation inquiry', result.preview.reviewNote);
    else heldSamples++;
  }
  if (organizationId === 'yw') for (const fixture of ywInquiryFixtures) {
    const result = previewYwHandoff(organizationId, contract, fixture.companyId, fixture.propertyId, fixture.id);
    if (result.ok) add(fixture.id, result.preview.threadId, result.preview.reference, result.preview.question, ywModuleLabels[fixture.module], result.preview.reviewNote);
    else heldSamples++;
  }
  return { ok: true, items, heldSamples };
}
