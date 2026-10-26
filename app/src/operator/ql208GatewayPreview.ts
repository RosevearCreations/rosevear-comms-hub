import type { OrganizationId } from './ql191Organizations';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import type { MockReviewQueueItem } from './ql204HandoffReviewQueue';
import { eligibleMockReviewDesk } from './ql205ReviewDesk';
import { assessMockHandoffSecurity, type MockOperatorProfile } from './ql206SecureOperations';

export const QL208_PREVIEW_VERSION = 'ql208-secure-provider-webhook-gateway-sandbox-mock-v1';
export type MockGatewayCase = 'fresh' | 'duplicate' | 'invalid_signature' | 'stale_nonce'
  | 'wrong_company' | 'wrong_tenant' | 'wrong_property' | 'unknown_fixture' | 'outbound';

export const mockGatewayCases: readonly { id: MockGatewayCase; label: string; for?: readonly OrganizationId[] }[] = [
  { id: 'fresh', label: 'Fictional inbound notice · expected valid' },
  { id: 'duplicate', label: 'Repeat accepted synthetic event ID' },
  { id: 'invalid_signature', label: 'Edited signature or raw body' },
  { id: 'stale_nonce', label: 'Expired or future-dated nonce' },
  { id: 'wrong_company', label: 'Wrong company routing' },
  { id: 'wrong_tenant', label: 'Wrong campground / YW company tenant', for: ['icamp', 'yw'] },
  { id: 'wrong_property', label: 'Wrong YW property', for: ['yw'] },
  { id: 'unknown_fixture', label: 'Unknown or held source reference' },
  { id: 'outbound', label: 'Attempt outgoing SMS, phone call or auto-reply' }
];

export type MockGatewayDisposition = 'HELD_FOR_REVIEW' | 'DENIED_REPLAY' | 'DENIED_SIGNATURE'
  | 'DENIED_TIME' | 'DENIED_COMPANY' | 'DENIED_TENANT' | 'DENIED_PROPERTY'
  | 'DENIED_SOURCE' | 'DENIED_OUTBOUND' | 'DENIED_OPERATOR' | 'INVALID_SCENARIO' | 'NO_PRIOR_RECEIPT';
export interface MockGatewayPreviewResult {
  disposition: MockGatewayDisposition;
  explanation: string;
  realProviderSignatureVerified: false;
  messagesSent: 0;
  callsPlaced: 0;
  externalWrites: 0;
}
export interface MockGatewayReceipt {
  key: string;
  reference: string;
  organizationId: OrganizationId;
  sampleOnly: true;
  state: 'HELD_FOR_HUMAN_REVIEW';
}
export interface MockGatewayPreviewRequest {
  organizationId: OrganizationId;
  contract: ConnectorContract;
  profile: MockOperatorProfile;
  item: MockReviewQueueItem;
  scenario: MockGatewayCase;
}
const deny = (disposition: MockGatewayDisposition, explanation: string): MockGatewayPreviewResult => ({
  disposition, explanation, realProviderSignatureVerified: false, messagesSent: 0,
  callsPlaced: 0, externalWrites: 0
});

/**
 * A browser demonstration of operator workflow decisions. It NEVER cryptographically
 * validates a webhook: the isolated Node CI harness tests actual invented HMAC bytes.
 */
export class MockGatewayPreviewWorkbench {
  private receipts = new Map<string, MockGatewayReceipt>();

  run({ organizationId, contract, profile, item, scenario }: MockGatewayPreviewRequest): MockGatewayPreviewResult {
    if (contract !== connectorContracts[organizationId] || !eligibleMockReviewDesk(organizationId, contract, item).ok) {
      return deny('DENIED_SOURCE', 'Company contract or fictional connector item was altered or is held.');
    }
    const decision = assessMockHandoffSecurity(organizationId, contract, profile, item, 'inspect_summary');
    if (!decision.designAllows) return deny('DENIED_OPERATOR', `Invented operator boundary: ${decision.explanation}`);
    if (!mockGatewayCases.some((entry) => entry.id === scenario && (!entry.for || entry.for.includes(organizationId)))) {
      return deny('INVALID_SCENARIO', 'This test is not applicable to this organization.');
    }
    if (scenario === 'outbound') return deny('DENIED_OUTBOUND', 'The outgoing message/phone dispatch queue does not exist. No send control is enabled.');
    if (scenario === 'invalid_signature') return deny('DENIED_SIGNATURE', 'Projected hold: changed raw content fails the synthetic server HMAC test. No signature checked in this browser.');
    if (scenario === 'stale_nonce') return deny('DENIED_TIME', 'Projected hold: the server test rejects an event outside the five-minute window.');
    if (scenario === 'wrong_company') return deny('DENIED_COMPANY', 'Projected hold: a signed source cannot be routed to a different company.');
    if (scenario === 'wrong_tenant') return deny('DENIED_TENANT', 'Projected hold: the campground or PMS tenant differs from the trusted route.');
    if (scenario === 'wrong_property') return deny('DENIED_PROPERTY', 'Projected hold: the YW property differs from the trusted route.');
    if (scenario === 'unknown_fixture') return deny('DENIED_SOURCE', 'Projected hold: an unrecognized or intentionally held source has no intake route.');
    const key = `${organizationId}:${item.id}`;
    if (scenario === 'duplicate') return this.receipts.has(key)
      ? deny('DENIED_REPLAY', 'The already received fictional notice cannot create a second handoff.')
      : deny('NO_PRIOR_RECEIPT', 'Receive the fictional inbound notice once before replaying it.');
    if (this.receipts.has(key)) return deny('DENIED_REPLAY', 'A prior fictional notice is already held in this browser memory.');
    this.receipts.set(key, Object.freeze({ key, reference: item.reference, organizationId, sampleOnly: true, state: 'HELD_FOR_HUMAN_REVIEW' }));
    return deny('HELD_FOR_REVIEW', 'Synthetic inbound notice held for manual review in browser memory. No contact, provider or backend was used.');
  }

  visible(organizationId: OrganizationId, profile: MockOperatorProfile): readonly MockGatewayReceipt[] {
    const contract = connectorContracts[organizationId];
    return [...this.receipts.values()].filter((receipt) => receipt.organizationId === organizationId &&
      // An item must still be recognizable by an authorized fictional viewer.
      this.getItem(organizationId, receipt.key)?.reference === receipt.reference &&
      assessMockHandoffSecurity(organizationId, contract, profile, this.getItem(organizationId, receipt.key)!, 'inspect_summary').designAllows);
  }

  private getItem(organizationId: OrganizationId, key: string): MockReviewQueueItem | undefined {
    // Imported lazily from the fixed review queue to avoid trusting mutable caller data.
    return this.knownItems[organizationId]?.find((item) => `${organizationId}:${item.id}` === key);
  }

  private knownItems: Partial<Record<OrganizationId, readonly MockReviewQueueItem[]>> = {};
  setAllowlistedItems(organizationId: OrganizationId, items: readonly MockReviewQueueItem[]) {
    // Caller may only offer canonical, safe queue objects; individual items are checked again on read.
    this.knownItems[organizationId] = items.filter((item) => eligibleMockReviewDesk(organizationId, connectorContracts[organizationId], item).ok);
  }
  clear() { this.receipts.clear(); }
}
