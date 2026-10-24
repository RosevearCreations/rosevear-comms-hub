import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { assessQl183Rehearsal, QL183_MODES, QL183_TASKS, QL183_VERSION,
  type Ql183Feedback, type Ql183Mode } from './ql183OperatorUsabilityAcceptance';
import './ql183-operator-usability.css';

const outcomes: ReadonlyArray<{ value: Ql183Feedback; label: string }> = [
  { value: 'NOT_TESTED', label: 'Not tested' },
  { value: 'SELF_REPORTED_USABLE', label: 'Usable in my rehearsal' },
  { value: 'NEEDS_IMPROVEMENT', label: 'Needs improvement' }
];

/** All input is predefined, temporary and scoped to the mounted business. */
export function Ql183OperatorUsabilityPreview({ brandId }: { brandId: BrandId }) {
  const [mode, setMode] = useState<Ql183Mode>('keyboard');
  const [feedback, setFeedback] = useState<Record<string, Ql183Feedback>>({});
  const assessment = useMemo(() => assessQl183Rehearsal(brandId, feedback), [brandId, feedback]);
  const tasks = QL183_TASKS.filter(task => task.mode === mode);
  const activeMode = QL183_MODES.find(entry => entry.id === mode)!;

  return (
    <section className="ql183-usability" aria-labelledby="ql183-heading">
      <header className="ql183-header">
        <div>
          <p className="ql183-kicker">QL-183 · {QL183_VERSION}</p>
          <h3 id="ql183-heading">Operator usability acceptance rehearsal</h3>
          <p>Guided keyboard, screen-reader and mobile checks for {brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}.</p>
        </div>
        <strong className="ql183-hold">SYNTHETIC TRAINING · LIVE PILOT HELD</strong>
      </header>
      <p className="ql183-safety" role="note">
        This is an operator <strong>self-report</strong>, not an automated accessibility audit or independent certification.
        Use only synthetic examples. Nothing is saved, exported, sent, approved or shared with a provider.
        Switch brands to start a separate in-memory rehearsal.
      </p>

      <div className="ql183-summary" role="status" aria-live="polite" aria-atomic="true">
        <strong>{assessment.disposition.replaceAll('_', ' ')}</strong>
        <span>{assessment.usable} usable · {assessment.needsImprovement} needs improvement · {assessment.notTested} not tested / {assessment.total} tasks</span>
        <span>Independent review: NOT VERIFIED · Live-pilot prerequisites: 12 HELD</span>
      </div>

      <div className="ql183-mode-picker">
        <label htmlFor="ql183-mode">Rehearsal mode</label>
        <select id="ql183-mode" value={mode} onChange={event => setMode(event.target.value as Ql183Mode)}>
          {QL183_MODES.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select>
        <p>{activeMode.instruction}</p>
      </div>

      <ol className="ql183-tasks" aria-label={`${activeMode.label} checks`}>
        {tasks.map(task => (
          <li key={task.id}>
            <h4>{task.title}</h4>
            <p className="ql183-workspace">Where: {task.workspace}</p>
            <p><strong>Try:</strong> {task.action}</p>
            <p><strong>Expected:</strong> {task.expected}</p>
            <fieldset>
              <legend>Result of your rehearsal for {task.title}</legend>
              {outcomes.map(entry => (
                <label key={entry.value}>
                  <input type="radio" name={`ql183-${task.id}`} value={entry.value}
                    checked={(feedback[task.id] ?? 'NOT_TESTED') === entry.value}
                    onChange={() => setFeedback(current => ({ ...current, [task.id]: entry.value }))} />
                  <span>{entry.label}</span>
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>

      {assessment.flaggedTaskIds.length > 0 && (
        <div className="ql183-followup" aria-label="Rehearsal items needing improvement">
          <strong>Follow-up needed (temporary, no identifying details)</strong>
          <ul>{QL183_TASKS.filter(task => assessment.flaggedTaskIds.includes(task.id)).map(task => (
            <li key={task.id}>{task.title} · {task.issueCategory}</li>
          ))}</ul>
        </div>
      )}
      <div className="ql183-actions">
        <button type="button" onClick={() => { setFeedback({}); setMode('keyboard'); }}>Clear this rehearsal</button>
        <p>No customer records · 0 calls · 0 SMS · 0 external writes · 0 owner approvals.</p>
      </div>
    </section>
  );
}
