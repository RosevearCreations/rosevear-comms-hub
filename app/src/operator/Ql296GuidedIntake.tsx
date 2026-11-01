import { useState } from 'react';
import type { OperatorOrganization } from './ql191Organizations';
import { ql296Fixtures, ql296Handoff, validateQl296 } from './ql296GuidedIntake';
import './ql296-guided-intake.css';

export function Ql296GuidedIntake({ organization }: { organization: OperatorOrganization }) {
  const fixture = ql296Fixtures.find((item) => item.organizationId === organization.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [staged, setStaged] = useState<ReturnType<typeof ql296Handoff>>(null);
  const [help, setHelp] = useState(false);
  if (!fixture) return <p role="alert">No verified fictional fixture for this company.</p>;
  const validation = validateQl296(organization.id, answers);
  return <section className="ql296" data-ql296-release="four-company-intake-v1" aria-labelledby="ql296-title">
    <header><div><p className="ql191-eyebrow">QL-296 · Guided intake / safe handoff</p><h3 id="ql296-title">{organization.name} · Inquiry review</h3><p>{fixture.scenario}</p></div><button type="button" aria-expanded={help} onClick={() => setHelp(!help)}>ⓘ Help</button></header>
    {help && <p role="note">Select only fictional categories. Every company has its own questions and review destination. The handoff is an unsent browser-memory preview; no customer record, quote, booking, task, payment, dispatch or external integration is created.</p>}
    <p className="ql296-warning" role="note">SYNTHETIC TRAINING ONLY · Four businesses remain isolated. AI Data Platform and Rosevear AI Hub are disconnected supporting apps. Never enter real customer information.</p>
    <div className="ql296-grid"><section aria-label="Business-specific intake questions"><h4>1 · Guided questions</h4><p>Sample reference: {fixture.reference}</p><div className="ql296-fields">{fixture.fields.map((field) => <label key={field.id}>{field.label}<select value={answers[field.id] ?? ''} aria-label={field.label} onChange={(event) => { setAnswers((previous) => ({ ...previous, [field.id]: event.target.value })); setStaged(null); }}><option value="">Choose a fictional answer</option>{field.choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select><small>{field.help}</small></label>)}</div>
      <p role="status">{validation.issues.length ? validation.issues.join('; ') : validation.missing.length ? `${validation.missing.length} required selections remain: ${validation.missing.join(', ')}` : 'All fictional questions complete; internal preview available.'}</p>
      <div className="ql296-actions"><button type="button" disabled={!validation.valid} onClick={() => setStaged(ql296Handoff(organization.id, answers))}>Preview internal handoff</button><button type="button" onClick={() => { setAnswers({}); setStaged(null); }}>Clear sample</button></div></section>
      <section aria-label="Unsent quote handoff summary"><h4>2 · Internal review card</h4><p>Destination: {fixture.reviewer}</p>{staged ? <div className="ql296-summary" role="status"><strong>{staged.status}</strong><p>Reference: {staged.reference}</p><ul>{staged.lines.map((line) => <li key={line}>{line}</li>)}</ul><p>Next manual step: independently verify scope, availability, eligibility and pricing outside this preview.</p></div> : <p className="ql296-pending">Complete the four questions and preview the fictional handoff. Edits invalidate the previous preview.</p>}<p className="ql296-warning">NO LIVE QUOTE · NO BOOKING · NO PAYMENT · NO SEND · NO EXPORT</p></section></div>
  </section>;
}
