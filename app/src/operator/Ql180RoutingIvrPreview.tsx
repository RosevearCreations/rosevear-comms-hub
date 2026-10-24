import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  QL180_LINES, QL180_SCENARIO_VERSION, getQl180InboundSamples, simulateQl180Route,
  type Ql180Answer, type Ql180Hours, type Ql180Key, type Ql180Line, type Ql180Result
} from './ql180RoutingIvr';
import './ql180-routing-ivr.css';

export function Ql180RoutingIvrPreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const inbound = useMemo(() => getQl180InboundSamples(migration, brandId), [migration, brandId]);
  const [line, setLine] = useState<Ql180Line>(brandId === 'rosiedazzlers' ? 'rosie_business_demo' : 'devil_business_demo');
  const [hours, setHours] = useState<Ql180Hours>('during_demo_hours');
  const [answer, setAnswer] = useState<Ql180Answer>('answered_demo');
  const [digit, setDigit] = useState<Ql180Key>('1');
  const [personalOptIn, setPersonalOptIn] = useState(false);
  const [result, setResult] = useState<Ql180Result | null>(null);

  useEffect(() => {
    setLine(brandId === 'rosiedazzlers' ? 'rosie_business_demo' : 'devil_business_demo');
    setHours('during_demo_hours');
    setAnswer('answered_demo');
    setDigit('1');
    setPersonalOptIn(false);
    setResult(null);
  }, [brandId]);

  function run() {
    setResult(simulateQl180Route(migration, brandId, {
      line, hours, answer, digit, personalOptIn, sourceEnvelope: inbound[0]
    }));
  }

  return (
    <section className="ql180-preview" aria-label="QL-180 multi-line routing and IVR preview simulator">
      <header className="ql180-header">
        <div>
          <p className="ql180-eyebrow">QL-180 · {QL180_SCENARIO_VERSION}</p>
          <h3>Multi-line routing & IVR preview simulator</h3>
          <p>Try sample business lines, an unidentified shared line and an optional isolated personal line. Follow a mock keypad decision, hours check and call outcome.</p>
        </div>
        <strong className="ql180-lock">SIMULATED ONLY · ROUTING OFF</strong>
      </header>
      <p className="ql180-safety" role="note">No real numbers, Bell Fibe or cell configuration, call forwarding, voicemail recording, IVR deployment, provider endpoints, SMS, private contacts or Supabase activity. Keypresses and business hours are manually chosen examples, not live events.</p>
      <div className="ql180-flow" aria-label="Preview decision sequence">
        <span>Checked-in mock call</span><span>Line identity</span><span>Brand gate</span><span>Hours & answer</span><span>Keypad → queue/hold</span>
      </div>
      <div className="ql180-layout">
        <form className="ql180-controls" aria-label="Synthetic IVR routing choices" onSubmit={event => { event.preventDefault(); run(); }}>
          <h4>Rehearse one synthetic call</h4>
          <label htmlFor="ql180-line">Incoming sample line</label>
          <select id="ql180-line" value={line} onChange={event => { setLine(event.target.value as Ql180Line); setResult(null); }}>
            {QL180_LINES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="ql180-hint">Active business: <strong>{brandId === 'rosiedazzlers' ? 'Rosie Dazzlers' : 'Devil n Dove'}</strong>. A different business line is explicitly blocked.</p>
          {line === 'optional_personal_demo' && (
            <label className="ql180-checkbox" htmlFor="ql180-personal">
              <input id="ql180-personal" type="checkbox" checked={personalOptIn} onChange={event => { setPersonalOptIn(event.target.checked); setResult(null); }} />
              Enable an isolated personal-line rehearsal (off by default; never linked to either brand)
            </label>
          )}
          <label htmlFor="ql180-hours">Business-hours example</label>
          <select id="ql180-hours" value={hours} onChange={event => { setHours(event.target.value as Ql180Hours); setResult(null); }}>
            <option value="during_demo_hours">During synthetic opening hours</option>
            <option value="after_demo_hours">After synthetic opening hours</option>
            <option value="holiday_closed_demo">Synthetic holiday closure</option>
          </select>
          <label htmlFor="ql180-answer">Phone response example</label>
          <select id="ql180-answer" value={answer} onChange={event => { setAnswer(event.target.value as Ql180Answer); setResult(null); }}>
            <option value="answered_demo">Answered · example only</option>
            <option value="no_answer_demo">Not answered · missed call</option>
            <option value="busy_demo">Line busy · missed call</option>
            <option value="mock_provider_error">Provider failure · synthetic hold</option>
          </select>
          <label htmlFor="ql180-digit">Simulated keypad choice</label>
          <select id="ql180-digit" value={digit} onChange={event => { setDigit(event.target.value as Ql180Key); setResult(null); }}>
            {line === 'shared_unresolved_demo' ? <>
              <option value="1">1 — Identify Rosie Dazzlers</option>
              <option value="2">2 — Identify Devil n Dove</option>
              <option value="0">0 — Repeat brand menu</option>
              <option value="9">9 — Unknown brand key</option>
              <option value="#"># — No brand / timeout</option>
            </> : <>
              <option value="1">1 — New inquiry / quote</option>
              <option value="2">2 — Existing customer</option>
              <option value="0">0 — Replay menu</option>
              <option value="9">9 — Invalid key</option>
              <option value="#"># — Timeout</option>
            </>}
          </select>
          <div className="ql180-actions">
            <button type="submit" disabled={!migration.verified || inbound.length === 0}>Simulate local route</button>
            <button type="button" onClick={() => setResult(null)}>Clear route result</button>
          </div>
          <p className="ql180-hint">Input source: {inbound.length} verified QL-179 inbound-call fixture(s). Mock keypad choices cannot dial or transfer a call.</p>
        </form>
        <section className="ql180-result" aria-label="Synthetic route decision and trace">
          <h4>Routing decision trace</h4>
          {!migration.verified && <p role="alert">Canonical synthetic fixtures failed validation; routing remains disabled.</p>}
          {!result ? (
            <p className="ql180-empty">Choose options and run a local simulation. No call is made, and no operator queue is changed.</p>
          ) : (
            <>
              <div className="ql180-summary" role="status" aria-live="polite">
                <span>Mock outcome</span><strong>{result.outcome.replaceAll('_', ' ')}</strong>
                <span>Demo destination</span><strong>{result.destination.replaceAll('_', ' ')}</strong>
                <span>Scoped brand</span><strong>{result.brandDestination === 'rosiedazzlers' ? 'Rosie Dazzlers' : result.brandDestination === 'devilndove' ? 'Devil n Dove' : 'None — held or isolated'}</strong>
              </div>
              <ol className="ql180-steps">{result.steps.map((step, index) => (
                <li key={`${step.stage}-${index}`}>
                  <small>{step.stage}</small><p>{step.description}</p>
                </li>
              ))}</ol>
              <strong className="ql180-zero">REAL CALLS {result.liveCalls} · SMS {result.sentMessages} · VOICEMAILS SAVED {result.savedVoicemails} · EXTERNAL WRITES {result.externalWrites}</strong>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
