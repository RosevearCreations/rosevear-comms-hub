import type { OrganizationId } from './ql191Organizations';
import { inboxForOrganization, type InboxConsent, type InboxThread } from './ql192InboxFixtures';

export interface SyntheticCustomerContext {
  id: string;
  organizationId: OrganizationId;
  label: string;
  context: string;
  /** Explicit authored fixture associations. Never inferred from matching names or channels. */
  threadIds: readonly string[];
}

/**
 * QL-193 is a deterministic, hand-linked sample registry. Internal team notes
 * deliberately have no customer identity. The same "customer A" in different
 * businesses represents unrelated, fictional people.
 */
export const syntheticCustomerContexts: Readonly<Record<OrganizationId, readonly SyntheticCustomerContext[]>> = {
  rosiedazzlers: [
    { id: 'rd-contact-a', organizationId: 'rosiedazzlers', label: 'Demo detailing customer A', context: 'Interior cleaning and condition-photo inquiry · sample vehicle only', threadIds: ['rd-sms', 'rd-mms'] },
    { id: 'rd-contact-b', organizationId: 'rosiedazzlers', label: 'Demo detailing customer B', context: 'One missed booking inquiry; no real callback details', threadIds: ['rd-missed'] },
    { id: 'rd-contact-c', organizationId: 'rosiedazzlers', label: 'Demo detailing customer C', context: 'Ceramic coating estimate context, without customer records', threadIds: ['rd-website'] },
    { id: 'rd-contact-e', organizationId: 'rosiedazzlers', label: 'Demo fleet contact E', context: 'Fleet scheduling question without a company account', threadIds: ['rd-email'] }
  ],
  devilndove: [
    { id: 'dnd-contact-a', organizationId: 'devilndove', label: 'Demo maker customer A', context: 'Engraving request and related inspiration-photo placeholder', threadIds: ['dnd-sms', 'dnd-mms'] },
    { id: 'dnd-contact-b', organizationId: 'devilndove', label: 'Demo maker customer B', context: 'Lost-wax commission question without an order', threadIds: ['dnd-voicemail'] },
    { id: 'dnd-contact-c', organizationId: 'devilndove', label: 'Demo maker customer C', context: 'Sample resin colour consultation without a customer account', threadIds: ['dnd-web'] }
  ],
  icamp: [
    { id: 'camp-contact-a', organizationId: 'icamp', label: 'Demo campground guest A', context: 'Tent-site question and separate arrival-call example · no booking', threadIds: ['camp-sms', 'camp-voice'] },
    { id: 'camp-contact-c', organizationId: 'icamp', label: 'Demo campground visitor C', context: 'Event pass inquiry without visitor admission', threadIds: ['camp-web'] },
    { id: 'camp-contact-d', organizationId: 'icamp', label: 'Demo seasonal camper D', context: 'Winter closing inquiry without tenant or site details', threadIds: ['camp-email'] }
  ],
  yw: [
    { id: 'yw-contact-a', organizationId: 'yw', label: 'Demo property owner A', context: 'Sample seasonal plowing and lawn-care requests · no property account', threadIds: ['yw-sms', 'yw-email'] },
    { id: 'yw-contact-b', organizationId: 'yw', label: 'Demo property owner B', context: 'Septic priority triage sample · no dispatch', threadIds: ['yw-voicemail'] },
    { id: 'yw-contact-c', organizationId: 'yw', label: 'Demo rural resident C', context: 'Garbage-sticker and service-contract inquiry · no billing', threadIds: ['yw-web'] }
  ]
};

export function customersForOrganization(organizationId: OrganizationId): readonly SyntheticCustomerContext[] {
  return syntheticCustomerContexts[organizationId];
}

export function customerForThread(organizationId: OrganizationId, threadId: string): SyntheticCustomerContext | undefined {
  if (!inboxForOrganization(organizationId).some((thread) => thread.id === threadId)) return undefined;
  return customersForOrganization(organizationId).find((customer) => customer.threadIds.includes(threadId));
}

export function customerThreads(organizationId: OrganizationId, customer: SyntheticCustomerContext): readonly InboxThread[] {
  if (customer.organizationId !== organizationId) return [];
  const canonical = customersForOrganization(organizationId).find((entry) => entry.id === customer.id);
  if (!canonical) return [];
  const scoped = inboxForOrganization(organizationId);
  return canonical.threadIds.flatMap((id) => {
    const thread = scoped.find((entry) => entry.id === id);
    return thread ? [thread] : [];
  });
}

/** A contact-wide marketing posture must never weaken any channel's restriction. */
export function restrictiveConsent(threads: readonly InboxThread[]): InboxConsent {
  if (threads.some((thread) => thread.consent === 'opted_out')) return 'opted_out';
  if (threads.length > 0 && threads.every((thread) => thread.consent === 'service_only')) return 'service_only';
  return 'unknown';
}

export function customerChannelCount(threads: readonly InboxThread[]): number {
  return new Set(threads.map((thread) => thread.channel)).size;
}
