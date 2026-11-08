import {useState} from 'react';
import {getSupabaseClient} from '../supabase/client';
import {QL331_BOOTSTRAP_GATES,QL331_PUBLIC_SOURCES,QL331_REFERENCE_PROJECT,
  QL331_SNAPSHOT,ql331Readiness,ql331PreviewScope,ql331VerifyMasterAccess,
  type Ql331MasterReadGateway,type Ql331AccessResult,type Ql331RequestedScope} from './ql331MasterAccess';
import './ql331-master-control.css';

const SUMMARY=ql331Readiness();
const DEFAULT_SCOPE:Ql331RequestedScope='shell_metadata';
const titleLink='https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/QL-331-MASTER-IDENTITY-AND-SHELL-RLS.md';

export function Ql331MasterControl({mode='it_command'}:{
  mode?:'it_command'|'management'|'analytics'|'system_status'
}){
  const [shellId,setShellId]=useState<string>(QL331_PUBLIC_SOURCES[0].id);
  const [requested,setRequested]=useState<Ql331RequestedScope>(DEFAULT_SCOPE);
  const [verified,setVerified]=useState<Ql331AccessResult|null>(null);
  const [checking,setChecking]=useState(false);
  const [gatesOpen,setGatesOpen]=useState(false);
  const source=QL331_PUBLIC_SOURCES.find(s=>s.id===shellId)??QL331_PUBLIC_SOURCES[0];
  const scope=ql331PreviewScope(source.id,requested);
  const full=mode==='it_command';
  async function verify(){
    setChecking(true);
    setVerified(null);
    try{
      const client=getSupabaseClient() as unknown as Ql331MasterReadGateway|null;
      const reading=await ql331VerifyMasterAccess(client);
      setVerified(reading);
    }finally{setChecking(false);}
  }
  function reset(){setShellId(QL331_PUBLIC_SOURCES[0].id);setRequested(DEFAULT_SCOPE);setVerified(null);setGatesOpen(false);}

  return <section className="ql331" data-ql331-release="real-rls-guarded-master-registry-v1" aria-labelledby="ql331-title">
    <header className="ql331-header">
      <div><p className="ql271-eyebrow">QL-331 · Master identity, shell registry &amp; tenant entitlements</p>
        <h3 id="ql331-title">Authenticated master foundation — no inherited customer access</h3>
        <p>Master access must use a verified Supabase Auth user and <strong>PostgreSQL row-level security</strong>. Registration, roles and delegated grants are never read from editable browser claims. Connections to all six outside applications remain on HOLD.</p>
      </div>
      <strong className="ql331-hold">0 / 6 CONNECTED · HOLD</strong>
    </header>
    <div className="ql331-metrics">
      <article><span>Canonical sources</span><strong>{SUMMARY.sourceCount}</strong><small>{SUMMARY.businessShells} platform shells + {SUMMARY.supports} supporting services</small></article>
      <article><span>Registered Auth users at preflight</span><strong>{SUMMARY.masterAuthUsersAtPreflight}</strong><small>Snapshot dated {QL331_SNAPSHOT.observedDate}; not a live count</small></article>
      <article><span>Active master entitlements</span><strong>0</strong><small>No owner or child access was auto-enrolled</small></article>
      <article><span>External source GET / writes</span><strong>0 / 0</strong><small>No key custody, provider send or customer data</small></article>
    </div>
    <p role="note" className="ql331-warning"><strong>Historical QL-331 preflight, not a current entry gate:</strong> The Comms Hub project <code>{QL331_REFERENCE_PROJECT}</code> had zero Auth users when this snapshot was taken. A November 8, 2026 protected count found two Auth users and zero active owner memberships; the newer QL-367–374 personal portal handles actual MFA and enrollment. Original-owner signatures, membership verification, row-level security and all six external connection holds remain required. This dated panel grants no access.</p>
    {(full||mode==='system_status'||mode==='management')&&<section className="ql331-panel" aria-labelledby="ql331-session-heading">
      <h4 id="ql331-session-heading">Master session and database access verification</h4>
      <p>This explicit action checks <code>auth.getUser()</code> first and only then attempts database RLS-scoped SELECTs using the existing optional Supabase client. There is no automatic request on page load, no service-role key, and no data write.</p>
      <div className="ql331-actions">
        <button type="button" disabled={checking} onClick={()=>{void verify();}}>
          {checking?'Verifying signed-in identity…':'Verify authenticated master session'}</button>
        <button type="button" onClick={reset}>Reset local readback</button>
      </div>
      <div className="ql331-readback" role="status" aria-live="polite">
        <strong>{verified?.state??'NOT CHECKED · CLOSED BY DEFAULT'}</strong>
        <p>{verified?.message??'No session or permission has been checked. The local preview never authorizes a master user.'}</p>
        {verified&&<small>Verified identity: {verified.verifiedAuth?'YES':'NO'} · Role: {verified.role??'NONE'} · RLS-visible shells: {verified.readableShells.length} · Child grants verified: {verified.childReadCount} · External peers connected: {verified.peerConnections}</small>}
      </div>
    </section>}
    {full&&<>
      <section className="ql331-panel" aria-labelledby="ql331-sources-heading">
        <h4 id="ql331-sources-heading">Six-source shell registry · public identifiers only</h4>
        <div className="ql331-scroll" role="region" tabIndex={0} aria-label="Scrollable six-source shell and support register">
          <table><caption>Visible source names are planning metadata, not authenticated master records</caption>
            <thead><tr><th scope="col">Platform or supporting service</th><th scope="col">Connection identity</th><th scope="col">Child boundary</th><th scope="col">Connection</th></tr></thead>
            <tbody>{QL331_PUBLIC_SOURCES.map(item=><tr key={item.id}><th scope="row"><strong>{item.name}</strong><small>{item.kind==='business'?'Application shell':'Supporting service'}</small></th>
              <td><code>{item.id}</code><small>{item.sourceAppId}</small></td>
              <td>{item.kind==='business'?'Only source-owned child IDs with separate grants':item.permissionBoundary}
                {item.ownedExample&&<small>Illustrative child: {item.ownedExample}</small>}</td>
              <td>{item.status}</td></tr>)}</tbody></table>
        </div>
      </section>
      <section className="ql331-panel" aria-labelledby="ql331-boundary-heading">
        <h4 id="ql331-boundary-heading">Shell → child isolation rehearsal · local only</h4>
        <p>The selector shows what a future server must deny until the identity, shell grant and specific child grant are verified. Selecting a business never creates a tenant or connection.</p>
        <div className="ql331-controls"><label htmlFor="ql331-shell">Selected shell / support
          <select id="ql331-shell" value={source.id} onChange={e=>{setShellId(e.currentTarget.value);setVerified(null);}}>
            {QL331_PUBLIC_SOURCES.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label htmlFor="ql331-scope">Requested access
          <select id="ql331-scope" value={requested} onChange={e=>setRequested(e.currentTarget.value as Ql331RequestedScope)}>
            <option value="shell_metadata">Shell metadata</option><option value="child_records">Child records</option><option value="support_as_child">Support as child</option>
          </select></label>
        </div>
        <div className="ql331-decision" role="status" aria-live="polite"><strong>{scope.decision} · NO-GO PREVIEW</strong>
          <p>{scope.detail}</p><small>Actual database grants cannot be conferred by this control. Source GET: {scope.accesses}.</small></div>
      </section>
    </>}
    <section className="ql331-panel" aria-labelledby="ql331-gates-heading"><h4 id="ql331-gates-heading">Real owner enrollment prerequisites</h4>
      <p>There were zero Supabase Auth users in the independent preflight. The existing owner email allowlist is <em>not</em> a verified Auth session, and no login or owner ID was created automatically.</p>
      <button type="button" className="ql331-expand" aria-expanded={gatesOpen} aria-controls="ql331-gates"
        onClick={()=>setGatesOpen(s=>!s)}>{gatesOpen?'Hide':'Show'} authenticated bootstrap checklist</button>
      {gatesOpen&&<ol id="ql331-gates">{QL331_BOOTSTRAP_GATES.map(g=><li key={g.id}><strong>{g.label}</strong><span>{g.state.replaceAll('_',' ')}</span></li>)}</ol>}
      <p>Reference: <a href={titleLink} target="_blank" rel="noopener noreferrer">QL-331 source-grounded schema, safe enrollment, test and rollback guide</a>.</p>
    </section>
    <footer>Master owner enrolled: NOT YET · Child grants: 0 · Signed source permissions: 0 · Key custody: NOT PROVISIONED · Windows relay {QL331_SNAPSHOT.windowsRelay} · ACK {QL331_SNAPSHOT.ack}. The QL-331 software and database gates are separate from authentic source connection approval.</footer>
  </section>;
}
