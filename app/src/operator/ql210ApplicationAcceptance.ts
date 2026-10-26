import type { OrganizationId } from './ql191Organizations';
import { operatorOrganizations } from './ql191Organizations';
import { inboxForOrganization } from './ql192InboxFixtures';
import { customersForOrganization, customerForThread, customerThreads } from './ql193CustomerContexts';
import { applyQueueAction, seedQueueForOrganization } from './ql194WorkQueue';
import { calendarTasksForOrganization, taskCalendarDate, toggleDemoReminder } from './ql197TaskCalendar';
import { mockKeypress, phoneEntries } from './ql195PhoneDesk';
import { draftGate, messageTargets } from './ql196MessagePolicy';
import { connectorContracts } from './ql199ConnectorContracts';
import { buildMockReviewQueue } from './ql204HandoffReviewQueue';
import { eligibleMockReviewDesk } from './ql205ReviewDesk';
import { mockOperatorProfiles, assessMockHandoffSecurity } from './ql206SecureOperations';
import { MockPersistenceSandbox } from './ql207PersistenceSandbox';
import { MockGatewayPreviewWorkbench } from './ql208GatewayPreview';
import { evaluateQl209Analytics } from './ql209Analytics';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';

export const QL210_RELEASE = 'ql210-four-company-application-acceptance-disabled-preview-v1';
export type Ql210Check = Readonly<{ id: string; label: string; state: 'PASS_SYNTHETIC' | 'FAIL_SYNTHETIC'; evidence: string }>;
export type Ql210CompanyReview = Readonly<{
  organizationId: OrganizationId;
  companyName: string;
  checks: readonly Ql210Check[];
  passed: number;
  failed: number;
  previewChecksReady: boolean;
  livePilotReady: false;
}>;
export type Ql210PortfolioReview = Readonly<{
  release: typeof QL210_RELEASE;
  organizations: readonly Ql210CompanyReview[];
  totalChecks: number;
  passed: number;
  failed: number;
  previewChecksReady: boolean;
  livePilotReady: false;
  ownerApprovalCaptured: false;
  externalReviewCompleted: false;
  providerConnected: false;
  realAuthVerified: false;
  messagesSent: 0;
  callsPlaced: 0;
  externalWrites: 0;
  heldPrerequisites: typeof QL181_PREREQUISITES;
}>;

const primaryPersonas: Readonly<Record<OrganizationId, string>> = {
  rosiedazzlers: 'rosie-reviewer', devilndove: 'dnd-reviewer',
  icamp: 'camp-rosevear-reviewer', yw: 'yw-rosevear-manager'
};
const otherOrganizations: Readonly<Record<OrganizationId, OrganizationId>> = {
  rosiedazzlers: 'devilndove', devilndove: 'rosiedazzlers', icamp: 'yw', yw: 'icamp'
};
function registeredPerson(id: string) { return mockOperatorProfiles.find((person) => person.id === id)!; }

/**
 * Acceptance is a deterministic *browser-only sample contract exercise*.
 * The checks inspect imported models, not real infrastructure, calls, tokens or audits.
 * An external security reviewer and owner must independently attest live readiness.
 */
export function evaluateQl210Company(organizationId: OrganizationId): Ql210CompanyReview {
  const organization = operatorOrganizations.find((entry) => entry.id === organizationId);
  const other = otherOrganizations[organizationId];
  const profile = registeredPerson(primaryPersonas[organizationId]);
  const wrongProfile = registeredPerson(primaryPersonas[other]);
  const contract = connectorContracts[organizationId];
  const queue = buildMockReviewQueue(organizationId, contract);
  const items = queue.ok ? queue.items : [];
  const first = items[0];
  const checks: Ql210Check[] = [];
  function run(id: string, label: string, evidence: string, scenario: () => boolean) {
    let passed = false;
    try { passed = scenario() === true; } catch { passed = false; }
    checks.push({ id, label, state: passed ? 'PASS_SYNTHETIC' : 'FAIL_SYNTHETIC', evidence });
  }

  run('inbox', 'Unified inbox · company boundaries',
    'Five fictional, uniquely keyed company threads; an unrelated company has a separate source list.', () => {
      const threads = inboxForOrganization(organizationId);
      const foreign = inboxForOrganization(other);
      return Boolean(organization && threads.length === 5 && foreign.length === 5 &&
        new Set(threads.map((thread) => thread.id)).size === threads.length &&
        threads.every((thread) => thread.organizationId === organizationId && !foreign.some((entry) => entry.id === thread.id)));
    });

  run('contacts', 'Customer 360 · explicitly linked samples',
    'Linked example threads are same-company only; cross-company customer lookups return no threads.', () => {
      const contacts = customersForOrganization(organizationId);
      const firstContact = contacts[0];
      if (!firstContact || !contacts.every((contact) => contact.organizationId === organizationId)) return false;
      const threads = customerThreads(organizationId, firstContact);
      return threads.length > 0 && threads.every((thread) => thread.organizationId === organizationId &&
        customerForThread(organizationId, thread.id)?.id === firstContact.id) && customerThreads(other, firstContact).length === 0;
    });

  run('tasks', 'Assignments, follow-ups & calendar',
    'A fictional task edit creates a local receipt; calendar and reminders cannot read the other company.', () => {
      const state = seedQueueForOrganization(organizationId);
      const task = state.tasks.find((entry) => entry.status !== 'done');
      if (!task) return false;
      const changed = applyQueueAction(organizationId, state, { kind: 'status', taskId: task.id, status: 'done' });
      const cross = applyQueueAction(other, state, { kind: 'status', taskId: task.id, status: 'done' });
      const reminders = toggleDemoReminder(organizationId, state, new Set<string>(), task.id);
      return changed.receipts.length === 1 && changed.tasks.find((entry) => entry.id === task.id)?.status === 'done'
        && cross === state && reminders.has(task.id) && calendarTasksForOrganization(organizationId, state).length === state.tasks.length
        && calendarTasksForOrganization(other, state).length === 0 && /^20\d\d-\d\d-\d\d$/.test(taskCalendarDate(task));
    });

  run('phone', 'Phone desk · no provider dialing',
    'Only sample missed-call/voicemail labels; keypad rejects non-dial characters.', () => {
      const entries = phoneEntries(organizationId);
      return entries.length > 0 && entries.every((entry) => entry.organizationId === organizationId)
        && mockKeypress('12', 'A') === '12' && mockKeypress('12', '#') === '12#';
    });

  run('composer', 'SMS/MMS consent & outbound hold',
    'Every mock target blocks service and marketing sends; an unrelated company target is rejected.', () => {
      const targets = messageTargets(organizationId);
      return targets.length > 0 && targets.every((item) => !draftGate(organizationId, item.id, 'service').allowed
        && !draftGate(organizationId, item.id, 'marketing').allowed)
        && draftGate(other, targets[0].id, 'service').consent === null;
    });

  run('connectors', 'QL-200–204 · canonical four-company handoffs',
    'Only fixed allowed source IDs produce fictional intake; altered and foreign contract values are rejected.', () => {
      if (!queue.ok || !first || items.length === 0) return false;
      const rejected = eligibleMockReviewDesk(organizationId, contract, { ...first, reference: 'ALTERED' });
      const foreign = buildMockReviewQueue(organizationId, connectorContracts[other]);
      return items.every((item) => item.organizationId === organizationId && item.externalActions === 'disabled'
        && eligibleMockReviewDesk(organizationId, contract, item).ok) && !rejected.ok && !foreign.ok;
    });

  run('roles', 'QL-206 · company, tenant & property test',
    'Fictional positive/negative profile checks; no actual identity grant or production authorization.', () => {
      if (!first) return false;
      const allowed = assessMockHandoffSecurity(organizationId, contract, profile, first, 'inspect_summary');
      const wrong = assessMockHandoffSecurity(organizationId, contract, wrongProfile, first, 'inspect_summary');
      const send = assessMockHandoffSecurity(organizationId, contract, profile, first, 'send_message');
      if (!allowed.designAllows || wrong.designAllows || send.designAllows || allowed.runtime !== 'disabled') return false;
      if (organizationId === 'icamp') return !assessMockHandoffSecurity(organizationId, contract,
        registeredPerson('camp-isolated-manager'), first, 'inspect_summary').designAllows;
      if (organizationId === 'yw') {
        const snow = items.find((item) => item.id === 'yw-demo-snow');
        return Boolean(snow && !assessMockHandoffSecurity(organizationId, contract,
          registeredPerson('yw-property-a-reviewer'), snow, 'inspect_summary').designAllows &&
          !assessMockHandoffSecurity(organizationId, contract, registeredPerson('yw-isolated-manager'), first, 'inspect_summary').designAllows);
      }
      return true;
    });

  run('persistence', 'QL-207 · safe in-memory checkpoint replay',
    'One fabricated stage can be saved/retried; stale versions, foreign roles and cross-company reads fail.', () => {
      if (!first) return false;
      const sandbox = new MockPersistenceSandbox();
      const input = { organizationId, contract, profile, item: first,
        stage: 'triage_note' as const, expectedVersion: 0, requestId: 'demo-1' };
      const created = sandbox.save(input);
      const replayed = sandbox.save(input);
      const stale = sandbox.save({ ...input, requestId: 'demo-2' });
      const foreign = sandbox.save({ ...input, profile: wrongProfile, requestId: 'demo-3' });
      const visible = sandbox.visibleTo(organizationId, profile);
      const otherVisible = sandbox.visibleTo(other, wrongProfile);
      sandbox.clear();
      return created.ok && replayed.ok && replayed.replayed && !stale.ok && stale.reason === 'stale_version'
        && !foreign.ok && visible.length === 1 && otherVisible.length === 0
        && sandbox.visibleTo(organizationId, profile).length === 0;
    });

  run('gateway', 'QL-208 · synthetic gateway and replay holds',
    'Browser-only policy scenarios reject duplicate events, bad signatures and every outgoing request.', () => {
      if (!first) return false;
      const lab = new MockGatewayPreviewWorkbench();
      lab.setAllowlistedItems(organizationId, items);
      const params = { organizationId, contract, profile, item: first };
      const accepted = lab.run({ ...params, scenario: 'fresh' });
      const replay = lab.run({ ...params, scenario: 'duplicate' });
      const invalid = lab.run({ ...params, scenario: 'invalid_signature' });
      const outward = lab.run({ ...params, scenario: 'outbound' });
      return accepted.disposition === 'HELD_FOR_REVIEW' && replay.disposition === 'DENIED_REPLAY'
        && invalid.disposition === 'DENIED_SIGNATURE' && outward.disposition === 'DENIED_OUTBOUND'
        && outward.messagesSent === 0 && outward.callsPlaced === 0;
    });

  run('analytics', 'QL-209 · scoped reports & invented budget guard',
    'An isolated fictional role gets no totals; an illustrative USD budget overrun never charges anyone.', () => {
      const model = { organizationId, profile, providerId: 'voipms' as const, volumeMultiplier: 10,
        monthlyBudgetUsd: 1, reservePercent: 25, currency: 'USD' as const, cadPerUsd: 1.4 };
      const own = evaluateQl209Analytics(model);
      const foreign = evaluateQl209Analytics({ ...model, profile: wrongProfile });
      return own.disposition === 'PREVIEW_ONLY' && own.cost.flag === 'above_demo_budget'
        && own.visibleHandoffs > 0 && own.actualResponsesTimed === 0 && own.externalWrites === 0
        && foreign.disposition === 'ACCESS_DENIED';
    });

  const passed = checks.filter((item) => item.state === 'PASS_SYNTHETIC').length;
  return { organizationId, companyName: organization?.name ?? organizationId,
    checks, passed, failed: checks.length - passed, previewChecksReady: passed === checks.length, livePilotReady: false };
}

/** Portfolio summary is sample-only and exposes no customer identifiers or cross-tenant data. */
export function evaluateQl210Portfolio(): Ql210PortfolioReview {
  const organizations = operatorOrganizations.map((entry) => evaluateQl210Company(entry.id));
  const totalChecks = organizations.reduce((sum, item) => sum + item.checks.length, 0);
  const passed = organizations.reduce((sum, item) => sum + item.passed, 0);
  const failed = totalChecks - passed;
  return { release: QL210_RELEASE, organizations, totalChecks, passed, failed,
    previewChecksReady: failed === 0 && organizations.length === 4,
    livePilotReady: false, ownerApprovalCaptured: false, externalReviewCompleted: false,
    providerConnected: false, realAuthVerified: false, messagesSent: 0, callsPlaced: 0,
    externalWrites: 0, heldPrerequisites: QL181_PREREQUISITES };
}
