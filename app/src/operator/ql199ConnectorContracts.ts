import { inboxForOrganization, type InboxChannel } from './ql192InboxFixtures';
import type { OrganizationId } from './ql191Organizations';

export type ConnectorOperation = 'intake_preview' | 'status_preview';
export type ConnectorState = 'mock_only';
export interface ConnectorContract {
  id: string;
  organizationId: OrganizationId;
  label: string;
  upstreamSystem: string;
  allowedOperations: readonly ConnectorOperation[];
  approvedChannels: readonly InboxChannel[];
  tenantBoundary: string;
  requiredGates: readonly string[];
  state: ConnectorState;
  nextBuild: string;
}

/** Static descriptions, NOT credentials, security grants, or live connector clients. */
export const connectorContracts: Readonly<Record<OrganizationId, ConnectorContract>> = {
  rosiedazzlers: {
    id: 'rosie-quote-intake', organizationId: 'rosiedazzlers', label: 'Detailing quote and booking intake',
    upstreamSystem: 'Rosie Dazzlers website', allowedOperations: ['intake_preview', 'status_preview'],
    approvedChannels: ['website', 'email'], tenantBoundary: 'Rosie Dazzlers organization + verified customer ownership',
    requiredGates: ['Server-authenticated Rosie organization role', 'Verified quote/booking scope', 'Read-only scoped API with audit and retention policy', 'Explicit owner approval'],
    state: 'mock_only', nextBuild: 'QL-200'
  },
  devilndove: {
    id: 'dnd-order-intake', organizationId: 'devilndove', label: 'Custom order and commission intake',
    upstreamSystem: 'Devil n Dove storefront', allowedOperations: ['intake_preview', 'status_preview'],
    approvedChannels: ['website', 'email', 'voicemail'], tenantBoundary: 'Devil n Dove organization + authorized order scope',
    requiredGates: ['Server-authenticated Devil n Dove role', 'Verified order/commission permission', 'Redacted media and data-minimal API', 'Explicit owner approval'],
    state: 'mock_only', nextBuild: 'QL-201'
  },
  icamp: {
    id: 'camp-guest-intake', organizationId: 'icamp', label: 'Campground guest and reservation intake',
    upstreamSystem: 'iCamp campground platform', allowedOperations: ['intake_preview', 'status_preview'],
    approvedChannels: ['website', 'email', 'sms'], tenantBoundary: 'Verified campground tenant + role + site access',
    requiredGates: ['Server-authenticated campground tenant and role', 'Campground isolation and reservation scope', 'Tenant-level audit and retention settings', 'Explicit owner approval'],
    state: 'mock_only', nextBuild: 'QL-202'
  },
  yw: {
    id: 'yw-service-intake', organizationId: 'yw', label: 'Property service request and job intake',
    upstreamSystem: 'YW Property Maintenance System', allowedOperations: ['intake_preview', 'status_preview'],
    approvedChannels: ['website', 'email', 'sms', 'voicemail'], tenantBoundary: 'Verified company tenant + enabled service module + property permission',
    requiredGates: ['Server-authenticated YW company role', 'Module and property authorization', 'Scoped job-intake audit and retention policy', 'Explicit owner approval'],
    state: 'mock_only', nextBuild: 'QL-203'
  }
};

export interface ConnectorMockPreview {
  contractId: string;
  organizationId: OrganizationId;
  sourceId: string;
  operation: ConnectorOperation;
  normalizedKind: 'inquiry' | 'status';
  reference: string;
  subject: string;
  safety: 'fictional_unconnected';
}

export type ConnectorPreviewResult =
  | { ok: true; preview: ConnectorMockPreview }
  | { ok: false; reason: 'organization_mismatch' | 'operation_blocked' | 'source_not_allowed' };

/** Allowlisted fixture adapter: no user-entered payload, API call, storage or side effect. */
export function previewConnectorMapping(id: OrganizationId, contract: ConnectorContract, operation: ConnectorOperation, sourceId: string): ConnectorPreviewResult {
  if (contract.organizationId !== id || connectorContracts[id] !== contract || contract.state !== 'mock_only') return { ok: false, reason: 'organization_mismatch' };
  if (!contract.allowedOperations.includes(operation)) return { ok: false, reason: 'operation_blocked' };
  const source = inboxForOrganization(id).find((item) => item.id === sourceId && item.organizationId === id && contract.approvedChannels.includes(item.channel));
  if (!source) return { ok: false, reason: 'source_not_allowed' };
  return { ok: true, preview: {
    contractId: contract.id, organizationId: id, sourceId: source.id, operation,
    normalizedKind: operation === 'intake_preview' ? 'inquiry' : 'status',
    reference: `DEMO-${source.id.toUpperCase()}`, subject: source.subject, safety: 'fictional_unconnected'
  } };
}

export function eligibleConnectorSamples(id: OrganizationId): readonly { id: string; label: string }[] {
  const contract = connectorContracts[id];
  return inboxForOrganization(id)
    .filter((thread) => thread.organizationId === id && contract.approvedChannels.includes(thread.channel))
    .map((thread) => ({ id: thread.id, label: `${thread.sourceLabel}: ${thread.subject}` }));
}
