import { useState } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import { getDashboardQueue, type QueueCategory } from './ql191DashboardData';
import './ql191-dashboard.css';

type QueueFilter = QueueCategory | 'all';
const filters: ReadonlyArray<{ id: QueueFilter; label: string }> = [
  { id: 'all', label: 'All activity' },
  { id: 'reply', label: 'Needs reply' },
  { id: 'call', label: 'Call events' },
  { id: 'intake', label: 'Intakes' },
  { id: 'task', label: 'Tasks' }
];

export function Ql191OperatorDashboard({ organization, onNavigate }: {
  organization: OperatorOrganization;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const items = getDashboardQueue(organization.id);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '');
  const [showHelp, setShowHelp] = useState(false);
  const visibleItems = items.filter((item) => filter === 'all' || item.category === filter);
  const selectedItem = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0];

  const stats = [
    { label: 'Sample activities', value: items.length, description: 'Fictional records only' },
    { label: 'Needs reply', value: items.filter((item) => item.category === 'reply').length, description: 'Simulated queue' },
    { label: 'Missed-call examples', value: items.filter((item) => item.category === 'call').length, description: 'No connected telephone' },
    { label: 'Follow-up examples', value: items.filter((item) => item.category === 'task').length, description: 'No real assignments' }
  ];

  return (
    <section className="ql191-dashboard" aria-labelledby="ql191-dashboard-title" data-organization={organization.id}>
      <div className="ql191-hero">
        <div>
          <p className="ql191-eyebrow">QL-191 · Operator Console V2</p>
          <h3 id="ql191-dashboard-title">Good to see you. Here is the {organization.name} desk.</h3>
          <p>{organization.summary}</p>
          <p className="ql191-synthetic-banner" role="note">Demonstration mode — the numbers, conversations and tasks below are fabricated. No live connections or real customer records.</p>
        </div>
        <button className="ql191-help-button" type="button" aria-label="Help with the operator dashboard" aria-expanded={showHelp} aria-controls="ql191-dashboard-help" onClick={() => setShowHelp((previous) => !previous)}>ⓘ <span>Help</span></button>
      </div>

      {showHelp && (
        <div className="ql191-help-content" id="ql191-dashboard-help" role="note">
          Choose a business in the left navigation to change the demo context. Select a filter to inspect synthetic activity. Workspace shortcuts navigate within the disabled preview; they cannot send, call, approve, or connect a provider.
        </div>
      )}

      <div className="ql191-metrics" aria-label="Synthetic dashboard metrics">
        {stats.map((stat) => (
          <article className="ql191-metric" key={stat.label}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <small>{stat.description}</small>
          </article>
        ))}
      </div>

      <div className="ql191-grid">
        <section className="ql191-panel ql191-activity" aria-labelledby="ql191-activity-heading">
          <div className="ql191-panel-heading">
            <div>
              <p className="ql191-eyebrow">Operator queue</p>
              <h4 id="ql191-activity-heading">Sample activity</h4>
            </div>
            <span className="ql191-pill">{visibleItems.length} shown</span>
          </div>
          <div className="ql191-filters" role="group" aria-label="Filter sample activities">
            {filters.map((choice) => (
              <button type="button" key={choice.id} aria-pressed={filter === choice.id} onClick={() => setFilter(choice.id)} className={filter === choice.id ? 'ql191-filter active' : 'ql191-filter'}>{choice.label}</button>
            ))}
          </div>
          <div className="ql191-queue-list" aria-label="Sample activity items">
            {visibleItems.map((item) => (
              <button type="button" className={selectedItem?.id === item.id ? 'ql191-queue-entry active' : 'ql191-queue-entry'} aria-pressed={selectedItem?.id === item.id} onClick={() => setSelectedId(item.id)} key={item.id}>
                <span>{item.channel}</span>
                <strong>{item.title}</strong>
                <small>{item.action}</small>
              </button>
            ))}
          </div>
          {selectedItem && (
            <div className="ql191-queue-detail" role="region" aria-label="Selected synthetic activity">
              <strong>{selectedItem.title}</strong>
              <p>{selectedItem.detail}</p>
              <span>No customer action is available in demonstration mode.</span>
            </div>
          )}
        </section>

        <div className="ql191-side-panels">
          <section className="ql191-panel" aria-labelledby="ql191-shortcuts-heading">
            <div className="ql191-panel-heading">
              <div><p className="ql191-eyebrow">Where to next</p><h4 id="ql191-shortcuts-heading">Workspace shortcuts</h4></div>
            </div>
            <div className="ql191-actions">
              <button type="button" onClick={() => onNavigate('inbox')}>Open inbox preview <span aria-hidden="true">›</span></button>
              <button type="button" onClick={() => onNavigate('samples')}>Review workflow examples <span aria-hidden="true">›</span></button>
              <button type="button" onClick={() => onNavigate('telephony')}>Phone/SMS safety <span aria-hidden="true">›</span></button>
              <button type="button" onClick={() => onNavigate('phone')}>Open phone desk preview <span aria-hidden="true">›</span></button>
              <button type="button" onClick={() => onNavigate('composer')}>SMS/MMS draft studio <span aria-hidden="true">›</span></button>
              <button type="button" onClick={() => onNavigate('evidence')}>Safety & hold review <span aria-hidden="true">›</span></button>
            </div>
          </section>

          <section className="ql191-panel" aria-labelledby="ql191-modules-heading">
            <div className="ql191-panel-heading">
              <div><p className="ql191-eyebrow">Company context</p><h4 id="ql191-modules-heading">Planned modules</h4></div>
            </div>
            <ul className="ql191-module-list">{organization.modules.map((module) => <li key={module}>{module}</li>)}</ul>
            {organization.tenantModel === 'multi-tenant-planned' && <p className="ql191-planned">Individual campground/company tenants will require independent verified permissions before live integration.</p>}
          </section>

          <section className="ql191-panel ql191-safety" aria-labelledby="ql191-integrations-heading">
            <div className="ql191-panel-heading"><div><p className="ql191-eyebrow">Readiness</p><h4 id="ql191-integrations-heading">Connection status</h4></div></div>
            <dl>
              <div><dt>Application connector</dt><dd>Not connected</dd></div>
              <div><dt>Calls & messaging</dt><dd>Disabled</dd></div>
              <div><dt>Live pilot prerequisites</dt><dd>12 held</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
