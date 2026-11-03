import type { OrganizationId } from './ql191Organizations';
import { readQl293Draft, type Ql293SessionDrafts } from './ql293ConversationRecovery';
import type { Ql297Delivery } from './ql297Omnichannel';

/** Display copy is deliberately distinct from provider delivery or verified customer receipt. */
export const ql315MockDelivery: Readonly<Record<Ql297Delivery, { label: string; tone: 'received' | 'failed' | 'blocked' | 'recovered'; meaning: string }>> = {
  RECEIVED_MOCK: { label: 'Received in preview', tone: 'received', meaning: 'A synthetic source event was accepted into this local replay. No customer delivery was attempted or confirmed.' },
  FAILED_MOCK: { label: 'Failed mock delivery', tone: 'failed', meaning: 'The fictional transport failed. Review its checked-in error code; no provider was contacted.' },
  BLOCKED_MOCK: { label: 'Blocked for review', tone: 'blocked', meaning: 'The synthetic scenario requires manual review. Recovery and live callbacks remain disabled.' },
  RECOVERED_MOCK: { label: 'Local recovery rehearsed', tone: 'recovered', meaning: 'A second in-memory receipt records one simulated recovery. No SMS, email or provider retry occurred.' }
};

export type Ql315DraftReadback = Readonly<{ state: 'empty' | 'unsent' | 'invalid'; label: string; guidance: string }>;

/** Invalid or cross-company entries must never be shown as recoverable drafts. */
export function ql315DraftReadback(drafts: Ql293SessionDrafts, organizationId: OrganizationId, threadId: string): Ql315DraftReadback {
  const saved = readQl293Draft(drafts, organizationId, threadId);
  if (saved) return { state: 'unsent', label: 'UNSENT · Local draft available', guidance: 'Scoped to this fictional company and thread. Review before editing. No outbound delivery or storage.' };
  if (Object.hasOwn(drafts, threadId)) return { state: 'invalid', label: 'STALE / INVALID · Recovery blocked', guidance: 'The saved context does not match this company, thread or safe draft rules. Its contents are hidden; clear the entry and start fresh.' };
  return { state: 'empty', label: 'NO SAVED DRAFT · Template only', guidance: 'This is a sample starting template, not a recovered customer message.' };
}
