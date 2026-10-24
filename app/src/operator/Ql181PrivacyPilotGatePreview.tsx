import { useEffect, useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { migrateQl173SyntheticFixtures } from '../fixtures/ql173CanonicalSynthetic';
import {
  QL181_GATE_VERSION, QL181_PREREQUISITES, evaluateQl181LivePilotGate,
  type Ql181PreviewRole
} from './ql181PrivacyPilotGate';
import './ql181-privacy-pilot-gate.css';

const roleChoices: ReadonlyArray<{ id: Ql181PreviewRole; label: string }> = [
  { id: 'signed_out', label: 'Signed out / unidentified' },
  { id: 'staff_readonly', label: 'Staff read-only (illustration)' },
  { id: 'admin', label: 'Admin (illustration)' },
  { id: 'owner', label: 'Owner (illustration)' }
];
const categories = ['Identity & roles', 'Consent & privacy', 'Provider & infrastructure', 'Owner governance'] as const;
const capabilityNames = {
  view_synthetic_samples: 'View mock samples',
  inspect_own_brand_mock_reviews: 'Inspect same-brand mock reviews',
  read_prerequisite_matrix: 'Read prerequisite matrix'
} as const;

export function Ql181PrivacyPilotGatePreview({ brandId }: { brandId: BrandId }) {
  const migration = useMemo(() => migrateQl173SyntheticFixtures(), []);
  const [role, setRole] = useState<Ql181PreviewRole>('signed_out');
  const [readIds, setReadIds] = useState<readonly string[]>([]);
  const gate = useMemo(() => evaluateQl181LivePilotGate(migration, brandId, {
    illustrativeRole: role, prospectiveBrandId: brandId, readOnlyReviewedIds: readIds
  }), [migration, brandId, role, readIds]);

  useEffect(() => { setRole('signed_out'); setReadIds([]); }, [brandId]);
  const canRead = gate.disposition === 'LIVE_PILOT_HELD';

  function setRead(id: string, checked: boolean) {
    setReadIds(existing => checked ? [...new Set([...existing, id])] : existing.filter(entry => entry !== id));
  }

  return (
    <section className="ql181-gate" aria-label="QL-181 privacy, roles and live-pilot prerequisite review">
      <header className="ql181-head">
        <div>
          <p className="ql181-kicker">QL-181 · {QL181_GATE_VERSION}</p>
          <h3>Privacy, roles & live-pilot gate</h3>
          <p>Read the outstanding requirements for any future phone/SMS pilot. This screen cannot approve one, establish identity, save evidence or change permissions.</p>
        </div>
        <strong className="ql181-hold" role="status">LIVE PILOT HELD · NO APPROVAL</strong>
      </header>
      <p className="ql181-warning" role="note">PUBLIC DISABLED PREVIEW — Review boxes below only mark text we read during this browser session. They do not clear a hold or create an owner sign-off, consent, audit, production role or authorized deployment. No private customer or personal-line data is displayed.</p>
      <div className="ql181-metrics" aria-label="Pilot gate status">
        <div><span>Live requirements held</span><strong>{gate.heldPrerequisiteIds.length} / {QL181_PREREQUISITES.length}</strong></div>
        <div><span>Explanations read here</span><strong>{gate.reviewedExplanationsOnly.length} / {QL181_PREREQUISITES.length}</strong></div>
        <div><span>Verified owner approvals</span><strong>0 · NOT COLLECTED</strong></div>
        <div><span>Live capabilities enabled</span><strong>0 · LOCKED</strong></div>
      </div>
      <div className="ql181-role-panel">
        <div>
          <h4>Illustrative least-privilege role matrix</h4>
          <p>Existing QL-009 types include owner, admin and staff_readonly. The selector below is a *training example* — it never authenticates us or changes the Supabase allowlist.</p>
          <label htmlFor="ql181-role">Preview a role category</label>
          <select id="ql181-role" value={role} onChange={event => setRole(event.target.value as Ql181PreviewRole)}>
            {roleChoices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
          </select>
        </div>
        <div>
          <h4>Projected mock-only access</h4>
          {gate.syntheticCapabilities.length ? <ul>{gate.syntheticCapabilities.map(capability => (
            <li key={capability}>{capabilityNames[capability]}</li>
          ))}</ul> : <p>No preview capabilities for an unidentified session.</p>}
          <strong className="ql181-never">For every role, real customer records, phone/SMS, routing edits, exports, consent writes and pilot approvals remain denied.</strong>
        </div>
      </div>
      {!canRead && <p role="alert">The checked-in synthetic fixture scope could not be verified. All pilot prerequisites remain held.</p>}
      <div className="ql181-matrix-header">
        <div><h4>Held prerequisite decision matrix</h4><p>Every item requires a separate external reviewer and verified evidence before any *future* go-live decision.</p></div>
        <button type="button" onClick={() => setReadIds([])} disabled={!readIds.length}>Clear local reading marks</button>
      </div>
      {categories.map(category => (
        <section key={category} className="ql181-category" aria-label={category}>
          <h5>{category}</h5>
          <div className="ql181-cards">
            {QL181_PREREQUISITES.filter(item => item.category === category).map(item => (
              <article key={item.id} className="ql181-card">
                <div className="ql181-card-head"><h6>{item.title}</h6><span>HELD · UNVERIFIED</span></div>
                <details>
                  <summary><span aria-hidden="true">ⓘ</span> Evidence gap and required work</summary>
                  <p><strong>Current evidence:</strong> {item.currentEvidence}</p>
                  <p><strong>Before any live pilot:</strong> {item.requiredBeforePilot}</p>
                  <p><strong>Future reviewer:</strong> {item.reviewer}</p>
                  <small>Source to inspect: <code>{item.sourcePath}</code></small>
                </details>
                <label htmlFor={`ql181-read-${item.id}`} className="ql181-check">
                  <input id={`ql181-read-${item.id}`} type="checkbox" disabled={!canRead}
                    checked={gate.reviewedExplanationsOnly.includes(item.id)}
                    onChange={event => setRead(item.id, event.target.checked)} />
                  I read this explanation (local only; hold remains)
                </label>
              </article>
            ))}
          </div>
        </section>
      ))}
      <section className="ql181-denial" aria-label="Pilot authorization outcome" role="status" aria-live="polite">
        <h4>{gate.disposition.replaceAll('_', ' ')}</h4>
        <ul>{gate.blockedReasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        <p>Allowed real provider calls: <strong>0</strong> · Real consent grants: <strong>0</strong> · Decisions saved: <strong>0</strong></p>
      </section>
    </section>
  );
}
