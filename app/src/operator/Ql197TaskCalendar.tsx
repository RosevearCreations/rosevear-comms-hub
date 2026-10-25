import { useState, type Dispatch, type SetStateAction } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { applyQueueAction, rosterForOrganization, sortedQueueTasks, type MockDueWindow, type MockQueueState } from './ql194WorkQueue';
import { calendarTasksForOrganization, demoWeekDates, taskCalendarDate, toggleDemoReminder } from './ql197TaskCalendar';
import { inboxForOrganization } from './ql192InboxFixtures';
import './ql197-task-calendar.css';

type TaskFilter = 'active' | 'all' | 'done';
const dueLabels: Readonly<Record<MockDueWindow,string>> = {
  overdue: 'Overdue demo', today: 'Today demo', soon: 'Soon demo', later: 'Later demo'
};

export function Ql197TaskCalendar({ organization, queue, setQueue, reminderIds, setReminderIds, onOpenThread, onOpenQueue }: {
  organization: OperatorOrganization;
  queue: MockQueueState;
  setQueue: Dispatch<SetStateAction<MockQueueState>>;
  reminderIds: ReadonlySet<string>;
  setReminderIds: Dispatch<SetStateAction<ReadonlySet<string>>>;
  onOpenThread: (threadId: string) => void;
  onOpenQueue: (threadId: string) => void;
}) {
  const tasks = calendarTasksForOrganization(organization.id, queue);
  const [week, setWeek] = useState(0);
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [selectedId, setSelectedId] = useState(tasks[0]?.id ?? '');
  const [showHelp, setShowHelp] = useState(false);
  const sourceById = new Map(inboxForOrganization(organization.id).map((thread) => [thread.id, thread]));
  const roster = rosterForOrganization(organization.id);
  const visible = sortedQueueTasks(tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.status === 'done' : task.status !== 'done')));
  const selected = visible.find((task) => task.id === selectedId) ?? visible[0];
  const selectedSource = selected ? sourceById.get(selected.threadId) : undefined;
  const dates = demoWeekDates(week);
  const activeReminders = tasks.filter((task) => reminderIds.has(task.id) && task.status !== 'done').length;

  return <section className="ql197-calendar" data-ql197-release="ql197-tasks-reminders-calendar-v1" data-organization={organization.id} aria-labelledby="ql197-title">
    <header className="ql197-header"><div><p className="ql191-eyebrow">QL-197 · Fictional task planning</p><h3 id="ql197-title">{organization.name} · Tasks, reminders & calendar</h3><p>Review a sample weekly board backed by the same session-only QL-194 follow-up tasks.</p></div>
      <button className="ql191-help-button" type="button" aria-expanded={showHelp} aria-controls="ql197-help" aria-label="Help with tasks reminders and calendar" onClick={() => setShowHelp((open) => !open)}>ⓘ Help</button></header>
    {showHelp && <p id="ql197-help" className="ql197-help" role="note">Use the week controls to inspect three fixed fictional weeks. Select an agenda task, move its illustrative due bucket, or toggle a local reminder flag. Due changes also appear in Assignments & follow-ups until this session or company changes. No real dates, alarms, calendar invites, emails, SMS, recurring jobs or schedule synchronizations are created.</p>}
    <p className="ql191-synthetic-banner" role="note">DISABLED SYNTHETIC PLANNER — fixed sample dates, fictional operators, no real deadlines, notifications, calendar connection, customer data, staff accounts, provider calls or persistence. Reminder toggles are visual flags only.</p>
    <div className="ql197-metrics" aria-label="Illustrative task statistics">
      <div><strong>{tasks.filter((task) => task.status !== 'done').length}</strong><span>Open samples</span></div>
      <div><strong>{tasks.filter((task) => task.status !== 'done' && (task.due === 'today' || task.due === 'overdue')).length}</strong><span>Attention examples</span></div>
      <div><strong>{activeReminders}</strong><span>Local reminder flags</span></div>
      <div><strong>0</strong><span>Alerts delivered</span></div>
    </div>
    <section className="ql197-board" aria-label="Fictional calendar week board">
      <div className="ql197-board-header"><div><h4>Sample calendar week</h4><p>Fixed 2026 demonstration dates · not tied to the current day</p></div><div className="ql197-week-controls"><button type="button" disabled={week <= -1} onClick={() => setWeek((value) => value - 1)}>Previous sample week</button><button type="button" onClick={() => setWeek(0)} disabled={week === 0}>Reset week</button><button type="button" disabled={week >= 1} onClick={() => setWeek((value) => value + 1)}>Next sample week</button></div></div>
      <div className="ql197-days">{dates.map((date) => <div className="ql197-day" key={date}><strong>{new Date(`${date}T00:00:00Z`).toLocaleDateString('en-CA',{ weekday:'short',month:'short',day:'numeric',timeZone:'UTC' })}</strong>
        {tasks.filter((task) => taskCalendarDate(task) === date).map((task) => <button type="button" key={task.id} onClick={() => { setSelectedId(task.id); setFilter('all'); }}><span>{task.status === 'done' ? 'Done · ' : ''}{dueLabels[task.due]}</span><strong>{task.title}</strong></button>)}
        {!tasks.some((task) => taskCalendarDate(task) === date) && <small>No sample tasks</small>}
      </div>)}</div>
    </section>
    <div className="ql197-layout"><section className="ql197-agenda" aria-label="Task agenda and filters"><h4>Agenda</h4><div className="ql197-filters" role="group" aria-label="Task completion filters">{(['active','all','done'] as const).map((choice) => <button type="button" key={choice} aria-pressed={filter === choice} className={filter === choice ? 'active' : ''} onClick={() => setFilter(choice)}>{choice === 'active' ? 'Active' : choice === 'all' ? 'All' : 'Completed'}</button>)}</div>
      <p role="status">{visible.length} of {tasks.length} company-scoped demo tasks</p>
      {visible.map((task) => <button type="button" className={selected?.id === task.id ? 'ql197-agenda-item active' : 'ql197-agenda-item'} key={task.id} aria-pressed={selected?.id === task.id} onClick={() => setSelectedId(task.id)}><small>{dueLabels[task.due]} · {task.status} · {task.priority}</small><strong>{task.title}</strong><span>{reminderIds.has(task.id) && task.status !== 'done' ? 'Reminder flag ON · ' : ''}{roster.find((member) => member.id === task.ownerId)?.label ?? 'Unassigned'}</span></button>)}
      {!visible.length && <p>No sample tasks match this view. Try All.</p>}
    </section><section className="ql197-details" aria-label="Selected task schedule and reminder controls"><h4>Selected sample follow-up</h4>
      {selected && selectedSource ? <><h5>{selected.title}</h5><p>{selectedSource.contactLabel} · {selectedSource.subject}</p>
        <label htmlFor="ql197-due">Illustrative due bucket</label><select id="ql197-due" value={selected.due} onChange={(event) => setQueue((state) => applyQueueAction(organization.id,state,{kind:'due',taskId:selected.id,due:event.target.value as MockDueWindow}))}>{Object.entries(dueLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
        <p className="ql197-demo-date">Sample calendar placement: {taskCalendarDate(selected)} · no real due time</p>
        <button type="button" disabled={selected.status === 'done'} aria-pressed={reminderIds.has(selected.id) && selected.status !== 'done'} onClick={() => setReminderIds((previous) => toggleDemoReminder(organization.id,queue,previous,selected.id))}>{reminderIds.has(selected.id) && selected.status !== 'done' ? 'Remove local reminder flag' : 'Set local reminder flag'}</button>
        <p className="ql197-reminder-result" role="status">{reminderIds.has(selected.id) && selected.status !== 'done' ? 'Reminder example marked in this browser session. Nothing will ring or be delivered.' : 'No active local reminder flag for this task.'}</p>
        <div className="ql197-actions"><button type="button" onClick={() => onOpenQueue(selected.threadId)}>Manage in follow-up queue</button><button type="button" onClick={() => onOpenThread(selected.threadId)}>Open source conversation</button></div>
        <div className="ql197-disabled"><button type="button" disabled>Send reminder disabled</button><button type="button" disabled>Export calendar invite disabled</button><button type="button" disabled>Sync staff calendar disabled</button></div>
      </> : <p>Choose a visible sample task.</p>}
    </section></div>
  </section>;
}
