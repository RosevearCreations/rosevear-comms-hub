import { inboxForOrganization } from './ql192InboxFixtures';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import type { OrganizationId } from './ql191Organizations';

export const campDemoTenants = [
  { id: 'camp-rosevear-demo', name: 'Camp Rosevear · fictional sample' },
  { id: 'camp-isolated-demo', name: 'Other demo campground · no shared records' }
] as const;
export type CampIntakeKind = 'reservation_question' | 'guest_service';

export interface CampIntakeFixture {
  id: string;
  organizationId: 'icamp';
  campgroundId: string;
  threadId: string;
  kind: CampIntakeKind;
  topic: string;
  siteOrEvent: string;
  stayOrVisitDates: string;
  reviewNote: string;
}

/** The example tenant and requests are fabricated. There is no iCamp API client. */
export const campIntakeFixtures: readonly CampIntakeFixture[] = [
  {
    id: 'camp-demo-reservation-1', organizationId: 'icamp', campgroundId: 'camp-rosevear-demo',
    threadId: 'camp-sms', kind: 'reservation_question', topic: 'Tent-site availability question',
    siteOrEvent: 'Tent site — specific site not chosen', stayOrVisitDates: 'Requested dates not supplied',
    reviewNote: 'Confirm dates, site type, occupancy rules, availability and rate with authorized campground staff.'
  },
  {
    id: 'camp-demo-guest-1', organizationId: 'icamp', campgroundId: 'camp-rosevear-demo',
    threadId: 'camp-web', kind: 'guest_service', topic: 'Event-hall visitor pass question',
    siteOrEvent: 'Fictional dance event', stayOrVisitDates: 'Event date not supplied',
    reviewNote: 'Verify event rules, visitor capacity, pass eligibility and office authorization before offering access.'
  }
] as const;

export interface CampHandoffPreview {
  reference: string;
  campgroundId: string;
  campgroundName: string;
  threadId: string;
  sourceSubject: string;
  kind: CampIntakeKind;
  topic: string;
  siteOrEvent: string;
  stayOrVisitDates: string;
  reviewNote: string;
  ownerReview: 'required';
  availability: 'not_checked';
  reservation: 'not_created';
  visitorPass: 'not_issued';
  gateAccess: 'not_granted';
  payment: 'not_requested';
  communication: 'not_sent';
}

export type CampHandoffResult =
  | { ok: true; preview: CampHandoffPreview }
  | { ok: false; reason: 'wrong_organization' | 'unknown_campground' | 'unknown_sample' | 'tenant_mismatch' | 'source_disallowed' };

/** Read-only, company-and-campground-scoped simulation. Real RBAC belongs on a private server. */
export function previewCampHandoff(organizationId: OrganizationId, contract: ConnectorContract, campgroundId: string, fixtureId: string): CampHandoffResult {
  if (organizationId !== 'icamp' || contract !== connectorContracts.icamp || contract.organizationId !== organizationId || contract.state !== 'mock_only') return { ok: false, reason: 'wrong_organization' };
  const campground = campDemoTenants.find((tenant) => tenant.id === campgroundId);
  if (!campground) return { ok: false, reason: 'unknown_campground' };
  const fixture = campIntakeFixtures.find((item) => item.id === fixtureId && item.organizationId === 'icamp');
  if (!fixture) return { ok: false, reason: 'unknown_sample' };
  if (fixture.campgroundId !== campgroundId) return { ok: false, reason: 'tenant_mismatch' };
  const thread = inboxForOrganization('icamp').find((item) => item.id === fixture.threadId && item.organizationId === organizationId && contract.approvedChannels.includes(item.channel));
  if (!thread) return { ok: false, reason: 'source_disallowed' };
  return { ok: true, preview: {
    reference: `DEMO-${fixture.id.toUpperCase()}`, campgroundId: campground.id, campgroundName: campground.name,
    threadId: thread.id, sourceSubject: thread.subject, kind: fixture.kind, topic: fixture.topic,
    siteOrEvent: fixture.siteOrEvent, stayOrVisitDates: fixture.stayOrVisitDates, reviewNote: fixture.reviewNote,
    ownerReview: 'required', availability: 'not_checked', reservation: 'not_created',
    visitorPass: 'not_issued', gateAccess: 'not_granted', payment: 'not_requested', communication: 'not_sent'
  } };
}
