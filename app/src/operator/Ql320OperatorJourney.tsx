import { useState } from 'react';
import type { OrganizationId, OperatorWorkspace } from './ql191Organizations';
import type { Ql293SessionDrafts } from './ql293ConversationRecovery';
import type { MockQueueState } from './ql194WorkQueue';
import { ql320JourneyReadback, ql320Steps, type Ql320StateExample } from './ql320FrontEndJourney';
import './ql320-operator-journey.css';

interface Props {
  organizationId: OrganizationId;
  organizationName: string;
  workspace: OperatorWorkspace;
  queue: MockQueueState;
  drafts: Ql293SessionDrafts;
  onNavigate: (workspace: OperatorWorkspace) => void;
  onOpenThread: (threadId: string) => void;
  onOpenContact: (contactId: string) => void;
  onOpenQueue: (threadId: string) => void;
  onOpenComposer: (threadId: string) => void;
}

const stateLabels: Readonly<Record<Ql320StateExample, string>> = {
  ready: 'Fixture ready', loading: 'Loading example', empty: 'Empty example', error: 'Error example', disabled: 'Disabled example'
};

export function Ql320OperatorJourney({ organizationId, organizationName, workspace, queue, drafts, onNavigate, onOpenThread, onOpenContact, onOpenQueue, onOpenComposer }: Props) {
  const [exampleState, setExampleState] = useState<Ql320StateExample>('ready');
  const readback = ql320JourneyReadback(organizationId, queue, drafts);
  const current = ql320Steps.findIndex((step) => step.workspace === workspace);
  const visualState = readback.state === 'ready' ? exampleState : readback.state;
  const exampleLabel = readback.thread?.subject ?? 'No authorized fictional conversation';

  function openStep(target: OperatorWorkspace) {
    if (visualState !== 'ready') return;
    if (target === 'inbox' && readback.thread) onOpenThread(readback.thread.id);
    else if (target === 'contacts' && readback.customer) onOpenContact(readback.customer.id);
    else if (target === 'queue' && readback.task) onOpenQueue(readback.task.threadId);
    else onNavigate(target);
  }

  return <section className="ql320-journey" data-ql320-journey={organizationId} aria-labelledby="ql320-title">
    <div className="ql320-intro">
      <div><p className="ql320-eyebrow">QL-320 · Front-end visual journey</p><h3 id="ql320-title">Six connected operator steps</h3>
        <p>{organizationName} · Fictional sample only. Select a step to open its existing, working preview screen.</p></div>
      <strong className="ql320-preview-state">DISABLED · no provider or customer action</strong>
    </div>
    <ol className="ql320-step-grid" aria-label="Six-step operator journey">
      {ql320Steps.map((step, index) => <li key={step.workspace} data-ql320-step={step.workspace}>
        <button type="button" className="ql320-step-button" aria-current={step.workspace === workspace ? 'step' : undefined}
          disabled={visualState !== 'ready'} onClick={() => openStep(step.workspace)}>
          <span className="ql320-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span><strong>{step.title}</strong><small>{step.detail}</small></span>
          <span className="ql320-step-link" aria-hidden="true">{step.workspace === workspace ? 'Here' : 'Open'}</span>
        </button>
      </li>)}
    </ol>
    <div className="ql320-state-area" aria-label="Local recovery and interface states">
      <div className="ql320-state-header">
        <div><strong>Source-backed example</strong><p>One isolated company · no network request, real customer, or provider receipt.</p></div>
        <span className={`ql320-state-chip ql320-state-${visualState}`} role="status">
          {visualState === 'ready' ? 'LOCAL FIXTURE READY' : visualState === 'error' && readback.state === 'error' ? 'SCOPE ERROR · BLOCKED' : stateLabels[visualState].toUpperCase()}
        </span>
      </div>
      {visualState === 'ready' && <div className="ql320-sample-readback">
        <p><strong>Conversation:</strong> {exampleLabel}</p>
        <p><strong>Contact:</strong> {readback.customer?.label ?? 'No linked contact · review only'}</p>
        <p><strong>Consent:</strong> {readback.thread?.consent ?? 'unknown'} · never authorizes real delivery.</p>
        <p><strong>Handoff:</strong> {readback.task ? `${readback.task.title} · ${readback.task.status.toUpperCase()} · simulated` : 'No linked task · prepare one inside the company workboard.'}</p>
        <p><strong>Unsent work:</strong> {readback.draft ? 'A redacted, unsent browser-session draft can be resumed.' : 'No recoverable draft in this company’s current browser session.'}</p>
        <div className="ql320-actions">
          {readback.draft && <button type="button" onClick={() => onOpenComposer(readback.draft!.threadId)}>Resume UNSENT sample draft</button>}
          {current >= 0 && current < ql320Steps.length - 1 && <button type="button" onClick={() => openStep(ql320Steps[current + 1].workspace)}>Next: {ql320Steps[current + 1].title}</button>}
          {current === -1 && <button type="button" onClick={() => openStep('inbox')}>Begin the journey</button>}
        </div>
      </div>}
      {visualState === 'loading' && <div className="ql320-recovery-state" role="status"><strong>Loading demonstration</strong><p>This is a visual-state rehearsal only. The four sample sets are already local; no provider is loading.</p><button type="button" onClick={() => setExampleState('ready')}>Return to available fixture</button></div>}
      {visualState === 'empty' && <div className="ql320-recovery-state" role="status"><strong>No sample to show</strong><p>Filtered or missing examples have no synthetic contact to open. Clear this rehearsal state to restore the exact company fixture.</p><button type="button" disabled={readback.state !== 'ready'} onClick={() => setExampleState('ready')}>Clear example and show fixture</button></div>}
      {visualState === 'error' && <div className="ql320-recovery-state ql320-recovery-error" role="alert"><strong>Sample readback unavailable</strong><p>{readback.state === 'error' ? 'A company-scope mismatch was detected. Navigation to this sample is blocked; switch to a valid business before continuing.' : 'Rehearsed failure: no information was changed or dispatched.'}</p><button type="button" disabled={readback.state === 'error'} onClick={() => setExampleState('ready')}>Retry local readback</button></div>}
      {visualState === 'disabled' && <div className="ql320-recovery-state" role="status"><strong>Actions disabled for review</strong><p>All journey links are temporarily disabled in this visual rehearsal. Live send, dispatch and connection approval are always disabled.</p><button type="button" onClick={() => setExampleState('ready')}>Restore navigation example</button></div>}
    </div>
    <details className="ql320-help"><summary>ⓘ Check loading, empty, error, disabled and recovery visuals</summary>
      <p>Choose a visual rehearsal below. These are client-side examples; they do not simulate a successful source request. The company scope and original fictional records remain unchanged.</p>
      <div className="ql320-state-choices" role="group" aria-label="Visual state rehearsal">
        {(Object.keys(stateLabels) as Ql320StateExample[]).map((state) => <button key={state} type="button" aria-pressed={exampleState === state}
          disabled={readback.state !== 'ready'} onClick={() => setExampleState(state)}>{stateLabels[state]}</button>)}
      </div>
      <p>Actual empty/errors block cross-company sample navigation. A browser-session draft is UNSENT and clears when switching businesses or refreshing this page; it is not an inbox delivery receipt.</p>
    </details>
    <p className="ql320-final-gap"><strong>Still awaiting independent acceptance:</strong> physical owner-device keyboard, screen-reader and 200–400% zoom checks; authenticated source and provider receipts; explicit separate authorization. QL-320 is a software visual sweep, not an owner sign-off.</p>
  </section>;
}
