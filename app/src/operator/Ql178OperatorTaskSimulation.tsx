import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import { redactQl176Draft } from './ql176ConversationTimeline';
import {
  QL178_DEMO_CLOCK, getQl178BrandTasks, filterQl178Tasks, simulateQl178Task,
  type Ql178Action, type Ql178Filter, type Ql178Overlays
} from './ql178OperatorTasks';
import './ql178-operator-tasks.css';

const filters: ReadonlyArray<{ value: Ql178Filter; label: string }> = [
  { value: 'all', label: 'All sample tasks' }, { value: 'overdue', label: 'Overdue (demo)' },
  { value: 'due_soon', label: 'Due soon (demo)' }, { value: 'later', label: 'Later (demo)' },
  { value: 'unscheduled', label: 'No due time' }, { value: 'waiting', label: 'Waiting on information' },
  { value: 'blocked', label: 'Blocked / no authorization' }, { value: 'escalated', label: 'Escalation review' }
];
const assignments = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'brand_demo_operator', label: 'Brand sample operator' },
  { value: 'brand_demo_reviewer', label: 'Brand sample reviewer' }
] as const;
const priorities = [
  { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }
] as const;
const dueWindows = [
  { value: 'unscheduled', label: 'Unscheduled' },
  { value: 'past_demo_shift', label: 'Past demo shift — overdue' },
  { value: 'next_demo_shift', label: 'Next demo shift — due soon' },
  { value: 'later_demo_shift', label: 'Later demo shift — two days' }
] as const;
const states = [
  { value: 'open', label: 'Open · internal sample' },
  { value: 'waiting_on_information', label: 'Waiting for sample information' },
  { value: 'blocked_authorization', label: 'Blocked · authorization absent' },
  { value: 'escalation_review', label: 'Escalation review · demo supervisor only' }
] as const;
const eventLabels: Record<Ql178Action, string> = {
  assignment: 'Demo assignment', priority: 'Priority', due: 'Due-time scenario', state: 'Waiting / escalation state', note: 'Internal handoff note'
};

export function Ql178OperatorTaskSimulation({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const [overlays, setOverlays] = useState<Ql178Overlays>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Ql178Filter>('all');
  const [feedback, setFeedback] = useState('Task assignments, due windows and review notes are simulated in this screen only.');
  const rows = useMemo(() => getQl178BrandTasks(migration, brandId, overlays), [migration, brandId, overlays]);
  const visible = useMemo(() => filterQl178Tasks(rows, filter), [rows, filter]);
  const selected = visible.find(row => row.id === selectedId) ?? visible[0] ?? null;

  useEffect(() => {
    setOverlays({});
    setSelectedId(null);
    setFilter('all');
    setFeedback('Brand changed. All screen-only task edits and mock escalations were discarded.');
  }, [brandId]);

  function change(operation: Ql178Action, value: string) {
    if (!selected) return;
    setOverlays(previous => simulateQl178Task(migration, brandId, previous, selected.id, operation, value));
    setFeedback(`Changed ${eventLabels[operation].toLowerCase()} for one synthetic task only. No reminder, real assignment, owner decision or customer contact occurred.`);
  }

  function reset() {
    if (!selected) return;
    setOverlays(previous => simulateQl178Task(migration, brandId, previous, selected.id, 'reset'));
    setFeedback('Mock task journey reset. The original checked-in synthetic task or suggested task was not modified.');
  }

  return (
    <section className="ql178-preview" aria-label="QL-178 synthetic operator task and follow-up simulation">
      <header className="ql178-heading">
        <div>
          <p className="ql178-eyebrow">QL-178 · operator task laboratory</p>
          <h3>Operator tasks & follow-up simulation</h3>
          <p>Practice assignment, prioritization, due/overdue triage, waiting and internal escalation against pinned two-brand sample tasks.</p>
        </div>
        <strong className="ql178-lock">DISABLED PREVIEW · NO REMINDERS</strong>
      </header>
      <p role="note" className="ql178-warning">Demo clock: {QL178_DEMO_CLOCK}. Due and overdue markers are training examples, not real deadlines. Do not enter private customer data. No messages, live follow-ups, owner approvals, actual task completion, hold release, browser storage or Supabase writes.</p>
      {!migration.verified && <p role="alert" className="ql178-error">Unverified fixture source: task simulation is blocked.</p>}
      <div className="ql178-grid">
        <section className="ql178-list" aria-label="Brand-specific simulated task list">
          <h4>{brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'} follow-ups</h4>
          <p>{rows.length} verified synthetic conversations · {rows.filter(row => row.source === 'CANONICAL_OPEN_TASK').length} pinned open task</p>
          <label htmlFor="ql178-filter">Task queue filter</label>
          <select id="ql178-filter" value={filter} onChange={event => { setFilter(event.target.value as Ql178Filter); setSelectedId(null); }}>
            {filters.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <p role="status" className="ql178-list-count">{visible.length} matching demo tasks</p>
          {visible.length === 0 && <p>No synthetic tasks match this view.</p>}
          {visible.map(row => (
            <button key={row.id} type="button" aria-pressed={selected?.id === row.id}
              className={selected?.id === row.id ? 'ql178-task active' : 'ql178-task'}
              onClick={() => { setSelectedId(row.id); setFeedback('Selected a brand-scoped synthetic follow-up task.'); }}>
              <strong>{row.taskTitle}</strong>
              <span>{row.priority} priority · {row.dueClass.replaceAll('_', ' ')} · {row.state.replaceAll('_', ' ')}</span>
              <small>{row.source === 'CANONICAL_OPEN_TASK' ? 'Pinned source task' : 'Derived task suggestion · not created'}</small>
            </button>
          ))}
        </section>
        <section className="ql178-detail" aria-label="Local-only task controls and replay history">
          {selected ? (
            <>
              <p className="ql178-eyebrow">Pinned source · {selected.sourceLabel}</p>
              <h4>{selected.taskTitle}</h4>
              <p>{selected.contactLabel} · {selected.subject}</p>
              <dl className="ql178-links">
                <div><dt>Conversation</dt><dd>{selected.conversationId}</dd></div>
                <div><dt>QL-177 mock handoff</dt><dd>{selected.mockHandoffId}</dd></div>
                <div><dt>Canonical task / intake</dt><dd>{selected.sourceTaskId ?? 'No canonical task created'} · {selected.linkedIntakeId ?? 'No canonical intake'}</dd></div>
              </dl>
              <div className="ql178-controls" role="group" aria-label="Simulated assignment and follow-up edits">
                <div>
                  <label htmlFor="ql178-assignment">Demo operator assignment</label>
                  <select id="ql178-assignment" value={selected.assignedTo} onChange={event => change('assignment', event.target.value)}>
                    {assignments.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ql178-priority">Priority</label>
                  <select id="ql178-priority" value={selected.priority} onChange={event => change('priority', event.target.value)}>
                    {priorities.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ql178-due">Simulated due-time scenario</label>
                  <select id="ql178-due" value={selected.dueWindow} onChange={event => change('due', event.target.value)}>
                    {dueWindows.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ql178-state">Internal waiting / escalation</label>
                  <select id="ql178-state" value={selected.state} onChange={event => change('state', event.target.value)}>
                    {states.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              </div>
              <p className={selected.dueClass === 'overdue' ? 'ql178-due overdue' : 'ql178-due'} role="note">
                {selected.dueClass.replaceAll('_', ' ').toUpperCase()} · {selected.dueAt ?? 'No demo due date'} · no automated notification
              </p>
              {selected.state === 'blocked_authorization' && <p className="ql178-hold" role="note">Authorization is absent. This simulated task cannot release a real owner hold or record approval.</p>}
              {selected.state === 'escalation_review' && <p className="ql178-hold" role="note">Demo supervisor review only. No person has been notified; this is not an actual escalation or owner decision.</p>}
              <label htmlFor="ql178-note" className="ql178-note-label">Synthetic internal handoff note (private details prohibited)</label>
              <textarea id="ql178-note" rows={3} maxLength={800} value={selected.note}
                placeholder="Example: Verify sample details before follow-up review."
                onChange={event => change('note', redactQl176Draft(event.target.value))} />
              <div className="ql178-actions"><button type="button" onClick={reset}>Reset mock task journey</button></div>
              <p role="status" aria-live="polite" className="ql178-feedback">{feedback}</p>
              <section className="ql178-replay" aria-label="Replayable simulated task event history">
                <h5>In-memory event replay ({selected.history.length})</h5>
                {selected.history.length === 0 ? <p>No local events staged. Original synthetic task is untouched.</p> : (
                  <ol>{selected.history.map(event => (
                    <li key={event.sequence}><strong>{event.sequence}. {eventLabels[event.field]}</strong>
                      <span>{event.field === 'note' ? 'Redacted text revised · content not repeated in the event list' : event.value.replaceAll('_', ' ')}</span>
                      <small>SIMULATED ONLY · screen memory · no audit/approval receipt</small>
                    </li>
                  ))}</ol>
                )}
              </section>
              <strong className="ql178-denials">NO REMINDERS · NO CUSTOMER SEND · NO TASK COMPLETION · NO OWNER APPROVAL · NO HOLD CLOSURE</strong>
            </>
          ) : <p>No matching verified task is selected; no action is possible.</p>}
        </section>
      </div>
    </section>
  );
}
