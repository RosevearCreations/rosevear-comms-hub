import {useState,type Dispatch,type SetStateAction} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL290_OBSERVED_AT,QL290_ORIGIN_GATES,QL290_ORIGIN_REASONS,
  QL290_ATTESTATION_GATES,QL290_WITNESS_REASONS,QL290_PRIORITY_REASONS,
  ql290PrepareOrigin,ql290PrepareAttestation,ql290PreparePriority,
  ql290PriorityReport,ql290PinnedProofUrl,ql290AuditPacket,
  type Ql290OriginReason,type Ql290WitnessReason,type Ql290PriorityReason,
  type Ql290OriginReconciliation,type Ql290WitnessAttestation,type Ql290PriorityItem
} from './ql290OriginWitnessPriority';
import type {Ql289ReviewerChallenge,Ql289WitnessClosureReadiness,
  Ql289ReceiptAgingFollowup} from './ql289ProvenanceWitnessReceiptAging';
import './ql289-provenance-witness-aging.css';
import './ql290-origin-witness-priority.css';

type Workstream='origins'|'attestation'|'priority';
type PriorityFilter='all'|'P0'|'P1';
const nameFor=(source:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===source)?.label??source;

export function Ql290OriginWitnessPriority({reviewerPredecessors,witnessPredecessors,
  sourcePredecessors,origins,setOrigins,attestations,setAttestations,priorities,setPriorities,
  onOpenQl289,onOpenEvidence}:{
    reviewerPredecessors:readonly Ql289ReviewerChallenge[];
    witnessPredecessors:readonly Ql289WitnessClosureReadiness[];
    sourcePredecessors:readonly Ql289ReceiptAgingFollowup[];
    origins:Ql290OriginReconciliation[];setOrigins:Dispatch<SetStateAction<Ql290OriginReconciliation[]>>;
    attestations:Ql290WitnessAttestation[];setAttestations:Dispatch<SetStateAction<Ql290WitnessAttestation[]>>;
    priorities:Ql290PriorityItem[];setPriorities:Dispatch<SetStateAction<Ql290PriorityItem[]>>;
    onOpenQl289:()=>void;onOpenEvidence:()=>void;
  }){
  const [workstream,setWorkstream]=useState<Workstream>('priority');
  const [filter,setFilter]=useState<PriorityFilter>('all');
  const [selectedReviewer,setSelectedReviewer]=useState('');
  const [originRef,setOriginRef]=useState('');
  const [originReason,setOriginReason]=useState<Ql290OriginReason>('RECEIPT_ORIGIN_NOT_CORROBORATED');
  const [selectedWitness,setSelectedWitness]=useState<Ql270SourceId>('rosiedazzlers');
  const [witnessRef,setWitnessRef]=useState('');
  const [witnessReason,setWitnessReason]=useState<Ql290WitnessReason>('SIGNED_ORIGINAL_ABSENT');
  const [selectedSource,setSelectedSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [priorityRef,setPriorityRef]=useState('');
  const [priorityReason,setPriorityReason]=useState<Ql290PriorityReason>('PIN_DRIFT_AND_ORIGINAL_ABSENT');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('QL-290 public-only snapshot: five moved pins, one stable pin, six original HTTP 404 exceptions. No private access, contact or transmission.');
  const report=ql290PriorityReport(asOf,sourcePredecessors);
  const visible=report.rows.filter(row=>filter==='all'||row.priority===filter);
  const reviewer=reviewerPredecessors.find(row=>row.challengeReference===selectedReviewer)??reviewerPredecessors[0];
  const witness=witnessPredecessors.find(row=>row.source===selectedWitness)??witnessPredecessors[0];
  const source=sourcePredecessors.find(row=>row.source===selectedSource)??sourcePredecessors[0];
  const packet=ql290AuditPacket(origins,attestations,priorities,asOf,sourcePredecessors);

  function recordOrigin(){
    if(!reviewer){setFeedback('Prepare an unverified QL-289 reviewer challenge case first.');return;}
    const result=ql290PrepareOrigin(reviewer,originRef,originReason,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setOrigins(old=>[...old.filter(item=>item.previousCase!==result.draft.previousCase),result.draft]);
    setOriginRef('');setFeedback('Unverified origin comparison prepared locally. No reviewer or issuer authenticated; no challenge issued.');
  }
  function recordWitness(){
    if(!witness){setFeedback('Prepare an unresolved QL-289 witness closure readiness case first.');return;}
    const result=ql290PrepareAttestation(witness,witnessRef,witnessReason,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setAttestations(old=>[...old.filter(item=>item.source!==result.draft.source),result.draft]);
    setWitnessRef('');setFeedback('Original witness attestation preflight recorded locally. No original arrived and no conflict closed.');
  }
  function recordPriority(){
    if(!source){setFeedback('Prepare a QL-289 unsent original receipt aging case first.');return;}
    const result=ql290PreparePriority(source,priorityRef,priorityReason,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setPriorities(old=>[...old.filter(item=>item.source!==result.draft.source),result.draft]);
    setPriorityRef('');setFeedback('Local exception priority recorded. It was not scheduled, sent, executed or independently rechecked.');
  }
  async function copyPacket(){
    try{if(!navigator.clipboard?.writeText)throw Error('Unavailable');
      await navigator.clipboard.writeText(packet);
      setFeedback('Unverified QL-290 local/public packet copied. Nothing transmitted.');}
    catch{setFeedback('Clipboard unavailable. Packet is still visible below; nothing transmitted.');}
  }

  return <section className="ql277-review ql289-desk ql290-desk" data-ql290-desk aria-labelledby="ql290-title">
    <header className="ql277-heading"><div><p className="ql271-eyebrow">QL-290 · Original evidence and six-source exception worklist</p>
      <h4 id="ql290-title">Reviewer origin reconciliation · Witness attestation preflight · Source priority queue</h4>
      <p>We can inspect public source exceptions and prepare nonsecret local case references. No form here proves a signer, contacts an independent reviewer, authorizes a source connection or performs a private GET.</p>
    </div><span>DISCONNECTED / HOLD</span></header>

    <div className="ql277-stats" aria-label="QL-290 origin attestation and immutable source status">
      <div><small>Unverified reviewer origin gates</small><strong>0 / 7</strong><em>{origins.length} local case(s) · no challenge issued</em></div>
      <div><small>Original witness attestation gates</small><strong>0 / 6</strong><em>{attestations.length} local preflight(s)</em></div>
      <div><small>Public source exceptions</small><strong>{report.priorityP0} P0 · {report.priorityP1} P1</strong><em>{report.missing} originals absent · {report.changed} pins moved</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later</em></div>
    </div>

    <nav className="ql277-tabs" aria-label="QL-290 evidence review workstreams">
      <button type="button" className={workstream==='priority'?'active':''} aria-current={workstream==='priority'?'page':undefined} onClick={()=>setWorkstream('priority')}>01 Six-app priority queue</button>
      <button type="button" className={workstream==='origins'?'active':''} aria-current={workstream==='origins'?'page':undefined} onClick={()=>setWorkstream('origins')}>02 Reviewer origin</button>
      <button type="button" className={workstream==='attestation'?'active':''} aria-current={workstream==='attestation'?'page':undefined} onClick={()=>setWorkstream('attestation')}>03 Witness attestation</button>
    </nav>

    {workstream==='priority'&&<section className="ql277-card" aria-labelledby="ql290-priority-title">
      <div className="ql290-section-head"><div><h5 id="ql290-priority-title">Six-app immutable source exception priority queue <span>{report.freshness.replaceAll('_',' ')}</span></h5>
        <p>Public `main` SHAs and immutable Proof-B paths checked at <time dateTime={QL290_OBSERVED_AT}>{QL290_OBSERVED_AT}</time>. Five moved; Yard Workers is stable. All six original paths returned HTTP 404. P0 = changed pin plus missing original; P1 = stable pin plus missing original. Neither priority implies acceptance.</p></div>
        <button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Snapshot age recalculated; this did not perform a new public or authenticated GET.');}}>Recalculate age only</button></div>
      <div className="ql283-timestamp-strip"><span><strong>Snapshot age</strong>{report.ageHours===null?'Clock review':`${report.ageHours} hour(s)`}</span><span><strong>Independent recheck due</strong>{report.nextRecheckAt}</span><span><strong>Originals accepted</strong>0</span><span><strong>Local unsent priorities</strong>{priorities.length}</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter QL-290 source priorities">
        <button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All ({report.sources})</button>
        <button type="button" aria-pressed={filter==='P0'} onClick={()=>setFilter('P0')}>P0 changed ({report.priorityP0})</button>
        <button type="button" aria-pressed={filter==='P1'} onClick={()=>setFilter('P1')}>P1 stable ({report.priorityP1})</button></div>
      <div className="ql290-source-list" aria-label="QL-290 immutable source priority ledger">
        {visible.map(row=><article key={row.source} className="ql290-source-card">
          <div className="ql290-source-title"><strong>{nameFor(row.source)}</strong><span className={`ql290-priority ${row.priority.toLowerCase()}`}>{row.priority} · {row.moved?'SHA changed':'SHA stable'}</span></div>
          <p>Original Proof-B <b>HTTP {row.http} — NOT RECEIVED</b> · {row.linkedPredecessors} unexecuted prior case(s)</p>
          <div className="ql290-source-meta"><code title={`QL-289 ${row.previousSha} → QL-290 ${row.sha}`}>{row.previousSha?.slice(0,10)} → {row.sha.slice(0,10)}</code>
            <a href={ql290PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer" aria-label={`Open immutable original Proof-B path for ${nameFor(row.source)}`}>Open public immutable path ↗</a></div>
        </article>)}</div>
      <div className="ql284-subsection"><h6>Prepare an unsent source exception priority item</h6>
        {sourcePredecessors.length===0?<p className="ql284-secondary-copy">All six public exceptions are shown above. Creating a local follow-up requires an intact QL-289 unsent receipt-aging case from this session.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql290-priority-source">QL-289 unsent predecessor
          <select id="ql290-priority-source" disabled={!source} value={source?.source??''} onChange={e=>setSelectedSource(e.target.value as Ql270SourceId)}>{!source?<option value="">No local predecessor</option>:sourcePredecessors.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql290-priority-reason">Exception priority reason
            <select id="ql290-priority-reason" value={priorityReason} onChange={e=>setPriorityReason(e.target.value as Ql290PriorityReason)}>{QL290_PRIORITY_REASONS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
          <label htmlFor="ql290-priority-ref">Distinct nonsecret case reference<input id="ql290-priority-ref" maxLength={32} value={priorityRef} onChange={e=>setPriorityRef(e.target.value)} placeholder="PRIORITY-290-CASE"/></label></div>
        <div className="ql277-actions"><button type="button" disabled={!source} onClick={recordPriority}>Prepare unsent priority item</button><button type="button" className="secondary" onClick={onOpenQl289}>Open QL-289 source aging</button></div>
        <div className="ql277-results">{priorities.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.priority} · {row.reason.replaceAll('_',' ')}</span><small>QL-289 {row.previousCase} · {row.previousSha.slice(0,10)} → {row.currentSha.slice(0,10)}</small><p>Scheduled NO · sent NO · executed NO · original accepted NO.</p></article>)}</div></div>
      <p className="ql277-warning">ⓘ Priority is a local review order only. A missing path, source SHA movement or later public HTTP 200 cannot authenticate a signature, independent witness, owner or recipient.</p>
    </section>}

    {workstream==='origins'&&<section className="ql277-card" aria-labelledby="ql290-origin-title"><h5 id="ql290-origin-title">Independent reviewer challenge origin reconciliation <span>0 AUTHENTICATED</span></h5>
      <p>Compare *claimed* QL-289 reviewer/issuer origins while keeping each original challenge, identity and authority prerequisite open. We do not issue a nonce, verify a key or accept a decision.</p>
      <div className="ql289-gate-matrix" aria-label="Seven unresolved reviewer origin reconciliation gates">{QL290_ORIGIN_GATES.map((row,i)=><div key={row.id}><b>{String(i+1).padStart(2,'0')}</b><span>{row.label}</span><strong>{row.status.replaceAll('_',' ')}</strong></div>)}</div>
      {reviewerPredecessors.length===0?<div className="ql279-empty"><strong>No QL-289 reviewer provenance challenge in this session.</strong><p>Open QL-289 to prepare an unissued local challenge matrix first.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql290-reviewer-case">QL-289 unissued reviewer case
        <select id="ql290-reviewer-case" disabled={!reviewer} value={reviewer?.challengeReference??''} onChange={e=>setSelectedReviewer(e.target.value)}>{!reviewer?<option value="">No local challenge</option>:reviewerPredecessors.map(row=><option key={row.challengeReference} value={row.challengeReference}>{row.challengeReference} · {row.reviewerCase}</option>)}</select></label>
        <label htmlFor="ql290-origin-reason">Uncorroborated origin condition<select id="ql290-origin-reason" value={originReason} onChange={e=>setOriginReason(e.target.value as Ql290OriginReason)}>{QL290_ORIGIN_REASONS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql290-origin-ref">New nonsecret reconciliation reference<input id="ql290-origin-ref" maxLength={32} value={originRef} onChange={e=>setOriginRef(e.target.value)} placeholder="ORIGIN-290-CASE"/></label></div>
      <div className="ql277-actions"><button type="button" disabled={!reviewer} onClick={recordOrigin}>Prepare unverified origin comparison</button><button type="button" className="secondary" onClick={onOpenQl289}>Open QL-289 challenge matrix</button></div>
      <div className="ql277-results">{origins.map(row=><article key={row.reference}><strong>{row.reference} · {row.previousCase}</strong><span>{row.reason.replaceAll('_',' ')}</span><small>Claimed reviewer {row.reviewerCase} · claimed issuer {row.issuerCase}</small><p>Signed original NOT RECEIVED · issued challenge NO · independent decision accepted NO.</p></article>)}</div>
      <p className="ql277-warning">ⓘ A local case string is not the original issuer, signature or identity evidence. Never paste protected receipts or credentials.</p>
    </section>}

    {workstream==='attestation'&&<section className="ql277-card" aria-labelledby="ql290-witness-title"><h5 id="ql290-witness-title">Original Proof-B witness attestation preconditions <span>NO ORIGINAL</span></h5>
      <p>The six original attestation requirements remain unmet. A local preflight may track the missing source pin and original chain but cannot act as a signature, independent witness or custodian resolution receipt.</p>
      <div className="ql289-gate-matrix" aria-label="Six unmet original Proof-B witness attestation gates">{QL290_ATTESTATION_GATES.map((row,i)=><div key={row.id}><b>{String(i+1).padStart(2,'0')}</b><span>{row.label}</span><strong>{row.status.replaceAll('_',' ')}</strong></div>)}</div>
      {witnessPredecessors.length===0?<div className="ql279-empty"><strong>No QL-289 open witness closure case in this session.</strong><p>Prepare an unresolved original custody case in QL-289 first.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql290-witness-source">QL-289 unresolved witness case
        <select id="ql290-witness-source" disabled={!witness} value={witness?.source??''} onChange={e=>setSelectedWitness(e.target.value as Ql270SourceId)}>{!witness?<option value="">No local witness case</option>:witnessPredecessors.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql290-witness-reason">Unmet attestation requirement<select id="ql290-witness-reason" value={witnessReason} onChange={e=>setWitnessReason(e.target.value as Ql290WitnessReason)}>{QL290_WITNESS_REASONS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql290-witness-ref">New nonsecret attestation case<input id="ql290-witness-ref" maxLength={32} value={witnessRef} onChange={e=>setWitnessRef(e.target.value)} placeholder="ATTEST-290-CASE"/></label></div>
      <div className="ql277-actions"><button type="button" disabled={!witness} onClick={recordWitness}>Prepare unresolved attestation preflight</button><button type="button" className="secondary" onClick={onOpenQl289}>Open QL-289 witness readiness</button><button type="button" className="secondary" onClick={onOpenEvidence}>Inspect public evidence</button></div>
      <div className="ql277-results">{attestations.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.reason.replaceAll('_',' ')}</span><small>QL-289 {row.previousCase} · {row.previousSha.slice(0,10)} → {row.currentSha.slice(0,10)}</small><p>Original NOT RECEIVED · witness NOT AUTHENTICATED · attestation NOT RECEIVED · closure approved NO.</p></article>)}</div>
      <p className="ql277-warning">ⓘ Witness closure remains blocked until the authentic original, signatures, independent identities, custody chain and owner TEST approval are independently verified.</p>
    </section>}

    <section className="ql277-card ql283-parked-note" aria-labelledby="ql290-ack-title"><h5 id="ql290-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5><p><strong>Parked for later.</strong> No acknowledgement evidence delivery, alert, escalation, routing or acceptance has begun. All six integrations remain DISCONNECTED / HOLD.</p></section>
    <section className="ql277-card" aria-labelledby="ql290-packet-title"><h5 id="ql290-packet-title">QL-290 original-origin and source-priority packet <span>LOCAL · NOT SENT</span></h5>
      <label className="ql277-note-label" htmlFor="ql290-packet">Read-only public observations and unverified local references<textarea id="ql290-packet" readOnly rows={10} value={packet}/></label>
      <div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy unverified QL-290 packet</button><button type="button" className="secondary" onClick={()=>{setOrigins([]);setAttestations([]);setPriorities([]);setFeedback('Only QL-290 local drafts cleared; public observations, QL-289 cases and parked ACK are unchanged.');}}>Clear QL-290 local drafts</button></div>
      <p role="status" aria-live="polite" className="ql287-feedback">{feedback}</p></section>
  </section>;
}
