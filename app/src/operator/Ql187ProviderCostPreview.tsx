import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { evaluateQl187Costs, QL187_DECISION_GATES, QL187_DEMO_RATES, QL187_PROVIDERS,
  QL187_VERSION, QL187_VOLUMES, type Ql187Currency, type Ql187VolumeId } from './ql187ProviderCostModel';
import './ql187-provider-cost.css';

const brandLabels: Readonly<Record<BrandId, string>> = { rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove' };

export function Ql187ProviderCostPreview({ brandId }: { brandId: BrandId }) {
  const [targetBrand, setTargetBrand] = useState<BrandId>(brandId);
  const [volume, setVolume] = useState<Ql187VolumeId>('small');
  const [currency, setCurrency] = useState<Ql187Currency>('CAD');
  const [cadPerUsd, setCadPerUsd] = useState(1.4);
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(25);
  const [reservePercent, setReservePercent] = useState(25);
  const result = useMemo(() => evaluateQl187Costs(brandId, {
    targetBrand, volume, currency, cadPerUsd, monthlyBudgetUsd, reservePercent
  }), [brandId, targetBrand, volume, currency, cadPerUsd, monthlyBudgetUsd, reservePercent]);
  const usage = QL187_VOLUMES.find(item => item.id === volume)!;
  const money = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(value);

  return <section className="ql187-cost" aria-labelledby="ql187-heading">
    <header className="ql187-header"><div>
      <p className="ql187-kicker">QL-187 · {QL187_VERSION}</p>
      <h3 id="ql187-heading">Provider decision & cost model</h3>
      <p>Compare three possible <em>new test-number</em> providers for {brandLabels[brandId]}; retain existing Bell Fibe and mobile lines unchanged.</p>
    </div><strong className="ql187-hold">HYPOTHETICAL RATES · NO PURCHASE</strong></header>
    <p className="ql187-warning" role="note"><strong>Every displayed rate is invented demonstration data, not a provider's advertised price.</strong>
      No current quote, line availability, subscription, exchange rate, taxes, 911 fees, carrier surcharges, compliance fees or service terms have been verified.
      This tool does not select a provider, place orders, port/forward phone numbers, capture owner approval or enable calls and texts.
      All 12 QL-181 live-pilot requirements remain held.</p>

    <div className="ql187-controls" role="group" aria-label="Fictional volume and cost assumptions">
      <div><label htmlFor="ql187-brand">Business under review</label><select id="ql187-brand" value={targetBrand}
        onChange={event => setTargetBrand(event.target.value as BrandId)}>
        <option value="rosiedazzlers">Rosie Dazzlers</option><option value="devilndove">Devil n Dove</option>
      </select></div>
      <div><label htmlFor="ql187-volume">Illustrative monthly traffic</label><select id="ql187-volume" value={volume}
        onChange={event => setVolume(event.target.value as Ql187VolumeId)}>
        {QL187_VOLUMES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></div>
      <div><label htmlFor="ql187-currency">Display currency</label><select id="ql187-currency" value={currency}
        onChange={event => setCurrency(event.target.value as Ql187Currency)}>
        <option value="CAD">CAD (assumed conversion)</option><option value="USD">USD (model base)</option>
      </select></div>
      <div><label htmlFor="ql187-fx">Hypothetical CAD per USD (not live FX)</label><input id="ql187-fx" type="number"
        min="0.5" max="3" step="0.01" value={cadPerUsd} onChange={event => setCadPerUsd(Number(event.target.value))} /></div>
      <div><label htmlFor="ql187-budget">Illustrative monthly budget (USD)</label><input id="ql187-budget" type="number"
        min="0" max="10000" step="1" value={monthlyBudgetUsd} onChange={event => setMonthlyBudgetUsd(Number(event.target.value))} /></div>
      <div><label htmlFor="ql187-reserve">Planning reserve % (0–100)</label><input id="ql187-reserve" type="number"
        min="0" max="100" step="1" value={reservePercent} onChange={event => setReservePercent(Number(event.target.value))} /></div>
    </div>

    <section className="ql187-result" role="status" aria-live="polite" aria-atomic="true">
      <h4>{result.disposition === 'REVIEW_ONLY_NO_PURCHASE' ? 'COST SCENARIO ONLY · NO PROVIDER SELECTED'
        : result.disposition === 'CROSS_BRAND_REJECTED' ? 'CROSS-BRAND REQUEST REJECTED' : 'INVALID ESTIMATE — DENIED'}</h4>
      <p>{result.explanation}</p>
      {result.disposition === 'REVIEW_ONLY_NO_PURCHASE' && <p><strong>Demo usage:</strong> {usage.inboundMinutes} incoming and {usage.outboundMinutes} outgoing voice minutes;
        {' '}{usage.inboundSmsSegments} inbound and {usage.outboundSmsSegments} outbound SMS segments; {usage.outboundMms} outbound MMS.
        One hypothetical new number for this business. The reserve is not a substitute for fees or taxes.</p>}
      <strong>Accounts ordered: 0 · Forwarding/ports changed: 0 · Messages/calls sent: 0 · Owner approvals: 0 · Pilot holds: 12</strong>
    </section>

    {result.disposition === 'REVIEW_ONLY_NO_PURCHASE' && <div className="ql187-table-wrap"><table>
      <caption>Fictional monthly cost projections per new test number — NOT quotes or a purchasing recommendation.</caption>
      <thead><tr><th scope="col">Provider candidate</th><th scope="col">Demo recurring USD</th>
        <th scope="col">Demo reserve USD</th><th scope="col">Modeled total ({currency})</th>
        <th scope="col">Against fictional USD budget</th></tr></thead>
      <tbody>{result.costs.map(row => {
        const provider = QL187_PROVIDERS.find(entry => entry.id === row.providerId)!;
        return <tr key={row.providerId}><th scope="row">{provider.label}</th>
          <td>{row.recurringUsd.toFixed(2)}</td><td>{row.reserveUsd.toFixed(2)}</td>
          <td>{money(row.displayTotal)}</td>
          <td>{row.withinIllustrativeBudget ? 'Within demo budget only' : 'Above demo budget'}</td></tr>;
      })}</tbody>
    </table></div>}

    <div className="ql187-line-note"><h4>Existing lines: preserve, do not assume zero cost</h4>
      <p>Bell Fibe home phone, Rosie Dazzlers' mobile, Devil n Dove's mobile and the personal/business mobile are <strong>outside these estimates</strong>.
        Their actual recurring plans, forwarding charges, SMS ownership, port eligibility and call behaviour are unknown here.
        Bell confirms home call forwarding is a feature, but availability and applicable long-distance/plan charges require review.</p>
      <a href="https://support.bell.ca/home_phone/calling_features/how_to_use_call_forwarding_on_my_bell_home_phone" target="_blank" rel="noopener noreferrer">Bell's official call-forwarding guidance</a>
    </div>
    <details className="ql187-help"><summary><span aria-hidden="true">ⓘ</span> How were the made-up costs calculated?</summary>
      <p>All three candidate rate cards below are intentionally fictional (USD). They are never fetched or updated from providers.
        Formula: monthly number + platform + other + (incoming minutes × inbound voice rate) + (outgoing minutes × outbound voice rate)
        + (in/out SMS segments × corresponding rates) + (outgoing MMS × rate), then add the percentage reserve.
        Display in CAD uses the entered <em>hypothetical</em> USD-to-CAD multiplier. Excludes taxes, real carrier/911/regulatory charges,
        registration, integration work, one-time fees and refunds.</p>
      <div className="ql187-table-wrap"><table><caption>Invented demonstration unit rates, USD only</caption>
        <thead><tr><th scope="col">Provider</th><th scope="col">Number/mo</th><th scope="col">In/out voice/min</th><th scope="col">In/out SMS/segment</th><th scope="col">MMS outgoing</th></tr></thead>
        <tbody>{QL187_PROVIDERS.map(provider => { const rate = QL187_DEMO_RATES[provider.id]; return <tr key={provider.id}>
          <th scope="row">{provider.label}</th><td>{rate.numberMonthlyUsd.toFixed(2)}</td>
          <td>{rate.incomingVoiceMinuteUsd.toFixed(3)} / {rate.outgoingVoiceMinuteUsd.toFixed(3)}</td>
          <td>{rate.inboundSmsSegmentUsd.toFixed(3)} / {rate.outboundSmsSegmentUsd.toFixed(3)}</td>
          <td>{rate.outboundMmsUsd.toFixed(3)}</td></tr>; })}</tbody>
      </table></div>
    </details>
    <details className="ql187-help"><summary><span aria-hidden="true">ⓘ</span> What needs verification before choosing a provider?</summary>
      <ul>{QL187_PROVIDERS.map(provider => <li key={provider.id}><strong>{provider.label}:</strong> {provider.review}
        {' '}<a href={provider.pricing} target="_blank" rel="noopener noreferrer">Official pricing / product page</a></li>)}</ul>
      <ol>{QL187_DECISION_GATES.map(item => <li key={item}>{item}</li>)}</ol>
    </details>
  </section>;
}
