import { useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { findOperatorOrganization } from './ql191Organizations';
import { ql302FixtureEvents, ql302Trend, type Ql302Segment, type Ql302Window } from './ql302StatisticsTrend';
import './ql302-statistics-trend.css';

const segments: readonly { id: Ql302Segment; label: string }[] = [
  { id: 'all', label: 'All training categories' }, { id: 'reply', label: 'Reply' }, { id: 'call', label: 'Mock call' }, { id: 'intake', label: 'Intake' }, { id: 'task', label: 'Follow-up task' }
];

export function Ql302StatisticsTrend({ organizationId }: { organizationId: OrganizationId }) {
  const [days, setDays] = useState<Ql302Window>(28);
  const [segment, setSegment] = useState<Ql302Segment>('all');
  const company = findOperatorOrganization(organizationId);
  const events = ql302FixtureEvents(organizationId);
  const trend = ql302Trend(events, days, segment);
  return <section className="ql302" data-ql302-release="scoped-synthetic-trend-provenance-v1" aria-labelledby="ql302-title">
    <header><p className="ql271-eyebrow">QL-302 · Statistics trend explorer</p><h3 id="ql302-title">{company?.name ?? 'Unknown company'} · Training-event trends</h3><p>Explore category totals over fictional lookback windows. Chart bars and the accessible table use the exact same aggregated rows.</p></header>
    <p className="ql302-truth" role="note">FIXTURE ONLY · Source: <code>ql191DashboardData.ts</code>, four company-isolated fictional queue examples. Day offsets (1, 4, 9, 15) are assigned for this training explorer. There are no real event timestamps, sampled history, live analytics feeds or actual refresh requests.</p>
    <div className="ql302-controls"><label>Demonstration lookback<select value={days} onChange={event => setDays(Number(event.currentTarget.value) as Ql302Window)}><option value={7}>Last 7 fictional days</option><option value={14}>Last 14 fictional days</option><option value={28}>Last 28 fictional days</option></select></label><label>Segment<select value={segment} onChange={event => setSegment(event.currentTarget.value as Ql302Segment)}>{segments.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label></div>
    <div className="ql302-kpis" aria-label="Source-explained sample metrics"><article><span>Selected fictional events</span><strong>{trend.total}</strong><small>Source: category-filtered training fixtures</small></article><article><span>Source fixtures</span><strong>{trend.sourceItems}</strong><small>Source: current company only</small></article><article><span>Live analytics events</span><strong>{trend.liveEvents}</strong><small>Freshness: no feed connected or queried</small></article></div>
    <div className="ql302-grid"><section aria-label="Synthetic time-window bar chart"><h4>Illustrative weekly distribution</h4><p>Each bar is a count of sample rows, not an observed time series.</p><div className="ql302-bars">{trend.rows.map(row => <div key={row.key} className="ql302-bar-row"><span>{row.label}</span><div className="ql302-track"><span style={{ width: `${row.count / trend.maxCount * 100}%` }} /></div><strong>{row.count}</strong></div>)}</div></section>
      <section aria-label="Statistics data table"><h4>Exact chart data</h4><div className="ql302-table-wrap"><table><caption>Fictional event counts by lookback band</caption><thead><tr><th scope="col">Demo period</th><th scope="col">Reply</th><th scope="col">Call</th><th scope="col">Intake</th><th scope="col">Task</th><th scope="col">Total</th></tr></thead><tbody>{trend.rows.map(row => <tr key={row.key}><th scope="row">{row.label}</th><td>{row.categories.reply}</td><td>{row.categories.call}</td><td>{row.categories.intake}</td><td>{row.categories.task}</td><td>{row.count}</td></tr>)}</tbody><tfoot><tr><th scope="row">Selected total</th><td colSpan={4}>Current filter: {segment}</td><td>{trend.total}</td></tr></tfoot></table></div></section></div>
    <p className="ql302-readback" role="status" aria-live="polite">{trend.total} training events in {days} fictional days for {company?.name}; {trend.rows.length} matching chart/table bands.</p>
    <footer><strong>Source provenance and freshness:</strong> Bundled, static, fabricated records loaded with this deployed application version; no ingestion or last-refreshed date is claimed. Switching company changes the fixture boundary. All six integrations remain DISCONNECTED / HOLD.</footer>
  </section>;
}
