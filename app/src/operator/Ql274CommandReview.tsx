import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import type { Ql272PreferenceEnvelope } from './ql272LayoutPreferences';
import { QL270_SOURCES } from './ql270ConnectionCentre';
import {
  QL274_ACCESSIBILITY_CHECKS, QL274_OBSERVED_AT, QL274_PUBLIC_PROOF_RECHECK,
  ql274HelpCoverage, ql274PinnedProofUrl, ql274PreferenceAccessibility, ql274ProofSummary
} from './ql274CommandAudit';
import './ql274-command-review.css';

const VIEW_LABELS: Record<Ql271CommandMode, string> = {
  it_command: 'IT Command', management: 'Management', analytics: 'Analytics', system_status: 'System Status'
};

export function Ql274CommandReview({ preferences, onOpenEvidence }: {
  preferences: Ql272PreferenceEnvelope;
  onOpenEvidence: () => void;
}) {
  const coverage = ql274HelpCoverage();
  const accessibility = ql274PreferenceAccessibility(preferences);
  const proof = ql274ProofSummary(new Date());
  return <div className="ql274-review" data-ql274-review>
    <header className="ql274-review-title"><div>
      <p className="ql271-eyebrow">QL-274 · Operator assurance</p>
      <h4>Help coverage, preference accessibility &amp; proof freshness</h4>
      <p>This review uses the implemented command controls and dated public GitHub observations. It does not perform live application or gateway checks.</p>
    </div><span className="ql274-hold-pill">DISCONNECTED / HOLD</span></header>

    <div className="ql274-review-kpis" aria-label="Command help and public proof audit summary">
      <div><span>Command view help</span><strong>{coverage.viewsCovered} / {coverage.totalViews}</strong><small>Contextual page guidance</small></div>
      <div><span>KPI help descriptions</span><strong>{coverage.metricsCovered} / {coverage.totalMetrics}</strong><small>Accessible ⓘ buttons</small></div>
      <div><span>Local profile visibility</span><strong>{accessibility.hasFocusableMetrics ? 'PASS' : 'REVIEW'}</strong><small>At least one card per view</small></div>
      <div><span>Public Proof-B</span><strong>{proof.missingCount} / {proof.sourceCount}</strong><small>HTTP 404 exceptions · 0 accepted</small></div>
    </div>

    <div className="ql274-review-columns">
      <section aria-labelledby="ql274-coverage-title" className="ql274-review-card">
        <h5 id="ql274-coverage-title">ⓘ Command help coverage <span>{coverage.gaps.length ? 'REVIEW' : 'COMPLETE'}</span></h5>
        <p>Each command view has purpose, interpretation and next-step help, plus individual KPI descriptions.</p>
        <ul className="ql274-coverage-list">{coverage.viewRows.map(row=><li key={row.id}>
          <strong>{VIEW_LABELS[row.id]}</strong><span>{row.viewHelp ? 'Page help ✓' : 'Page gap'} · {row.describedMetrics}/{row.expectedMetrics} KPI hints</span>
        </li>)}</ul>
        <p className="ql274-minor-note">Scope: four QL-271 command views. Historical workspaces and owner-specific tasks still require separate contextual-help review.</p>
      </section>

      <section aria-labelledby="ql274-accessibility-title" className="ql274-review-card">
        <h5 id="ql274-accessibility-title">⌨ Operator preference accessibility <span>REVIEWED</span></h5>
        <p>Active browser-local layout: <strong>{accessibility.activeLabel}</strong> · {accessibility.density} density · {accessibility.rolePreview.replace('_', ' ')} display preview.</p>
        <ul className="ql274-accessibility-list">{QL274_ACCESSIBILITY_CHECKS.map(item=><li key={item.id}>
          <span aria-hidden="true">{item.result === 'OWNER_REVIEW_PENDING' ? '◷' : '✓'}</span>
          <div><strong>{item.label}</strong><small>{item.detail}</small><em>{item.result === 'OWNER_REVIEW_PENDING' ? 'Manual check pending' : 'Code and regression coverage'}</em></div>
        </li>)}</ul>
        <p className="ql274-minor-note">Saving a preference changes local presentation, never identity, tenant access or a permission.</p>
      </section>
    </div>

    <section className="ql274-review-card ql274-evidence" aria-labelledby="ql274-proof-title">
      <div className="ql274-evidence-head"><div>
        <h5 id="ql274-proof-title">◈ Six-app original proof exception freshness <span>{proof.status === 'RECENT_404_EXCEPTION' ? 'RECENT SNAPSHOT' : 'RECHECK DUE'}</span></h5>
        <p>Public read-only HTTP checks at six immutable GitHub main SHAs, {new Date(QL274_OBSERVED_AT).toLocaleString('en-CA', { timeZone:'America/Toronto', dateStyle:'medium', timeStyle:'short' })} Eastern. Snapshot age: {proof.elapsedHours} hour(s).</p>
      </div><button type="button" onClick={onOpenEvidence}>Open security evidence <span aria-hidden="true">›</span></button></div>
      <div className="ql274-proof-list" role="table" aria-label="Immutable source proof exception checks">
        <div role="row" className="ql274-proof-head"><span role="columnheader">Application</span><span role="columnheader">Commit</span><span role="columnheader">Result</span><span role="columnheader">Source</span></div>
        {QL274_PUBLIC_PROOF_RECHECK.map(row=>{
          const source = QL270_SOURCES.find(item => item.id === row.source);
          return <div role="row" key={row.source} className="ql274-proof-row">
            <strong role="cell">{source?.label ?? row.repo}</strong>
            <code role="cell" title={row.sha}>{row.sha.slice(0,12)}</code>
            <span role="cell" className="ql274-proof-status">HTTP {row.http} · HOLD</span>
            <a role="cell" href={ql274PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${source?.label ?? row.repo} immutable public proof check`}>Check GitHub ↗</a>
          </div>;
        })}
      </div>
      <p className="ql274-minor-note">Immutable results are historical immediately after collection. A newer main commit or an age of 24 hours requires a fresh independent public recheck. HTTP 200 would mean only that a file exists, not that a signature or witness was accepted.</p>
      <p className="ql274-hold-note" role="note">Original signed Proof-B accepted: 0/6 · independent authorizations: 0/6 · authenticated TEST gateway GETs: 0. No live calls, SMS, dispatch or customer-data exchange.</p>
    </section>
  </div>;
}
