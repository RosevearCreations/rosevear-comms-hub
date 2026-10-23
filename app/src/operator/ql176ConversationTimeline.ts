/**
 * QL-176: brand-isolated synthetic timelines and in-memory draft demonstrations.
 * No live provider, storage, external send, approval or export dependency exists.
 */
import type { BrandId } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';

export const QL176_MAX_DRAFT_LENGTH = 800;
export type Ql176EventKind = 'conversation_opened' | 'inbound_fixture' | 'internal_note' | 'draft_staged' | 'mock_delivery_failure';
export type Ql176DeliveryState = 'NOT_APPLICABLE' | 'INBOUND_FIXTURE' | 'UNSENT_SIMULATED' | 'FAILED_SIMULATED';
export type Ql176TimelineEvent = Readonly<{
  id: string;
  conversationId: string;
  kind: Ql176EventKind;
  channel: string;
  occurredAt: string;
  label: string;
  detail: string;
  deliveryState: Ql176DeliveryState;
  sourceLabel: string;
  syntheticOnly: true;
}>;
export type Ql176DraftState = Readonly<{
  brandId: BrandId;
  text: string;
  deliveryState: 'UNSENT_SIMULATED';
  source: 'CANONICAL_FIXTURE' | 'LOCAL_SCREEN_ONLY';
}>;
export type Ql176DraftOverlay = Readonly<Record<string, Ql176DraftState>>;
export type Ql176Thread = Readonly<{
  id: string;
  brandId: BrandId;
  subject: string;
  contactLabel: string;
  sourceChannel: string;
  fixtureLabel: string;
  events: readonly Ql176TimelineEvent[];
  draft: Ql176DraftState;
  syntheticOnly: true;
}>;

const brands: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];

/** Strip recognizable identifiers/secrets before state receives user input. */
export function redactQl176Draft(input: string): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, QL176_MAX_DRAFT_LENGTH)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\b(?:Bearer\s+)[A-Za-z0-9._~+/-]{8,}/gi, '[REDACTED TOKEN]')
    .replace(/\b(?:sk[_-](?:test|live|proj)?[_-]?)[A-Za-z0-9_-]{6,}\b/gi, '[REDACTED KEY]')
    .replace(/https?:\/\/[^\s<>]+/gi, '[REDACTED URL]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED EMAIL]')
    .replace(/(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}\b/g, '[REDACTED PHONE]');
}

function migrationSafe(result: Ql173Migration, brandId: BrandId): boolean {
  return brands.includes(brandId) && result.verified && validateQl173CanonicalSnapshot(result.snapshot).length === 0;
}

function eventOrder(a: Ql176TimelineEvent, b: Ql176TimelineEvent): number {
  // Source timestamps can coincide; show the illustrated lifecycle in a
  // meaningful order rather than allowing lexicographic IDs to put a mock
  // failure before the conversation even opened.
  const rank: Record<Ql176EventKind, number> = {
    conversation_opened: 0, inbound_fixture: 1, internal_note: 2, draft_staged: 3, mock_delivery_failure: 4
  };
  return a.occurredAt.localeCompare(b.occurredAt) || rank[a.kind] - rank[b.kind] || a.id.localeCompare(b.id);
}

export function getQl176BrandThreads(result: Ql173Migration, brandId: BrandId, overlay: Ql176DraftOverlay = {}): Ql176Thread[] {
  if (!migrationSafe(result, brandId)) return [];
  const snapshot = result.snapshot;
  const contacts = new Map(snapshot.contacts.filter(row => row.primaryBrand === brandId).map(row => [row.id, row]));

  return snapshot.conversations.flatMap(row => {
    if (row.brandId !== brandId) return [];
    const contact = contacts.get(row.contactId);
    if (!contact) return [];
    const sourceLabel = `${row.provenance.sourceSetVersion} · ${row.provenance.sourceId}`;
    const events: Ql176TimelineEvent[] = [{
      id: `${row.id}:opened`, conversationId: row.id, kind: 'conversation_opened', channel: row.sourceChannel,
      occurredAt: row.createdAt, label: 'Synthetic conversation opened', detail: redactQl176Draft(row.summary),
      deliveryState: 'NOT_APPLICABLE', sourceLabel, syntheticOnly: true
    }];
    for (const message of snapshot.messages.filter(message => message.conversationId === row.id)) {
      // The QL-173 validator rejects outbound/approved messages. Preserve the
      // explicit fail-closed boundary if a future migration changes.
      if (message.direction !== 'inbound' && message.direction !== 'internal') return [];
      const internal = message.direction === 'internal';
      events.push({
        id: message.id, conversationId: row.id, kind: internal ? 'internal_note' : 'inbound_fixture',
        channel: message.channel, occurredAt: message.createdAt,
        label: internal ? 'Synthetic internal note' : 'Synthetic inbound sample',
        detail: redactQl176Draft(message.body),
        deliveryState: internal ? 'NOT_APPLICABLE' : 'INBOUND_FIXTURE',
        sourceLabel: `${message.provenance.sourceSetVersion} · ${message.provenance.sourceId}`, syntheticOnly: true
      });
    }
    const pinnedDraft = snapshot.drafts.find(draft => draft.brandId === brandId && draft.conversationId === row.id);
    const local = overlay[row.id];
    const validLocal = local?.brandId === brandId && local.deliveryState === 'UNSENT_SIMULATED' && local.source === 'LOCAL_SCREEN_ONLY';
    const draft: Ql176DraftState = validLocal
      ? { brandId, text: redactQl176Draft(local.text), deliveryState: 'UNSENT_SIMULATED', source: 'LOCAL_SCREEN_ONLY' }
      : { brandId, text: redactQl176Draft(pinnedDraft?.body ?? ''), deliveryState: 'UNSENT_SIMULATED', source: 'CANONICAL_FIXTURE' };
    if (pinnedDraft) {
      events.push({ id: pinnedDraft.id, conversationId: row.id, kind: 'draft_staged', channel: row.sourceChannel,
        occurredAt: pinnedDraft.createdAt, label: 'Unsent synthetic draft staged',
        detail: 'Draft exists only in the pinned synthetic fixture. No message was sent or approved.',
        deliveryState: 'UNSENT_SIMULATED', sourceLabel: `${pinnedDraft.provenance.sourceSetVersion} · ${pinnedDraft.provenance.sourceId}`,
        syntheticOnly: true });
      // Explicitly *illustrative*, not a provider callback or attempted send.
      events.push({ id: `${row.id}:mock-failure-example`, conversationId: row.id, kind: 'mock_delivery_failure',
        channel: row.sourceChannel, occurredAt: pinnedDraft.createdAt,
        label: 'TRAINING EXAMPLE · mock delivery failed (no send attempted)',
        detail: 'Illustrative failure/blocked state only. No real provider request, delivery attempt or customer contact occurred.',
        deliveryState: 'FAILED_SIMULATED', sourceLabel: 'QL-176 checked-in UI example · not a provider receipt', syntheticOnly: true });
    }
    if (validLocal) {
      events.push({ id: `${row.id}:local-draft-example`, conversationId: row.id, kind: 'draft_staged',
        channel: row.sourceChannel, occurredAt: row.lastActivityAt,
        label: 'Unsent draft staged locally (screen only)',
        detail: 'This screen-only edit was never saved outside React memory and never sent.',
        deliveryState: 'UNSENT_SIMULATED', sourceLabel: 'QL-176 ephemeral editor · not a delivery receipt', syntheticOnly: true });
    }
    return [{
      id: row.id, brandId, subject: row.subject, contactLabel: contact.name, sourceChannel: row.sourceChannel,
      fixtureLabel: sourceLabel, events: events.sort(eventOrder), draft, syntheticOnly: true as const
    }];
  }).sort((a, b) => a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id));
}

export function stageQl176Draft(
  result: Ql173Migration, brandId: BrandId, previous: Ql176DraftOverlay,
  conversationId: string, text: string, operation: 'stage' | 'discard'
): Ql176DraftOverlay {
  if (!['stage', 'discard'].includes(operation) || !getQl176BrandThreads(result, brandId).some(thread => thread.id === conversationId)) return previous;
  if (operation === 'discard') {
    const next = { ...previous };
    delete next[conversationId];
    return next;
  }
  if (typeof text !== 'string') return previous;
  return { ...previous, [conversationId]: { brandId, text: redactQl176Draft(text), deliveryState: 'UNSENT_SIMULATED', source: 'LOCAL_SCREEN_ONLY' } };
}
