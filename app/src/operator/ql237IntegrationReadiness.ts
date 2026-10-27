import type { OrganizationId } from './ql191Organizations';

export const QL237_RELEASE = 'ql237-no-cost-comms-options-rosevear-integration-v1-disabled-preview';
export const ROSEVEAR_INTEGRATION_CONTRACT = 'rosevear.integration.v1';

export type IntegrationSystem = OrganizationId | 'ai-data-platform' | 'rosevear-comms-hub' | 'rosevear-ai-hub';

export interface IntegrationCapabilityPreview {
  system: OrganizationId;
  owner: string;
  entity: string;
  reference: string;
  events: readonly string[];
  capabilities: readonly string[];
  tenantRequired: boolean;
}

/** Documentation-grade capability allowlists; these are NOT active grants. */
export const QL237_COMPANY_CONTRACTS: Readonly<Record<OrganizationId, IntegrationCapabilityPreview>> = {
  devilndove: {
    system: 'devilndove', owner: 'Devil n Dove', entity: 'product', reference: 'demo-product-53',
    events: ['product.updated', 'product.media_updated', 'order.created', 'listing.updated'],
    capabilities: ['read_product_reference', 'read_listing_reference', 'create_handoff_preview'], tenantRequired: false
  },
  rosiedazzlers: {
    system: 'rosiedazzlers', owner: 'Rosie Dazzlers', entity: 'booking', reference: 'demo-booking-12',
    events: ['quote.created', 'booking.created', 'booking.rescheduled', 'gift_certificate.created'],
    capabilities: ['read_quote_reference', 'read_booking_reference', 'create_handoff_preview'], tenantRequired: false
  },
  yw: {
    system: 'yw', owner: 'Yard Workers / Property Maintenance System', entity: 'job', reference: 'demo-job-7',
    events: ['service_request.created', 'job.assigned', 'job.status_changed', 'invoice.created'],
    capabilities: ['read_job_reference', 'read_property_reference', 'create_handoff_preview'], tenantRequired: true
  },
  icamp: {
    system: 'icamp', owner: 'iCamp', entity: 'reservation', reference: 'demo-reservation-9',
    events: ['reservation.created', 'reservation.changed', 'guest.arrived', 'site.status_changed'],
    capabilities: ['read_reservation_reference', 'read_site_reference', 'create_handoff_preview'], tenantRequired: true
  }
};

export interface NoCostCommunicationOption {
  id: string;
  label: string;
  costClass: 'no-platform-fee' | 'free-software-only' | 'limited-free-trial' | 'existing-plan';
  advantage: string;
  boundary: string;
  supportsRealPstnSms: boolean;
  source: string;
}

/** Dated source-linked research, not a price quote or connected provider. */
export const QL237_OPTIONS: readonly NoCostCommunicationOption[] = [
  { id: 'cloudflare-email', label: 'Cloudflare form + incoming email', costClass: 'no-platform-fee',
    advantage: 'Free-tier website inquiries and email forwarding; good first business intake path.',
    boundary: 'Not calling or SMS. Domain, mail replies, quotas and operational setup need review.',
    supportsRealPstnSms: false, source: 'https://developers.cloudflare.com/email-service/' },
  { id: 'existing-lines', label: 'Existing Bell/mobile numbers', costClass: 'existing-plan',
    advantage: 'Continue answering business calls/texts manually without buying another number.',
    boundary: 'Existing plan charges remain. No automated calling, SMS or app integration is included.',
    supportsRealPstnSms: true, source: 'https://support.bell.ca/home_phone/calling_features/how_to_use_call_forwarding_on_my_bell_home_phone' },
  { id: 'asterisk', label: 'Asterisk / FreePBX', costClass: 'free-software-only',
    advantage: 'Self-hosted, open-source phone routing and IVR software.',
    boundary: 'A Canadian public telephone number, SIP trunk and SMS gateway generally cost extra; setup/security are ours.',
    supportsRealPstnSms: false, source: 'https://www.asterisk.org/get-started/' },
  { id: 'twilio-trial', label: 'Twilio trial', costClass: 'limited-free-trial',
    advantage: 'Official limited test environment for voice/SMS developer evaluation.',
    boundary: '30-day trial, verified-recipient and product limits; pay-as-you-go for ongoing Canadian service.',
    supportsRealPstnSms: false, source: 'https://www.twilio.com/docs/usage/trials' },
  { id: 'linphone', label: 'Linphone personal SIP', costClass: 'free-software-only',
    advantage: 'Free SIP-to-SIP app testing between individual users over the internet.',
    boundary: 'Its free account is for individual users, not a pooled company phone line; no standard carrier SMS.',
    supportsRealPstnSms: false, source: 'https://www.linphone.org/en/getting-started/' }
];

export interface Ql237PreviewEvent {
  event_id: string;
  event_type: string;
  schema_version: typeof ROSEVEAR_INTEGRATION_CONTRACT;
  source_system: IntegrationSystem;
  destination_system: IntegrationSystem;
  business_id: OrganizationId;
  tenant_id: string | null;
  entity_type: string;
  entity_id: string;
  occurred_at: string;
  trace_id: string;
  idempotency_key: string;
  payload: Readonly<{ reference: string }>;
}

export type Ql237Disposition = 'HELD_UNVERIFIED' | 'REJECT_CROSS_BUSINESS' | 'REJECT_TENANT_SCOPE'
  | 'REJECT_DIRECT_ROUTE' | 'REJECT_CAPABILITY' | 'REJECT_SCHEMA' | 'REJECT_STALE_TIMESTAMP'
  | 'REJECT_REPLAY';

export interface Ql237PreviewReceipt {
  disposition: Ql237Disposition;
  explanation: string;
  business: OrganizationId;
  /** Never persist customer identifiers, payloads, access tokens or fake signatures. */
  privacy: 'REFERENCE_ONLY_NO_CUSTOMER_DATA';
  liveCalls: 0;
  liveSms: 0;
  providerDispatch: 0;
  remoteWrites: 0;
  realApproval: false;
  realPilotHolds: 12;
}

export function ql237Fixture(company: OrganizationId, id = 'mock-1', now = new Date()): Ql237PreviewEvent {
  const contract = QL237_COMPANY_CONTRACTS[company];
  return {
    event_id: 'demo-event-' + id, event_type: contract.events[0],
    schema_version: ROSEVEAR_INTEGRATION_CONTRACT, source_system: company,
    destination_system: 'ai-data-platform', business_id: company,
    tenant_id: contract.tenantRequired ? 'demo-' + company + '-tenant' : null,
    entity_type: contract.entity, entity_id: contract.reference,
    occurred_at: now.toISOString(), trace_id: 'demo-trace-' + id,
    idempotency_key: 'demo-key-' + id, payload: { reference: contract.reference }
  };
}

/** Pure, mock-only preflight. A positive result remains HELD and never authenticates/sends. */
export function inspectQl237Event(
  event: Ql237PreviewEvent, activeCompany: OrganizationId, seen: Set<string>, now = new Date()
): Ql237PreviewReceipt {
  const contract = QL237_COMPANY_CONTRACTS[activeCompany];
  let disposition: Ql237Disposition = 'HELD_UNVERIFIED';
  let explanation = 'Fictional reference matched the active company and v1 event allowlist. Actual authentication, tenant ownership, provider setup and all live release gates are UNVERIFIED.';

  if (event.schema_version !== ROSEVEAR_INTEGRATION_CONTRACT || !event.event_id || !event.trace_id ||
      !event.idempotency_key || !event.entity_id || !event.payload?.reference) {
    disposition = 'REJECT_SCHEMA'; explanation = 'Missing or mismatched integration contract fields.';
  } else if (event.destination_system !== 'ai-data-platform') {
    disposition = 'REJECT_DIRECT_ROUTE'; explanation = 'Every business event must go through AI Data Platform; no direct app-to-app route.';
  } else if (event.source_system !== activeCompany || event.business_id !== activeCompany) {
    disposition = 'REJECT_CROSS_BUSINESS'; explanation = 'An event cannot cross the selected business ownership boundary.';
  } else if ((contract.tenantRequired && event.tenant_id !== 'demo-' + activeCompany + '-tenant') ||
      (!contract.tenantRequired && event.tenant_id !== null)) {
    disposition = 'REJECT_TENANT_SCOPE'; explanation = 'Tenant scope is missing, different, or unexpectedly supplied.';
  } else if (!contract.events.includes(event.event_type) || event.entity_type !== contract.entity ||
      event.entity_id !== contract.reference || event.payload.reference !== contract.reference) {
    disposition = 'REJECT_CAPABILITY'; explanation = 'The event or reference is outside the fictional allowlist.';
  } else {
    const occurred = Date.parse(event.occurred_at);
    if (!Number.isFinite(occurred) || Math.abs(now.getTime() - occurred) > 5 * 60 * 1000) {
      disposition = 'REJECT_STALE_TIMESTAMP'; explanation = 'Event clock is outside the illustrative five-minute freshness window.';
    } else {
      const scopedKey = [activeCompany, event.tenant_id ?? 'single', event.idempotency_key].join(':');
      if (seen.has(scopedKey)) {
        disposition = 'REJECT_REPLAY'; explanation = 'Repeated mock idempotency key; no second action permitted.';
      } else { seen.add(scopedKey); }
    }
  }
  return { disposition, explanation, business: activeCompany, privacy: 'REFERENCE_ONLY_NO_CUSTOMER_DATA',
    liveCalls: 0, liveSms: 0, providerDispatch: 0, remoteWrites: 0, realApproval: false, realPilotHolds: 12 };
}
