/**
 * QL-173: deterministic synthetic fixture migration for the disabled preview.
 * Only checked-in seedDb and QL-093 local fallbacks are eligible sources.
 * Never pass browser localStorage, provider payloads, or a live Supabase row.
 */
import { seedDb } from '../data/seedData';
import type { AuditEvent, BrandId, Contact, Conversation, FollowUpTask, HubDatabase, IntakeRequest, Message } from '../types';
import { localFallbackConversations, localFallbackSystemStatus, type Ql093SyntheticConversationPreview, type Ql093SyntheticSystemStatusPreview } from '../operator/ql093ValidatedSyntheticSafeReads';
import { fingerprintQl165Fixture, QL165_FIXTURE_SET_VERSION, verifyQl165SyntheticFixtures } from '../operator/ql165SyntheticFixtureProvenance';

export const QL173_SCHEMA_VERSION = 1 as const;
export const QL173_FIXTURE_SET_VERSION = 'ql173-canonical-v1' as const;
export const QL173_SEED_SET_VERSION = 'ql004-seed-v1' as const;

type SourceKind = 'ql004_seed' | 'ql093_local_fallback';

export type Ql173Provenance = {
  synthetic: true;
  sourceKind: SourceKind;
  sourceId: string;
  sourceSetVersion: string;
  sourceFingerprint: string;
  recordFingerprint: string;
  schemaVersion: typeof QL173_SCHEMA_VERSION;
};

export type Ql173Record<T extends { id: string }> = T & { provenance: Ql173Provenance };
export type Ql173UnsentDraft = Ql173Record<{
  id: string;
  brandId: BrandId;
  conversationId: string;
  body: string;
  state: 'UNSENT_SIMULATED';
  createdAt: string;
}>;

export type Ql173CanonicalSnapshot = {
  schemaVersion: typeof QL173_SCHEMA_VERSION;
  fixtureSetVersion: typeof QL173_FIXTURE_SET_VERSION;
  sourcePins: { ql004: string; ql093: typeof QL165_FIXTURE_SET_VERSION };
  contacts: Ql173Record<Contact>[];
  conversations: Ql173Record<Conversation>[];
  messages: Ql173Record<Message>[];
  followUpTasks: Ql173Record<FollowUpTask>[];
  intakeRequests: Ql173Record<IntakeRequest>[];
  auditEvents: Ql173Record<AuditEvent>[];
  drafts: Ql173UnsentDraft[];
};

export type Ql173Migration = { verified: boolean; snapshot: Ql173CanonicalSnapshot; issues: readonly string[] };

const validBrands = new Set<BrandId>(['rosiedazzlers', 'devilndove']);
const allowedFields = {
  contacts: ['id', 'primaryBrand', 'name', 'phone', 'email', 'town', 'customerType', 'source', 'notes', 'createdAt', 'updatedAt', 'provenance'],
  conversations: ['id', 'brandId', 'contactId', 'sourceChannel', 'status', 'priority', 'subject', 'summary', 'tags', 'lastActivityAt', 'createdAt', 'updatedAt', 'provenance'],
  messages: ['id', 'conversationId', 'direction', 'channel', 'body', 'aiGenerated', 'humanApproved', 'createdAt', 'provenance'],
  followUpTasks: ['id', 'brandId', 'contactId', 'conversationId', 'title', 'dueAt', 'status', 'priority', 'notes', 'createdAt', 'updatedAt', 'provenance'],
  intakeRequests: ['id', 'brandId', 'contactId', 'conversationId', 'intakeType', 'rawAnswers', 'flags', 'recommendedService', 'status', 'createdAt', 'updatedAt', 'provenance'],
  auditEvents: ['id', 'brandId', 'entityType', 'entityId', 'eventType', 'details', 'createdAt', 'provenance'],
  drafts: ['id', 'brandId', 'conversationId', 'body', 'state', 'createdAt', 'provenance']
} as const;

const provenanceFields = ['synthetic', 'sourceKind', 'sourceId', 'sourceSetVersion', 'sourceFingerprint', 'recordFingerprint', 'schemaVersion'] as const;

function idFor(source: 'ql004' | 'ql093', entity: string, originalId: string): string {
  return `syn-${source}-${entity}-${originalId}`;
}

function makeRecord<T extends { id: string }>(value: T, source: { kind: SourceKind; id: string; version: string; fingerprint: string }): Ql173Record<T> {
  return {
    ...value,
    provenance: {
      synthetic: true,
      sourceKind: source.kind,
      sourceId: source.id,
      sourceSetVersion: source.version,
      sourceFingerprint: source.fingerprint,
      recordFingerprint: fingerprintQl165Fixture(value),
      schemaVersion: QL173_SCHEMA_VERSION
    }
  };
}

function seedRecord<T extends { id: string }>(kind: string, value: T, transformed: T): Ql173Record<T> {
  return makeRecord(transformed, {
    kind: 'ql004_seed', id: `${kind}:${value.id}`, version: QL173_SEED_SET_VERSION,
    fingerprint: fingerprintQl165Fixture(value)
  });
}

function fallbackRecord<T extends { id: string }>(row: Ql093SyntheticConversationPreview, value: T): Ql173Record<T> {
  return makeRecord(value, {
    kind: 'ql093_local_fallback', id: row.id, version: QL165_FIXTURE_SET_VERSION,
    fingerprint: fingerprintQl165Fixture(row)
  });
}

function byRecentActivity<T extends { id: string; createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
}

export function createQl173CanonicalSnapshot(seed: HubDatabase = seedDb, fallbacks: readonly Ql093SyntheticConversationPreview[] = localFallbackConversations): Ql173CanonicalSnapshot {
  const contacts = seed.contacts.map(row => seedRecord('contact', row, {
    ...row, id: idFor('ql004', 'contact', row.id),
    // Fake email/phone in the old demo are not necessary to the canonical preview.
    phone: undefined, email: undefined, town: undefined
  }));
  const conversations = seed.conversations.map(row => seedRecord('conversation', row, {
    ...row, id: idFor('ql004', 'conversation', row.id), contactId: idFor('ql004', 'contact', row.contactId)
  }));
  const messages = seed.messages.map(row => seedRecord('message', row, {
    ...row, id: idFor('ql004', 'message', row.id), conversationId: idFor('ql004', 'conversation', row.conversationId),
    humanApproved: false // historical demo flag must never masquerade as real approval
  }));
  const followUpTasks = seed.followUpTasks.map(row => seedRecord('task', row, {
    ...row, id: idFor('ql004', 'task', row.id),
    contactId: row.contactId ? idFor('ql004', 'contact', row.contactId) : undefined,
    conversationId: row.conversationId ? idFor('ql004', 'conversation', row.conversationId) : undefined
  }));
  const intakeRequests = seed.intakeRequests.map(row => seedRecord('intake', row, {
    ...row, id: idFor('ql004', 'intake', row.id),
    contactId: idFor('ql004', 'contact', row.contactId),
    conversationId: idFor('ql004', 'conversation', row.conversationId)
  }));
  const auditEvents = seed.auditEvents.map(row => seedRecord('audit', row, {
    ...row, id: idFor('ql004', 'audit', row.id),
    entityId: row.entityType === 'system' ? row.entityId : idFor('ql004', row.entityType, row.entityId)
  }));
  const drafts: Ql173UnsentDraft[] = [];

  for (const row of fallbacks) {
    const contactId = idFor('ql093', 'contact', row.id);
    const conversationId = idFor('ql093', 'conversation', row.id);
    contacts.push(fallbackRecord(row, {
      id: contactId, primaryBrand: row.brandId, name: `Synthetic inquiry: ${row.title}`,
      customerType: 'unknown', source: 'checked_in_synthetic_fixture', createdAt: row.createdAt, updatedAt: row.createdAt
    }));
    conversations.push(fallbackRecord(row, {
      id: conversationId, brandId: row.brandId, contactId, sourceChannel: row.id === 'rosie-missed-call' ? 'missed_call' : 'manual',
      status: 'needs_reply', priority: 'normal', subject: row.title, summary: row.summary,
      tags: ['synthetic', 'read_only'], lastActivityAt: row.createdAt, createdAt: row.createdAt, updatedAt: row.createdAt
    }));
    messages.push(fallbackRecord(row, {
      id: idFor('ql093', 'message', row.id), conversationId, direction: 'internal', channel: 'admin_note',
      body: row.summary, aiGenerated: false, humanApproved: false, createdAt: row.createdAt
    }));
    drafts.push(fallbackRecord(row, {
      id: idFor('ql093', 'draft', row.id), brandId: row.brandId, conversationId,
      body: row.draft, state: 'UNSENT_SIMULATED', createdAt: row.createdAt
    }));
  }

  return {
    schemaVersion: QL173_SCHEMA_VERSION,
    fixtureSetVersion: QL173_FIXTURE_SET_VERSION,
    sourcePins: { ql004: QL173_SEED_SET_VERSION, ql093: QL165_FIXTURE_SET_VERSION },
    contacts: contacts.sort(byRecentActivity), conversations: conversations.sort(byRecentActivity),
    messages: messages.sort(byRecentActivity), followUpTasks: followUpTasks.sort(byRecentActivity),
    intakeRequests: intakeRequests.sort(byRecentActivity), auditEvents: auditEvents.sort(byRecentActivity),
    drafts: drafts.sort(byRecentActivity)
  };
}

function isValidTimestamp(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

export function validateQl173CanonicalSnapshot(snapshot: Ql173CanonicalSnapshot): string[] {
  const issues: string[] = [];
  if (snapshot.schemaVersion !== QL173_SCHEMA_VERSION || snapshot.fixtureSetVersion !== QL173_FIXTURE_SET_VERSION) issues.push('canonical schema/fixture version drift');
  if (snapshot.sourcePins?.ql004 !== QL173_SEED_SET_VERSION || snapshot.sourcePins?.ql093 !== QL165_FIXTURE_SET_VERSION) issues.push('source set version drift');

  const identitySet = new Set<string>();
  const collections = Object.keys(allowedFields) as (keyof typeof allowedFields)[];
  for (const collection of collections) {
    const rows = snapshot[collection];
    if (!Array.isArray(rows)) { issues.push(`${collection}: missing canonical collection`); continue; }
    for (let index = 0; index < rows.length; index++) {
      const record = rows[index] as Ql173Record<{ id: string; createdAt: string }>;
      if (!record || typeof record !== 'object') { issues.push(`${collection}: malformed canonical record`); continue; }
      if (typeof record.id !== 'string' || !/^syn-ql0(?:04|93)-[a-z_-]+-[a-z0-9_-]+$/.test(record.id)) issues.push(`${collection}: invalid synthetic ID: ${String(record.id)}`);
      if (identitySet.has(record.id)) issues.push(`${collection}: duplicate global identity ${record.id}`);
      identitySet.add(record.id);
      if (!isValidTimestamp(record.createdAt)) issues.push(`${collection}: invalid createdAt ${record.id}`);
      if (Object.keys(record).some(key => !(allowedFields[collection] as readonly string[]).includes(key))) issues.push(`${collection}: schema drift ${record.id}`);
      const { provenance, ...fields } = record;
      if (!provenance || typeof provenance !== 'object' ||
        Object.keys(provenance).some(key => !provenanceFields.includes(key as typeof provenanceFields[number])) ||
        provenance.synthetic !== true || provenance.schemaVersion !== QL173_SCHEMA_VERSION ||
        !['ql004_seed', 'ql093_local_fallback'].includes(provenance.sourceKind) ||
        !provenance.sourceId ||
        !/^fnv1a64:[0-9a-f]{16}$/.test(provenance.sourceFingerprint) ||
        provenance.recordFingerprint !== fingerprintQl165Fixture(fields) ||
        provenance.sourceSetVersion !== (provenance.sourceKind === 'ql004_seed' ? QL173_SEED_SET_VERSION : QL165_FIXTURE_SET_VERSION)) {
        issues.push(`${collection}: missing or drifted provenance ${record.id}`);
      }
      if (index && byRecentActivity(rows[index - 1] as { id: string; createdAt: string }, record) > 0) issues.push(`${collection}: non-deterministic sort order`);
    }
  }

  const contacts = new Map(snapshot.contacts?.map(row => [row.id, row]) ?? []);
  const conversations = new Map(snapshot.conversations?.map(row => [row.id, row]) ?? []);
  const validBrand = (brand: BrandId, label: string) => { if (!validBrands.has(brand)) issues.push(`${label}: invalid brand reference ${brand}`); };

  for (const contact of snapshot.contacts ?? []) {
    validBrand(contact.primaryBrand, contact.id);
    if (contact.phone || contact.email || contact.town || !/^(Sample |Synthetic inquiry:)/.test(contact.name)) issues.push(`private/non-synthetic contact fields ${contact.id}`);
  }
  for (const conversation of snapshot.conversations ?? []) {
    validBrand(conversation.brandId, conversation.id);
    const contact = contacts.get(conversation.contactId);
    if (!contact) issues.push(`orphan conversation contact ${conversation.id}`);
    else if (contact.primaryBrand !== conversation.brandId) issues.push(`cross-brand conversation/contact ${conversation.id}`);
  }
  for (const message of snapshot.messages ?? []) {
    if (!conversations.has(message.conversationId)) issues.push(`orphan message ${message.id}`);
    if (message.humanApproved || message.aiGenerated || message.direction === 'outbound') issues.push(`unsafe synthetic message approval/delivery ${message.id}`);
  }
  for (const task of snapshot.followUpTasks ?? []) {
    validBrand(task.brandId, task.id);
    if (task.contactId && !contacts.has(task.contactId)) issues.push(`orphan task contact ${task.id}`);
    if (task.conversationId && !conversations.has(task.conversationId)) issues.push(`orphan task conversation ${task.id}`);
    if (task.contactId && contacts.get(task.contactId)?.primaryBrand !== task.brandId) issues.push(`cross-brand task/contact ${task.id}`);
    if (task.conversationId && conversations.get(task.conversationId)?.brandId !== task.brandId) issues.push(`cross-brand task/conversation ${task.id}`);
    if (task.contactId && task.conversationId && conversations.get(task.conversationId)?.contactId !== task.contactId) issues.push(`task relation mismatch ${task.id}`);
  }
  for (const intake of snapshot.intakeRequests ?? []) {
    validBrand(intake.brandId, intake.id);
    if (!contacts.has(intake.contactId)) issues.push(`orphan intake contact ${intake.id}`);
    if (!conversations.has(intake.conversationId)) issues.push(`orphan intake conversation ${intake.id}`);
    if (contacts.get(intake.contactId)?.primaryBrand !== intake.brandId || conversations.get(intake.conversationId)?.brandId !== intake.brandId) issues.push(`cross-brand intake ${intake.id}`);
    if (conversations.get(intake.conversationId)?.contactId !== intake.contactId) issues.push(`intake relation mismatch ${intake.id}`);
  }
  for (const event of snapshot.auditEvents ?? []) {
    if (event.brandId) validBrand(event.brandId, event.id);
    if (event.entityType !== 'system') {
      const exists = identitySet.has(event.entityId);
      if (!exists) issues.push(`orphan audit target ${event.id}`);
    }
  }
  for (const draft of snapshot.drafts ?? []) {
    validBrand(draft.brandId, draft.id);
    if (draft.state !== 'UNSENT_SIMULATED') issues.push(`unsafe delivery state ${draft.id}`);
    if (!conversations.has(draft.conversationId)) issues.push(`orphan draft ${draft.id}`);
    else if (conversations.get(draft.conversationId)?.brandId !== draft.brandId) issues.push(`cross-brand draft ${draft.id}`);
  }
  return [...new Set(issues)];
}

function emptyQl173CanonicalSnapshot(): Ql173CanonicalSnapshot {
  return {
    schemaVersion: QL173_SCHEMA_VERSION, fixtureSetVersion: QL173_FIXTURE_SET_VERSION,
    sourcePins: { ql004: QL173_SEED_SET_VERSION, ql093: QL165_FIXTURE_SET_VERSION },
    contacts: [], conversations: [], messages: [], followUpTasks: [], intakeRequests: [], auditEvents: [], drafts: []
  };
}

export function migrateQl173SyntheticFixtures(
  seed: HubDatabase = seedDb,
  fallbacks: readonly Ql093SyntheticConversationPreview[] = localFallbackConversations,
  statuses: readonly Ql093SyntheticSystemStatusPreview[] = localFallbackSystemStatus
): Ql173Migration {
  const issues: string[] = [];
  try {
    const pinned = verifyQl165SyntheticFixtures(fallbacks, statuses);
    if (!pinned.verified) issues.push(...pinned.failures.map(failure => `QL-165 source pin: ${failure}`));
    if (fingerprintQl165Fixture(seed) !== QL173_APPROVED_SEED_FINGERPRINT) issues.push('QL-004 source fixture content drift');
    // Bad inputs are not projected into any preview-visible snapshot.
    if (issues.length) return { verified: false, snapshot: emptyQl173CanonicalSnapshot(), issues };
    const snapshot = createQl173CanonicalSnapshot(seed, fallbacks);
    issues.push(...validateQl173CanonicalSnapshot(snapshot));
    return { verified: issues.length === 0, snapshot: issues.length ? emptyQl173CanonicalSnapshot() : snapshot, issues };
  } catch {
    return { verified: false, snapshot: emptyQl173CanonicalSnapshot(), issues: [...issues, 'malformed checked-in synthetic source'] };
  }
}

// Build-time reviewed source pin; never silently recalculate on migration.
export const QL173_APPROVED_SEED_FINGERPRINT = 'fnv1a64:0791e3cb92938645' as const;

export function getQl173BrandConversations(result: Ql173Migration, brandId: BrandId) {
  if (!result.verified || !validBrands.has(brandId)) return [];
  return result.snapshot.conversations.filter(row => row.brandId === brandId).map(row => ({
    ...row,
    draft: result.snapshot.drafts.find(draft => draft.conversationId === row.id)?.body ?? '',
    isUnsent: true as const
  }));
}
