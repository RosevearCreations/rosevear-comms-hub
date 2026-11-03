import type { OperatorWorkspace, OrganizationId } from './ql191Organizations';
import { operatorOrganizations } from './ql191Organizations';
import { ql301Incidents, type Ql301Incident, type Ql301Status } from './ql301ManagementDashboard';
import type { MockQueueState, MockFollowUpTask } from './ql194WorkQueue';
import { rosterForOrganization } from './ql194WorkQueue';
import { inboxForOrganization } from './ql192InboxFixtures';
import type { Ql272RolePreview } from './ql272LayoutPreferences';

export type Ql321Severity = 'high' | 'medium' | 'low';
export type Ql321Lane = 'attention' | 'incidents' | 'workload';
export type Ql321WorkFilter = 'all' | 'open' | 'waiting' | 'done' | 'overdue' | 'unassigned';
export type Ql321IncidentFilter = Ql301Status | 'all';

export interface Ql321Row {
  id: string;
  origin: 'QL-301 incident scenario' | 'QL-194 task';
  title: string;
  status: string;
  responsible: string;
  severity: Ql321Severity;
  time: string;
  source: string;
  destination: OperatorWorkspace;
  threadId: string | null;
  attention: boolean;
}

export interface Ql321Model {
  state: 'ready' | 'error';
  company: OrganizationId;
  incidentRows: readonly Ql321Row[];
  workloadRows: readonly Ql321Row[];
  counts: { incidentCases: number; blocked: number; checkpoints: number; tasks: number; open: number; waiting: number; done: number; overdue: number; unassigned: number; attention: number };
}

const incidentSeverity: Readonly<Record<Ql301Status, Ql321Severity>> = {
  blocked_handoff: 'high', checkpoint_due: 'high', review_needed: 'medium', queued: 'low'
};

function incidentRow(item: Ql301Incident): Ql321Row {
  return {
    id: item.id, origin: 'QL-301 incident scenario', title: item.title, status: item.status.replaceAll('_', ' '),
    responsible: item.desk, severity: incidentSeverity[item.status], time: `${item.syntheticAgeHours}h sample offset`,
    source: `ql191DashboardData.ts → ql301ManagementDashboard.ts · ${item.id} · ${item.source}`,
    destination: item.destination, threadId: null,
    attention: item.status === 'blocked_handoff' || item.status === 'checkpoint_due'
  };
}

function taskRow(task: MockFollowUpTask, roster: ReadonlyMap<string, string>): Ql321Row {
  const urgent = task.status !== 'done' && (task.due === 'overdue' || task.ownerId === null);
  return {
    id: task.id, origin: 'QL-194 task', title: task.title, status: task.status === 'done' ? 'Completed sample' : task.status === 'waiting' ? 'Waiting · simulated' : 'Open · simulated',
    responsible: task.ownerId === null ? 'UNASSIGNED · fictional' : roster.get(task.ownerId) ?? 'Unverified sample owner',
    severity: urgent ? 'high' : task.status === 'waiting' ? 'medium' : 'low',
    time: task.due === 'overdue' ? 'OVERDUE · fixed sample' : `${task.due} · fixed sample`,
    source: `ql194WorkQueue.ts · ${task.id} · ${task.threadId}`,
    destination: 'queue', threadId: task.threadId, attention: urgent
  };
}

const emptyCounts = () => ({ incidentCases: 0, blocked: 0, checkpoints: 0, tasks: 0, open: 0, waiting: 0, done: 0, overdue: 0, unassigned: 0, attention: 0 });

/** Two deliberately separate fixture ledgers. No synthetic incident is mistaken for a queue task or live event. */
export function ql321ManagementModel(company: OrganizationId, queue: MockQueueState): Ql321Model {
  const invalid = () => ({ state: 'error' as const, company, incidentRows: [], workloadRows: [], counts: emptyCounts() });
  if (!operatorOrganizations.some((org) => org.id === company) || queue.organizationId !== company ||
    !Array.isArray(queue.tasks) || queue.tasks.some((task) => task.organizationId !== company)) return invalid();
  const roster = new Map(rosterForOrganization(company).map((member) => [member.id, member.label]));
  const threadIds = new Set(inboxForOrganization(company).map((thread) => thread.id));
  if (new Set(queue.tasks.map((task) => task.id)).size !== queue.tasks.length ||
    queue.tasks.some((task) => (task.ownerId !== null && !roster.has(task.ownerId)) || !threadIds.has(task.threadId))) return invalid();
  const incidents = ql301Incidents(company);
  const incidentRows = incidents.map(incidentRow);
  const workloadRows = queue.tasks.map((task) => taskRow(task, roster));
  const attention = [...incidentRows, ...workloadRows].filter((row) => row.attention).length;
  return {
    state: 'ready', company, incidentRows, workloadRows,
    counts: {
      incidentCases: incidentRows.length,
      blocked: incidents.filter((incident) => incident.status === 'blocked_handoff').length,
      checkpoints: incidents.filter((incident) => incident.status === 'checkpoint_due').length,
      tasks: queue.tasks.length,
      open: queue.tasks.filter((task) => task.status === 'open').length,
      waiting: queue.tasks.filter((task) => task.status === 'waiting').length,
      done: queue.tasks.filter((task) => task.status === 'done').length,
      overdue: queue.tasks.filter((task) => task.status !== 'done' && task.due === 'overdue').length,
      unassigned: queue.tasks.filter((task) => task.status !== 'done' && task.ownerId === null).length,
      attention
    }
  };
}

export function ql321VisibleRows(model: Ql321Model, lane: Ql321Lane, incidentFilter: Ql321IncidentFilter, workFilter: Ql321WorkFilter, query: string): readonly Ql321Row[] {
  if (model.state !== 'ready') return [];
  const source = lane === 'incidents' ? model.incidentRows : lane === 'workload' ? model.workloadRows : [...model.incidentRows, ...model.workloadRows].filter((row) => row.attention);
  const needle = query.trim().toLocaleLowerCase('en-CA');
  return source.filter((row) => {
    if (lane === 'incidents' && incidentFilter !== 'all' && row.status !== incidentFilter.replaceAll('_', ' ')) return false;
    if (lane === 'workload' && workFilter !== 'all') {
      if (workFilter === 'overdue' && !row.time.startsWith('OVERDUE')) return false;
      if (workFilter === 'unassigned' && !row.responsible.startsWith('UNASSIGNED')) return false;
      if (['open','waiting','done'].includes(workFilter) && !row.status.toLocaleLowerCase('en-CA').startsWith(workFilter === 'done' ? 'completed' : workFilter)) return false;
    }
    return !needle || `${row.id} ${row.title} ${row.status} ${row.responsible} ${row.source}`.toLocaleLowerCase('en-CA').includes(needle);
  });
}

const ql321RoleLinks: Readonly<Record<Ql272RolePreview, readonly OperatorWorkspace[]>> = {
  operator: ['inbox', 'event_timeline', 'guided_intake', 'queue'],
  manager: ['inbox', 'event_timeline', 'guided_intake', 'queue'],
  it_reviewer: ['event_timeline']
};

/** Presentation affordance only. This role is a display preference, never a permission or auth check. */
export function ql321PreviewLinkAllowed(role: Ql272RolePreview, destination: OperatorWorkspace): boolean {
  return ql321RoleLinks[role]?.includes(destination) ?? false;
}
