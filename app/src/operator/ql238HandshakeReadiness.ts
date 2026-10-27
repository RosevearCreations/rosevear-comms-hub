import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { OrganizationId } from './ql191Organizations';
import { QL237_COMPANY_CONTRACTS, ROSEVEAR_INTEGRATION_CONTRACT } from './ql237IntegrationReadiness';

export const QL238_RELEASE = 'ql238-v1-health-capabilities-handshake-readiness-tenant-isolation-held-evidence-v1';
export const QL238_PREVIEW_ENV = 'disabled-preview' as const;
export type Ql238Kind = 'health' | 'capabilities';
export type Ql238ConnectionState = 'DISCONNECTED' | 'HOLD';
export type Ql238Disposition = 'HELD_UNVERIFIED' | 'DENIED_SCHEMA' | 'DENIED_ROUTE'
  | 'DENIED_BUSINESS' | 'DENIED_TENANT' | 'DENIED_ENVIRONMENT' | 'DENIED_CAPABILITY'
  | 'DENIED_TIME' | 'DENIED_SEQUENCE' | 'DENIED_REPLAY';

export interface Ql238Request {
  application_id: OrganizationId;
  gateway_id: 'ai-data-platform';
  method: 'GET';
  path: '/api/integration/v1/health' | '/api/integration/v1/capabilities';
  schema_version: typeof ROSEVEAR_INTEGRATION_CONTRACT;
  environment: typeof QL238_PREVIEW_ENV;
  business_id: OrganizationId;
  tenant_id: string | null;
  requested_capabilities: readonly string[];
  nonce: string;
  issued_at: string;
}

export interface Ql238ResponsePreview {
  application_id: OrganizationId;
  application_version: 'demo-only';
  contract_version: typeof ROSEVEAR_INTEGRATION_CONTRACT;
  environment: typeof QL238_PREVIEW_ENV;
  connection_status: 'HOLD';
  capabilities?: readonly string[];
}

export interface Ql238Receipt {
  company: OrganizationId;
  kind: Ql238Kind;
  disposition: Ql238Disposition;
  reason: string;
  response: Ql238ResponsePreview | null;
  actualConnection: 'DISCONNECTED';
  realIdentityVerified: false;
  signedServerRequestVerified: false;
  sentRequests: 0;
  externalWrites: 0;
  liveCalls: 0;
  liveSms: 0;
  ownerApproval: false;
  actualPilotHolds: 12;
}

export interface Ql238Evidence {
  health: Ql238Receipt | null;
  capabilities: Ql238Receipt | null;
  acknowledgement: 'NOT_REVIEWED' | 'ACKNOWLEDGED_UNVERIFIED';
  phase: 'REVIEW_ONLY' | 'LOCAL_PACKET_PREPARED_HELD';
}
export type Ql238Ledger = Partial<Record<OrganizationId, Ql238Evidence>>;

const allowedKeys = [
  'application_id', 'gateway_id', 'method', 'path', 'schema_version', 'environment',
  'business_id', 'tenant_id', 'requested_capabilities', 'nonce', 'issued_at'
] as const;

function actualHoldsUntouched(): boolean {
  return QL181_PREREQUISITES.length === 12 &&
    QL181_PREREQUISITES.every((item) => item.state === 'HELD_UNVERIFIED');
}

/** v1 readiness advertises read-only capabilities, never commands or transfers. */
export function ql238ReadCapabilities(company: OrganizationId): readonly string[] {
  return QL237_COMPANY_CONTRACTS[company].capabilities.filter((item) => item.startsWith('read_'));
}

export function ql238RequestFixture(
  company: OrganizationId, kind: Ql238Kind, nonce = 'mock-first', now = new Date()
): Ql238Request {
  return {
    application_id: company, gateway_id: 'ai-data-platform', method: 'GET',
    path: kind === 'health' ? '/api/integration/v1/health' : '/api/integration/v1/capabilities',
    schema_version: ROSEVEAR_INTEGRATION_CONTRACT, environment: QL238_PREVIEW_ENV,
    business_id: company,
    tenant_id: QL237_COMPANY_CONTRACTS[company].tenantRequired ? 'demo-' + company + '-tenant' : null,
    requested_capabilities: kind === 'health' ? [] : ql238ReadCapabilities(company),
    nonce, issued_at: now.toISOString()
  };
}

function receipt(company: OrganizationId, kind: Ql238Kind, disposition: Ql238Disposition,
  reason: string, response: Ql238ResponsePreview | null = null): Ql238Receipt {
  return {
    company, kind, disposition, reason, response, actualConnection: 'DISCONNECTED',
    realIdentityVerified: false, signedServerRequestVerified: false,
    sentRequests: 0, externalWrites: 0, liveCalls: 0, liveSms: 0,
    ownerApproval: false, actualPilotHolds: 12
  };
}

/**
 * In-browser shape/route preflight. It deliberately CANNOT verify any real
 * signature or reach another app. Even a passing fixture remains HELD.
 */
export function inspectQl238Fixture(
  request: Ql238Request, company: OrganizationId, seen: Set<string>, now = new Date()
): Ql238Receipt {
  const kind: Ql238Kind = request?.path === '/api/integration/v1/capabilities' ? 'capabilities' : 'health';
  const contract = QL237_COMPANY_CONTRACTS[company];
  if (!request || typeof request !== 'object' || Object.keys(request).length !== allowedKeys.length ||
      Object.keys(request).some((key) => !allowedKeys.includes(key as typeof allowedKeys[number])) ||
      !request.nonce || !/^mock-[a-z0-9-]{1,48}$/.test(request.nonce) ||
      request.method !== 'GET' ||
      !Array.isArray(request.requested_capabilities) ||
      request.schema_version !== ROSEVEAR_INTEGRATION_CONTRACT) {
    return receipt(company, kind, 'DENIED_SCHEMA', 'A malformed, expanded or unversioned v1 request fails closed.');
  }
  if (request.gateway_id !== 'ai-data-platform' ||
      !['/api/integration/v1/health', '/api/integration/v1/capabilities'].includes(request.path)) {
    return receipt(company, kind, 'DENIED_ROUTE', 'Only read-only health and capabilities via AI Data Platform are in scope.');
  }
  if (request.application_id !== company || request.business_id !== company) {
    return receipt(company, kind, 'DENIED_BUSINESS', 'The claimed source or business differs from the isolated active company.');
  }
  if ((contract.tenantRequired && request.tenant_id !== 'demo-' + company + '-tenant') ||
      (!contract.tenantRequired && request.tenant_id !== null)) {
    return receipt(company, kind, 'DENIED_TENANT', 'Company/campground tenant is missing, foreign or unexpected.');
  }
  if (request.environment !== QL238_PREVIEW_ENV) {
    return receipt(company, kind, 'DENIED_ENVIRONMENT', 'A production or mismatched environment cannot use the disabled-preview rehearsal.');
  }
  const permitted = kind === 'health' ? [] : ql238ReadCapabilities(company);
  if (request.requested_capabilities.length !== permitted.length ||
      new Set(request.requested_capabilities).size !== permitted.length ||
      request.requested_capabilities.some((name) => !permitted.includes(name))) {
    return receipt(company, kind, 'DENIED_CAPABILITY', 'No write, provider, unknown or cross-business capability can be requested.');
  }
  const timestamp = Date.parse(request.issued_at);
  if (!Number.isFinite(timestamp) || Math.abs(now.getTime() - timestamp) > 300_000) {
    return receipt(company, kind, 'DENIED_TIME', 'Mock handshake nonce is older or later than the five-minute review window.');
  }
  const routePrefix = [company, request.tenant_id ?? 'single-business'].join(':') + ':';
  if (kind === 'capabilities' && ![...seen].some((key) => key.startsWith(routePrefix + 'health:'))) {
    return receipt(company, kind, 'DENIED_SEQUENCE', 'Inspect health for this exact fictional company and tenant before capabilities.');
  }
  if (!actualHoldsUntouched()) {
    return receipt(company, kind, 'DENIED_SCHEMA', 'QL-181 release register changed; independently reassess all actual holds first.');
  }
  const key = [company, request.tenant_id ?? 'single-business', kind, request.nonce].join(':');
  if (seen.has(key)) return receipt(company, kind, 'DENIED_REPLAY', 'Repeated fixture nonce cannot create another handshake receipt.');
  seen.add(key);
  const response: Ql238ResponsePreview = {
    application_id: company, application_version: 'demo-only',
    contract_version: ROSEVEAR_INTEGRATION_CONTRACT, environment: QL238_PREVIEW_ENV,
    connection_status: 'HOLD', ...(kind === 'capabilities' ? { capabilities: permitted } : {})
  };
  return receipt(company, kind, 'HELD_UNVERIFIED',
    'Synthetic health/capability shape is in scope, but no server identity, signature, remote response or real connector was verified.',
    response);
}

export function recordQl238Evidence(ledger: Ql238Ledger, sample: Ql238Receipt): Ql238Ledger {
  const current = ledger[sample.company];
  return {
    ...ledger, [sample.company]: {
      health: sample.kind === 'health' ? sample : current?.health ?? null,
      capabilities: sample.kind === 'health' ? null : sample,
      acknowledgement: 'NOT_REVIEWED', phase: 'REVIEW_ONLY'
    }
  };
}

export function ql238EvidenceReady(evidence: Ql238Evidence | undefined): boolean {
  return !!evidence && actualHoldsUntouched() &&
    evidence.health?.disposition === 'HELD_UNVERIFIED' &&
    evidence.capabilities?.disposition === 'HELD_UNVERIFIED';
}

/** Only an explicit fictional evidence acknowledgement, not actual owner approval. */
export function acknowledgeQl238Evidence(ledger: Ql238Ledger, company: OrganizationId): Ql238Ledger {
  const entry = ledger[company];
  if (!ql238EvidenceReady(entry)) return ledger;
  return { ...ledger, [company]: { ...entry!, acknowledgement: 'ACKNOWLEDGED_UNVERIFIED', phase: 'REVIEW_ONLY' } };
}

/** A packet never changes the connection's DISCONNECTED state or the 12 real holds. */
export function prepareQl238HeldPacket(ledger: Ql238Ledger, company: OrganizationId): Ql238Ledger {
  const entry = ledger[company];
  if (!ql238EvidenceReady(entry) || entry?.acknowledgement !== 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return { ...ledger, [company]: { ...entry!, phase: 'LOCAL_PACKET_PREPARED_HELD' } };
}

export function resetQl238Company(ledger: Ql238Ledger, company: OrganizationId): Ql238Ledger {
  const next = { ...ledger };
  delete next[company];
  return next;
}

export function ql238Portfolio(ledger: Ql238Ledger) {
  const ids: readonly OrganizationId[] = ['rosiedazzlers', 'devilndove', 'icamp', 'yw'];
  return ids.map((id) => ({
    company: id, health: ledger[id]?.health?.disposition ?? 'NOT_TESTED',
    capabilities: ledger[id]?.capabilities?.disposition ?? 'NOT_TESTED',
    phase: ledger[id]?.phase ?? 'REVIEW_ONLY', actualConnection: 'DISCONNECTED' as const,
    realPilotHolds: QL181_PREREQUISITES.filter((item) => item.state === 'HELD_UNVERIFIED').length
  }));
}
