import { useState } from 'react';
import type { OperatorWorkspace, OrganizationId } from './ql191Organizations';
import { findOperatorOrganization } from './ql191Organizations';
import { ql301FilterIncidents, ql301Incidents, ql301Summary, type Ql301Filter, type Ql301Status } from './ql301ManagementDashboard';
import './ql301-management-dashboard.css';

const statuses: Record<Ql301Status, string> = { review_needed: 'Review needed', blocked_handoff: 'Blocked handoff', checkpoint_due: 'Checkpoint due', queued: 'Queued follow-up' };
const filters: readonly { id: Ql301Filter; label: string }[] = [{ id: 'all', label: 'All sample work' }, ...Object.entries(statuses).map(([id, label]) => ({ id: id as Ql301Status, label }))];

export function Ql301ManagementDashboard({ organizationId, mode, onNavigate }: { organizationId: OrganizationId; mode: 'management' | 'system_status'; onNavigate: (workspace: OperatorWorkspace) => void }) {
  const [filter, setFilter] = useState<Ql301Filter>('all');
  const organization = findOperatorOrganization(organizationId);
  const incidents = ql301Incidents(organizationId);
  const summary = ql301Summary(incidents);
  const visible = ql301FilterIncidents(incidents, filter);
  return <section className="ql301" data-ql301-release="scoped-management-incident-cards-v1" aria-labelledby="ql301-title">
    <header><div><p className="ql271-eyebrow">QL-301 · {mode === 'management' ? 'Management command' : 'Incident status'} dashboard</p><h3 id="ql301-title">{organization?.name ?? 'Unknown company'} · Ownership and incident review</h3><p>One-company sample desk with explicit handoff, review and incident-age checkpoints. Each card is derived from the existing fictional queue fixtures.</p></div><span className="ql301-mode">SYNTHETIC · READ ONLY</span></header>
    <p className="ql301-warning" role="note">No employees assigned, SLA clocks running, incidents observed or provider handoffs activated. The age figures are fixed training examples, not elapsed live time. No cross-company customer data is combined.</p>
    <div className="ql301-metrics" aria-label="Synthetic workload counts">
      <article><span>Sample workload</span><strong>{summary.total}</strong><small>One selected business</small></article>
      <article><span>Blocked handoffs</span><strong>{summary.blocked}</strong><small>Mock callback gate</small></article>
      <article><span>Review checkpoints</span><strong>{summary.review + summary.checkpoints}</strong><small>Reply and intake review</small></article>
      <article><span>Longest sample age</span><strong>{summary.longestSyntheticAgeHours}h</strong><small>Fixed demonstration offset</small></article>
    </div>
    <div className="ql301-controls"><label>Filter incident status<select value={filter} onChange={event => setFilter(event.currentTarget.value as Ql301Filter)}>{filters.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><p role="status" aria-live="polite">Showing {visible.length} of {summary.total} fictional items for {organization?.name}.</p></div>
    {visible.length ? <ul className="ql301-cases">{visible.map(item => <li key={item.id}><article><div className="ql301-case-head"><span className="ql301-status" data-status={item.status}>{statuses[item.status]}</span><span>Sample age {item.syntheticAgeHours}h</span></div><h4>{item.title}</h4><p>Review desk: <strong>{item.desk}</strong></p><p>Fixture origin: {item.source}</p><button type="button" onClick={() => onNavigate(item.destination)}>Open {item.destination.replaceAll('_', ' ')} preview for this scenario</button></article></li>)}</ul> : <p className="ql301-empty" role="status">No synthetic items match this filter. No live work has been queried.</p>}
    <footer>Company boundary: {organization?.name} only · Live assignments 0 · Real incidents 0 · External writes 0</footer>
  </section>;
}
