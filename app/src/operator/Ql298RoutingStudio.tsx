import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { ql298Default, ql298Lines, ql298Menus, ql298Simulate, type Ql298Scenario } from './ql298RoutingStudio';
import './ql298-routing-studio.css';

export function Ql298RoutingStudio({ organization }: { organization: OperatorOrganization }) {
  const [first, setFirst] = useState<Ql298Scenario>(() => ql298Default(organization.id));
  const [second, setSecond] = useState<Ql298Scenario>(() => ({ ...ql298Default(organization.id), hours: 'after_hours' }));
  const [help, setHelp] = useState(false);
  const variants = [first, second];
  const results = variants.map((scenario) => ql298Simulate(organization.id, scenario));
  const update = (index: number, change: Partial<Ql298Scenario>) => {
    const setter = index === 0 ? setFirst : setSecond;
    setter((previous) => ({ ...previous, ...change }));
  };
  return <section className="ql298" data-ql298-release="safe-four-business-routing-v1" aria-labelledby="ql298-heading">
    <header><div><p className="ql191-eyebrow">QL-298 · Safe IVR scenario studio</p><h3 id="ql298-heading">{organization.name} · Routing comparison</h3><p>Compare two fictional call journeys, menu decisions and safe fallback outcomes without changing a real business line.</p></div><button type="button" aria-expanded={help} onClick={() => setHelp((value) => !value)}>ⓘ Help</button></header>
    {help && <p role="note">The five-stage trace shows source line, business identity, simulated opening hours, answer state and keypad choice. Shared lines need explicit company identification; mismatched destinations are blocked. Each side is independent and exists in screen memory only.</p>}
    <p className="ql298-warning" role="note">DISABLED SIMULATION · No number purchase, live call, carrier account, forwarding, SIP, DTMF to a provider, recordings, SMS, callback, private customer data or configuration write. All six supporting apps remain disconnected.</p>
    <div className="ql298-menu"><strong>Menu for {organization.name}</strong><span>1 · {ql298Menus[organization.id][0]}</span><span>2 · {ql298Menus[organization.id][1]}</span><span>0 · Repeat menu</span><span>9 / # · Invalid / timeout fallback</span></div>
    <div className="ql298-grid">{variants.map((scenario, index) => <section key={index} aria-label={`Routing scenario ${index === 0 ? 'A' : 'B'}`}>
      <h4>Scenario {index === 0 ? 'A' : 'B'} · {index === 0 ? 'Baseline' : 'Compare fallback'}</h4>
      <div className="ql298-fields"><label>Fictional incoming line<select value={scenario.line} onChange={(event) => update(index, { line: event.target.value as Ql298Scenario['line'] })}>{ql298Lines.map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}</select></label>
      <label>Shared-line identification<select value={scenario.identifiedBusiness} onChange={(event) => update(index, { identifiedBusiness: event.target.value as Ql298Scenario['identifiedBusiness'] })}><option value="unidentified">Unidentified · hold</option>{ql298Lines.filter((line) => line.id !== 'shared_unidentified').map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}</select></label>
      <label>Demo hours<select value={scenario.hours} onChange={(event) => update(index, { hours: event.target.value as Ql298Scenario['hours'] })}><option value="open">During demo hours</option><option value="after_hours">After demo hours</option><option value="holiday_closed">Fictional holiday closure</option></select></label>
      <label>Answer result<select value={scenario.answer} onChange={(event) => update(index, { answer: event.target.value as Ql298Scenario['answer'] })}><option value="answered">Answered in simulation</option><option value="no_answer">No answer</option><option value="busy">Busy</option><option value="provider_error">Mock carrier error</option></select></label>
      <label>Keypad choice<select value={scenario.key} onChange={(event) => update(index, { key: event.target.value as Ql298Scenario['key'] })}><option value="1">1 · New inquiry</option><option value="2">2 · Existing request</option><option value="0">0 · Repeat</option><option value="9">9 · Invalid</option><option value="#"># · Timeout</option></select></label></div>
      <div className="ql298-result" role="status"><strong>{results[index].outcome.replaceAll('_', ' ')}</strong><p>Destination: {results[index].destination.replaceAll('_', ' ')}</p></div>
      <ol>{results[index].steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ol>
    </section>)}</div>
    <div className="ql298-actions"><button type="button" onClick={() => { setFirst(ql298Default(organization.id)); setSecond({ ...ql298Default(organization.id), hours: 'after_hours' }); }}>Reset both sample scenarios</button><strong>REAL CALLS 0 · FORWARDS 0 · MESSAGES 0 · RECORDINGS 0 · EXTERNAL WRITES 0</strong></div>
  </section>;
}
