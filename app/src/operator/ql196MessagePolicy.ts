import type { OrganizationId } from './ql191Organizations';
import { inboxForOrganization, type InboxThread, type InboxConsent } from './ql192InboxFixtures';
import { customerForThread, customerThreads, restrictiveConsent } from './ql193CustomerContexts';

export type DraftPurpose = 'service' | 'marketing';
export type AttachmentPlaceholder = 'none' | 'sample_photo' | 'sample_document';
export const MAX_DEMO_CHARACTERS = 500;

const templates: Readonly<Record<OrganizationId, readonly { id: string; title: string; text: string }[]>> = {
  rosiedazzlers: [
    { id: 'acknowledge', title: 'Detailing inquiry acknowledgement', text: 'Demo draft: Thanks for your detailing question. Our team would review the vehicle information before offering a quote.' },
    { id: 'followup', title: 'Appointment follow-up', text: 'Demo draft: We would confirm service availability and weather conditions before agreeing to an appointment.' }
  ],
  devilndove: [
    { id: 'acknowledge', title: 'Custom maker inquiry', text: 'Demo draft: Thanks for your custom project idea. We would review materials and timing before making a promise.' },
    { id: 'followup', title: 'Design reference request', text: 'Demo draft: We would request the design details using an approved private intake process.' }
  ],
  icamp: [
    { id: 'acknowledge', title: 'Campground guest inquiry', text: 'Demo draft: Thanks for checking with the campground. Availability and policies would need staff confirmation.' },
    { id: 'followup', title: 'Arrival information', text: 'Demo draft: We would verify the guest and reservation before providing site or gate details.' }
  ],
  yw: [
    { id: 'acknowledge', title: 'Property service inquiry', text: 'Demo draft: Thanks for the property service inquiry. We would review the location and scope before quoting.' },
    { id: 'followup', title: 'Dispatch follow-up', text: 'Demo draft: Service scheduling would need a verified contract, address and crew availability.' }
  ]
};

export function messageTemplates(organizationId: OrganizationId) { return templates[organizationId]; }

export function messageTargets(organizationId: OrganizationId): readonly InboxThread[] {
  return inboxForOrganization(organizationId).filter((thread) => thread.channel === 'sms' || thread.channel === 'mms');
}

/** A related synthetic contact's opt-out takes precedence over channel-level consent. */
export function effectiveDemoConsent(organizationId: OrganizationId, threadId: string): InboxConsent | null {
  const thread = messageTargets(organizationId).find((entry) => entry.id === threadId);
  if (!thread) return null;
  const contact = customerForThread(organizationId, threadId);
  return contact ? restrictiveConsent(customerThreads(organizationId, contact)) : thread.consent;
}

export function draftGate(organizationId: OrganizationId, threadId: string, purpose: DraftPurpose) {
  const consent = effectiveDemoConsent(organizationId, threadId);
  if (consent === null) return { consent, label: 'Invalid or cross-company message target', allowed: false } as const;
  if (consent === 'opted_out') return { consent, label: 'Opt-out on linked sample contact — outbound blocked', allowed: false } as const;
  if (purpose === 'marketing') return { consent, label: 'No verified express marketing consent — promotional delivery blocked', allowed: false } as const;
  return { consent, label: consent === 'service_only' ? 'Service context only; manual approval still required' : 'Unknown consent; verify authorization before any service reply', allowed: false } as const;
}

export function sanitizeDemoDraft(value: string): string { return value.slice(0, MAX_DEMO_CHARACTERS); }
