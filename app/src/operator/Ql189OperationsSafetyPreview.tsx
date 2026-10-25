import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import {
  QL189_VERSION, QL189_SAFETY_CASES, QL189_LIVE_PREREQUISITES,
  QL189_SAMPLE_LIMITS, viewQl189DryRun
} from './ql189OperationsSafetyPreview';
import './ql189-operations-safety.css';

const brandName: Record<BrandId, string> = { rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove' };

export function Ql189OperationsSafetyPreview({ brandId }: { brandId: BrandId }) {
  const [targetBrand, setTargetBrand] = useState<BrandId>(brandId);
  const [mockEventsInMinute, setMockEventsInMinute] = useState(0);
  const [rollingMockCents, setRollingMockCents] = useState(0);
  const [nextMockCostCents, setNextMockCostCents] = useState(100);
  const [incidentStopped, setIncidentStopped] = useState(false);
  const projection = useMemo(() => viewQl189DryRun({ activeBrand: brandId, targetBrand,
    mockEventsInMinute, rollingMockCents, nextMockCostCents, incidentStopped
  }), [brandId, targetBrand, mockEventsInMinute, rollingMockCents, nextMockCostCents, incidentStopped]);

  return <section className="ql189-operations" aria-labelledby="ql189-heading">
    <header className="ql189-header"><div>
      <p className="ql189-kicker">QL-189 · {QL189_VERSION}</p>
      <h3 id="ql189-heading">Operations safety controls — synthetic rehearsal</h3>
      <p>Explore a fictional rate, cost and incident-stop decision for {brandName[brandId]}.
        A separate isolated Node suite exercises mock reservations and redacted telemetry.</p>
    </div><strong className="ql189-hold">NO LIVE SAFETY SERVICE · 12 PILOT HOLDS</strong></header>
    <p className="ql189-warning" role="note"><strong>Training-only predictions.</strong> These controls do not execute
      the Node suite, spend money, change incident state or enforce limits at a server. The sample thresholds
      are invented—not a selected provider tariff, owner-approved budget or real operational configuration.
      Every live phone/SMS function remains disabled.</p>

    <div className="ql189-controls" role="group" aria-label="Fictional safety review inputs">
      <div><label htmlFor="ql189-brand">Synthetic business context</label><select id="ql189-brand"
        value={targetBrand} onChange={e => setTargetBrand(e.target.value as BrandId)}>
        <option value="rosiedazzlers">Rosie Dazzlers</option><option value="devilndove">Devil n Dove</option>
      </select></div>
      <div><label htmlFor="ql189-minute">Mock events already reviewed this minute</label><select id="ql189-minute"
        value={mockEventsInMinute} onChange={e => setMockEventsInMinute(Number(e.target.value))}>
        {[0, 1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
      </select></div>
      <div><label htmlFor="ql189-budget">Invented rolling 24-hour projected total</label><select id="ql189-budget"
        value={rollingMockCents} onChange={e => setRollingMockCents(Number(e.target.value))}>
        {[0, 200, 450, 500].map(cents => <option key={cents} value={cents}>${(cents / 100).toFixed(2)} mock</option>)}
      </select></div>
      <div><label htmlFor="ql189-cost">Next invented operation estimate</label><select id="ql189-cost"
        value={nextMockCostCents} onChange={e => setNextMockCostCents(Number(e.target.value))}>
        {[50, 100, 250, 300].map(cents => <option key={cents} value={cents}>${(cents / 100).toFixed(2)} mock</option>)}
      </select></div>
      <div><label htmlFor="ql189-stop">Fictional incident switch</label><select id="ql189-stop"
        value={incidentStopped ? 'stopped' : 'normal'} onChange={e => setIncidentStopped(e.target.value === 'stopped')}>
        <option value="normal">Not stopped (simulation)</option><option value="stopped">STOPPED (simulation only)</option>
      </select></div>
    </div>

    <section className="ql189-result" role="status" aria-live="polite" aria-atomic="true">
      <h4>ILLUSTRATIVE RESULT · {projection.disposition}</h4>
      <p>{projection.explanation}</p>
      <p><strong>Example thresholds:</strong> {QL189_SAMPLE_LIMITS.mockEventsPerMinute} mock reviews/minute,
        ${ (QL189_SAMPLE_LIMITS.maxMockEventCents / 100).toFixed(2) } mock per operation,
        ${ (QL189_SAMPLE_LIMITS.rollingMockBudgetCents / 100).toFixed(2) } mock over 24 hours.</p>
      <strong>Live dispatch: 0 · Real cost: $0 · Provider changes: 0 · Customer data writes: 0 · Pilot holds: 12</strong>
    </section>

    <div className="ql189-table-wrap"><table>
      <caption>Safety playbook examples (the Node suite, not this table, tests state transitions)</caption>
      <thead><tr><th scope="col">Control</th><th scope="col">Mock outcome</th><th scope="col">What must be addressed</th></tr></thead>
      <tbody>{QL189_SAFETY_CASES.map(item => <tr key={item.key}><th scope="row">{item.name}</th>
        <td>{item.outcome}</td><td>{item.note}</td></tr>)}</tbody>
    </table></div>
    <details className="ql189-help"><summary><span aria-hidden="true">ⓘ</span> Are these real rate limits, charges or incident controls?</summary>
      <p>No. The Node harness is an ephemeral, deterministic training simulation. It has no HTTP listener,
        live account, actual role verification, durable quota ledger, provider costs, log collector or
        emergency suspension capability. Browser inputs are read-only examples, not operational controls.</p>
    </details>
    <details className="ql189-help"><summary><span aria-hidden="true">ⓘ</span> How will a real system stop, recover and explain an incident?</summary>
      <p>A separate protected server must enforce stop-before-dispatch checks, atomic quotas and budget reservations,
        reject retries safely, record redacted evidence and alert an authorized owner. Recovery must verify provider
        status, consent, costs, data retention, rollback and independent approval before restarting traffic.</p>
    </details>
    <details className="ql189-help"><summary><span aria-hidden="true">ⓘ</span> Remaining pre-pilot safety work</summary>
      <ol>{QL189_LIVE_PREREQUISITES.map(item => <li key={item}>{item}</li>)}</ol>
      <p>QL-190 will assemble a separate independent pre-pilot review packet. Neither QL-189 nor QL-190
        automatically lifts any of the twelve QL-181 live-pilot prerequisites.</p>
    </details>
  </section>;
}
