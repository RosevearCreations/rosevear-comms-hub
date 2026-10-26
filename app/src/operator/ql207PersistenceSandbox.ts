import type { OrganizationId } from './ql191Organizations';
import { connectorContracts, type ConnectorContract } from './ql199ConnectorContracts';
import { campIntakeFixtures } from './ql202CampConnector';
import { ywInquiryFixtures } from './ql203YwConnector';
import { buildMockReviewQueue, type MockReviewQueueItem } from './ql204HandoffReviewQueue';
import { eligibleMockReviewDesk } from './ql205ReviewDesk';
import { assessMockHandoffSecurity, type MockOperatorProfile } from './ql206SecureOperations';

export type MockPersistenceStage = 'triage_note' | 'human_review_needed';
export interface MockPersistenceRecord {
  key: string;
  organizationId: OrganizationId;
  tenantId: string | null;
  propertyId: string | null;
  itemId: string;
  reference: string;
  stage: MockPersistenceStage;
  version: number;
  sampleOnly: true;
}
export type MockPersistenceFailure = 'not_authorized' | 'invalid_fixture' | 'invalid_request' | 'idempotency_conflict' | 'stale_version';
export type MockPersistenceResult =
  | { ok: true; record: MockPersistenceRecord; replayed: boolean }
  | { ok: false; reason: MockPersistenceFailure; explanation: string };

export interface MockPersistenceRequest {
  organizationId: OrganizationId;
  contract: ConnectorContract;
  profile: MockOperatorProfile;
  item: MockReviewQueueItem;
  stage: MockPersistenceStage;
  expectedVersion: number;
  requestId: string;
}

interface Receipt { fingerprint: string; record: MockPersistenceRecord }

function getScope(organizationId: OrganizationId, itemId: string): { tenantId: string | null; propertyId: string | null } | null {
  if (organizationId === 'icamp') {
    const camp = campIntakeFixtures.find((item) => item.id === itemId);
    return camp ? { tenantId: camp.campgroundId, propertyId: null } : null;
  }
  if (organizationId === 'yw') {
    const yw = ywInquiryFixtures.find((item) => item.id === itemId);
    return yw ? { tenantId: yw.companyId, propertyId: yw.propertyId } : null;
  }
  return { tenantId: null, propertyId: null };
}

/**
 * A browser-memory transaction rehearsal only. There are intentionally no
 * Supabase clients, fetches, localStorage calls or other persistence adapters.
 */
export class MockPersistenceSandbox {
  private records = new Map<string, MockPersistenceRecord>();
  private receipts = new Map<string, Receipt>();

  save(request: MockPersistenceRequest): MockPersistenceResult {
    const { organizationId, contract, profile, item, stage, expectedVersion, requestId } = request;
    if (contract !== connectorContracts[organizationId] || !eligibleMockReviewDesk(organizationId, contract, item).ok) {
      return { ok: false, reason: 'invalid_fixture', explanation: 'Held, altered, foreign or missing fictional source.' };
    }
    if (!assessMockHandoffSecurity(organizationId, contract, profile, item, 'edit_rehearsal').designAllows) {
      return { ok: false, reason: 'not_authorized', explanation: 'This role, business, campground or property scope fails the proposed design test.' };
    }
    if (!['triage_note', 'human_review_needed'].includes(stage) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || !/^demo-[1-9]\d{0,8}$/.test(requestId)) {
      return { ok: false, reason: 'invalid_request', explanation: 'Only bounded fictional stages, versions and demo idempotency keys are accepted.' };
    }
    const scope = getScope(organizationId, item.id);
    if (!scope) return { ok: false, reason: 'invalid_fixture', explanation: 'No invented tenant ownership mapping exists for this source.' };
    const key = [organizationId, scope.tenantId ?? '-', scope.propertyId ?? '-', item.id].join(':');
    const idempotencyKey = `${organizationId}:${profile.id}:${requestId}`;
    const fingerprint = `${key}|${stage}|${expectedVersion}`;
    const receipt = this.receipts.get(idempotencyKey);
    if (receipt) {
      return receipt.fingerprint === fingerprint
        ? { ok: true, record: receipt.record, replayed: true }
        : { ok: false, reason: 'idempotency_conflict', explanation: 'An existing demo request key cannot be reused for a different write.' };
    }
    const previous = this.records.get(key);
    if ((previous?.version ?? 0) !== expectedVersion) {
      return { ok: false, reason: 'stale_version', explanation: 'A newer fictional version exists. Re-read before retrying a changed write.' };
    }
    const record: MockPersistenceRecord = Object.freeze({ key, organizationId, ...scope, itemId: item.id,
      reference: item.reference, stage, version: expectedVersion + 1, sampleOnly: true });
    this.records.set(key, record);
    this.receipts.set(idempotencyKey, { fingerprint, record });
    return { ok: true, record, replayed: false };
  }

  /** Query returns only fictional records visible to this exact invented persona. */
  visibleTo(organizationId: OrganizationId, profile: MockOperatorProfile): readonly MockPersistenceRecord[] {
    const contract = connectorContracts[organizationId];
    return [...this.records.values()].filter((record) => {
      if (record.organizationId !== organizationId) return false;
      const fixture = this.findAllowlistedItem(organizationId, record.itemId);
      return Boolean(fixture && fixture.reference === record.reference
        && assessMockHandoffSecurity(organizationId, contract, profile, fixture, 'inspect_summary').designAllows);
    });
  }

  private findAllowlistedItem(organizationId: OrganizationId, itemId: string): MockReviewQueueItem | undefined {
    // Only a fixed connector-generated fixture may be materialized in a query.
    const contract = connectorContracts[organizationId];
    const queue = buildQueue(organizationId, contract);
    return queue.find((item) => item.id === itemId);
  }

  clear() { this.records.clear(); this.receipts.clear(); }
}

// Indirection makes it impossible to accidentally query external records here.
function buildQueue(organizationId: OrganizationId, contract: ConnectorContract): readonly MockReviewQueueItem[] {
  const result = buildMockReviewQueue(organizationId, contract);
  return result.ok ? result.items : [];
}
