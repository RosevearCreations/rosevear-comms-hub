import { useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { findOperatorOrganization } from './ql191Organizations';
import { QL322_CATEGORIES, ql322BandSources, ql322TrendModel, type Ql302Segment, type Ql302Window } from './ql302StatisticsTrend';
import './ql302-statistics-trend.css';

const segments: readonly { id: Ql302Segment; label: string }[] = [
  { id: 'all', label: 'All training categories' }, ...QL322_CATEGORIES.map(item => ({ id: item.id, label: item.label }))
];

export function Ql302StatisticsTrend({ organizationId }: { organizationId: OrganizationId }) {
  const [days, setDays] = useState<Ql302Window>(28);
  const [segment, setSegment] = useState<Ql302Segment>('all');
  const [bandKey, setBandKey] = useState<string | null>(null);
  const company = findOperatorOrganization(organizationId);
  const trend = ql322TrendModel(organizationId, days, segment);
  const selectedBand = trend.rows.find(row => row.key === bandKey);
  const sourceRows = ql322BandSources(organizationId, days, segment, selectedBand?.key ?? null);
  function updateWindow(value: Ql302Window) { setDays(value); setBandKey(null); }
  function updateSegment(value: Ql302Segment) { setSegment(value); setBandKey(null); }
  return <section className="ql302 ql322" data-ql302-release="scoped-synthetic-trend-provenance-v1" data-ql322-release="chart-table-freshness-v1" aria-labelledby="ql302-title">
    <header><p className="ql271-eyebrow">QL-322 · Statistical Trend Explorer</p><h3 id="ql302-title">{company?.name ?? 'Unknown company'} · Training-event trends</h3><p>Filter and compare fictional training-event counts. Select any chart bar or table period to inspect the exact source rows.</p></header>
    <p className="ql302-truth" role="note">FIXTURE ONLY · Source: <code>ql191DashboardData.ts</code>, four company-isolated fictional queue examples. QL-302 assigns made-up day offsets (1, 4, 9, 15); they are <strong>not real dates or event timestamps</strong>. No live business analytics or refresh requests.</p>
    <div className="ql302-controls"><label>Demonstration lookback<select value={days} onChange={event => updateWindow(Number(event.currentTarget.value) as Ql302Window)}><option value={7}>Last 7 fictional days</option><option value={14}>Last 14 fictional days</option><option value={28}>Last 28 fictional days</option></select></label><label>Segment<select value={segment} onChange={event => updateSegment(event.currentTarget.value as Ql302Segment)}>{segments.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label></div>
    <div className="ql302-kpis" aria-label="Source-explained sample metrics">
      <article><span>Selected fictional events</span><strong>{trend.total}</strong><small>Known count · filtered QL-191 fixtures</small></article>
      <article><span>Previous equal-length demo window</span><strong>{trend.previous === null ? 'Unknown' : trend.previous}</strong><small>{trend.previous === null ? 'Outside the 28-day sample coverage · not zero' : `Known ${trend.previous === 0 ? 'zero' : 'count'} · change ${trend.delta! > 0 ? '+' : ''}${trend.delta}`}</small></article>
      <article><span>Live analytics events</span><strong>Unknown</strong><small>Freshness: no feed connected or queried; zero requests does not mean zero real events</small></article>
    </div>
    <div className="ql322-freshness" role="note" aria-label="Source freshness and observation status"><strong>Source freshness · static training fixtures</strong><span>Last observed real event: <b>Unknown / not available</b></span><span>Last real refresh: <b>Never connected</b></span><span>Sample offsets: <b>illustrative, not calendar dates</b></span><span>Snapshot age: <b>Unknown</b> (no timestamp in source)</span></div>
    <div className="ql322-legend" aria-label="Chart legend">{QL322_CATEGORIES.map(item => <span key={item.id} className={`ql322-legend-${item.id}`}><i aria-hidden="true"/>{item.label}</span>)}<span className="ql322-legend-note">Text counts and table cells also identify categories.</span></div>
    <div className="ql302-grid"><section aria-label="Synthetic time-window stacked bar chart"><h4>Illustrative weekly distribution</h4><p>Each bar is one period; category segments match the table exactly.</p>
      <div className="ql302-bars">{trend.rows.map(row => <button type="button" key={row.key} aria-pressed={selectedBand?.key === row.key} className="ql322-bar-button ql302-bar-row" onClick={() => setBandKey(selectedBand?.key === row.key ? null : row.key)} aria-label={`${row.label}: ${row.count} fictional events. Show source records`}><span>{row.label}</span><span className="ql302-track" aria-hidden="true">{QL322_CATEGORIES.map(category => <span key={category.id} className={`ql322-stack-${category.id}`} style={{ width: `${row.categories[category.id] / trend.maxCount * 100}%` }}/>)}</span><strong>{row.count}</strong></button>)}</div>
      {trend.total === 0 && <p className="ql322-empty">Known zero matching sample records. Real event counts remain unknown; try another category or period.</p>}
    </section><section aria-label="Statistics data table"><h4>Exact chart data</h4><div className="ql302-table-wrap" tabIndex={0} role="region" aria-label="Scrollable matching chart data table"><table><caption>Fictional event counts by lookback band · same values as stacked bars</caption><thead><tr><th scope="col">Demo period</th>{QL322_CATEGORIES.map(category => <th scope="col" key={category.id}>{category.label}</th>)}<th scope="col">Total</th></tr></thead><tbody>{trend.rows.map(row => <tr key={row.key} className={selectedBand?.key === row.key ? 'ql322-selected-row' : ''}><th scope="row"><button type="button" aria-pressed={selectedBand?.key === row.key} onClick={() => setBandKey(selectedBand?.key === row.key ? null : row.key)}>{row.label}</button></th>{QL322_CATEGORIES.map(category => <td key={category.id}>{row.categories[category.id]}</td>)}<td>{row.count}</td></tr>)}</tbody><tfoot><tr><th scope="row">Selected total</th><td colSpan={4}>Filter: {segments.find(item => item.id === segment)?.label}</td><td>{trend.total}</td></tr></tfoot></table></div></section></div>
    <section className="ql322-source" aria-labelledby="ql322-source-title"><div className="ql322-source-heading"><div><h4 id="ql322-source-title">Source record drill-through</h4><p>{selectedBand ? selectedBand.label : 'All matching periods'} · {sourceRows.length} known fictional {sourceRows.length === 1 ? 'record' : 'records'}</p></div>{selectedBand && <button type="button" onClick={() => setBandKey(null)}>Clear period selection</button>}</div>
      {sourceRows.length ? <div className="ql302-table-wrap" tabIndex={0} role="region" aria-label="Scrollable source records"><table><caption>Exact QL-191 records for {company?.name}; fictitious categories and IDs only</caption><thead><tr><th scope="col">Source ID</th><th scope="col">Category</th><th scope="col">Training example</th><th scope="col">Illustrative offset</th><th scope="col">Source</th></tr></thead><tbody>{sourceRows.map(item => <tr key={item.id}><th scope="row"><code>{item.id}</code></th><td>{segments.find(entry => entry.id === item.category)?.label}</td><td>{item.title}</td><td>{item.category === 'reply' ? 1 : item.category === 'call' ? 4 : item.category === 'intake' ? 9 : 15} demo days ago</td><td><code>ql191DashboardData.ts</code></td></tr>)}</tbody></table></div> : <p className="ql322-empty">No matching fictional source rows. This is a known zero, not a failed feed or verified real-world absence. Clear the period or adjust filters.</p>}
    </section>
    <p className="ql302-readback" role="status" aria-live="polite">{trend.total} training events in {days} fictional days for {company?.name}; {trend.rows.length} matching chart/table bands. {selectedBand ? `Selected ${selectedBand.label}: ${selectedBand.count}.` : 'All periods shown.'}</p>
    <footer><strong>Source provenance and freshness:</strong> Bundled, static, fabricated QL-191 records with QL-302 demonstration offsets; no ingestion timestamp or last-refreshed date exists. The chart, table and drill-through share the same aggregation. All six integrations remain <strong>DISCONNECTED / HOLD</strong>.</footer>
  </section>;
}
