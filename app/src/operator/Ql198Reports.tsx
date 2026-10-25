import { useState } from 'react';
import type { OperatorOrganization, OperatorWorkspace } from './ql191Organizations';
import type { MockQueueState } from './ql194WorkQueue';
import { reportForOrganization, type ReportingDimension } from './ql198Reporting';
import './ql198-reports.css';

export function Ql198Reports({ organization, queue, onNavigate }: {
  organization: OperatorOrganization; queue: MockQueueState;
  onNavigate: (workspace: OperatorWorkspace) => void;
}) {
  const [dimension, setDimension] = useState<ReportingDimension>('channel');
  const [helpOpen, setHelpOpen] = useState(false);
  const report = reportForOrganization(organization.id, queue, dimension);
  if (!report) return <p role="alert">Reporting context mismatch. Switch companies to reset the fictional data.</p>;
  const cards = [
    ['Sample threads', report.threads], ['Unread examples', report.unread],
    ['Needs reply', report.awaitingReply], ['Active tasks', report.activeTasks],
    ['Unassigned', report.unassignedTasks], ['Overdue examples', report.overdueTasks],
    ['Completed tasks', report.completedTasks], ['Session edits', report.receiptCount]
  ] as const;
  return <section className="ql198-reports" aria-labelledby="ql198-title" data-ql198-release="ql198-synthetic-reporting-v1" data-organization={organization.id}>
    <header className="ql198-top">
      <div><p className="ql191-eyebrow">QL-198 · Fictional operational reports</p><h3 id="ql198-title">{organization.name} · Reporting centre</h3>
        <p>Explore deterministic examples from this company's sample inbox and the session-only follow-up queue.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql198-help" onClick={() => setHelpOpen((value) => !value)}>ⓘ Help</button>
    </header>
    <p className="ql198-warning" role="note">DEMO ONLY · These are fictional snapshots, not live business performance or historical trends. No tracking, exports, analytics provider or external reporting is enabled.</p>
    {helpOpen && <p id="ql198-help" className="ql198-help" role="note">Choose Channel or Status to regroup the same synthetic threads. Task figures reflect only this tab's QL-194 follow-up changes, so switching companies or reloading resets edits. Percentages use the sample thread count; none represent actual service levels.</p>}
    <div className="ql198-cards" aria-label="Synthetic report totals">{cards.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="ql198-panel">
      <div className="ql198-panel-head"><h4>Conversation breakdown</h4><div role="group" aria-label="Report grouping">
        <button type="button" aria-pressed={dimension === 'channel'} onClick={() => setDimension('channel')}>By channel</button>
        <button type="button" aria-pressed={dimension === 'status'} onClick={() => setDimension('status')}>By status</button>
      </div></div>
      <table><caption>{dimension === 'channel' ? 'Channel' : 'Status'} distribution — fictional examples only</caption><thead><tr><th scope="col">{dimension === 'channel' ? 'Channel' : 'Status'}</th><th scope="col">Examples</th><th scope="col">Share</th></tr></thead><tbody>
        {report.rows.map((row) => <tr key={row.key}><th scope="row">{row.label}</th><td>{row.count}</td><td><div className="ql198-meter" aria-hidden="true"><span style={{ width: `${row.percent}%` }} /></div>{row.percent}%</td></tr>)}
      </tbody></table>
    </div>
    <div className="ql198-actions"><button type="button" onClick={() => onNavigate('inbox')}>Inspect sample inbox</button><button type="button" onClick={() => onNavigate('queue')}>Review follow-up queue</button><button type="button" onClick={() => onNavigate('calendar')}>Open task calendar</button></div>
  </section>;
}
