import { useState } from 'react';
import type { OperatorWorkspace, OrganizationId } from './ql191Organizations';
import { findOperatorOrganization } from './ql191Organizations';
import type { MockQueueState } from './ql194WorkQueue';
import type { Ql272RolePreview } from './ql272LayoutPreferences';
import {
  ql321ManagementModel, ql321PreviewLinkAllowed, ql321VisibleRows,
  type Ql321Lane, type Ql321WorkFilter, type Ql321IncidentFilter, type Ql321Row
} from './ql321ManagementCockpit';
import './ql321-management-cockpit.css';

const incidentFilters: readonly { value: Ql321IncidentFilter; label: string }[] = [
  { value: 'all', label: 'All incident scenarios' },
  { value: 'blocked_handoff', label: 'Blocked handoff' },
  { value: 'checkpoint_due', label: 'Checkpoint due' },
  { value: 'review_needed', label: 'Review needed' },
  { value: 'queued', label: 'Queued follow-up' }
];
const workFilters: readonly { value: Ql321WorkFilter; label: string }[] = [
  { value: 'all', label: 'All queue tasks' }, { value: 'open', label: 'Open' },
  { value: 'waiting', label: 'Waiting' }, { value: 'done', label: 'Completed' },
  { value: 'overdue', label: 'Overdue only' }, { value: 'unassigned', label: 'Unassigned only' }
];
const lanes: readonly { value: Ql321Lane; label: string; hint: string }[] = [
  { value: 'attention', label: 'Attention', hint: 'Derived follow-up priorities across two separate fixtures' },
  { value: 'incidents', label: 'Incident scenarios', hint: 'Four QL-301 narrative training cases' },
  { value: 'workload', label: 'Task workload', hint: 'Company-specific QL-194 assignment state' }
];

export function Ql321ManagementCockpit({ organizationId, queue, rolePreview, onNavigate, onOpenQueue }: {
  organizationId: OrganizationId;
  queue: MockQueueState;
  rolePreview: Ql272RolePreview;
  onNavigate: (workspace: OperatorWorkspace) => void;
  onOpenQueue: (threadId: string) => void;
}) {
  const [lane, setLane] = useState<Ql321Lane>('attention');
  const [incidentFilter, setIncidentFilter] = useState<Ql321IncidentFilter>('all');
  const [workFilter, setWorkFilter] = useState<Ql321WorkFilter>('all');
  const [query, setQuery] = useState('');
  const company = findOperatorOrganization(organizationId);
  const model = ql321ManagementModel(organizationId, queue);
  const rows = ql321VisibleRows(model, lane, incidentFilter, workFilter, query);

  function show(nextLane: Ql321Lane, incident: Ql321IncidentFilter = 'all', task: Ql321WorkFilter = 'all') {
    setLane(nextLane);
    setIncidentFilter(incident);
    setWorkFilter(task);
    setQuery('');
  }

  function drillThrough(row: Ql321Row) {
    if (!ql321PreviewLinkAllowed(rolePreview, row.destination)) return;
    if (row.threadId) onOpenQueue(row.threadId);
    else onNavigate(row.destination);
  }

  return <section className="ql321-cockpit" data-ql321-cockpit={organizationId} data-ql321-role-preview={rolePreview} aria-labelledby="ql321-heading">
    <div className="ql321-head">
      <div><p className="ql321-eyebrow">QL-321 · Management Command</p><h3 id="ql321-heading">{company?.name ?? 'Unknown company'} · Workload and incident drill-through</h3>
        <p>One selected business. Two labelled fictional sources: QL-301 incident scenarios and QL-194 queue tasks. Counts never combine them into an invented live incident total.</p></div>
      <span className="ql321-safety">PREVIEW ONLY · NOT LIVE MANAGEMENT</span>
    </div>
    <p className="ql321-boundary" role="note">Role display: <strong>{rolePreview.replaceAll('_', ' ')}</strong> (local visual preference, <strong>not</strong> verified login permission). All staff identities, deadlines, severity labels and incidents below are demonstration-only. No real SLA, assignment, authorization or external delivery occurs.</p>
    {model.state === 'error' ? <div className="ql321-integrity-error" role="alert"><strong>Company integrity mismatch · readback blocked.</strong><p>The task company or sample owner does not match the selected business. No merged summary or cross-company drill-through is permitted. Switch business to restore its safe fixture.</p></div>
      : <>
        <div className="ql321-metrics" aria-label="Source-reconciled management KPIs">
          <button type="button" onClick={() => show('incidents')} aria-label={`Show all ${model.counts.incidentCases} incident scenarios`}><span>Incident scenarios</span><strong>{model.counts.incidentCases}</strong><small>QL-301 cases · not observed incidents</small></button>
          <button type="button" onClick={() => show('workload')} aria-label={`Show all ${model.counts.tasks} queue tasks`}><span>Queue tasks</span><strong>{model.counts.tasks}</strong><small>{model.counts.open} open · {model.counts.waiting} waiting · {model.counts.done} completed</small></button>
          <button type="button" onClick={() => show('attention')} aria-label={`Show ${model.counts.attention} attention records`}><span>Attention records</span><strong>{model.counts.attention}</strong><small>High-priority fixture flags · not alerts</small></button>
          <button type="button" onClick={() => show('workload', 'all', 'overdue')} aria-label={`Show ${model.counts.overdue} overdue sample tasks`}><span>OVERDUE tasks</span><strong>{model.counts.overdue}</strong><small>Fixed sample due window, no clock</small></button>
          <button type="button" onClick={() => show('workload', 'all', 'unassigned')} aria-label={`Show ${model.counts.unassigned} unassigned sample tasks`}><span>Unassigned tasks</span><strong>{model.counts.unassigned}</strong><small>No actual staff responsibility</small></button>
          <button type="button" onClick={() => show('incidents', 'blocked_handoff')} aria-label={`Show ${model.counts.blocked} blocked incident scenarios`}><span>Blocked handoffs</span><strong>{model.counts.blocked}</strong><small>{model.counts.checkpoints} other checkpoint scenario</small></button>
        </div>
        <div className="ql321-attention-head"><div><h4>Priority attention cards</h4><p>Only QL-301 blocked/checkpoint scenarios and QL-194 overdue/unassigned open tasks. Each card links back to its own fictional source.</p></div><span>{model.counts.attention} synthetic flags</span></div>
        {model.counts.attention ? <ul className="ql321-attention-grid" aria-label="Source-backed attention records">
          {[...model.incidentRows, ...model.workloadRows].filter(row => row.attention).map(row => <li key={`${row.origin}-${row.id}`}>
            <article><span className="ql321-severity" data-severity={row.severity}>{row.severity.toUpperCase()} · demonstration</span><h5>{row.title}</h5><p>{row.origin} · {row.time}</p><p>Responsibility: {row.responsible}</p>
              <button type="button" disabled={!ql321PreviewLinkAllowed(rolePreview, row.destination)} onClick={() => drillThrough(row)}>{ql321PreviewLinkAllowed(rolePreview, row.destination) ? 'Open related preview' : 'Role-display preview: link unavailable'}</button>
            </article>
          </li>)}
        </ul> : <p className="ql321-empty" role="status">No attention flags exist in the current fictional fixture. Nothing live was queried.</p>}
        <div className="ql321-inspector" id="ql321-inspector">
          <div className="ql321-inspector-head"><div><h4>Reconciled source explorer</h4><p>Choose a lane, filter or search; the table and its count change together.</p></div><span>Owner responsibility is a sample roster label only</span></div>
          <div className="ql321-lanes" role="group" aria-label="Source explorer lanes">
            {lanes.map(entry => <button key={entry.value} type="button" aria-pressed={lane === entry.value} title={entry.hint} onClick={() => show(entry.value)}>{entry.label}</button>)}
          </div>
          <div className="ql321-filter-row">
            {lane === 'incidents' && <label htmlFor="ql321-incident-filter">Incident scenario status<select id="ql321-incident-filter" value={incidentFilter} onChange={event => setIncidentFilter(event.currentTarget.value as Ql321IncidentFilter)}>{incidentFilters.map(entry => <option value={entry.value} key={entry.value}>{entry.label}</option>)}</select></label>}
            {lane === 'workload' && <label htmlFor="ql321-work-filter">Queue status / responsibility<select id="ql321-work-filter" value={workFilter} onChange={event => setWorkFilter(event.currentTarget.value as Ql321WorkFilter)}>{workFilters.map(entry => <option value={entry.value} key={entry.value}>{entry.label}</option>)}</select></label>}
            <label htmlFor="ql321-search">Search only this business’s fictional rows<input id="ql321-search" type="search" value={query} onChange={event => setQuery(event.currentTarget.value)} placeholder="Case ID, owner, status…" /></label>
            <p role="status" aria-live="polite">Showing <strong>{rows.length}</strong> of <strong>{lane === 'incidents' ? model.counts.incidentCases : lane === 'workload' ? model.counts.tasks : model.counts.attention}</strong> {lane === 'incidents' ? 'scenarios' : lane === 'workload' ? 'tasks' : 'attention records'}.</p>
          </div>
          {rows.length ? <div className="ql321-table-scroll" role="region" tabIndex={0} aria-label="Scrollable management source table">
            <table><caption>{company?.name} · {lanes.find(item => item.value === lane)?.label} · fabricated source rows</caption><thead><tr><th scope="col">Case / task</th><th scope="col">Status &amp; urgency</th><th scope="col">Review desk / sample owner</th><th scope="col">Time / due</th><th scope="col">Exact fixture provenance</th><th scope="col">Drill-through</th></tr></thead>
              <tbody>{rows.map(row => <tr key={`${row.origin}-${row.id}`}><th scope="row"><strong>{row.title}</strong><small>{row.id} · {row.origin}</small></th><td>{row.status}<br /><span className="ql321-severity" data-severity={row.severity}>{row.severity.toUpperCase()} · sample</span></td><td>{row.responsible}</td><td>{row.time}</td><td><code>{row.source}</code></td><td><button type="button" disabled={!ql321PreviewLinkAllowed(rolePreview, row.destination)} onClick={() => drillThrough(row)}>{ql321PreviewLinkAllowed(rolePreview, row.destination) ? `Open ${row.destination.replaceAll('_', ' ')} preview` : 'Unavailable for this display role'}</button></td></tr>)}</tbody>
            </table>
          </div> : <div className="ql321-empty" role="status"><strong>No fictional records match.</strong><p>Try a different filter or clear the search. No hidden live queue was queried.</p><button type="button" onClick={() => show(lane)}>Reset this source view</button></div>}
        </div>
        <div className="ql321-proof"><p><strong>Reconciliation:</strong> QL-301 incident statuses = {model.counts.incidentCases} cases; QL-194 open + waiting + completed = {model.counts.open + model.counts.waiting + model.counts.done} of {model.counts.tasks} tasks. Attention flags = {model.counts.attention} source rows, without conflating separate cases and tasks.</p><p>Data provenance: <code>ql191DashboardData.ts</code> → <code>ql301ManagementDashboard.ts</code>; <code>ql194WorkQueue.ts</code> seeded/mutable in memory for the selected company. No timestamped production incident, personnel account or cross-company aggregate is asserted.</p></div>
      </>}
    <div className="ql321-role-links"><span>Role-display shortcuts:</span>
      {rolePreview === 'it_reviewer' ? <button type="button" onClick={() => onNavigate('system_status')}>System Status and held proof</button> : <><button type="button" onClick={() => onNavigate('inbox')}>Company inbox preview</button><button type="button" onClick={() => onNavigate('queue')}>Assignments preview</button></>}
      <small>Visual role preview only. These buttons are not an access-control enforcement mechanism.</small>
    </div>
  </section>;
}
