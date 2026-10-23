/**
 * QL-175: read-only contact context derived exclusively from provenance-checked
 * QL-173 synthetic fixtures. Consent is never inferred from a contact field,
 * incoming message, historical status, or a local preview action.
 */
import type { BrandId } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';

export const QL175_CHANNELS = ['sms', 'voice', 'email'] as const;
export type Ql175Channel = typeof QL175_CHANNELS[number];
export type Ql175ConsentState = 'unknown' | 'opted_out'; // no verified grant artifacts exist
export type Ql175Scenario = Readonly<{ brandId: BrandId; optedOut: readonly Ql175Channel[] }>;
export type Ql175Scenarios = Readonly<Record<string, Ql175Scenario>>;
export type Ql175Consent = Readonly<{
  channel: Ql175Channel;
  state: Ql175ConsentState;
  provenance: 'NO_CONSENT_EVIDENCE' | 'LOCAL_SIMULATION_ONLY';
  verifiedGrant: false;
  dispatchAllowed: false;
}>;
export type Ql175ContactCandidate = Readonly<{ id: string; brandId: BrandId; label: string }>;
export type Ql175DuplicateCandidate = Readonly<{
  contactId: string;
  otherId: string;
  reason: 'same_normalized_synthetic_label';
  action: 'REVIEW_ONLY_NO_MERGE';
}>;
export type Ql175ContactContext = Readonly<{
  id: string;
  brandId: BrandId;
  label: string;
  contactType: string;
  fixture: string;
  conversations: ReadonlyArray<Readonly<{
    id: string; subject: string; channel: string; status: string; lastActivityAt: string;
    messageCount: number; draftState: 'UNSENT_SIMULATED' | 'NO_DRAFT';
  }>>;
  followUps: ReadonlyArray<Readonly<{ id: string; title: string; status: string }>>;
  intakes: ReadonlyArray<Readonly<{ id: string; type: string; status: string }>>;
  duplicates: readonly Ql175DuplicateCandidate[];
  consent: readonly Ql175Consent[];
  identityVerified: false;
  syntheticOnly: true;
}>;

const brands: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];

function isValidMigration(result: Ql173Migration, brandId: BrandId): boolean {
  return brands.includes(brandId) && result.verified && validateQl173CanonicalSnapshot(result.snapshot).length === 0;
}

function normalizeLabel(label: string): string {
  // Exact complete-label similarity is a review clue, not an identity match.
  return label.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

export function findQl175DuplicateCandidates(contacts: readonly Ql175ContactCandidate[], brandId: BrandId): Ql175DuplicateCandidate[] {
  if (!brands.includes(brandId)) return [];
  const scoped = contacts.filter(row => row.brandId === brandId && typeof row.id === 'string' && typeof row.label === 'string');
  const suggestions: Ql175DuplicateCandidate[] = [];
  for (let i = 0; i < scoped.length; i++) {
    const key = normalizeLabel(scoped[i].label);
    if (key.length < 6 || ['unknown', 'sample', 'synthetic'].includes(key)) continue;
    for (let j = i + 1; j < scoped.length; j++) {
      if (scoped[i].id === scoped[j].id || normalizeLabel(scoped[j].label) !== key) continue;
      suggestions.push({ contactId: scoped[i].id, otherId: scoped[j].id, reason: 'same_normalized_synthetic_label', action: 'REVIEW_ONLY_NO_MERGE' });
      suggestions.push({ contactId: scoped[j].id, otherId: scoped[i].id, reason: 'same_normalized_synthetic_label', action: 'REVIEW_ONLY_NO_MERGE' });
    }
  }
  return suggestions.sort((a, b) => a.contactId.localeCompare(b.contactId) || a.otherId.localeCompare(b.otherId));
}

export function getQl175BrandContacts(result: Ql173Migration, brandId: BrandId, scenarios: Ql175Scenarios = {}): Ql175ContactContext[] {
  if (!isValidMigration(result, brandId)) return [];
  const snapshot = result.snapshot;
  const contacts = snapshot.contacts.filter(row => row.primaryBrand === brandId);
  const duplicateSuggestions = findQl175DuplicateCandidates(
    contacts.map(row => ({ id: row.id, brandId: row.primaryBrand, label: row.name })), brandId
  );

  return contacts.map(contact => {
    const conversations = snapshot.conversations.filter(row => row.brandId === brandId && row.contactId === contact.id)
      .map(row => ({
        id: row.id, subject: row.subject, channel: row.sourceChannel, status: row.status, lastActivityAt: row.lastActivityAt,
        messageCount: snapshot.messages.filter(message => message.conversationId === row.id).length,
        draftState: snapshot.drafts.some(draft => draft.brandId === brandId && draft.conversationId === row.id)
          ? 'UNSENT_SIMULATED' as const : 'NO_DRAFT' as const
      })).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt) || a.id.localeCompare(b.id));
    const scenario = scenarios[contact.id];
    const optedOut = scenario?.brandId === brandId && Array.isArray(scenario.optedOut)
      ? scenario.optedOut.filter(channel => QL175_CHANNELS.includes(channel)) : [];
    return {
      id: contact.id, brandId, label: contact.name, contactType: contact.customerType,
      fixture: `${contact.provenance.sourceSetVersion} · ${contact.provenance.sourceId}`,
      conversations,
      followUps: snapshot.followUpTasks.filter(task => task.brandId === brandId && task.contactId === contact.id)
        .map(task => ({ id: task.id, title: task.title, status: task.status })),
      intakes: snapshot.intakeRequests.filter(intake => intake.brandId === brandId && intake.contactId === contact.id)
        .map(intake => ({ id: intake.id, type: intake.intakeType, status: intake.status })),
      duplicates: duplicateSuggestions.filter(suggestion => suggestion.contactId === contact.id),
      consent: QL175_CHANNELS.map(channel => ({
        channel, state: optedOut.includes(channel) ? 'opted_out' as const : 'unknown' as const,
        provenance: optedOut.includes(channel) ? 'LOCAL_SIMULATION_ONLY' as const : 'NO_CONSENT_EVIDENCE' as const,
        verifiedGrant: false as const, dispatchAllowed: false as const
      })),
      identityVerified: false as const, syntheticOnly: true as const
    };
  }).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}

export function simulateQl175OptOut(
  result: Ql173Migration, brandId: BrandId, previous: Ql175Scenarios,
  contactId: string, channel: Ql175Channel, operation: 'opt_out' | 'reset'
): Ql175Scenarios {
  if (!QL175_CHANNELS.includes(channel) || !['opt_out', 'reset'].includes(operation)) return previous;
  if (!getQl175BrandContacts(result, brandId).some(contact => contact.id === contactId)) return previous;
  const existing = previous[contactId]?.brandId === brandId ? previous[contactId].optedOut : [];
  const optedOut = operation === 'opt_out'
    ? [...new Set([...existing, channel])]
    : existing.filter(existingChannel => existingChannel !== channel);
  return { ...previous, [contactId]: { brandId, optedOut } };
}
