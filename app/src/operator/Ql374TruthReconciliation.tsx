import {QL374_HISTORICAL_PREREQUISITES,QL374_REQUIRED_GATES} from '../auth/ql374OwnerEntry';
import './ql374-truth.css';

/** Public command pages are synthetic. This dated classification is not a
 * protected server reading, owner authorization, or connection grant. */
export function Ql374TruthReconciliation(){
  return <section className="ql374-public-truth" aria-labelledby="ql374-public-truth-title">
    <p className="ql271-eyebrow">QL-374 · PRELAUNCH TRUTH RECONCILIATION · 8 NOV 2026</p>
    <h3 id="ql374-public-truth-title">Current security gates versus retired preflight snapshots</h3>
    <p>Prior architecture and proof checks are kept as historical evidence, but are no longer treated as prerequisites to open the newer personal owner portal. Production software readiness does <strong>not</strong> authorize customer access.</p>
    <div className="ql374-public-truth-grid">
      <section aria-labelledby="ql374-archived-heading">
        <h4 id="ql374-archived-heading">Retired as current entry blockers · {QL374_HISTORICAL_PREREQUISITES.length}</h4>
        <ul>{QL374_HISTORICAL_PREREQUISITES.map(x=><li key={x.id}><strong>{x.label}</strong><small>{x.resolution}</small></li>)}</ul>
      </section>
      <section aria-labelledby="ql374-gates-heading">
        <h4 id="ql374-gates-heading">Independent gates still required · {QL374_REQUIRED_GATES.length}</h4>
        <ol>{QL374_REQUIRED_GATES.map(x=><li key={x}>{x}</li>)}</ol>
      </section>
    </div>
    <p className="ql374-truth-footnote">Verified at review: 2 Supabase Auth users, 0 active owner memberships and 6 of 6 application shells DISCONNECTED / HOLD. This public preview is a dated report, not a live authenticated readback; use the protected QL-370 refresh under <a href="#/master">Master Owner Portal</a> for a current check.</p>
  </section>;
}
