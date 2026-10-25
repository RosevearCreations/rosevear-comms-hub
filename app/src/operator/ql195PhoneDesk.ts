import { inboxForOrganization, type InboxThread } from './ql192InboxFixtures';
import type { OrganizationId } from './ql191Organizations';

export type PhoneFilter = 'all' | 'missed' | 'voicemail';
export type PhoneEntry = Readonly<{
  id: string;
  organizationId: OrganizationId;
  threadId: string;
  kind: 'missed' | 'voicemail';
  subject: string;
  contactLabel: string;
  description: string;
}>;

/** The displayed line is a label, never a number or provider route. */
export const phoneLineLabels: Readonly<Record<OrganizationId, string>> = {
  rosiedazzlers: 'Rosie Dazzlers · sample service line',
  devilndove: 'Devil n Dove · sample maker line',
  icamp: 'iCamp · sample front desk line',
  yw: 'YW · sample dispatch line'
};

export function phoneEntries(organizationId: OrganizationId): readonly PhoneEntry[] {
  return inboxForOrganization(organizationId)
    .filter((thread): thread is InboxThread => thread.channel === 'voice' || thread.channel === 'voicemail')
    .map((thread) => ({
      id: `ql195-${thread.id}`, organizationId, threadId: thread.id,
      kind: thread.channel === 'voicemail' ? 'voicemail' : 'missed',
      subject: thread.subject, contactLabel: thread.contactLabel,
      description: thread.events.find((event) => event.kind === 'call_event')?.body ?? thread.summary
    }));
}

/** Not a telephone formatter; digits exist in ephemeral mock keypad state only. */
export function mockKeypress(previous: string, key: string): string {
  return /^[0-9*#]$/.test(key) ? (previous + key).slice(0, 16) : previous;
}
