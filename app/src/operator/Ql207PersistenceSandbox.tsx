import { useMemo, useRef, useState } from 'react';
import type { OrganizationId } from './ql191Organizations';
import { connectorContracts } from './ql199ConnectorContracts';
import { buildMockReviewQueue } from './ql204HandoffReviewQueue';
import { mockOperatorProfiles } from './ql206SecureOperations';
import { MockPersistenceSandbox, type MockPersistenceRequest, type MockPersistenceResult, type MockPersistenceStage } from './ql207PersistenceSandbox';
import './ql207-persistence-sandbox.css';

const defaultPersona: Record<OrganizationId, string> = {
  rosiedazzlers: 'rosie-reviewer', devilndove: 'dnd-reviewer',
  icamp: 'camp-rosevear-reviewer', yw: 'yw-rosevear-manager'
};

export function Ql207PersistenceSandbox({ organizationId }: { organizationId: OrganizationId }) {
  const [store] = useState(() => new MockPersistenceSandbox());
  const queue = useMemo(() => buildMockReviewQueue(organizationId, connectorContracts[organizationId]), [organizationId]);
  const [profileId, setProfileId] = useState(defaultPersona[organizationId]);
  const [sampleId, setSampleId] = useState('');
  const [stage, setStage] = useState<MockPersistenceStage>('triage_note');
  const [lastResult, setLastResult] = useState<MockPersistenceResult | null>(null);
  const [lastRequest, setLastRequest] = useState<MockPersistenceRequest | null>(null);
  const [revision, setRevision] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const requestSeq = useRef(1);
  const items = queue.ok ? queue.items : [];
  const selected = items.find((item) => item.id === sampleId) ?? items[0];
  const profile = mockOperatorProfiles.find((person) => person.id === profileId) ?? mockOperatorProfiles[0];
  const visible = store.visibleTo(organizationId, profile);
  const current = selected ? visible.find((record) => record.itemId === selected.id) : undefined;
  void revision; // The revision clock re-renders after a store mutation.

  function attempt(mode: 'save' | 'retry' | 'stale') {
    if (!selected) return;
    const request: MockPersistenceRequest = mode === 'retry' && lastRequest ? lastRequest : {
      organizationId, contract: connectorContracts[organizationId], profile, item: selected, stage,
      expectedVersion: mode === 'stale' ? Math.max(0, (current?.version ?? 0) - 1) : (current?.version ?? 0),
      requestId: `demo-${requestSeq.current++}`
    };
    const result = store.save(request);
    setLastResult(result);
    if (mode !== 'retry') setLastRequest(request);
    setRevision((value) => value + 1);
  }

  function clear() { store.clear(); setLastResult(null); setLastRequest(null); requestSeq.current = 1; setRevision((value) => value + 1); }
  function changePersona(value: string) { setProfileId(value); setLastRequest(null); setLastResult(null); }
  function changeSample(value: string) { setSampleId(value); setLastRequest(null); setLastResult(null); }

  return <section className="ql207-sandbox" data-ql207-release="ql207-supabase-tenant-persistence-sandbox-mock-v1" aria-labelledby="ql207-title">
    <header className="ql207-header"><div><p className="ql191-eyebrow">QL-207 · Database readiness</p><h4 id="ql207-title">Tenant-isolated persistence sandbox</h4><p>Exercise mock save, scoped read, idempotent retry and conflicting revisions before any private Supabase rollout.</p></div>
      <button type="button" className="ql191-help-button" aria-expanded={helpOpen} aria-controls="ql207-help" onClick={() => setHelpOpen((open) => !open)}>ⓘ Help</button></header>
    <p role="note" className="ql207-warning"><strong>OFFLINE REHEARSAL · NO SUPABASE WRITES.</strong> This is a browser-memory stand-in for a future private database. It accepts only fictional connector fixtures and fixed stage labels, never real names, contact details, credentials or messages. Refreshing or switching companies discards the exercise.</p>
    {helpOpen && <div className="ql207-help" id="ql207-help" role="note">Pick a fictional reviewer and inquiry, save a versioned checkpoint, retry the same request key to prove duplicate suppression, then try an old revision to see a conflict. Pick a reviewer from a different company, an isolated campground or a different YW property to test denial. Only authorized fictional rows appear in the read list. None of these outcomes is real authentication, an RLS test against Supabase, a durable audit, a quote, a booking, or permission to send.</div>}
    {selected ? <>
      <div className="ql207-controls">
        <div><label htmlFor="ql207-persona">Fictional operator</label><select id="ql207-persona" value={profileId} onChange={(event) => changePersona(event.target.value)}>{mockOperatorProfiles.map((person) => <option value={person.id} key={person.id}>{person.label}</option>)}</select></div>
        <div><label htmlFor="ql207-sample">Selected company handoff</label><select id="ql207-sample" value={selected.id} onChange={(event) => changeSample(event.target.value)}>{items.map((item) => <option value={item.id} key={item.id}>{item.reference} · {item.title}</option>)}</select></div>
        <div><label htmlFor="ql207-stage">Fictional checkpoint stage</label><select id="ql207-stage" value={stage} onChange={(event) => { setStage(event.target.value as MockPersistenceStage); setLastRequest(null); setLastResult(null); }}><option value="triage_note">Triage note (mock)</option><option value="human_review_needed">Human review needed (mock)</option></select></div>
      </div>
      <div className="ql207-actions"><button type="button" onClick={() => attempt('save')}>Save fictional checkpoint in memory</button><button type="button" onClick={() => attempt('retry')} disabled={!lastRequest}>Replay last request key</button><button type="button" onClick={() => attempt('stale')} disabled={!current}>Test stale version rejection</button><button type="button" onClick={clear}>Clear sandbox memory</button></div>
      <div className="ql207-outcome" role="status" aria-live="polite">
        {lastResult ? <><strong>{lastResult.ok ? lastResult.replayed ? 'DUPLICATE SUPPRESSED · NO NEW VERSION' : 'FICTIONAL SNAPSHOT SAVED IN MEMORY' : `BLOCKED · ${lastResult.reason}`}</strong><p>{lastResult.ok ? `Record ${lastResult.record.reference}, version ${lastResult.record.version}. No network or database activity.` : lastResult.explanation}</p></> : <p>No sandbox transaction attempted yet.</p>}
      </div>
      <section className="ql207-records" aria-label="Scoped mock read results"><h5>Visible fictional snapshots ({visible.length})</h5>{visible.length ? <ul>{visible.map((record) => <li key={record.key}><strong>{record.reference}</strong> · v{record.version} · {record.stage === 'triage_note' ? 'Triage note' : 'Human review needed'} <small>Tenant: {record.tenantId ?? 'Single company'}{record.propertyId ? ` · Property: ${record.propertyId}` : ''}</small></li>)}</ul> : <p>No fictional snapshots are visible to this selected persona.</p>}</section>
    </> : <p role="alert">All fictional sources are held. Nothing can be written or read.</p>}
    <p className="ql207-footer">Prepared separately: a non-executed, private-schema Supabase/RLS proposal. Production DB tables and migrations are unchanged. Real persistence requires a dedicated development project, server-authenticated identity, verified tenant membership, RLS tests with actual tokens, audit/retention design and explicit owner approval.</p>
  </section>;
}
