import type { OrganizationId } from './ql191Organizations';
import { customersForOrganization, customerThreads, restrictiveConsent, type SyntheticCustomerContext } from './ql193CustomerContexts';
import type { MockFollowUpTask, MockQueueState } from './ql194WorkQueue';
import type { InboxConsent, InboxThread } from './ql192InboxFixtures';

export type Ql295DuplicateDisposition = 'needs-independent-check' | 'not-duplicate' | 'deferred';

export interface Ql295Candidate {
  id: string;
  organizationId: OrganizationId;
  leftId: string;
  rightId: string;
  signal: string;
}

/** Deliberately authored review scenarios; similar words are never auto-matched. */
const candidates: Readonly<Record<OrganizationId, readonly Ql295Candidate[]>> = {
  rosiedazzlers: [{ id: 'rd-possible-1', organizationId: 'rosiedazzlers', leftId: 'rd-contact-a', rightId: 'rd-contact-c', signal: 'Both ask about vehicle appearance services; this is NOT identity evidence.' }],
  devilndove: [{ id: 'dnd-possible-1', organizationId: 'devilndove', leftId: 'dnd-contact-a', rightId: 'dnd-contact-b', signal: 'Two customization inquiries; no shared verified identity source.' }],
  icamp: [{ id: 'camp-possible-1', organizationId: 'icamp', leftId: 'camp-contact-a', rightId: 'camp-contact-c', signal: 'Both ask about visiting; no verified guest, site or tenant match.' }],
  yw: [{ id: 'yw-possible-1', organizationId: 'yw', leftId: 'yw-contact-a', rightId: 'yw-contact-c', signal: 'Two maintenance-service interests; no verified address or account match.' }]
};

export interface Ql295Review {
  candidateId: string;
  disposition: Ql295DuplicateDisposition;
  sequence: number;
}

export interface Ql295ReviewState {
  organizationId: OrganizationId;
  reviews: readonly Ql295Review[];
  nextSequence: number;
}

export function seedQl295Review(organizationId: OrganizationId): Ql295ReviewState {
  return { organizationId, reviews: [], nextSequence: 1 };
}

export function duplicateCandidates(organizationId: OrganizationId): readonly Ql295Candidate[] {
  return candidates[organizationId];
}

/** Non-authoritative local disposition only. No confirmed identity/merge status exists. */
export function reviewQl295Candidate(organizationId: OrganizationId, state: Ql295ReviewState, candidateId: string, disposition: Ql295DuplicateDisposition): Ql295ReviewState {
  if (state.organizationId !== organizationId || !candidates[organizationId].some((candidate) => candidate.id === candidateId)) return state;
  if (!(['needs-independent-check', 'not-duplicate', 'deferred'] as const).includes(disposition)) return state;
  const previous = state.reviews.find((review) => review.candidateId === candidateId);
  if (previous?.disposition === disposition) return state;
  return { ...state, reviews: [...state.reviews.filter((review) => review.candidateId !== candidateId), { candidateId, disposition, sequence: state.nextSequence }], nextSequence: state.nextSequence + 1 };
}

export function candidateForContact(organizationId: OrganizationId, contactId: string): Ql295Candidate | undefined {
  return candidates[organizationId].find((candidate) => candidate.leftId === contactId || candidate.rightId === contactId);
}

export function candidatePeer(organizationId: OrganizationId, candidate: Ql295Candidate, currentId: string): SyntheticCustomerContext | undefined {
  if (candidate.organizationId !== organizationId || ![candidate.leftId, candidate.rightId].includes(currentId)) return undefined;
  return customersForOrganization(organizationId).find((contact) => contact.id === (candidate.leftId === currentId ? candidate.rightId : candidate.leftId));
}

export function ql295TasksForContact(organizationId: OrganizationId, contact: SyntheticCustomerContext, queue: MockQueueState): readonly MockFollowUpTask[] {
  if (queue.organizationId !== organizationId || contact.organizationId !== organizationId) return [];
  const linkedThreads = new Set(customerThreads(organizationId, contact).map((thread) => thread.id));
  return queue.tasks.filter((task) => task.organizationId === organizationId && linkedThreads.has(task.threadId));
}

export type Ql295ContactPosture = { effective: InboxConsent; label: string; reason: string; marketingAllowed: false; sources: readonly { threadId: string; channel: string; consent: InboxConsent }[] };

/** These actions require genuine scoped permissions that the disabled preview never supplies. */
export const ql295PermissionGate = {
  readRealContacts: false,
  mergeIdentity: false,
  changeConsent: false,
  sendMessage: false,
  exportCustomer: false
} as const;

export function ql295ConsentPosture(threads: readonly InboxThread[]): Ql295ContactPosture {
  const effective = restrictiveConsent(threads);
  const explanation: Record<InboxConsent, { label: string; reason: string }> = {
    opted_out: { label: 'OPTED OUT — no marketing', reason: 'At least one linked fictional source opted out. Other channels cannot override that restriction.' },
    service_only: { label: 'SERVICE ONLY — no marketing', reason: 'Every linked source is service-only. This does not constitute marketing permission.' },
    unknown: { label: 'UNVERIFIED — no outbound permission', reason: 'At least one source lacks verified permission, or no source is linked. Do not infer consent from other channels.' }
  };
  return { effective, ...explanation[effective], marketingAllowed: false, sources: threads.map((thread) => ({ threadId: thread.id, channel: thread.channel, consent: thread.consent })) };
}
