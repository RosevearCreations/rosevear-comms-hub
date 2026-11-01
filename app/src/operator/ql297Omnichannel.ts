import type { OrganizationId } from './ql191Organizations';

export type Ql297Channel = 'phone' | 'sms' | 'email-style' | 'voicemail' | 'missed-call';
export type Ql297Delivery = 'RECEIVED_MOCK' | 'FAILED_MOCK' | 'BLOCKED_MOCK' | 'RECOVERED_MOCK';
export type Ql297Event = Readonly<{
  id: string; organizationId: OrganizationId; channel: Ql297Channel; label: string;
  source: string; occurredAt: string; delivery: Exclude<Ql297Delivery, 'RECOVERED_MOCK'>;
  errorCode: string | null; recoveryHint: string;
}>;
export type Ql297Receipt = Readonly<{ eventId: string; outcome: Ql297Delivery; replayKey: string; attempt: number }>;
export type Ql297Session = Readonly<{ organizationId: OrganizationId; receipts: readonly Ql297Receipt[]; lastAction: string }>;

const examples: readonly Omit<Ql297Event, 'id' | 'organizationId' | 'source' | 'occurredAt'>[] = [
  { channel: 'phone', label: 'Inbound service question', delivery: 'RECEIVED_MOCK', errorCode: null, recoveryHint: 'Review the fictional call summary' },
  { channel: 'sms', label: 'Text delivery error', delivery: 'FAILED_MOCK', errorCode: 'MOCK_TRANSPORT_TIMEOUT', recoveryHint: 'Rehearse one local recovery receipt; no actual resend' },
  { channel: 'email-style', label: 'Email-style intake notification', delivery: 'RECEIVED_MOCK', errorCode: null, recoveryHint: 'Review simulated email metadata only' },
  { channel: 'voicemail', label: 'Voicemail transcription unavailable', delivery: 'BLOCKED_MOCK', errorCode: 'MOCK_AUDIO_UNAVAILABLE', recoveryHint: 'Escalate to manual review; no recording fetched' },
  { channel: 'missed-call', label: 'Missed call follow-up', delivery: 'RECEIVED_MOCK', errorCode: null, recoveryHint: 'Prepare unsent operator follow-up only' },
  { channel: 'email-style', label: 'Email-style delivery failure', delivery: 'FAILED_MOCK', errorCode: 'MOCK_BOUNCE', recoveryHint: 'Rehearse local recovery; no email account connected' }
];
const organizations: readonly OrganizationId[] = ['rosiedazzlers', 'devilndove', 'yw', 'icamp'];
export const QL297_FIXTURE_VERSION = 'ql297-fixture-v1';
export const ql297Events: readonly Ql297Event[] = organizations.flatMap((organizationId, organizationIndex) => examples.map((event, index) => ({
  ...event, id: `ql297-${organizationId}-${index + 1}`, organizationId,
  source: `CHECKED_IN_SYNTHETIC/${QL297_FIXTURE_VERSION}/${organizationId}/${index + 1}`,
  occurredAt: new Date(Date.UTC(2026, 9, 29, 12 + organizationIndex, index * 4)).toISOString()
})));

export function ql297ForOrganization(organizationId: OrganizationId): readonly Ql297Event[] {
  return ql297Events.filter((event) => event.organizationId === organizationId);
}
export function emptyQl297Session(organizationId: OrganizationId): Ql297Session {
  return { organizationId, receipts: [], lastAction: 'No mock events replayed.' };
}
export function ql297Apply(session: Ql297Session, organizationId: OrganizationId, eventId: string, action: 'replay' | 'recover'): Ql297Session {
  if (session.organizationId !== organizationId) return session;
  const event = ql297ForOrganization(organizationId).find((candidate) => candidate.id === eventId);
  if (!event) return { ...session, lastAction: 'REJECTED: event is not in this company’s checked-in fixture set.' };
  const original = session.receipts.find((receipt) => receipt.eventId === eventId && receipt.attempt === 1);
  const recovery = session.receipts.find((receipt) => receipt.eventId === eventId && receipt.attempt === 2);
  if (action === 'replay') {
    if (original) return { ...session, lastAction: `DUPLICATE IGNORED: ${event.id} was already replayed. No second receipt.` };
    return { organizationId, receipts: [...session.receipts, { eventId, outcome: event.delivery, replayKey: `${event.id}:original`, attempt: 1 }], lastAction: `Accepted ${event.channel} fixture in memory only.` };
  }
  if (event.delivery !== 'FAILED_MOCK' || !original) return { ...session, lastAction: 'RECOVERY BLOCKED: only an already-replayed FAILED mock event is eligible.' };
  if (recovery) return { ...session, lastAction: `DUPLICATE RECOVERY IGNORED: ${event.id} was already recovered.` };
  return { organizationId, receipts: [...session.receipts, { eventId, outcome: 'RECOVERED_MOCK', replayKey: `${event.id}:recovery`, attempt: 2 }], lastAction: 'A single local recovery receipt was recorded. No provider retry or external delivery occurred.' };
}

export function ql297Timeline(session: Ql297Session, organizationId: OrganizationId) {
  if (session.organizationId !== organizationId) return [];
  return session.receipts.flatMap((receipt) => {
    const fixture = ql297ForOrganization(organizationId).find((event) => event.id === receipt.eventId);
    return fixture ? [{ ...fixture, ...receipt }] : [];
  }).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.attempt - b.attempt || a.eventId.localeCompare(b.eventId));
}
