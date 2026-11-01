import { dashboardQueues, type DashboardQueueItem, type QueueCategory } from './ql191DashboardData';
import type { OperatorWorkspace, OrganizationId } from './ql191Organizations';

export type Ql301Status = 'review_needed' | 'blocked_handoff' | 'checkpoint_due' | 'queued';
export type Ql301Filter = Ql301Status | 'all';
export type Ql301Incident = {
  id: string;
  title: string;
  category: QueueCategory;
  status: Ql301Status;
  desk: string;
  syntheticAgeHours: number;
  source: string;
  destination: OperatorWorkspace;
};

const categoryRules: Record<QueueCategory, Pick<Ql301Incident, 'status' | 'desk' | 'syntheticAgeHours' | 'destination'>> = {
  reply: { status: 'review_needed', desk: 'Operator triage · sample', syntheticAgeHours: 2, destination: 'inbox' },
  call: { status: 'blocked_handoff', desk: 'Callback review · sample', syntheticAgeHours: 8, destination: 'event_timeline' },
  intake: { status: 'checkpoint_due', desk: 'Intake review · sample', syntheticAgeHours: 24, destination: 'guided_intake' },
  task: { status: 'queued', desk: 'Follow-up desk · sample', syntheticAgeHours: 4, destination: 'queue' }
};

function incidentFromFixture(item: DashboardQueueItem): Ql301Incident {
  return { id: item.id, title: item.title, category: item.category, source: item.channel, ...categoryRules[item.category] };
}

/** The only input is the pre-existing four-company synthetic fixture registry. */
export function ql301Incidents(organization: OrganizationId): readonly Ql301Incident[] {
  return (dashboardQueues[organization] ?? []).map(incidentFromFixture);
}

export function ql301Summary(incidents: readonly Ql301Incident[]) {
  return {
    total: incidents.length,
    review: incidents.filter(item => item.status === 'review_needed').length,
    blocked: incidents.filter(item => item.status === 'blocked_handoff').length,
    checkpoints: incidents.filter(item => item.status === 'checkpoint_due').length,
    queued: incidents.filter(item => item.status === 'queued').length,
    longestSyntheticAgeHours: Math.max(0, ...incidents.map(item => item.syntheticAgeHours))
  };
}

export function ql301FilterIncidents(incidents: readonly Ql301Incident[], status: Ql301Filter) {
  return status === 'all' ? [...incidents] : incidents.filter(item => item.status === status);
}
