import {useState} from 'react';
import type {OperatorWorkspace} from './ql191Organizations';
import {QL270_SOURCES,ql270PrepareLocalPlan,
  ql270PublicProofUrl,QL270_PROOF_SNAPSHOT,QL270_OBSERVED_ON,
  type Ql270SourceId}
  from './ql270ConnectionCentre';
import {QL274_OBSERVED_AT,QL274_PUBLIC_PROOF_RECHECK,ql274PinnedProofUrl} from './ql274CommandAudit';
import {QL276_OBSERVED_AT,QL276_PUBLIC_SOURCE_RECHECK,ql276PinnedProofUrl} from './ql276EvidenceIntake';
import {QL277_OBSERVED_AT,QL277_PUBLIC_SOURCE_RECHECK,ql277PinnedProofUrl} from './ql277DriftReview';
import {QL278_OBSERVED_AT,QL278_PUBLIC_SOURCE_RECHECK,ql278PinnedProofUrl} from './ql278FollowupDesk';
import {QL279_OBSERVED_AT,QL279_PUBLIC_SOURCE_RECHECK,ql279PinnedProofUrl} from './ql279ReviewerCustodyEscalation';
import {QL280_OBSERVED_AT,QL280_PUBLIC_SOURCE_RECHECK,ql280PinnedProofUrl} from './ql280ReceiptReconciliation';
import {QL281_OBSERVED_AT,QL281_PUBLIC_SOURCE_RECHECK,ql281PinnedProofUrl} from './ql281SignatureProofCustody';
import {QL282_OBSERVED_AT,QL282_PUBLIC_SOURCE_RECHECK,ql282PinnedProofUrl} from './ql282IssuerPublicationReview';
import {QL283_OBSERVED_AT,QL283_PUBLIC_SOURCE_RECHECK,ql283PinnedProofUrl} from './ql283IssuerTrustOwnerFollowup';
import './ql270-connections.css';

export function Ql270Connections({onNavigate}:{onNavigate:(view:OperatorWorkspace)=>void}){
  const [selected,setSelected]=useState<Ql270SourceId>('rosiedazzlers');
  const [aliases,setAliases]=useState<Partial<Record<Ql270SourceId,string>>>({});
  const [planStatus,setPlanStatus]=useState<Partial<Record<Ql270SourceId,ReturnType<typeof ql270PrepareLocalPlan>>>>({});
  const [help,setHelp]=useState(false);
  const source=QL270_SOURCES.find(row=>row.id===selected)??QL270_SOURCES[0];
  const sourceSnapshot=QL270_PROOF_SNAPSHOT.find(row=>row.source===selected);
  const recentProof=QL274_PUBLIC_PROOF_RECHECK.find(row=>row.source===selected);
  const latestProof=QL276_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const driftProof=QL277_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const followupProof=QL278_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const arrivalProof=QL279_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const reconciledProof=QL280_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const signatureProof=QL281_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const exceptionProof=QL282_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const trustProof=QL283_PUBLIC_SOURCE_RECHECK.find(row=>row.source===selected);
  const readyDrafts=Object.values(planStatus).filter(x=>x?.tenantAliasValid).length;

  function prepare(){
    setPlanStatus(old=>({...old,[selected]:ql270PrepareLocalPlan(selected,(aliases[selected]??'').trim())}));
  }

  return <section className="ql270-connect" data-ql270-mode="disabled-preview" aria-labelledby="ql270-title">
    <header className="ql270-hero">
      <div>
        <p className="ql270-overline">QL-270 / IT Command / Connection orchestration</p>
        <h3 id="ql270-title">One hub. Six systems. Zero shortcuts around security.</h3>
        <p>Set up and inspect nonproduction connection plans here. Four apps serve our businesses;
          two shared systems support analytics and private local automation. Nothing is live yet.</p>
        <div className="ql270-hero-actions">
          <button type="button" onClick={()=>onNavigate('six_app_evidence')}>Open security evidence <span aria-hidden="true">↗</span></button>
          <button type="button" className="ql270-secondary" onClick={()=>setHelp(v=>!v)}
            aria-expanded={help} aria-controls="ql270-help">ⓘ How connecting works</button>
        </div>
      </div>
      <div className="ql270-orb" aria-hidden="true"><span>QL</span><small>HUB</small></div>
    </header>

    {help&&<aside className="ql270-explain" id="ql270-help" role="note">
      <h4>What happens when we connect?</h4>
      <p>Each business keeps its own customers, permissions and tenant. The Comms Hub would
        receive explicitly permitted message/quote/booking events. AI Data Platform would
        summarize authorized events across systems without silently merging customer records.
        Rosevear AI Hub would optionally power private, approved local AI workflows;
        its Windows relay is not installed for these tests. Neither supporting service is a fifth business.</p>
      <p>First, a genuine original signed source proof must be published and independently verified.
        A separate nonproduction tenant, scoped GET identity, human witness/reviewer and owner
        TEST-only permission must follow. Only then may an operator schedule a bounded read-only
        gateway trial. This UI cannot issue keys or grant authorization.</p>
    </aside>}

    <div className="ql270-metrics" aria-label="Real integration readiness">
      <article><span>Registered sources</span><strong>6 <small>/ 6</small></strong><div className="ql270-meter"><i style={{width:'100%'}}/></div><small>Known repository mappings only</small></article>
      <article><span>Signed proofs accepted</span><strong>0 <small>/ 6</small></strong><div className="ql270-meter"><i style={{width:'0%'}}/></div><small>QL-283 public recheck: six HTTP 404s</small></article>
      <article><span>Local TEST drafts</span><strong>{readyDrafts} <small>/ 6</small></strong><div className="ql270-meter"><i style={{width:`${readyDrafts/6*100}%`}}/></div><small>Session-only plans, not connections</small></article>
      <article><span>Live pilot holds</span><strong>12 <small>/ 12</small></strong><div className="ql270-meter ql270-meter-alert"><i style={{width:'100%'}}/></div><small>Calls, messaging and dispatch OFF</small></article>
    </div>

    <div className="ql270-map" role="group" aria-label="Integration roles and separation">
      <div className="ql270-map-centre"><span>◆</span><strong>Comms Hub</strong><small>Orchestrator · HELD</small></div>
      <div className="ql270-map-spokes"><div><strong>4 business apps</strong><small>Customer-specific operations</small></div>
        <span aria-hidden="true">⇄</span><div><strong>AI Data Platform</strong><small>Optional shared reporting</small></div>
        <span aria-hidden="true">⇄</span><div><strong>Rosevear AI Hub</strong><small>Optional private edge AI</small></div></div>
      <p>Planned data flows only · tenant boundaries remain separate · no deployed integration traffic</p>
    </div>

    <div className="ql270-section-heading"><div><p className="ql270-overline">Source registry</p><h4>Business applications</h4></div><span>4 customer-facing workspaces</span></div>
    <div className="ql270-source-grid">
      {QL270_SOURCES.filter(s=>s.kind==='Business app').map(s=><button type="button" key={s.id}
        className={`ql270-source ql270-${s.tone}${selected===s.id?' active':''}`}
        aria-pressed={selected===s.id} onClick={()=>setSelected(s.id)}>
        <span className="ql270-source-icon">{s.icon}</span><span><strong>{s.label}</strong><small>{s.benefit}</small></span>
        <em>HOLD</em>
      </button>)}
    </div>
    <div className="ql270-section-heading"><div><p className="ql270-overline">Shared infrastructure</p><h4>Supporting applications</h4></div><span>2 optional services, separately authorized</span></div>
    <div className="ql270-source-grid ql270-support-grid">
      {QL270_SOURCES.filter(s=>s.kind!=='Business app').map(s=><button type="button" key={s.id}
        className={`ql270-source ql270-${s.tone}${selected===s.id?' active':''}`}
        aria-pressed={selected===s.id} onClick={()=>setSelected(s.id)}>
        <span className="ql270-source-icon">{s.icon}</span><span><strong>{s.label}</strong><small>{s.benefit}</small></span>
        <em>HOLD</em>
      </button>)}
    </div>

    <section className="ql270-inspector" aria-labelledby="ql270-inspector-title">
      <div className="ql270-inspector-heading"><div><p className="ql270-overline">IT / Connection inspector</p>
        <h4 id="ql270-inspector-title">{source.label} <span>— {source.kind}</span></h4>
        <p>{source.scope}</p></div><span className="ql270-hold">● DISCONNECTED / HOLD</span></div>
      <div className="ql270-preflight">
        <div className="ql270-preflight-step"><span>01</span><strong>Create a TEST plan</strong><small>Alias &amp; nonproduction scope, local only</small></div>
        <div className="ql270-preflight-step"><span>02</span><strong>Verify source proof</strong><small>Public GitHub check ≠ authenticated signer</small></div>
        <div className="ql270-preflight-step"><span>03</span><strong>Independent approval</strong><small>Signer, reviewer, witness, tenant &amp; owner</small></div>
        <div className="ql270-preflight-step"><span>04</span><strong>Authorized GET trial</strong><small>2 positive + 7 denials, 15 min maximum</small></div>
      </div>
      <div className="ql270-form-grid">
        <div className="ql270-form-panel">
          <h5>Prepare a nonproduction profile</h5>
          <p>Use a generic alias only (for example <code>np-demo-lab</code>). Never enter a real
            tenant ID, password, token, domain or customer information.</p>
          <label htmlFor="ql270-tenant-alias">TEST tenant alias <span>(not provisioned)</span></label>
          <input id="ql270-tenant-alias" value={aliases[selected]??''} maxLength={35}
            placeholder="np-demo-lab" onChange={e=>{setAliases(old=>({...old,[selected]:e.currentTarget.value}));
              setPlanStatus(old=>({...old,[selected]:undefined}));}}/>
          <button type="button" onClick={prepare}>Validate local TEST plan</button>
          {planStatus[selected]&&<p role="status" className={planStatus[selected]?.tenantAliasValid?'ql270-note-good':'ql270-note-error'}>
            {planStatus[selected]?.tenantAliasValid?'Local plan prepared. Connection remains OFF; no tenant or credentials were created.':
              'Enter a non-secret alias starting np- (4–32 lowercase letters, digits or dashes after the prefix).'}</p>}
        </div>
        <div className="ql270-form-panel">
          <h5>Validate the public source file</h5>
          <p>QL-270 immutable commit ({QL270_OBSERVED_ON}): <code>{sourceSnapshot?.sha.slice(0,12)}</code> · original signed proof HTTP 404.
            New QL-274 public recheck ({new Date(QL274_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern) at <code>{recentProof?.sha.slice(0,12)}</code>: HTTP {recentProof?.http}. We can inspect either dated snapshot without contacting an application gateway.</p>
          <a className="ql270-public-check" href={ql270PublicProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open current public Proof-B source ↗</a>
          <a className="ql270-public-check ql274-public-pin" href={ql274PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open immutable QL-274 proof check ↗</a>
          <p>QL-276 public recheck ({new Date(QL276_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern) at <code>{latestProof?.sha.slice(0,12)}</code>: HTTP {latestProof?.http}. This reflects a newly checked immutable main commit, not live access to the source app.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql276PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open immutable QL-276 proof check ↗</a>
          <p>QL-277 public recheck ({new Date(QL277_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern) at a newer immutable main commit <code>{driftProof?.sha.slice(0,12)}</code>: HTTP {driftProof?.http}. This source SHA changed since QL-276 and the original proof remains absent.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql277PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open immutable QL-277 drift proof check ↗</a>
          <p>QL-278 dated follow-up ({new Date(QL278_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern): immutable main <code>{followupProof?.sha.slice(0,12)}</code> returned HTTP {followupProof?.http}. {followupProof?.sha === driftProof?.sha ? 'Main SHA unchanged since QL-277.' : 'Main SHA moved since QL-277.'} No original custody receipt was verified.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql278PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open immutable QL-278 Proof-B follow-up ↗</a>
          <p>QL-279 original arrival watch ({new Date(QL279_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern): latest checked immutable main <code>{arrivalProof?.sha.slice(0,12)}</code> · HTTP {arrivalProof?.http}. {arrivalProof?.sha===followupProof?.sha?'Same main SHA as QL-278.':'Main SHA changed since QL-278.'} Source proof and original custody/witness remain unverified.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql279PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open immutable QL-279 original proof watch ↗</a>
          <p>QL-280 original Proof-B return reconciliation ({new Date(QL280_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern): immutable main <code>{reconciledProof?.sha.slice(0,12)}</code> returned HTTP {reconciledProof?.http}. {reconciledProof?.sha===arrivalProof?.sha?'Main SHA unchanged since QL-279.':'Main SHA moved since QL-279.'} An original signed proof or independently authenticated receipt is still NOT VERIFIED.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql280PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">
            Open immutable QL-280 source proof reconciliation ↗</a>
          <p>QL-281 independent reviewer challenge and Proof-B publication freshness diff ({new Date(QL281_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern): immutable main <code>{signatureProof?.sha.slice(0,12)}</code> returned HTTP {signatureProof?.http}. {signatureProof?.sha===reconciledProof?.sha?'Main SHA unchanged since QL-280.':'Main SHA moved since QL-280.'} Original signed Proof-B, reviewer signature response and authenticated escalation acknowledgement custody remain NOT VERIFIED.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql281PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">Open immutable QL-281 original-proof freshness check ↗</a>
          <p>QL-282 original reviewer challenge issuer readiness and Proof-B publication exception triage ({new Date(QL282_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern): immutable main <code>{exceptionProof?.sha.slice(0,12)}</code> returned HTTP {exceptionProof?.http}. {exceptionProof?.sha===signatureProof?.sha?'Main SHA unchanged since QL-281.':'Main SHA moved since QL-281.'} The separate six-app acknowledgement delivery evidence workstream is now <strong>Under Review — parked for later</strong>; source integration protections remain unchanged.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql282PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">Open immutable QL-282 source publication exception ↗</a>
          <p>QL-283 independent public source SHA recheck ({new Date(QL283_OBSERVED_AT).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Toronto'})} Eastern): current immutable main <code>{trustProof?.sha.slice(0,12)}</code> returned HTTP {trustProof?.http}; {trustProof?.sha===exceptionProof?.sha?'SHA unchanged':'SHA changed'} since QL-282. Original Proof-B publication exception stays open. Issuer trust and source-owner references are local review drafts only; ACK delivery evidence is Under Review — parked.</p>
          <a className="ql270-public-check ql274-public-pin" href={ql283PinnedProofUrl(selected)} target="_blank" rel="noopener noreferrer">Open immutable QL-283 source recheck ↗</a>
          <p className="ql270-public-result" role="status">Last verified snapshot: HTTP 404 (QL-270); QL-274: HTTP {recentProof?.http}; QL-276: HTTP {latestProof?.http}; QL-277: HTTP {driftProof?.http}; QL-278: HTTP {followupProof?.http}; QL-279: HTTP {arrivalProof?.http}; QL-280: HTTP {reconciledProof?.http}; QL-281: HTTP {signatureProof?.http}; QL-282: HTTP {exceptionProof?.http}; latest dated public snapshot: HTTP {trustProof?.http} (QL-283) · DISCONNECTED / HOLD. Current response must be reviewed independently. Any source SHA change, later claim or 24-hour snapshot age requires a new independent public GET; original signed receipts, authenticated gateway and owner TEST approval remain absent.</p>
          <small>Even HTTP 200 would only confirm a file exists. It would not authenticate
            its signer, independent key pin, human witness, or tenant boundary.</small>
          <p><a href={`https://github.com/RosevearCreations/${sourceSnapshot?.repo}/tree/main`}
            target="_blank" rel="noopener noreferrer">View source repository ↗</a></p>
        </div>
      </div>
      <footer className="ql270-inspector-footer"><strong>GET trial cannot be scheduled.</strong>
        Missing original proof-B and private independent authorization. No server configuration
        or live app connection can be created from this disabled preview.
        <button type="button" onClick={()=>onNavigate('six_app_evidence')}>Review full security gates</button>
      </footer>
    </section>
  </section>;
}
