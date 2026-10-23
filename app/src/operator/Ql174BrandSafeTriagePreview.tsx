import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  QL174_DEFAULT_FILTERS, QL174_QUEUE_ORDER,
  countQl174Queues, filterQl174Rows, getQl174BrandRows, simulateQl174Triage,
  type Ql174Assignment, type Ql174Filters, type Ql174Queue, type Ql174Simulations, type Ql174WorkQueue
} from './ql174BrandSafeTriage';
import './ql174-brand-safe-triage.css';

const labels: Record<Ql174Queue, string> = {
  all: 'All', new: 'New', needs_reply: 'Needs reply', awaiting_customer: 'Awaiting customer', quote: 'Quotes', follow_up: 'Follow-up'
};

export function Ql174BrandSafeTriagePreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const [simulations, setSimulations] = useState<Ql174Simulations>({});
  const [filters, setFilters] = useState<Ql174Filters>(QL174_DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nextQueue, setNextQueue] = useState<Ql174WorkQueue>('needs_reply');
  const [nextAssignment, setNextAssignment] = useState<Ql174Assignment>('unassigned');
  const [announcement, setAnnouncement] = useState('All triage actions are local, simulated and unsaved.');

  const rows = useMemo(() => getQl174BrandRows(migration, brandId, simulations), [migration, brandId, simulations]);
  const visibleRows = useMemo(() => filterQl174Rows(rows, filters), [rows, filters]);
  const queueCounts = useMemo(() => countQl174Queues(rows), [rows]);
  const selected = visibleRows.find(row => row.id === selectedId) ?? visibleRows[0];

  useEffect(() => {
    if (!selected) return;
    setNextQueue(selected.queue);
    setNextAssignment(selected.assignedTo);
  }, [selected?.id, selected?.queue, selected?.assignedTo]);

  // Switching businesses cannot bring a previously selected conversation or
  // uncommitted selector value across the brand boundary.
  useEffect(() => {
    setSelectedId(null);
    setFilters(QL174_DEFAULT_FILTERS);
    setAnnouncement('Brand changed. Synthetic triage is scoped to the selected business only.');
  }, [brandId]);

  function applySimulation() {
    if (!selected) return;
    const next = simulateQl174Triage(migration, brandId, simulations, selected.id, nextQueue, nextAssignment);
    if (next === simulations) {
      setAnnouncement('Simulation blocked by brand, fixture or transition guard.');
      return;
    }
    setSimulations(next);
    setAnnouncement(`Simulated only: ${selected.subject} moved to ${labels[nextQueue]}; operator ${nextAssignment === 'unassigned' ? 'unassigned' : 'assigned to this brand’s demo operator'}. Nothing was sent or saved.`);
  }

  function changeFilter<K extends keyof Ql174Filters>(field: K, value: Ql174Filters[K]) {
    setFilters(current => ({ ...current, [field]: value }));
    setSelectedId(null);
  }

  return (
    <section className="ql174-preview" aria-label="QL-174 brand-safe synthetic inbox triage">
      <div className="ql174-intro">
        <div>
          <p className="ql174-eyebrow">QL-174 · synthetic operator triage</p>
          <h3>Brand-safe inbox and follow-up</h3>
          <p>Read-only QL-173 fixtures, six preview conversations across both brands. Queue moves and assignments are temporary screen simulations.</p>
        </div>
        <strong className="ql174-lock">DISABLED PREVIEW · UNSENT</strong>
      </div>
      <p className="ql174-warning" role="note">
        No phone calls, SMS, email delivery, provider events, real owner approvals, hold closure, or database/browser writes. Switching brands filters the fixture source; it does not grant new access.
      </p>
      {!migration.verified && (
        <p className="ql174-blocked" role="alert">Fixture provenance validation failed. All synthetic triage records are blocked pending reviewed rebuild.</p>
      )}
      <div className="ql174-queues" role="group" aria-label="Synthetic queue filters">
        {QL174_QUEUE_ORDER.map(queue => (
          <button
            key={queue}
            type="button"
            className={filters.queue === queue ? 'ql174-queue active' : 'ql174-queue'}
            aria-pressed={filters.queue === queue}
            onClick={() => changeFilter('queue', queue)}
          >
            <span>{labels[queue]}</span>
            <strong>{queueCounts[queue]}</strong>
          </button>
        ))}
      </div>
      <div className="ql174-filter-bar">
        <label>
          Search synthetic conversations
          <input type="search" value={filters.query} maxLength={100} placeholder="Subject, tag or sample contact" onChange={event => changeFilter('query', event.target.value)} />
        </label>
        <label>
          Priority
          <select value={filters.priority} onChange={event => changeFilter('priority', event.target.value as Ql174Filters['priority'])}>
            <option value="all">All priorities</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
          </select>
        </label>
        <label>
          Assigned operator
          <select value={filters.assignment} onChange={event => changeFilter('assignment', event.target.value as Ql174Filters['assignment'])}>
            <option value="all">All assignments</option><option value="unassigned">Unassigned</option><option value="brand_demo_operator">Brand demo operator</option>
          </select>
        </label>
        <label>
          Sort
          <select value={filters.sort} onChange={event => changeFilter('sort', event.target.value as Ql174Filters['sort'])}>
            <option value="recent">Most recent</option><option value="priority">Highest priority</option>
          </select>
        </label>
      </div>
      <div className="ql174-grid">
        <section className="ql174-list" aria-label="Filtered synthetic conversations">
          <p className="ql174-list-count" role="status">{visibleRows.length} of {rows.length} synthetic conversations for {brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}</p>
          {visibleRows.length === 0 && <p className="ql174-empty">No synthetic records match. Try All or clear the search and filters.</p>}
          {visibleRows.map(row => (
            <button
              className={selected?.id === row.id ? 'ql174-item selected' : 'ql174-item'}
              type="button"
              aria-pressed={selected?.id === row.id}
              onClick={() => setSelectedId(row.id)}
              key={row.id}
            >
              <span className="ql174-item-top"><strong>{row.subject}</strong><small>{row.priority.toUpperCase()}</small></span>
              <span>{row.contactLabel}</span>
              <span className="ql174-item-meta">{labels[row.queue]} · {row.operatorLabel}</span>
              {row.hasFollowUp && <span className="ql174-follow-up">Synthetic follow-up</span>}
            </button>
          ))}
        </section>
        <section className="ql174-detail" aria-label="Selected synthetic conversation and simulated triage">
          {selected ? (
            <>
              <p className="ql174-eyebrow">Selected synthetic conversation · {selected.channel.replaceAll('_', ' ')}</p>
              <h4>{selected.subject}</h4>
              <p>{selected.summary}</p>
              <dl className="ql174-facts">
                <div><dt>Current queue</dt><dd>{labels[selected.queue]}</dd></div>
                <div><dt>Priority</dt><dd>{selected.priority}</dd></div>
                <div><dt>Operator</dt><dd>{selected.operatorLabel}</dd></div>
                <div><dt>Draft</dt><dd>{selected.draftState === 'UNSENT_SIMULATED' ? 'UNSENT / SIMULATED' : 'No draft'}</dd></div>
                <div><dt>Fixture</dt><dd>{selected.provenanceLabel}</dd></div>
              </dl>
              <div className="ql174-simulate">
                <h5>Preview-only triage change</h5>
                <label>
                  Move to synthetic queue
                  <select aria-label="Simulated destination queue" value={nextQueue} onChange={event => setNextQueue(event.target.value as Ql174WorkQueue)}>
                    {QL174_QUEUE_ORDER.filter(queue => queue !== 'all').map(queue => <option value={queue} key={queue}>{labels[queue]}</option>)}
                  </select>
                </label>
                <label>
                  Simulated assignment
                  <select aria-label="Simulated operator assignment" value={nextAssignment} onChange={event => setNextAssignment(event.target.value as Ql174Assignment)}>
                    <option value="unassigned">Unassigned</option>
                    <option value="brand_demo_operator">{brandId === 'rosiedazzlers' ? 'Rosie demo operator' : 'Devil n Dove demo operator'}</option>
                  </select>
                </label>
                <button type="button" className="ql174-apply" onClick={applySimulation}>Apply simulated triage</button>
              </div>
            </>
          ) : (
            <p className="ql174-empty">Select a matching synthetic conversation. Nothing is sent or persisted.</p>
          )}
        </section>
      </div>
      <div className="ql174-footer">
        <p role="status" aria-live="polite">{announcement}</p>
        <button type="button" onClick={() => { setSimulations({}); setAnnouncement('Preview changes reset. Canonical fixtures remain unchanged.'); }}>Reset simulated changes</button>
      </div>
    </section>
  );
}
