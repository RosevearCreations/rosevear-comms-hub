import { inboxForOrganization } from './ql192InboxFixtures';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import type { OrganizationId } from './ql191Organizations';

export type RosieIntakeKind = 'quote_request' | 'booking_question';
export type RosieHandoffState = 'operator_review_required';
export interface RosieIntakeFixture {
  id: string;
  organizationId: 'rosiedazzlers';
  sourceId: string;
  kind: RosieIntakeKind;
  service: string;
  vehicleGroup: string;
  preferredWindow: string;
  additionalDetails: string;
}

/** Explicitly fictional and not read from Rosie Dazzlers' database or booking service. */
export const rosieIntakeFixtures: readonly RosieIntakeFixture[] = [
  {
    id: 'rosie-demo-quote-1', organizationId: 'rosiedazzlers', sourceId: 'rd-website',
    kind: 'quote_request', service: 'Ceramic coating inquiry', vehicleGroup: 'Midsize vehicle',
    preferredWindow: 'To be discussed', additionalDetails: 'Review paint condition and coating eligibility before giving an estimate.'
  },
  {
    id: 'rosie-demo-booking-1', organizationId: 'rosiedazzlers', sourceId: 'rd-email',
    kind: 'booking_question', service: 'Recurring fleet detailing inquiry', vehicleGroup: 'Fleet size not supplied',
    preferredWindow: 'Schedule not supplied', additionalDetails: 'Manual review of vehicle count, capacity and seasonal service eligibility is required.'
  }
] as const;

export interface RosieHandoffPreview {
  reference: string;
  sourceId: string;
  intakeKind: RosieIntakeKind;
  service: string;
  vehicleGroup: string;
  preferredWindow: string;
  additionalDetails: string;
  sourceSubject: string;
  state: RosieHandoffState;
  pricing: 'not_quoted';
  availability: 'not_checked';
  deposit: 'not_requested';
  booking: 'not_created';
  delivery: 'not_sent';
}

export type RosieHandoffResult =
  | { ok: true; preview: RosieHandoffPreview }
  | { ok: false; reason: 'wrong_organization' | 'unknown_sample' | 'source_disallowed' };

/** An offline allowlist adapter, not a credentialled API connector or reservation writer. */
export function previewRosieHandoff(organizationId: OrganizationId, contract: ConnectorContract, sampleId: string): RosieHandoffResult {
  if (organizationId !== 'rosiedazzlers' || contract !== connectorContracts.rosiedazzlers || contract.organizationId !== organizationId || contract.state !== 'mock_only') {
    return { ok: false, reason: 'wrong_organization' };
  }
  const sample = rosieIntakeFixtures.find((item) => item.id === sampleId && item.organizationId === 'rosiedazzlers');
  if (!sample) return { ok: false, reason: 'unknown_sample' };
  const thread = inboxForOrganization('rosiedazzlers').find((item) => item.id === sample.sourceId && item.organizationId === organizationId && contract.approvedChannels.includes(item.channel));
  if (!thread) return { ok: false, reason: 'source_disallowed' };
  return { ok: true, preview: {
    reference: `DEMO-${sample.id.toUpperCase()}`, sourceId: thread.id, intakeKind: sample.kind,
    service: sample.service, vehicleGroup: sample.vehicleGroup, preferredWindow: sample.preferredWindow,
    additionalDetails: sample.additionalDetails, sourceSubject: thread.subject, state: 'operator_review_required',
    pricing: 'not_quoted', availability: 'not_checked', deposit: 'not_requested', booking: 'not_created', delivery: 'not_sent'
  } };
}
