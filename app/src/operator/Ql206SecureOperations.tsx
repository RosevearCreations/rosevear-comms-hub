import { useMemo, useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { connectorContracts } from './ql199ConnectorContracts';
import { buildMockReviewQueue } from './ql204HandoffReviewQueue';
import { assessMockHandoffSecurity, mockOperatorProfiles, mockSecurityOperations, type MockSecurityOperation } from './ql206SecureOperations';
import './ql206-secure-operations.css';

interface LocalTestRecord { id: number; profile: string; operation: string; reference: string; result: string }

export function Ql206SecureOperations({ organizationId }: { organizationId: OrganizationId }) {
  const queue = useMemo(() => buildMockReviewQueue(organizationId, connectorContracts[organizationId]), [organizationId]);
  const [profileId, setProfileId] = useState('signed-out');
  const [sampleId, setSampleId] = useState('');
  const [operation, setOperation] = useState<MockSecurityOperation>('inspect_summary');
  const [checks, setChecks] = useState<readonly LocalTestRecord[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const samples = queue.ok ? queue.items : [];
  const selected = samples.find((item) => item.id === sampleId) ?? samples[0];
  const profile = mockOperatorProfiles.find((entry) => entry.id === profileId) ?? mockOperatorProfiles[0];
  const decision = selected ? assessMockHandoffSecurity(organizationId, connectorContracts[organizationId], profile, selected, operation) : null;

  function recordCheck() {
    if (!decision || !selected) return;
    setChecks((current) => [{ id: (current[0]?.id ?? 0) + 1, profile: profile.label,
      operation: mockSecurityOperations.find((entry) => entry.id === operation)?.label ?? operation,
      reference: selected.reference, result: decision.designAllows ? 'Design match · runtime held' : `Design denied · ${decision.reason}` }, ...current].slice(0, 8));
  }

  return <section className="ql206-security" data-ql206-release="ql206-four-company-secure-operations-mock-v1" aria-labelledby="ql206-title">
    <header className="ql206-heading"><div><p className="ql191-eyebrow">QL-206 · Secure operations</p><h4 id="ql206-title">Role, company & tenant access tests</h4><p>Rehearse permission decisions against the selected company’s fictional handoff records.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql206-help" onClick={() => setHelpOpen((shown) => !shown)}>ⓘ Help</button>
    </header>
    <p className="ql206-warning" role="note"><strong>DESIGN TEST ONLY · REAL ACCESS DENIED.</strong> Personas are invented dropdown choices, never authenticated identities or credentials. No login, Supabase rule, tenant grant, customer read, outgoing message, approval, audit persistence or provider connection is performed.</p>
    {helpOpen && <div className="ql206-help" id="ql206-help" role="note"><p>Select a fictional persona, an allowed connector sample and an operation. Try a foreign company, isolated campground, property-scoped staff role, and send action. A design match demonstrates the proposed policy only: verified identity stays NO and runtime remains DISABLED. Record a test to keep a short in-memory result log; switching companies or refreshing resets it.</p></div>}
    {selected ? <>
      <div className="ql206-controls">
        <div><label htmlFor="ql206-persona">Fictional operator persona</label><select id="ql206-persona" value={profileId} onChange={(event) => setProfileId(event.target.value)}>{mockOperatorProfiles.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></div>
        <div><label htmlFor="ql206-sample">Company-scoped fictional inquiry</label><select id="ql206-sample" value={selected.id} onChange={(event) => setSampleId(event.target.value)}>{samples.map((item) => <option value={item.id} key={item.id}>{item.reference} · {item.title}</option>)}</select></div>
        <div><label htmlFor="ql206-operation">Test operation</label><select id="ql206-operation" value={operation} onChange={(event) => setOperation(event.target.value as MockSecurityOperation)}>{mockSecurityOperations.map((entry) => <option value={entry.id} key={entry.id}>{entry.label}</option>)}</select></div>
      </div>
      <div className="ql206-outcome" role="status" aria-live="polite" aria-atomic="true">
        <strong>{decision?.designAllows ? 'DESIGN MATCH · RUNTIME DENIED' : 'DESIGN DENIED · RUNTIME DENIED'}</strong>
        <p>{decision?.explanation}</p>
        <dl><div><dt>Verified session</dt><dd>NO</dd></div><div><dt>Company scope</dt><dd>{profile.organizationId ?? 'None'}</dd></div><div><dt>Tenant / property scope</dt><dd>{profile.tenantId ?? 'Not assigned'}{profile.propertyId ? ` / ${profile.propertyId}` : ''}</dd></div><div><dt>Actual provider or database operation</dt><dd>DISABLED</dd></div></dl>
      </div>
      <div className="ql206-log-actions"><button type="button" onClick={recordCheck}>Record simulated test</button><button type="button" onClick={() => setChecks([])} disabled={checks.length === 0}>Clear session test log</button></div>
      <div className="ql206-log"><h5>Session-only test results ({checks.length})</h5>{checks.length === 0 ? <p>No access scenarios recorded yet.</p> : <ol>{checks.map((check) => <li key={check.id}><strong>{check.result}</strong> · {check.profile} · {check.operation} · {check.reference}</li>)}</ol>}</div>
    </> : <p role="alert">No eligible fictional connector inquiries are available for this company. All access tests are held.</p>}
    <p className="ql206-footer">Before real access: private authentication, server-side company and tenant checks, object-level authorization, least-privilege roles, immutable audit, privacy/consent review, adversarial isolation tests and explicit owner sign-off are required. This panel cannot satisfy those gates.</p>
  </section>;
}
