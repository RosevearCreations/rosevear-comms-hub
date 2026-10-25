import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { QL188_CASES, QL188_LIVE_GATES, QL188_VERSION, viewQl188Case, type Ql188CaseId }
  from './ql188SecurityPreview';
import './ql188-security-harness.css';

const businessNames: Readonly<Record<BrandId, string>> = { rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove' };

export function Ql188SecurityHarnessPreview({ brandId }: { brandId: BrandId }) {
  const [targetBrand, setTargetBrand] = useState<BrandId>(brandId);
  const [caseId, setCaseId] = useState<Ql188CaseId>('fresh');
  const projection = useMemo(() => viewQl188Case(brandId, targetBrand, caseId), [brandId, targetBrand, caseId]);

  return <section className="ql188-security" aria-labelledby="ql188-heading">
    <header className="ql188-header"><div>
      <p className="ql188-kicker">QL-188 · {QL188_VERSION}</p>
      <h3 id="ql188-heading">Server auth, webhook & replay test harness</h3>
      <p>Read the outcomes that the checked-in, isolated Node test harness is designed to check for {businessNames[brandId]}.</p>
    </div><strong className="ql188-hold">NO LIVE ENDPOINT · NO SECRETS</strong></header>
    <p className="ql188-warning" role="note"><strong>This page does not execute cryptographic checks.</strong> It describes
      synthetic cases; actual mock HMAC, session and replay checks execute only in Node regression tests.
      The mock signature algorithm is deliberately provider-neutral and must not be used to validate real Twilio, Telnyx
      or VoIP.ms requests. No HTTP listener, provider secret, account, customer record or real identity is connected.
      All 12 QL-181 live-pilot prerequisites remain held.</p>
    <div className="ql188-controls" role="group" aria-label="Synthetic security regression examples">
      <div><label htmlFor="ql188-brand">Illustrative business context</label><select id="ql188-brand" value={targetBrand}
        onChange={event => setTargetBrand(event.target.value as BrandId)}>
        <option value="rosiedazzlers">Rosie Dazzlers</option><option value="devilndove">Devil n Dove</option>
      </select></div>
      <div><label htmlFor="ql188-case">Synthetic server-side test case</label><select id="ql188-case" value={caseId}
        onChange={event => setCaseId(event.target.value as Ql188CaseId)}>
        {QL188_CASES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></div>
    </div>
    <section className="ql188-result" role="status" aria-live="polite" aria-atomic="true">
      <h4>{projection.disposition === 'ILLUSTRATIVE_CASE_ONLY' ? 'SYNTHETIC CASE DESCRIPTION · NOT LIVE AUTH'
        : projection.disposition === 'CROSS_BRAND_REJECTED' ? 'CROSS-BRAND REQUEST REJECTED' : 'INVALID CASE — DENIED'}</h4>
      {projection.expectedServerDisposition && <p><strong>Expected Node test disposition:</strong> {projection.expectedServerDisposition}</p>}
      <p>{projection.explanation}</p>
      <strong>Live endpoints: 0 · Real identities authenticated: 0 · Provider credentials: 0 · External writes: 0 · Calls/SMS: 0 · Pilot holds: 12</strong>
    </section>
    <div className="ql188-table-wrap"><table>
      <caption>Designed negative and positive test cases — Node tests are the executable evidence, not this table.</caption>
      <thead><tr><th scope="col">Case</th><th scope="col">Expected mock result</th><th scope="col">Boundary being exercised</th></tr></thead>
      <tbody>{QL188_CASES.map(item => <tr key={item.id}><th scope="row">{item.label}</th>
        <td>{item.expected}</td><td>{item.explanation}</td></tr>)}</tbody>
    </table></div>
    <details className="ql188-help"><summary><span aria-hidden="true">ⓘ</span> How is the Node-only harness different from a real webhook server?</summary>
      <p>The Node harness creates fresh temporary keys and fake operator sessions, signs fictional raw messages with
        a <em>test-only</em> HMAC-SHA256 contract, checks signatures in constant-time, enforces a test timestamp window
        and deduplicates accepted event IDs in memory. It never listens on a network port. Its temporary replay set
        is not a durable or atomic store. Real provider signature formats and authentication must use their official
        server libraries and a separately approved protected runtime.</p>
    </details>
    <details className="ql188-help"><summary><span aria-hidden="true">ⓘ</span> Which safeguards still block the live pilot?</summary>
      <ol>{QL188_LIVE_GATES.map(item => <li key={item}>{item}</li>)}</ol>
      <p>Browser brand controls never authorize a server request. A verified user session does not establish verified
        recipient consent or signed provider identity. QL-185 data retention, QL-186 consent classification and
        QL-187 provider selection remain review-only until independently approved.</p>
    </details>
  </section>;
}
