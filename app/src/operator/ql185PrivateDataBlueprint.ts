/**
 * QL-185: public, synthetic-only private-data inventory and lifecycle design.
 * This module deliberately has no storage, Supabase, network or deletion API.
 */
import type { BrandId } from '../types';

export const QL185_VERSION = 'ql185-private-data-minimization-retention-blueprint-v1';
export type Ql185CategoryId =
  | 'contact_identity' | 'conversation_content' | 'intake_answers'
  | 'task_notes' | 'audit_details' | 'operational_metadata' | 'public_synthetic';
export type Ql185LifecycleAction = 'collect' | 'view' | 'export' | 'correct' | 'delete' | 'retain';

export type Ql185Category = Readonly<{
  id: Ql185CategoryId;
  label: string;
  existingFields: string;
  currentSurface: string;
  classification: 'potential_private' | 'synthetic_public';
  proposedMinimization: string;
  futureBoundary: string;
}>;

/** Field names reflect the current QL-004 schema; values are never loaded. */
export const QL185_CATEGORIES: readonly Ql185Category[] = [
  { id: 'contact_identity', label: 'Contact identity and reachability',
    existingFields: 'Contact.name, phone, email, town, notes, primaryBrand',
    currentSurface: 'QL-004 localStorage, full JSON import/export', classification: 'potential_private',
    proposedMinimization: 'Collect one necessary contact method and a business purpose only; avoid optional free-text identity details until needed.',
    futureBoundary: 'Private same-brand server store, purpose-scoped field access, verified consent basis and redacted exports.' },
  { id: 'conversation_content', label: 'Message bodies and conversation summaries',
    existingFields: 'Message.body, Conversation.subject, summary, tags',
    currentSurface: 'QL-004 localStorage, full JSON import/export', classification: 'potential_private',
    proposedMinimization: 'Prefer status and a brief purpose-specific summary; do not replicate whole messages into lists, logs or task notes.',
    futureBoundary: 'Restrict full text to authorized same-brand case handling, redact diagnostics and document lawful collection.' },
  { id: 'intake_answers', label: 'Intake answers and service context',
    existingFields: 'IntakeRequest.rawAnswers, flags, recommendedService',
    currentSurface: 'QL-004 localStorage, full JSON import/export', classification: 'potential_private',
    proposedMinimization: 'Replace open-ended answer capture with necessary typed fields; avoid unsolicited personal details.',
    futureBoundary: 'Server-validated field allowlist, per-brand case authorization and field-level erasure review.' },
  { id: 'task_notes', label: 'Follow-up titles, notes and deadlines',
    existingFields: 'FollowUpTask.title, notes, dueAt, contactId',
    currentSurface: 'QL-004 localStorage, full JSON import/export', classification: 'potential_private',
    proposedMinimization: 'Store a case reference, status and required next action without copying customer message bodies.',
    futureBoundary: 'Role-scoped task metadata; track and redact embedded personal details in notes.' },
  { id: 'audit_details', label: 'Audit events and identifying free text',
    existingFields: 'AuditEvent.details, entityId, eventType, createdAt',
    currentSurface: 'QL-004 localStorage, full JSON import/export; manual lead event includes a name',
    classification: 'potential_private',
    proposedMinimization: 'Use event codes and pseudonymous references; never log free-text message bodies, secrets or contact names.',
    futureBoundary: 'Separate access-controlled integrity audit with redaction and an independently approved lifecycle.' },
  { id: 'operational_metadata', label: 'Linked IDs, brand, timestamps and status',
    existingFields: 'contactId, conversationId, brandId, createdAt, updatedAt, status',
    currentSurface: 'QL-004 localStorage, full JSON import/export', classification: 'potential_private',
    proposedMinimization: 'Use opaque identifiers and minimal queue metadata; linked identifiers are not automatically anonymous.',
    futureBoundary: 'Explicit tenant ownership, server-side RLS and role-based, field-limited query projections.' },
  { id: 'public_synthetic', label: 'Pinned public synthetic test samples',
    existingFields: 'QL-173 sample IDs, mock voice/SMS receipts and public QL-087/090 read models',
    currentSurface: 'Checked-in synthetic fixtures and approved public read-only preview surfaces',
    classification: 'synthetic_public',
    proposedMinimization: 'Keep non-personal, clearly synthetic fixtures separate from private records and customer exports.',
    futureBoundary: 'Never promote fixture sample IDs, public view grants or mock consent to real customer authorization.' }
] as const;

export const QL185_ACTIONS: readonly Ql185LifecycleAction[] = ['collect', 'view', 'export', 'correct', 'delete', 'retain'];
export const QL185_LIFECYCLE: Readonly<Record<Ql185LifecycleAction, string>> = {
  collect: 'Document purpose, notice, lawful basis, necessary fields and channel-specific consent before collection.',
  view: 'Verify real session, role, brand, resource, purpose and selected fields on the server; test cross-brand denial.',
  export: 'Verify identity and scope independently; redact unrelated records, bound format and destination, record disclosure and require second-person review.',
  correct: 'Verify identity and record ownership, reconcile linked copies and retain an appropriately minimized correction trail.',
  delete: 'Verify request and exceptions, locate primary/derived/backup copies, record reviewer decision and deletion evidence; never treat a preview reset as erasure.',
  retain: 'Approve a purpose-specific minimum and maximum schedule, legal holds, backup expiry and periodic review before any automatic purge.'
};

export const QL185_STORAGE_RISKS = [
  { source: 'QL-004 localStorage', observed: 'loadHubDb/saveHubDb persist the whole local HubDatabase under a browser key.',
    risk: 'Browser/profile access, shared-device exposure, script access and no verified server authorization or expiry.',
    alternative: 'Keep only non-personal disposable demo data here. Stage private same-brand server storage after auth, RLS, encryption and review.' },
  { source: 'QL-004 JSON export', observed: 'exportHubDb serializes all contacts, messages, intakes, tasks and audit details without field filtering.',
    risk: 'Unscoped transfer/disclosure, indefinite copies and accidental cross-brand or free-text leakage.',
    alternative: 'Future identity-verified, single-brand, minimal export with redaction, approved destination and accountable audit.' },
  { source: 'QL-004 JSON import', observed: 'importHubDb validates broad arrays then saves the complete supplied database.',
    risk: 'Untrusted or real-person data can enter an unapproved browser-local store and be re-exported.',
    alternative: 'Use synthetic fixtures only. Future private migration requires schema/field allowlists, purpose checks and isolated staging.' },
  { source: 'QL-004 reset', observed: 'resetHubDb replaces the current application snapshot with seed data.',
    risk: 'A local reset does not securely erase downloads, other devices, backups or server-held data.',
    alternative: 'Design separate authenticated access/correction/erasure workflow with retention exceptions and backup handling.' }
] as const;

export const QL185_DECISIONS_HELD = [
  'Privacy owner to approve purpose and necessity for each field and brand',
  'Qualified reviewer to determine applicable law and retention minimum/maximum, including exceptions',
  'Security reviewer to accept real storage, RLS, server authorization and key management',
  'Owner to approve identity-verified access, correction, export and deletion request channels',
  'Operations to verify deletion propagation, backups, audit evidence, incident response and rollback',
  'Independent live-pilot sign-off after all 12 QL-181 prerequisites are separately satisfied'
] as const;

export type Ql185Assessment = Readonly<{
  version: typeof QL185_VERSION;
  disposition: 'INVALID_BLUEPRINT_REQUEST' | 'CROSS_BRAND_REJECTED' | 'PLANNING_ONLY_HELD';
  targetBrand: BrandId | null;
  category: Ql185CategoryId | null;
  action: Ql185LifecycleAction | null;
  classification: Ql185Category['classification'] | null;
  proposedSafeguard: string;
  retentionMinimum: null;
  retentionMaximum: null;
  retentionApproved: false;
  exportAuthorized: false;
  deletionPerformed: false;
  actualPrivateDataActionAllowed: false;
  livePilotAuthorized: false;
  heldPrerequisites: 12;
  realRecordsRead: 0;
  storageWrites: 0;
  networkRequests: 0;
  customerExports: 0;
  customerDeletions: 0;
  ownerApprovals: 0;
}>;

/** Strictly pure: evaluates catalog identifiers, never touches real data. */
export function assessQl185Lifecycle(activeBrand: unknown, request: unknown): Ql185Assessment {
  const zero = {
    version: QL185_VERSION, retentionMinimum: null, retentionMaximum: null,
    retentionApproved: false, exportAuthorized: false, deletionPerformed: false,
    actualPrivateDataActionAllowed: false, livePilotAuthorized: false, heldPrerequisites: 12,
    realRecordsRead: 0, storageWrites: 0, networkRequests: 0, customerExports: 0,
    customerDeletions: 0, ownerApprovals: 0
  } as const;
  const invalid = (): Ql185Assessment => ({ ...zero, disposition: 'INVALID_BLUEPRINT_REQUEST',
    targetBrand: null, category: null, action: null, classification: null,
    proposedSafeguard: 'Reject unrecognized or tampered inputs; no personal data or lifecycle operation is exposed.' });
  const brands: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];
  if (!brands.includes(activeBrand as BrandId) || !request || typeof request !== 'object' || Array.isArray(request) ||
    (Object.getPrototypeOf(request) !== Object.prototype && Object.getPrototypeOf(request) !== null)) return invalid();
  const entry = request as Record<string, unknown>;
  const keys = Object.keys(entry);
  if (keys.length !== 3 || keys.some(key => !['targetBrand', 'categoryId', 'action'].includes(key)) ||
    !brands.includes(entry.targetBrand as BrandId) || !QL185_ACTIONS.includes(entry.action as Ql185LifecycleAction)) return invalid();
  const category = QL185_CATEGORIES.find(item => item.id === entry.categoryId);
  if (!category) return invalid();
  if (entry.targetBrand !== activeBrand) return {
    ...zero, disposition: 'CROSS_BRAND_REJECTED', targetBrand: null, category: null, action: null,
    classification: null, proposedSafeguard: 'Business mismatch: select the correct business workspace before even reviewing a category.'
  };
  return {
    ...zero, disposition: 'PLANNING_ONLY_HELD', targetBrand: activeBrand as BrandId,
    category: category.id, action: entry.action as Ql185LifecycleAction,
    classification: category.classification,
    proposedSafeguard: `${QL185_LIFECYCLE[entry.action as Ql185LifecycleAction]} ${category.futureBoundary}`
  };
}
