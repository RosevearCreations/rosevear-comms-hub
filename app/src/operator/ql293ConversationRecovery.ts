import type { OrganizationId } from './ql191Organizations';
import { type InboxConsent, type InboxEvent, type InboxThread } from './ql192InboxFixtures';
import { redactQl176Draft } from './ql176ConversationTimeline';
import {
  MAX_DEMO_CHARACTERS, messageTargets, messageTemplates, sanitizeDemoDraft,
  type AttachmentPlaceholder, type DraftPurpose
} from './ql196MessagePolicy';

export interface Ql293SessionDraft {
  version: 1;
  organizationId: OrganizationId;
  threadId: string;
  purpose: DraftPurpose;
  templateId: string;
  text: string;
  attachment: AttachmentPlaceholder;
  deliveryState: 'UNSENT_SIMULATED';
}

export type Ql293SessionDrafts = Readonly<Record<string, Ql293SessionDraft>>;

export const ql293AttachmentTypes = ['none', 'sample_photo', 'sample_document'] as const;

/** The old redactor removes recognizable personal identifiers before React memory receives edits. */
export function safeQl293DraftText(value: unknown): string {
  return typeof value === 'string' ? sanitizeDemoDraft(redactQl176Draft(value)).slice(0, MAX_DEMO_CHARACTERS) : '';
}

/** Strictly reads fictional thread drafts for the current business only. */
export function readQl293Draft(drafts: Ql293SessionDrafts, organizationId: OrganizationId, threadId: string): Ql293SessionDraft | null {
  const entry: unknown = drafts[threadId];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const draft = entry as Partial<Ql293SessionDraft>;
  if (draft.version !== 1 || draft.organizationId !== organizationId || draft.threadId !== threadId ||
    draft.deliveryState !== 'UNSENT_SIMULATED' || !messageTargets(organizationId).some((thread) => thread.id === threadId) ||
    !['service', 'marketing'].includes(draft.purpose ?? '') ||
    !messageTemplates(organizationId).some((template) => template.id === draft.templateId) ||
    !ql293AttachmentTypes.some((attachment) => attachment === draft.attachment) ||
    typeof draft.text !== 'string' || draft.text.length > MAX_DEMO_CHARACTERS || safeQl293DraftText(draft.text) !== draft.text) return null;
  return { ...draft } as Ql293SessionDraft;
}

export function stageQl293Draft(previous: Ql293SessionDrafts, organizationId: OrganizationId, input: {
  threadId: string; purpose: DraftPurpose; templateId: string; text: string; attachment: AttachmentPlaceholder;
}): Ql293SessionDrafts {
  const candidate: Ql293SessionDraft = {
    version: 1, organizationId, threadId: input.threadId, purpose: input.purpose,
    templateId: input.templateId, text: safeQl293DraftText(input.text), attachment: input.attachment,
    deliveryState: 'UNSENT_SIMULATED'
  };
  if (!readQl293Draft({ [input.threadId]: candidate }, organizationId, input.threadId)) return previous;
  return { ...previous, [input.threadId]: candidate };
}

export function discardQl293Draft(previous: Ql293SessionDrafts, organizationId: OrganizationId, threadId: string): Ql293SessionDrafts {
  if (!messageTargets(organizationId).some((thread) => thread.id === threadId) || !Object.hasOwn(previous, threadId)) return previous;
  const next = { ...previous };
  delete next[threadId];
  return next;
}

export type Ql293EventDisplay = Readonly<{
  label: string;
  meaning: string;
  state: 'INBOUND_FIXTURE' | 'INTERNAL_ONLY' | 'CALL_SIMULATION' | 'UNSENT_SIMULATED';
  attachment: null | { label: string; kind: 'image_description' | 'document_description'; stored: false };
}>;

const eventDescriptions: Readonly<Record<InboxEvent['kind'], Omit<Ql293EventDisplay, 'attachment'>>> = {
  inbound: { label: 'Received example', meaning: 'Fictional inbound content; no real mailbox or provider receipt.', state: 'INBOUND_FIXTURE' },
  call_event: { label: 'Call scenario', meaning: 'Illustrative missed-call or voicemail event; no real call or recording.', state: 'CALL_SIMULATION' },
  internal_note: { label: 'Internal review note', meaning: 'Fictional staff context; nothing was sent to a customer.', state: 'INTERNAL_ONLY' },
  draft: { label: 'Unsent draft', meaning: 'Local or fixture-only draft; never queued, scheduled or delivered.', state: 'UNSENT_SIMULATED' }
};

/** Metadata is a description only. There is no attachment URL, blob, file or upload path. */
export function describeQl293Event(thread: InboxThread, event: InboxEvent): Ql293EventDisplay {
  const base = eventDescriptions[event.kind];
  const attachment = thread.channel === 'mms' && event.kind === 'inbound'
    ? { label: 'Fictional photo description only · no file stored', kind: 'image_description' as const, stored: false as const }
    : null;
  return { ...base, attachment };
}

export function ql293ReplyHelp(thread: InboxThread, effectiveConsent: InboxConsent = thread.consent): string {
  if (effectiveConsent === 'opted_out') return 'This synthetic contact has an opt-out indicator. Do not attempt a marketing reply. All delivery remains disabled.';
  if (effectiveConsent === 'service_only') return 'Service context in this fictional fixture does not authorize marketing or any real delivery.';
  if (thread.channel === 'sms' || thread.channel === 'mms') return 'Consent is unknown. The SMS/MMS studio can hold only a redacted UNSENT draft; it cannot send, schedule or upload.';
  return 'Consent is unknown. This timeline is read-only; no live reply, callback, mailbox or customer account is connected.';
}
