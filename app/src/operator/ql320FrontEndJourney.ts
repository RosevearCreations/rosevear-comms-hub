import type { OperatorWorkspace, OrganizationId } from './ql191Organizations';
import { operatorOrganizations } from './ql191Organizations';
import { inboxForOrganization } from './ql192InboxFixtures';
import { customerForThread } from './ql193CustomerContexts';
import { readQl293Draft, type Ql293SessionDrafts } from './ql293ConversationRecovery';
import type { MockQueueState } from './ql194WorkQueue';

export const ql320Steps = [
  { workspace: 'inbox', title: 'Inbox', detail: 'Find a fictional conversation.' },
  { workspace: 'contacts', title: 'Contact 360', detail: 'Read a linked synthetic contact and consent.' },
  { workspace: 'guided_intake', title: 'Intake', detail: 'Prepare an unsent company-specific inquiry.' },
  { workspace: 'routing_studio', title: 'Routing', detail: 'Inspect IVR and safe fallback scenarios.' },
  { workspace: 'queue', title: 'Handoff', detail: 'Review a local task and UNSENT handoff.' },
  { workspace: 'accessibility_review', title: 'Accessibility review', detail: 'Record manual device checks; no owner pass implied.' }
] as const satisfies readonly { workspace: OperatorWorkspace; title: string; detail: string }[];

export type Ql320StepWorkspace = (typeof ql320Steps)[number]['workspace'];
export type Ql320StateExample = 'ready' | 'loading' | 'empty' | 'error' | 'disabled';

/** A local, scoped readback; never interpolates names or data from a different business. */
export function ql320JourneyReadback(organizationId: OrganizationId, queue: MockQueueState, drafts: Ql293SessionDrafts) {
  if (!operatorOrganizations.some((entry) => entry.id === organizationId)) {
    return { state: 'error' as const, thread: null, customer: null, task: null, draft: null };
  }
  if (queue.organizationId !== organizationId || queue.tasks.some((task) => task.organizationId !== organizationId)) {
    return { state: 'error' as const, thread: null, customer: null, task: null, draft: null };
  }
  const threads = inboxForOrganization(organizationId).filter((thread) => thread.organizationId === organizationId);
  const thread = threads.find((entry) => customerForThread(organizationId, entry.id)) ?? null;
  if (!thread) return { state: 'empty' as const, thread: null, customer: null, task: null, draft: null };
  const customer = customerForThread(organizationId, thread.id) ?? null;
  const task = queue.tasks.find((entry) => entry.threadId === thread.id) ?? null;
  const draft = threads.map((entry) => readQl293Draft(drafts, organizationId, entry.id)).find((entry) => entry !== null) ?? null;
  return { state: 'ready' as const, thread, customer, task, draft };
}
