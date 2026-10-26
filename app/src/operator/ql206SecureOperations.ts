import type { OrganizationId } from './ql191Organizations';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import { campIntakeFixtures } from './ql202CampConnector';
import { ywInquiryFixtures, ywDemoCompanies, ywDemoProperties } from './ql203YwConnector';
import type { MockReviewQueueItem } from './ql204HandoffReviewQueue';
import { eligibleMockReviewDesk } from './ql205ReviewDesk';

export type MockSecurityRole = 'signed_out' | 'viewer' | 'reviewer' | 'manager' | 'owner';
export type MockSecurityOperation = 'inspect_summary' | 'edit_rehearsal' | 'prepare_packet' | 'send_message';

export interface MockOperatorProfile {
  id: string;
  label: string;
  role: MockSecurityRole;
  organizationId: OrganizationId | null;
  tenantId: string | null;
  propertyId: string | null;
}

/** Fixed, invented personas. Selecting one is NEVER a login or a role grant. */
export const mockOperatorProfiles: readonly MockOperatorProfile[] = [
  { id: 'signed-out', label: 'Signed out · no company', role: 'signed_out', organizationId: null, tenantId: null, propertyId: null },
  { id: 'rosie-viewer', label: 'Rosie · read-only staff', role: 'viewer', organizationId: 'rosiedazzlers', tenantId: null, propertyId: null },
  { id: 'rosie-reviewer', label: 'Rosie · review staff', role: 'reviewer', organizationId: 'rosiedazzlers', tenantId: null, propertyId: null },
  { id: 'rosie-manager', label: 'Rosie · manager', role: 'manager', organizationId: 'rosiedazzlers', tenantId: null, propertyId: null },
  { id: 'dnd-reviewer', label: 'Devil n Dove · review staff', role: 'reviewer', organizationId: 'devilndove', tenantId: null, propertyId: null },
  { id: 'dnd-owner', label: 'Devil n Dove · owner', role: 'owner', organizationId: 'devilndove', tenantId: null, propertyId: null },
  { id: 'camp-rosevear-reviewer', label: 'Camp Rosevear · review staff', role: 'reviewer', organizationId: 'icamp', tenantId: 'camp-rosevear-demo', propertyId: null },
  { id: 'camp-rosevear-manager', label: 'Camp Rosevear · manager', role: 'manager', organizationId: 'icamp', tenantId: 'camp-rosevear-demo', propertyId: null },
  { id: 'camp-isolated-manager', label: 'Other campground · manager', role: 'manager', organizationId: 'icamp', tenantId: 'camp-isolated-demo', propertyId: null },
  { id: 'yw-property-a-reviewer', label: 'Yard Rosevear · Lot A review staff', role: 'reviewer', organizationId: 'yw', tenantId: 'yard-rosevear-demo', propertyId: 'yw-farm-road-demo' },
  { id: 'yw-rosevear-manager', label: 'Yard Rosevear · manager', role: 'manager', organizationId: 'yw', tenantId: 'yard-rosevear-demo', propertyId: null },
  { id: 'yw-isolated-manager', label: 'Other YW company · manager', role: 'manager', organizationId: 'yw', tenantId: 'yard-isolated-demo', propertyId: null }
];

export const mockSecurityOperations: readonly { id: MockSecurityOperation; label: string }[] = [
  { id: 'inspect_summary', label: 'Inspect fictional summary' },
  { id: 'edit_rehearsal', label: 'Draft internal rehearsal' },
  { id: 'prepare_packet', label: 'Prepare fictional packet' },
  { id: 'send_message', label: 'Send message · always blocked' }
];

const roleOperations: Readonly<Record<MockSecurityRole, readonly MockSecurityOperation[]>> = {
  signed_out: [],
  viewer: ['inspect_summary'],
  reviewer: ['inspect_summary', 'edit_rehearsal'],
  manager: ['inspect_summary', 'edit_rehearsal', 'prepare_packet'],
  owner: ['inspect_summary', 'edit_rehearsal', 'prepare_packet']
};

export type MockSecurityReason =
  | 'unknown_profile' | 'invalid_source' | 'unverified_identity' | 'company_scope'
  | 'tenant_scope' | 'property_scope' | 'role_scope' | 'external_disabled' | 'design_only';

export interface MockSecurityDecision {
  designAllows: boolean;
  runtime: 'disabled';
  verifiedIdentity: false;
  reason: MockSecurityReason;
  explanation: string;
}

function deny(reason: MockSecurityReason, explanation: string): MockSecurityDecision {
  return { designAllows: false, runtime: 'disabled', verifiedIdentity: false, reason, explanation };
}

/**
 * A deliberately non-authoritative design test. No identity/token/claim is verified,
 * and even a role match can never become an actual runtime permission.
 */
export function assessMockHandoffSecurity(
  organizationId: OrganizationId,
  contract: ConnectorContract,
  profile: MockOperatorProfile,
  item: MockReviewQueueItem,
  operation: MockSecurityOperation
): MockSecurityDecision {
  if (!mockOperatorProfiles.includes(profile)) return deny('unknown_profile', 'This invented persona is not in the fixed test registry.');
  if (connectorContracts[organizationId] !== contract || !eligibleMockReviewDesk(organizationId, contract, item).ok) {
    return deny('invalid_source', 'Company contract or fictional sample is missing, held, altered, or belongs elsewhere.');
  }
  if (operation === 'send_message' || !mockSecurityOperations.some((entry) => entry.id === operation)) {
    return deny('external_disabled', 'No simulated role can send, approve, dispatch, export, or connect to a provider.');
  }
  if (profile.role === 'signed_out' || !profile.organizationId) {
    return deny('unverified_identity', 'Signed-out personas cannot inspect or edit a fictional handoff in this policy test.');
  }
  if (profile.organizationId !== organizationId) {
    return deny('company_scope', 'Assigned company differs from the company that owns this fictional inquiry.');
  }
  if (organizationId === 'icamp') {
    const fixture = campIntakeFixtures.find((entry) => entry.id === item.id && entry.organizationId === organizationId);
    if (!fixture || profile.tenantId !== fixture.campgroundId) {
      return deny('tenant_scope', 'The assigned campground tenant does not own this fictional inquiry.');
    }
  }
  if (organizationId === 'yw') {
    const fixture = ywInquiryFixtures.find((entry) => entry.id === item.id);
    const tenant = ywDemoCompanies.find((entry) => entry.id === fixture?.companyId);
    const property = ywDemoProperties.find((entry) => entry.id === fixture?.propertyId);
    if (!fixture || !tenant || !property || property.companyId !== tenant.id || profile.tenantId !== tenant.id) {
      return deny('tenant_scope', 'The assigned YW company tenant does not own this fictional inquiry.');
    }
    if (profile.propertyId && profile.propertyId !== property.id) {
      return deny('property_scope', 'The fictional operator has a different property assignment.');
    }
  }
  if (!roleOperations[profile.role]?.includes(operation)) {
    return deny('role_scope', 'This proposed role does not include the requested mock review operation.');
  }
  return { designAllows: true, runtime: 'disabled', verifiedIdentity: false, reason: 'design_only',
    explanation: 'Proposed role and ownership scope match the invented record. Real runtime access remains denied.' };
}
