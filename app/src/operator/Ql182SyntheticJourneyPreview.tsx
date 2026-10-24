import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import { assessQl182Journey, getQl182InboundChoices, QL182_VERSION } from './ql182SyntheticJourneyAcceptance';
import './ql182-synthetic-journey.css';

export function Ql182SyntheticJourneyPreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const choices = useMemo(() => getQl182InboundChoices(migration, brandId), [migration, brandId]);
  const [choiceId, setChoiceId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const selected = choices.find(row => row.event.id === choiceId) ?? choices[0];
  const acceptance = useMemo(() => assessQl182Journey(migration, brandId, selected), [migration, brandId, selected]);
  const activeStep = acceptance.steps[currentStep];

  return (
    <section className="ql182-journey" aria-label="QL-182 synthetic operator journey acceptance">
      <header className="ql182-header">
        <div>
          <p className="ql182-kicker">QL-182 · {QL182_VERSION}</p>
          <h3>Synthetic operator journey acceptance</h3>
          <p>Walk through one pinned sample from incoming event to mock receipt. Each checkpoint uses the same verified two-brand fixtures as the operator screens.</p>
        </div>
        <strong className="ql182-lock">LIVE PILOT HELD · SYNTHETIC ONLY</strong>
      </header>
      <p className="ql182-warning" role="note">Acceptance means these example screens agree, not that production phone/SMS, customer contact, database writes, consent or sign-off works. No private customer details or real phone lines are used.</p>
      <div className="ql182-toolbar">
        <div>
          <label htmlFor="ql182-scenario">Choose a checked-in incoming event</label>
          <select id="ql182-scenario" value={selected?.event.id ?? ''} disabled={!choices.length}
            onChange={event => { setChoiceId(event.target.value); setCurrentStep(0); }}>
            {choices.map(row => <option value={row.event.id} key={row.event.id}>{row.event.label} · {row.event.channel.toUpperCase()}</option>)}
          </select>
          <small>Active brand only: {brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}. Switching brands resets the walkthrough.</small>
        </div>
        <div className="ql182-result" role="status">
          <span>Automated synthetic acceptance</span>
          <strong>{acceptance.disposition.replaceAll('_', ' ')}</strong>
          <small>Real calls: 0 · SMS sent: 0 · owner approvals: 0</small>
        </div>
      </div>

      {acceptance.disposition === 'DENIED_UNVERIFIED_SOURCE' ? <p role="alert" className="ql182-denied">{acceptance.reasons.join(' ')} No journey or real action is available.</p> : (
        <>
          <p className="ql182-source">Pinned source: <code>{acceptance.sourceLabel}</code> · All {acceptance.steps.length} checkpoints checked by the local acceptance model.</p>
          <ol className="ql182-list" aria-label="Synthetic journey checkpoints">
            {acceptance.steps.map((step, index) => (
              <li key={step.id}>
                <button type="button" aria-current={index === currentStep ? 'step' : undefined}
                  className={index === currentStep ? 'ql182-step selected' : 'ql182-step'}
                  onClick={() => setCurrentStep(index)}>
                  <span>{step.title}</span>
                  <small>{step.outcome === 'HELD_FOR_LIVE_PILOT' ? 'Live held' : step.outcome === 'NOT_APPLICABLE_SIMULATED' ? 'N/A (SMS)' : 'Mock verified'}</small>
                </button>
              </li>
            ))}
          </ol>
          <section className="ql182-detail" aria-label="Selected synthetic acceptance evidence" aria-live="polite">
            <p className="ql182-kicker">Checkpoint {currentStep + 1} / {acceptance.steps.length}</p>
            <h4>{activeStep?.title}</h4>
            <p>{activeStep?.evidence}</p>
            <strong>{activeStep?.outcome.replaceAll('_', ' ')}</strong>
            <div className="ql182-actions">
              <button type="button" disabled={currentStep === 0} onClick={() => setCurrentStep(value => Math.max(0, value - 1))}>Previous checkpoint</button>
              <button type="button" disabled={currentStep === acceptance.steps.length - 1} onClick={() => setCurrentStep(value => Math.min(acceptance.steps.length - 1, value + 1))}>Next checkpoint</button>
              <button type="button" onClick={() => setCurrentStep(0)}>Restart walkthrough</button>
            </div>
          </section>
          <p className="ql182-final"><strong>{acceptance.heldPrerequisites} / {acceptance.heldPrerequisites} live-pilot prerequisites remain HELD.</strong> This final queued build closes the *synthetic-development batch* only after exact-commit production checks; it does not approve any live pilot.</p>
        </>
      )}
    </section>
  );
}
