import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { inboxForOrganization } from './ql192InboxFixtures';
import { customerForThread } from './ql193CustomerContexts';
import { applyQueueAction, handoffStepLabels, rosterForOrganization, sortedQueueTasks, taskVersion, type MockHandoffStep, type MockQueueAction, type MockQueueState } from './ql194WorkQueue';
import { ql294LaneCounts, ql294Lanes, ql294MatchesLane, ql294Shortcut, ql294ShortcutHelp, type Ql294Lane } from './ql294OperatorWorklist';
import './ql194-follow-up-queue.css';

type QueueFilter = 'all' | 'attention' | 'unassigned' | 'done';
const queueFilters: readonly { id: QueueFilter; label: string }[] = [
  { id: 'all', label: 'All follow-ups' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'done', label: 'Done' }
];
const dueLabels = { overdue: 'Overdue example', today: 'Today example', soon: 'Coming up', later: 'Later' } as const;

export function Ql194FollowUpQueue({ organization, queue, setQueue, initialThreadId, onOpenThread, onOpenContact }: {
  organization: OperatorOrganization;
  queue: MockQueueState;
  setQueue: Dispatch<SetStateAction<MockQueueState>>;
  initialThreadId?: string | null;
  onOpenThread: (threadId: string) => void;
  onOpenContact: (contactId: string) => void;
}) {
  const tasks = queue.organizationId === organization.id ? queue.tasks : [];
  const roster = rosterForOrganization(organization.id);
  const threadById = new Map(inboxForOrganization(organization.id).map((thread) => [thread.id, thread]));
  const initialTaskId = tasks.find((task) => task.threadId === initialThreadId)?.id;
  const [selectedId, setSelectedId] = useState(initialTaskId ?? tasks[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showHelp, setShowHelp] = useState(false);
  const [lane, setLane] = useState<Ql294Lane>('all');
  const [handoffRecipient, setHandoffRecipient] = useState(roster[0]?.id ?? '');
  const [handoffStep, setHandoffStep] = useState<MockHandoffStep>('verify-context');
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const counts = ql294LaneCounts(queue, ownerFilter);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const action = ql294Shortcut(event);
      if (action === 'search') { event.preventDefault(); searchRef.current?.focus(); }
      if (action === 'selection') { event.preventDefault(); listRef.current?.querySelector<HTMLButtonElement>('button.ql194-task')?.focus(); }
      if (action === 'help') { event.preventDefault(); setShowHelp((previous) => !previous); }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const filtered = useMemo(() => sortedQueueTasks(tasks.filter((task) => {
    const thread = threadById.get(task.threadId);
    const name = roster.find((member) => member.id === task.ownerId)?.label ?? 'Unassigned';
    const text = [task.title, thread?.subject, thread?.contactLabel, thread?.channel, name].join(' ').toLocaleLowerCase();
    return text.includes(search.trim().toLocaleLowerCase()) && ql294MatchesLane(task, lane, ownerFilter) && (ownerFilter === 'all' || (ownerFilter === 'unassigned' ? task.ownerId === null : task.ownerId === ownerFilter)) && (
      filter === 'all' ||
      (filter === 'attention' && task.status !== 'done' && (task.due === 'overdue' || task.due === 'today' || task.priority === 'high')) ||
      (filter === 'unassigned' && task.ownerId === null && task.status !== 'done') ||
      (filter === 'done' && task.status === 'done')
    );
  })), [tasks, threadById, roster, search, filter, ownerFilter, lane]);
  const selected = filtered.find((task) => task.id === selectedId) ?? filtered[0];
  const source = selected ? threadById.get(selected.threadId) : undefined;
  const customer = source ? customerForThread(organization.id, source.id) : undefined;
  const jumpSource = initialThreadId ? threadById.get(initialThreadId) : undefined;
  const existingJumpTask = jumpSource && tasks.find((task) => task.threadId === jumpSource.id);
  const handoff = selected && queue.handoffs.find((entry) => entry.organizationId === organization.id && entry.taskId === selected.id);
  const handoffStale = Boolean(handoff && selected && handoff.taskVersion !== taskVersion(selected));
  const metrics = {
    open: tasks.filter((task) => task.status !== 'done').length,
    unassigned: tasks.filter((task) => task.status !== 'done' && task.ownerId === null).length,
    due: tasks.filter((task) => task.status !== 'done' && (task.due === 'overdue' || task.due === 'today')).length,
    done: tasks.filter((task) => task.status === 'done').length
  };

  function dispatch(action: MockQueueAction) {
    setQueue((previous) => applyQueueAction(organization.id, previous, action));
  }

  function createFromJump(threadId: string) {
    if (tasks.some((task) => task.threadId === threadId)) return;
    const newId = `${organization.id}-followup-${queue.nextTask}`;
    dispatch({ kind: 'create', threadId });
    setSearch('');
    setFilter('all');
    setOwnerFilter('all');
    setSelectedId(newId);
  }

  return (
    <section className="ql194-queue" data-ql194-release="ql194-assignment-follow-up-queue-v1" data-organization={organization.id} aria-labelledby="ql194-heading">
      <header className="ql194-header">
        <div>
          <p className="ql191-eyebrow">QL-194 · Operator work queue</p>
          <h3 id="ql194-heading">{organization.name} · Assignments & follow-ups</h3>
          <p>Practice routing conversation work to a fictional team, without contacting customers.</p>
        </div>
        <button type="button" className="ql191-help-button" aria-expanded={showHelp} aria-controls="ql194-help" aria-label="Help with assignments and follow-ups" onClick={() => setShowHelp((previous) => !previous)}>ⓘ Help</button>
      </header>
      {showHelp && <div id="ql194-help" className="ql194-help" role="region" aria-label="Assignment worklist help and keyboard shortcuts"><p>Choose an example task to set its demonstration owner, status, priority or due window. Open the linked inbox or Customer 360 for source context. The due windows are examples—not actual dates, timers or service guarantees. Waiting means a simulated blocked handoff. Prepare a structured, unsent handoff preview, then refresh it if task details change. Changes survive navigating inside this company during this session, but reset on company switch or page reload. These receipts are not real audit records.</p><h4>⌨ Assignment shortcuts</h4><p>Use these outside all editable fields. Standard Tab, Shift + Tab, Enter and Space are always available.</p><dl className="ql294-shortcuts">{ql294ShortcutHelp.map((item) => <div key={item.keys}><dt><kbd>{item.keys}</kbd></dt><dd>{item.action}</dd></div>)}</dl></div>}
      <p className="ql191-synthetic-banner" role="note">DISABLED SYNTHETIC WORK QUEUE — fictional operators, due windows, tasks and receipts. No real staff assignments, dispatch, task notifications, CRM/tenant records, API requests or server/browser storage writes. No live permissions or customer contact are authorized.</p>

      <div className="ql194-stats" aria-label="Mock queue metrics">
        <div><strong>{metrics.open}</strong><span>Active examples</span></div>
        <div><strong>{metrics.unassigned}</strong><span>Unassigned</span></div>
        <div><strong>{metrics.due}</strong><span>Due now / overdue demo</span></div>
        <div><strong>{metrics.done}</strong><span>Completed in demo</span></div>
      </div>

      {jumpSource && <div className="ql194-jump" role="status">
        <div><strong>From unified conversation:</strong> {jumpSource.subject}</div>
        {existingJumpTask ? <p>Existing sample follow-up: {existingJumpTask.title}</p> : <button type="button" onClick={() => createFromJump(jumpSource.id)}>Create demo follow-up for this conversation</button>}
      </div>}

      <section className="ql294-worklists" aria-label="Assignment worklist lanes" data-ql294-release="ql294-assignment-handoff-shortcuts-v1">
        <div className="ql294-worklist-heading"><div><p className="ql191-eyebrow">QL-294 · Guided operator worklists</p><h4>Ownership, urgency &amp; blocked handoffs</h4></div><span>Illustrative due windows only · no reminders</span></div>
        <div className="ql294-lanes" role="group" aria-label="Choose a worklist lane">
          {ql294Lanes.map((item) => <button key={item.id} type="button" aria-pressed={lane === item.id} title={item.description} onClick={() => { setLane(item.id); setFilter('all'); setSearch(''); setOwnerFilter((previous) => item.id === 'mine' ? (previous === 'all' || previous === 'unassigned' ? roster[0]?.id ?? 'all' : previous) : 'all'); }}><strong>{counts[item.id]}</strong><span>{item.label}</span></button>)}
        </div>
        {lane === 'mine' && <p className="ql294-lane-hint" role="status">Selected owner worklist: {roster.find((member) => member.id === ownerFilter)?.label ?? 'Choose a fictional owner below'}.</p>}
      </section>

      <div className="ql194-layout">
        <section className="ql194-directory" aria-label="Follow-up queue filters and items">
          <label htmlFor="ql194-search">Search assignments</label>
          <input ref={searchRef} id="ql194-search" type="search" autoComplete="off" value={search} placeholder="Topic, contact or fictional owner" onChange={(event) => setSearch(event.target.value)} />
          <label htmlFor="ql194-owner-filter">Owner filter</label>
          <select id="ql194-owner-filter" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">All sample owners</option>
            <option value="unassigned">Unassigned</option>
            {roster.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
          </select>
          <div className="ql194-filters" role="group" aria-label="Follow-up status filters">
            {queueFilters.map((entry) => <button key={entry.id} type="button" aria-pressed={filter === entry.id} className={filter === entry.id ? 'active' : ''} onClick={() => setFilter(entry.id)}>{entry.label}</button>)}
          </div>
          <p className="ql194-count" role="status">{filtered.length} of {tasks.length} fictional assignments</p>
          {filtered.length ? <div className="ql194-task-list" ref={listRef}>
            {filtered.map((task) => <button type="button" key={task.id} className={selected?.id === task.id ? 'ql194-task active' : 'ql194-task'} aria-pressed={selected?.id === task.id} onClick={() => setSelectedId(task.id)}>
              <span className="ql194-task-flags"><span>{dueLabels[task.due]}</span><span>{task.priority === 'high' ? 'High priority' : 'Normal'}</span></span>
              <strong>{task.title}</strong>
              <small>{roster.find((person) => person.id === task.ownerId)?.label ?? 'Unassigned'} · {task.status === 'waiting' ? 'Waiting / blocked' : task.status}</small>
              <small>{threadById.get(task.threadId)?.channel.toUpperCase()} source · fictional</small>
            </button>)}
          </div> : <div className="ql194-empty"><p>No sample follow-ups match the filters.</p><button type="button" onClick={() => { setSearch(''); setOwnerFilter('all'); setFilter('all'); setLane('all'); }}>Clear queue filters</button></div>}
        </section>

        <section className="ql194-details" aria-label="Selected follow-up details">
          {selected && source ? <>
            <p className="ql191-eyebrow">Selected sample assignment · not a live work order</p>
            <h4>{selected.title}</h4>
            <p>{source.contactLabel} · {source.sourceLabel}</p>
            <div className="ql194-source-context"><strong>Source:</strong> {source.subject} · {source.summary}</div>
            <div className="ql194-controls">
              <div><label htmlFor="ql194-assignee">Fictional owner</label><select id="ql194-assignee" value={selected.ownerId ?? ''} onChange={(event) => dispatch({ kind: 'assign', taskId: selected.id, ownerId: event.target.value || null })}>
                <option value="">Unassigned</option>{roster.map((person) => <option key={person.id} value={person.id}>{person.label} · {person.role}</option>)}
              </select></div>
              <div><label htmlFor="ql194-status">Sample status</label><select id="ql194-status" value={selected.status} onChange={(event) => dispatch({ kind: 'status', taskId: selected.id, status: event.target.value as typeof selected.status })}>
                <option value="open">Open</option><option value="waiting">Waiting</option><option value="done">Done</option>
              </select></div>
              <div><label htmlFor="ql194-due">Illustrative due window</label><select id="ql194-due" value={selected.due} onChange={(event) => dispatch({ kind: 'due', taskId: selected.id, due: event.target.value as typeof selected.due })}>
                {Object.entries(dueLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></div>
              <div><label htmlFor="ql194-priority">Priority</label><select id="ql194-priority" value={selected.priority} onChange={(event) => dispatch({ kind: 'priority', taskId: selected.id, priority: event.target.value as typeof selected.priority })}>
                <option value="normal">Normal</option><option value="high">High</option>
              </select></div>
            </div>
            <div className="ql194-navigation">
              <button type="button" onClick={() => onOpenThread(source.id)}>Open source in unified inbox</button>
              {customer ? <button type="button" onClick={() => onOpenContact(customer.id)}>Open linked Customer 360</button> : <span>Internal-only source: no customer profile inferred.</span>}
            </div>
            <section className="ql294-handoff" aria-labelledby="ql294-handoff-title">
              <div className="ql294-worklist-heading"><div><p className="ql191-eyebrow">Structured, role-safe demo summary</p><h5 id="ql294-handoff-title">Operator handoff preview</h5></div><span>UNSENT · local session</span></div>
              <p>Choose a fictional colleague and an approved next step. The preview uses only this company’s fictional task and channel labels—no free-text notes or real staff notification.</p>
              <div className="ql294-handoff-controls"><div><label htmlFor="ql294-handoff-recipient">Fictional handoff recipient</label><select id="ql294-handoff-recipient" value={handoffRecipient} onChange={(event) => setHandoffRecipient(event.target.value)}>{roster.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}</select></div><div><label htmlFor="ql294-handoff-step">Suggested next action</label><select id="ql294-handoff-step" value={handoffStep} onChange={(event) => setHandoffStep(event.target.value as MockHandoffStep)}>{Object.entries(handoffStepLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
              <button className="ql294-prepare" type="button" disabled={selected.status === 'done'} onClick={() => dispatch({ kind: 'handoff', taskId: selected.id, recipientId: handoffRecipient, nextStep: handoffStep })}>Prepare unsent handoff summary</button>
              {selected.status === 'done' && <p>Reopen this demonstration item before preparing a new handoff.</p>}
              {handoff && <div className={handoffStale ? 'ql294-preview stale' : 'ql294-preview'} role="status" aria-live="polite"><strong>{handoffStale ? 'OUTDATED · Refresh this preview' : 'UNSENT · Current handoff preview'}</strong><p>{handoff.summary}</p><small>{handoffStale ? 'Assignment details changed after the preview was prepared. Do not rely on this outdated summary.' : 'Locally prepared only. No receipt of delivery, staff action or approval.'}</small></div>}
            </section>
            <div className="ql194-receipts">
              <h5>Session-only change receipts</h5>
              {queue.receipts.filter((receipt) => receipt.taskId === selected.id).length ? <ol>{queue.receipts.filter((receipt) => receipt.taskId === selected.id).map((receipt) => <li key={receipt.id}>Demo action {receipt.sequence}: {receipt.description}</li>)}</ol> : <p>Nothing changed in this demonstration session.</p>}
              <small>Not an authorization, a signed audit trail, or an external notification.</small>
            </div>
            <div className="ql194-disabled"><button type="button" disabled>Notify owner disabled</button><button type="button" disabled>Dispatch job disabled</button><button type="button" disabled>Send reply disabled</button></div>
          </> : <p className="ql194-empty">Choose a visible sample assignment or clear the filters.</p>}
        </section>
      </div>
    </section>
  );
}
