import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { assessQl186Message, QL186_CHANNELS, QL186_EVIDENCE_STATES, QL186_HOLDS,
  QL186_KEYWORD_EVENTS, QL186_PROPOSED_LEDGER_FIELDS, QL186_SCENARIOS, QL186_VERSION,
  type Ql186Channel, type Ql186ConsentEvidence, type Ql186KeywordEvent, type Ql186ScenarioId } from './ql186ConsentMessageClassification';
import './ql186-consent-classification.css';

const brandLabels: Readonly<Record<BrandId, string>> = { rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove' };

export function Ql186ConsentMessageClassificationPreview({ brandId }: { brandId: BrandId }) {
  const [targetBrand, setTargetBrand] = useState<BrandId>(brandId);
  const [scenarioId, setScenarioId] = useState<Ql186ScenarioId>('booking_update');
  const [channel, setChannel] = useState<Ql186Channel>('sms');
  const [consentEvidence, setConsentEvidence] = useState<Ql186ConsentEvidence>('none');
  const [priorSuppressed, setPriorSuppressed] = useState(false);
  const [keywordEvent, setKeywordEvent] = useState<Ql186KeywordEvent>('none');
  const result = useMemo(() => assessQl186Message(brandId, {
    targetBrand, scenarioId, channel, consentEvidence, priorSuppressed, keywordEvent
  }), [brandId, targetBrand, scenarioId, channel, consentEvidence, priorSuppressed, keywordEvent]);
  const scenario = result.disposition === 'REVIEW_ONLY_NO_SEND' ? QL186_SCENARIOS.find(item => item.id === scenarioId) : null;
  return <section className="ql186-consent" aria-labelledby="ql186-heading">
    <header className="ql186-header"><div>
      <p className="ql186-kicker">QL-186 · {QL186_VERSION}</p>
      <h3 id="ql186-heading">Consent & message classification specification</h3>
      <p>Examine synthetic service, commercial and control-message examples for {brandLabels[brandId]} before any real-provider pilot.</p>
    </div><strong className="ql186-hold">NO VERIFIED CONSENT · ALL SENDS BLOCKED</strong></header>
    <p className="ql186-warning" role="note"><strong>Not a legal finding or a messaging tool.</strong> Choosing an example,
      a purported consent claim, STOP, START or HELP never grants consent, clears suppression or sends an SMS, email or call.
      Real consent proof and legal classification require independent review. All 12 live-pilot prerequisites remain held.</p>
    <div className="ql186-controls" role="group" aria-label="Synthetic message and consent scenario">
      <div><label htmlFor="ql186-brand">Business under review</label><select id="ql186-brand" value={targetBrand}
        onChange={event => setTargetBrand(event.target.value as BrandId)}>
        <option value="rosiedazzlers">Rosie Dazzlers</option><option value="devilndove">Devil n Dove</option>
      </select></div>
      <div><label htmlFor="ql186-scenario">Sample message purpose</label><select id="ql186-scenario" value={scenarioId}
        onChange={event => setScenarioId(event.target.value as Ql186ScenarioId)}>
        {QL186_SCENARIOS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></div>
      <div><label htmlFor="ql186-channel">Proposed channel</label><select id="ql186-channel" value={channel}
        onChange={event => setChannel(event.target.value as Ql186Channel)}>
        {QL186_CHANNELS.map(item => <option value={item} key={item}>{item.toUpperCase()}</option>)}
      </select></div>
      <div><label htmlFor="ql186-evidence">Illustrative consent evidence</label><select id="ql186-evidence" value={consentEvidence}
        onChange={event => setConsentEvidence(event.target.value as Ql186ConsentEvidence)}>
        {QL186_EVIDENCE_STATES.map(item => <option value={item} key={item}>{item === 'none' ? 'No consent evidence' : 'Claim shown — NOT verified'}</option>)}
      </select></div>
      <div><label htmlFor="ql186-prior">Previously suppressed in example?</label><select id="ql186-prior"
        value={priorSuppressed ? 'yes' : 'no'} onChange={event => setPriorSuppressed(event.target.value === 'yes')}>
        <option value="no">No known prior suppression</option><option value="yes">Yes — synthetic suppression</option>
      </select></div>
      <div><label htmlFor="ql186-keyword">Synthetic inbound keyword</label><select id="ql186-keyword" value={keywordEvent}
        onChange={event => setKeywordEvent(event.target.value as Ql186KeywordEvent)}>
        {QL186_KEYWORD_EVENTS.map(item => <option key={item} value={item}>{item === 'none' ? 'None' : item}</option>)}
      </select></div>
    </div>
    <section className="ql186-result" role="status" aria-live="polite" aria-atomic="true">
      <h4>{result.disposition === 'REVIEW_ONLY_NO_SEND' ? 'CLASSIFICATION REVIEW ONLY · NO SEND'
        : result.disposition === 'CROSS_BRAND_REJECTED' ? 'CROSS-BRAND REVIEW REJECTED' : 'INVALID SCENARIO — DENIED'}</h4>
      {scenario && <><p><strong>Fictional example:</strong> {scenario.example}</p>
        <p><strong>Candidate class:</strong> {scenario.intent.replaceAll('_', ' ')} — not legally approved</p></>}
      <p><strong>Review:</strong> {result.reason}</p><p><strong>Keyword and suppression:</strong> {result.keywordInterpretation}</p>
      <p><strong>Suppression modeled:</strong> {result.suppressionModeled ? 'YES — remains in force in this illustration' : 'NO — not proof of consent'}</p>
      <strong>Verified grants: 0 · Evidence writes: 0 · Suppression writes: 0 · Phone/SMS/email sent: 0 · Owner approvals: 0 · Live-pilot holds: 12</strong>
    </section>
    <div className="ql186-table-wrap"><table><caption>Message purpose examples for review — no row is authorization to send.</caption>
      <thead><tr><th scope="col">Example</th><th scope="col">Review class</th><th scope="col">Next legal/privacy decision</th></tr></thead>
      <tbody>{QL186_SCENARIOS.map(item => <tr key={item.id}><th scope="row">{item.label}</th>
        <td>{item.intent.replaceAll('_', ' ')}</td><td>{item.nextReview}</td></tr>)}</tbody>
    </table></div>
    <details className="ql186-help"><summary><span aria-hidden="true">ⓘ</span> What evidence would a real consent and suppression ledger require?</summary>
      <p>Future private server storage—not browser localStorage or the public synthetic Supabase read model—would track brand,
        recipient, channel, purpose, legal basis, text of the notice, source, timestamps, withdrawal and any reviewed expiry.
        These are proposed fields only; this panel does not create a ledger or prove permission.</p>
      <ul>{QL186_PROPOSED_LEDGER_FIELDS.map(row => <li key={row.field}><strong><code>{row.field}</code>:</strong> {row.why}</li>)}</ul>
    </details>
    <details className="ql186-help"><summary><span aria-hidden="true">ⓘ</span> What is still required before a real SMS, email or call?</summary>
      <ol>{QL186_HOLDS.map(item => <li key={item}>{item}</li>)}</ol>
      <p>STOP preserves suppression; START is never automatic renewed marketing consent. HELP is informational and not a
        dispatch authorization. Voice calls need a separate applicable-rule review. Even owner role or a synthetic
        opt-in claim cannot lift the existing QL-181 gate.</p>
    </details>
  </section>;
}
