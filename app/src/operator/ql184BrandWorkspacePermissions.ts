/**
 * QL-184: proposed brand-workspace permission mapping only.
 * No authorization outcome in this module is a session, RLS grant, Supabase
 * privilege, customer-data read, dispatch right, or owner approval.
 */
import type { BrandId } from '../types';
import type { AppAdminRole } from '../supabase/appAdmin.types';

export const QL184_VERSION = 'ql184-brand-workspace-permission-blueprint-v1';
export type Ql184Role = AppAdminRole | 'signed_out';
export type Ql184OperationId =
  | 'inbox_read' | 'inbox_triage' | 'contact_minimal_read' | 'draft_prepare'
  | 'intake_prepare' | 'task_assign' | 'audit_summary_read' | 'role_change_propose'
  | 'customer_export' | 'provider_dispatch' | 'pilot_authorize';

export type Ql184Operation = Readonly<{
  id: Ql184OperationId;
  label: string;
  resource: string;
  action: string;
  proposedRoles: readonly AppAdminRole[];
  approvalBoundary: string;
}>;

export const QL184_OPERATIONS: readonly Ql184Operation[] = [
  { id: 'inbox_read', label: 'Read same-brand inbox metadata', resource: 'conversation_queue', action: 'read_metadata',
    proposedRoles: ['staff_readonly', 'admin', 'owner'], approvalBoundary: 'Future server check of brand_id and record identity.' },
  { id: 'inbox_triage', label: 'Propose an internal queue triage change', resource: 'conversation_queue', action: 'propose_triage',
    proposedRoles: ['admin', 'owner'], approvalBoundary: 'Future server role, brand and record check; no current queue write.' },
  { id: 'contact_minimal_read', label: 'Read minimized same-brand contact context', resource: 'contact_context', action: 'read_minimal',
    proposedRoles: ['staff_readonly', 'admin', 'owner'], approvalBoundary: 'Future purpose-based field filtering and server-level access checks.' },
  { id: 'draft_prepare', label: 'Prepare an unsent internal draft', resource: 'conversation_drafts', action: 'prepare_unsent',
    proposedRoles: ['admin', 'owner'], approvalBoundary: 'No send, approval or persistence rights follow from draft access.' },
  { id: 'intake_prepare', label: 'Prepare a same-brand internal intake handoff', resource: 'intake_review', action: 'prepare_internal',
    proposedRoles: ['admin', 'owner'], approvalBoundary: 'No real booking, quote, invoice, promise or private-data write.' },
  { id: 'task_assign', label: 'Propose same-brand task assignment', resource: 'follow_up_tasks', action: 'propose_assignment',
    proposedRoles: ['admin', 'owner'], approvalBoundary: 'Future task ownership and row-specific authorization required.' },
  { id: 'audit_summary_read', label: 'Review same-brand audit metadata', resource: 'audit_metadata', action: 'read_metadata',
    proposedRoles: ['owner'], approvalBoundary: 'No raw private payload, secret or cross-brand audit access.' },
  { id: 'role_change_propose', label: 'Prepare a role-change request for independent review', resource: 'admin_roles', action: 'propose_change',
    proposedRoles: ['owner'], approvalBoundary: 'Not permission to edit app_admins, issue grants or self-elevate.' },
  { id: 'customer_export', label: 'Export real customer records', resource: 'private_customer_records', action: 'export',
    proposedRoles: [], approvalBoundary: 'Always held. Requires separate policy, privacy review and server implementation.' },
  { id: 'provider_dispatch', label: 'Send a live call or SMS', resource: 'live_telephony', action: 'dispatch',
    proposedRoles: [], approvalBoundary: 'Always held. Provider account, consent and live pilot are not authorized.' },
  { id: 'pilot_authorize', label: 'Authorize a real pilot or owner exception', resource: 'owner_authorization', action: 'approve',
    proposedRoles: [], approvalBoundary: 'Always held. An illustrative owner selector cannot authorize a pilot.' }
] as const;

export const QL184_ROLES: readonly Ql184Role[] = ['signed_out', 'staff_readonly', 'admin', 'owner'];
const brandIds: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];
const requestFields = ['role', 'assignedBrands', 'targetBrand', 'operationId'];

export type Ql184Request = Readonly<{
  role: Ql184Role;
  assignedBrands: readonly BrandId[];
  targetBrand: BrandId;
  operationId: Ql184OperationId;
}>;

export type Ql184Assessment = Readonly<{
  version: typeof QL184_VERSION;
  disposition: 'INVALID_PREVIEW_REQUEST' | 'DESIGN_DENIED_RUNTIME_HELD' | 'DESIGN_ALLOWED_RUNTIME_HELD';
  role: Ql184Role | null;
  brandId: BrandId | null;
  targetBrand: BrandId | null;
  operation: Ql184OperationId | null;
  proposedDesignAllows: boolean;
  actualRuntimeAllows: false;
  reason: string;
  pendingSecurityReviews: readonly string[];
  syntheticBlueprintOnly: true;
  verifiedSession: false;
  livePilotAuthorized: false;
  heldPrerequisites: 12;
  customerRecordsRead: 0;
  supabaseMutations: 0;
  callsPlaced: 0;
  messagesSent: 0;
  ownerApprovals: 0;
}>;

/** A fail-closed model that describes a *future* role matrix without applying it. */
export function assessQl184Permission(activeBrand: unknown, input: unknown): Ql184Assessment {
  const common = {
    version: QL184_VERSION, actualRuntimeAllows: false, syntheticBlueprintOnly: true,
    verifiedSession: false, livePilotAuthorized: false, heldPrerequisites: 12,
    customerRecordsRead: 0, supabaseMutations: 0, callsPlaced: 0, messagesSent: 0,
    ownerApprovals: 0,
    pendingSecurityReviews: ['Server identity/MFA and revocation', 'Exact-role and brand-scope authorization',
      'Per-resource and per-row RLS/IDOR tests', 'Private-data minimization and audit policy',
      'Independent security acceptance and out-of-band owner sign-off']
  } as const;
  const invalid = (): Ql184Assessment => ({
    ...common, disposition: 'INVALID_PREVIEW_REQUEST', role: null, brandId: null,
    targetBrand: null, operation: null, proposedDesignAllows: false,
    reason: 'Unrecognized or unverified business, role, permission scope or request. No access or private details are projected.'
  });

  if (!brandIds.includes(activeBrand as BrandId) || !input || typeof input !== 'object' || Array.isArray(input) ||
    !(Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null)) return invalid();
  const req = input as Partial<Ql184Request>;
  if (Object.keys(input).length !== requestFields.length || Object.keys(input).some(key => !requestFields.includes(key)) ||
    !QL184_ROLES.includes(req.role as Ql184Role) || !brandIds.includes(req.targetBrand as BrandId) ||
    !Array.isArray(req.assignedBrands) || req.assignedBrands.length > brandIds.length ||
    new Set(req.assignedBrands).size !== req.assignedBrands.length ||
    req.assignedBrands.some(item => !brandIds.includes(item)) ||
    !QL184_OPERATIONS.some(operation => operation.id === req.operationId)) return invalid();

  const role = req.role as Ql184Role;
  const operation = QL184_OPERATIONS.find(item => item.id === req.operationId)!;
  const sameBrand = req.targetBrand === activeBrand;
  const assigned = req.assignedBrands.includes(req.targetBrand);
  const proposedDesignAllows = role !== 'signed_out' && sameBrand && assigned &&
    operation.proposedRoles.includes(role as AppAdminRole);
  const reason = role === 'signed_out' ? 'No verified operator identity: a signed-out role has no proposed private workspace rights.'
    : !sameBrand ? 'Cross-brand access denied: the requested business differs from the active workspace.'
    : !assigned ? 'Brand scope denied: the proposed assignment does not include this business.'
    : !operation.proposedRoles.includes(role as AppAdminRole) ? `The ${role} role has no proposed ${operation.action} capability. ${operation.approvalBoundary}`
    : `Proposed same-brand role matrix match only. ${operation.approvalBoundary} Actual runtime stays denied.`;

  return {
    ...common, disposition: proposedDesignAllows ? 'DESIGN_ALLOWED_RUNTIME_HELD' : 'DESIGN_DENIED_RUNTIME_HELD',
    role, brandId: activeBrand as BrandId, targetBrand: req.targetBrand!, operation: operation.id,
    proposedDesignAllows, reason
  };
}
