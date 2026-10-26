import { useMemo, useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { mockOperatorProfiles } from './ql206SecureOperations';
import { evaluateQl209Analytics, QL209_MULTIPLIERS, QL209_RATE_OPTIONS, QL209_RELEASE,
  type Ql209Report, type Ql209ReportInput } from './ql209Analytics';
import type { Ql187Currency, Ql187ProviderId } from './ql187ProviderCostModel';
import './ql209-analytics-cost-controls.css';

const defaultPersona: Readonly<Record<OrganizationId, string>> = {
  rosiedazzlers: 'rosie-manager', devilndove: 'dnd-owner',
  icamp: 'camp-rosevear-manager', yw: 'yw-rosevear-manager'
};
const flagLabel = {
  within_demo_budget: 'WITHIN FICTIONAL BUDGET',
  approaching_demo_budget: 'AT OR ABOVE 80% OF FICTIONAL BUDGET',
  above_demo_budget: 'FICTIONAL BUDGET EXCEEDED'
} as const;

export function Ql209AnalyticsCostControls({ organizationId }: { organizationId: OrganizationId }) {
  const [profileId, setProfileId] = useState(defaultPersona[organizationId]);
  const [providerId, setProviderId] = useState<Ql187ProviderId>('voipms');
  const [volumeMultiplier, setVolumeMultiplier] = useState(10);
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(25);
  const [reservePercent, setReservePercent] = useState(25);
  const [currency, setCurrency] = useState<Ql187Currency>('CAD');
  const [cadPerUsd, setCadPerUsd] = useState(1.4);
  const [helpOpen, setHelpOpen] = useState(false);
  const profile = mockOperatorProfiles.find((item) => item.id === profileId) ?? mockOperatorProfiles[0];
  const request: Ql209ReportInput = { organizationId, profile, providerId, volumeMultiplier,
    monthlyBudgetUsd, reservePercent, currency, cadPerUsd };
  const result = useMemo(() => evaluateQl209Analytics(request), [organizationId, profile, providerId,
    volumeMultiplier, monthlyBudgetUsd, reservePercent, currency, cadPerUsd]);
  const report: Ql209Report | null = result.disposition === 'PREVIEW_ONLY' ? result : null;
  const denialExplanation = result.disposition === 'PREVIEW_ONLY' ? '' : result.reason;
  const formatted = (value: number, selected: Ql187Currency = 'USD') =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: selected }).format(value);

  return <section className="ql209-analytics" aria-labelledby="ql209-title" data-ql209-release={QL209_RELEASE} data-organization={organizationId}>
    <header className="ql209-head"><div><p className="ql191-eyebrow">QL-209 · Four-company analytics</p>
      <h4 id="ql209-title">Tenant-scoped analytics &amp; cost controls</h4>
      <p>Review eligible fictional handoffs, planned response priorities and hypothetical monthly telephony budgets.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql209-help" onClick={() => setHelpOpen((value) => !value)}>ⓘ Help</button>
    </header>
    <p className="ql209-warning" role="note"><strong>PLANNING DATA ONLY · NO LIVE BILLING.</strong> Counts come only from QL-200–203 fictional connector handoffs visible to a QL-206 test persona. All phone/SMS rates are invented QL-187 examples, not provider quotes. No actual response duration, live traffic, carrier fees, taxes, exchange rates or customer identity is known.</p>
    {helpOpen && <p id="ql209-help" className="ql209-help" role="note">Change the fictional operator to test company, campground and YW property scope. Volume multiples repeat the visible sample channel mix for arithmetic; projected outgoing communications are a what-if only and never sent. High-priority examples get a proposed 30-minute response target and other examples 120 minutes, not measured performance. An over-budget warning does not charge, block, approve or enable any real service. The demo assumes one new number and excludes the existing Bell Fibe and mobile plans.</p>}
    <div className="ql209-controls" role="group" aria-label="Fictional reporting and cost assumptions">
      <div><label htmlFor="ql209-profile">Fictional operator scope</label><select id="ql209-profile" value={profileId} onChange={(event) => setProfileId(event.target.value)}>{mockOperatorProfiles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
      <div><label htmlFor="ql209-plan">Invented monthly rate card</label><select id="ql209-plan" value={providerId} onChange={(event) => setProviderId(event.target.value as Ql187ProviderId)}>{QL209_RATE_OPTIONS.map((rate) => <option key={rate.id} value={rate.id}>{rate.label} · not a quote</option>)}</select></div>
      <div><label htmlFor="ql209-volume">Fictional volume multiplier</label><select id="ql209-volume" value={volumeMultiplier} onChange={(event) => setVolumeMultiplier(Number(event.target.value))}>{QL209_MULTIPLIERS.map((n) => <option key={n} value={n}>×{n} fictional sample traffic</option>)}</select></div>
      <div><label htmlFor="ql209-budget">Illustrative monthly budget (USD)</label><input id="ql209-budget" type="number" min="0" max="100000" step="1" value={monthlyBudgetUsd} onChange={(event) => setMonthlyBudgetUsd(Number(event.target.value))} /></div>
      <div><label htmlFor="ql209-reserve">Planning reserve % (0–100)</label><input id="ql209-reserve" type="number" min="0" max="100" step="1" value={reservePercent} onChange={(event) => setReservePercent(Number(event.target.value))} /></div>
      <div><label htmlFor="ql209-currency">Display currency</label><select id="ql209-currency" value={currency} onChange={(event) => setCurrency(event.target.value as Ql187Currency)}><option value="CAD">CAD · assumed conversion</option><option value="USD">USD</option></select></div>
      <div><label htmlFor="ql209-fx">Illustrative CAD per USD</label><input id="ql209-fx" type="number" min="0.5" max="3" step="0.01" value={cadPerUsd} onChange={(event) => setCadPerUsd(Number(event.target.value))} /></div>
    </div>
    {report ? <>
      <div className="ql209-metrics" aria-label="Scoped synthetic connector activity">
        {[
          ['Visible mock handoffs', report.visibleHandoffs],
          ['High priority', report.highPriority],
          ['New / awaiting reply', report.awaitingReply],
          ['Waiting / resolved', report.waitingOrResolved],
          ['30-minute targets planned', report.targetWithin30Minutes],
          ['120-minute targets planned', report.targetWithin120Minutes]
        ].map(([label, count]) => <article key={label}><span>{label}</span><strong>{count}</strong></article>)}
      </div>
      <div className="ql209-panels">
        <section className="ql209-panel" aria-labelledby="ql209-breakdown"><h5 id="ql209-breakdown">Connector traffic breakdown</h5>
          <table><caption>Visible fictional handoff source channels · no private messages</caption><thead><tr><th scope="col">Channel</th><th scope="col">Examples</th></tr></thead><tbody>
            {report.channels.map((row) => <tr key={row.channel}><th scope="row">{row.label}</th><td>{row.count}</td></tr>)}
          </tbody></table>
          <p>Actual responses timed: {report.actualResponsesTimed} · Human review is still required for every synthetic handoff.</p>
        </section>
        <section className="ql209-panel" aria-labelledby="ql209-costs"><h5 id="ql209-costs">Hypothetical monthly cost</h5>
          <div className="ql209-budget-result" role="status" aria-live="polite"><strong>{flagLabel[report.cost.flag]}</strong>
            <p>Modeled total: <strong>{formatted(report.cost.displayTotal, currency)}</strong> ({formatted(report.cost.totalUsd)} before illustrative conversion)</p>
            <p>{report.cost.budgetUsedPercent === null ? 'Budget set to zero; any modeled cost exceeds it.' : `${report.cost.budgetUsedPercent}% of the example USD budget`}</p>
            <div className="ql209-progress" role="img" aria-label={`Example budget usage: ${report.cost.budgetUsedPercent ?? 'undefined'} percent`}><span style={{ width: `${Math.min(100, report.cost.budgetUsedPercent ?? 100)}%` }} /></div>
          </div>
          <table><caption>Invented USD planning components · no provider billing</caption><tbody>
            <tr><th scope="row">New number + platform</th><td>{formatted(report.cost.fixedUsd)}</td></tr>
            <tr><th scope="row">Projected voice minutes</th><td>{formatted(report.cost.voiceUsd)}</td></tr>
            <tr><th scope="row">Projected SMS segments</th><td>{formatted(report.cost.smsUsd)}</td></tr>
            <tr><th scope="row">Projected MMS</th><td>{formatted(report.cost.mmsUsd)}</td></tr>
            <tr><th scope="row">Planning reserve</th><td>{formatted(report.cost.reserveUsd)}</td></tr>
            <tr className="ql209-total"><th scope="row">Modeled total (USD)</th><td>{formatted(report.cost.totalUsd)}</td></tr>
          </tbody></table>
        </section>
      </div>
      <p className="ql209-projection"><strong>Usage behind the arithmetic:</strong> {report.usage.inboundSmsSegments} incoming SMS segments, {report.usage.projectedOutboundSmsSegments} possible outgoing SMS segments, {report.usage.inboundVoiceMinutes} incoming voice minutes and {report.usage.projectedOutboundVoiceMinutes} possible outgoing voice minutes. All projected outgoing activity remains disabled.</p>
    </> : <p role="alert" className="ql209-denied"><strong>{result.disposition}</strong> · {denialExplanation} No company, campground, property or cost totals are disclosed for this selection.</p>}
    <p className="ql209-foot">Real provider and account costs, service availability, billing commitments, carrier surcharges, taxes, regulatory fees and FX must be verified privately before any financial decision. This workbench cannot purchase numbers, change forwarding, dispatch a message, save to Supabase, export records or approve a live pilot.</p>
  </section>;
}
