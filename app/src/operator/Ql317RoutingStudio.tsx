import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { ql298Lines, ql298Menus, type Ql298Scenario } from './ql298RoutingStudio';
import { ql317Example, ql317Examples, ql317RouteMap, type Ql317CaseId } from './ql317RouteMap';
import './ql298-routing-studio.css';
import './ql317-routing-visual.css';

type Editor = Readonly<{ example: Ql317CaseId; scenario: Ql298Scenario }>;

export function Ql317RoutingStudio({ organization }: { organization: OperatorOrganization }) {
  const [editors, setEditors] = useState<readonly [Editor, Editor]>(() => [
    { example: 'baseline', scenario: ql317Example(organization.id, 'baseline') },
    { example: 'closed_hours', scenario: ql317Example(organization.id, 'closed_hours') }
  ]);
  const [help, setHelp] = useState(false);
  const maps = editors.map(({ scenario }) => ql317RouteMap(organization.id, scenario));
  const update = (index: number, change: Partial<Ql298Scenario>) => setEditors((previous) => {
    const current = previous[index];
    const edited: Editor = { ...current, scenario: { ...current.scenario, ...change } };
    return index === 0 ? [edited, previous[1]] : [previous[0], edited];
  });
  const useExample = (index: number, example: Ql317CaseId) => setEditors((previous) => {
    const selected = { example, scenario: ql317Example(organization.id, example) };
    return index === 0 ? [selected, previous[1]] : [previous[0], selected];
  });
  return <section className="ql298 ql317" data-ql298-release="safe-four-business-routing-v1" data-ql317-release="diagram-table-fallback-v1" aria-labelledby="ql298-heading">
    <header className="ql317-hero"><div><p className="ql191-eyebrow">QL-317 · Operations Command / Routing Studio</p><h3 id="ql298-heading">{organization.name} · IVR decision map</h3><p>See where a fictional call would stop, compare two independent paths, and rehearse fallback decisions.</p></div><button type="button" aria-expanded={help} aria-controls="ql317-help" onClick={() => setHelp((value) => !value)}>ⓘ {help ? 'Hide help' : 'Routing help'}</button></header>
    {help && <div id="ql317-help" className="ql317-help" role="note"><strong>How to use this safe studio</strong><p>Choose a guided case for each side; change its fictional line, business claim, hours, answer or keypad choice. Compare the map and matching decision table. Revert returns that side to its selected guided case. Amber BLOCKED means human review; grey NOT REACHED means the simulation stopped earlier. A shared-line claim never verifies identity.</p><p><strong>Loop protection:</strong> key 0 previews one repeat request and ends at MENU PREVIEW ONLY. Nothing auto-runs, dials or saves when we leave this screen.</p></div>}
    <p className="ql298-warning" role="note">DISABLED SYNTHETIC PREVIEW · No real number, live call, carrier account, SIP, forwarding, DTMF, IVR deployment, recording, SMS, callback or external write. Six-app integrations remain DISCONNECTED / HOLD.</p>
    <div className="ql298-menu" aria-label={`${organization.name} fictional menu`}><strong>Fictional {organization.name} menu</strong><span>1 · {ql298Menus[organization.id][0]}</span><span>2 · {ql298Menus[organization.id][1]}</span><span>0 · Repeat once, then stop</span><span>9 / # · Manual hold</span></div>
    <div className="ql317-compare" role="note" aria-label="Scenario comparison outcomes"><span>A: <strong>{maps[0].result.outcome.replaceAll('_', ' ')}</strong></span><span>B: <strong>{maps[1].result.outcome.replaceAll('_', ' ')}</strong></span><small>Both local simulations · zero live routes</small></div>
    <div className="ql298-grid">{editors.map(({ example, scenario }, index) => {
      const letter = index === 0 ? 'A' : 'B';
      const { result, stages, isHold, guidance } = maps[index];
      const baseline = ql317Example(organization.id, example);
      const dirty = (Object.keys(scenario) as (keyof Ql298Scenario)[]).some((key) => scenario[key] !== baseline[key]);
      return <section key={letter} className="ql317-scenario" data-scenario={letter} aria-label={`Routing scenario ${letter}`}>
        <div className="ql317-scenario-head"><div><span className="ql317-number">{letter}</span><h4>Scenario {letter}</h4><p>{ql317Examples.find((item) => item.id === example)!.guidance}</p></div><span className="ql317-local">LOCAL ONLY</span></div>
        <div className="ql317-preset"><label htmlFor={`ql317-preset-${letter}`}>Guided comparison example</label><select id={`ql317-preset-${letter}`} value={example} onChange={(event) => useExample(index, event.target.value as Ql317CaseId)}>{ql317Examples.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button type="button" disabled={!dirty} onClick={() => useExample(index, example)}>Revert edits to selected example</button><small>{dirty ? 'Edited locally · revert available' : 'Example loaded · no unsaved edits'}</small></div>
        <div className="ql298-fields"><label>Fictional incoming line<select value={scenario.line} onChange={(event) => update(index, { line: event.target.value as Ql298Scenario['line'] })}>{ql298Lines.map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}</select></label>
        <label>Shared-line identification claim<select value={scenario.identifiedBusiness} onChange={(event) => update(index, { identifiedBusiness: event.target.value as Ql298Scenario['identifiedBusiness'] })}><option value="unidentified">Unidentified · hold</option>{ql298Lines.filter((line) => line.id !== 'shared_unidentified').map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}</select></label>
        <label>Demo hours<select value={scenario.hours} onChange={(event) => update(index, { hours: event.target.value as Ql298Scenario['hours'] })}><option value="open">During demo hours</option><option value="after_hours">After demo hours</option><option value="holiday_closed">Fictional holiday closure</option></select></label>
        <label>Answer result<select value={scenario.answer} onChange={(event) => update(index, { answer: event.target.value as Ql298Scenario['answer'] })}><option value="answered">Answered in simulation</option><option value="no_answer">No answer</option><option value="busy">Busy</option><option value="provider_error">Mock carrier error</option></select></label>
        <label>Keypad choice<select value={scenario.key} onChange={(event) => update(index, { key: event.target.value as Ql298Scenario['key'] })}><option value="1">1 · New inquiry</option><option value="2">2 · Existing request</option><option value="0">0 · Repeat once</option><option value="9">9 · Invalid / missing option</option><option value="#"># · Timeout</option></select></label></div>
        <div className={`ql298-result ql317-result ${isHold ? 'ql317-result-hold' : ''}`} role="status" aria-live="polite"><span className="ql317-eyebrow">{isHold ? 'BLOCKED / HUMAN REVIEW' : 'SAFE DISABLED PREVIEW'}</span><strong>{result.outcome.replaceAll('_', ' ')}</strong><p>Destination: {result.destination.replaceAll('_', ' ')}</p><p>{guidance}</p></div>
        <div className="ql317-map-pair"><div><h5 id={`ql317-map-heading-${letter}`}>Route map · {letter}</h5><ol className="ql317-map" aria-labelledby={`ql317-map-heading-${letter}`}>{stages.map((stage) => <li key={stage.id} data-ql317-step={stage.id} data-ql317-state={stage.state}><strong>{stage.title}</strong><span className="ql317-pill">{stage.state.replaceAll('_', ' ')}</span><p>{stage.detail}</p></li>)}</ol></div>
        <div className="ql317-table-wrap"><h5 id={`ql317-table-heading-${letter}`}>Matching decision table · {letter}</h5><table aria-labelledby={`ql317-table-heading-${letter}`}><caption>Same five decisions and stop states as the route map; not a live routing table.</caption><thead><tr><th scope="col">Stage</th><th scope="col">State</th><th scope="col">Decision / safe fallback</th></tr></thead><tbody>{stages.map((stage) => <tr key={stage.id} data-ql317-step={stage.id} data-ql317-state={stage.state}><th scope="row">{stage.title}</th><td>{stage.state.replaceAll('_', ' ')}</td><td>{stage.detail}</td></tr>)}</tbody></table></div></div>
        <details className="ql317-trace"><summary>View original QL-298 deterministic trace ({result.steps.length} steps)</summary><ol>{result.steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ol></details>
      </section>;
    })}</div>
    <div className="ql298-actions"><button type="button" onClick={() => setEditors([{ example: 'baseline', scenario: ql317Example(organization.id, 'baseline') }, { example: 'closed_hours', scenario: ql317Example(organization.id, 'closed_hours') }])}>Reset both sample scenarios</button><strong>REAL CALLS 0 · FORWARDS 0 · MESSAGES 0 · RECORDINGS 0 · EXTERNAL WRITES 0</strong></div>
  </section>;
}
