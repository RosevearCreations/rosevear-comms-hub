import {useState,type Dispatch,type SetStateAction} from 'react';
import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import type {Ql288ReviewerIndependenceAudit,Ql288CustodianResolutionPreflight,
  Ql288ImmutableExceptionQueue} from './ql288ReceiptCustodianSourceQueue';
import {QL289_OBSERVED_AT,QL289_REVIEWER_CHALLENGE_GATES,QL289_REVIEWER_CHALLENGE_FOCUS,
  QL289_WITNESS_CLOSURE_GATES,QL289_WITNESS_GAPS,QL289_RECEIPT_AGING_REASONS,
  ql289PrepareReviewerChallenge,ql289PrepareWitnessClosure,ql289PrepareReceiptAging,
  ql289ExceptionReceiptAging,ql289PinnedProofUrl,ql289AuditPacket,
  type Ql289ReviewerFocus,type Ql289WitnessGap,type Ql289ReceiptAgingReason,
  type Ql289ReviewerChallenge,type Ql289WitnessClosureReadiness,
  type Ql289ReceiptAgingFollowup} from './ql289ProvenanceWitnessReceiptAging';
import './ql288-receipt-custodian-source.css';
import './ql289-provenance-witness-aging.css';

type Topic='reviewer'|'witness'|'aging';
type Filter='all'|'changed'|'unchanged';
const nameFor=(id:Ql270SourceId)=>QL270_SOURCES.find(row=>row.id===id)?.label??id;

export function Ql289ProvenanceWitnessReceiptAging({reviewerPredecessors,custodianPredecessors,
  sourcePredecessors,challenges,setChallenges,witnesses,setWitnesses,agingDrafts,setAgingDrafts,
  onOpenQl288,onOpenEvidence}:{
  reviewerPredecessors:readonly Ql288ReviewerIndependenceAudit[];
  custodianPredecessors:readonly Ql288CustodianResolutionPreflight[];
  sourcePredecessors:readonly Ql288ImmutableExceptionQueue[];
  challenges:Ql289ReviewerChallenge[];setChallenges:Dispatch<SetStateAction<Ql289ReviewerChallenge[]>>;
  witnesses:Ql289WitnessClosureReadiness[];setWitnesses:Dispatch<SetStateAction<Ql289WitnessClosureReadiness[]>>;
  agingDrafts:Ql289ReceiptAgingFollowup[];setAgingDrafts:Dispatch<SetStateAction<Ql289ReceiptAgingFollowup[]>>;
  onOpenQl288:()=>void;onOpenEvidence:()=>void;
}){
  const [topic,setTopic]=useState<Topic>('reviewer');
  const [filter,setFilter]=useState<Filter>('all');
  const [selectedReviewer,setSelectedReviewer]=useState('');
  const [challengeRef,setChallengeRef]=useState('');
  const [reviewerFocus,setReviewerFocus]=useState<Ql289ReviewerFocus>('REVIEWER_RECEIPT_SOURCE_UNCORROBORATED');
  const [selectedWitness,setSelectedWitness]=useState<Ql270SourceId>('rosiedazzlers');
  const [witnessRef,setWitnessRef]=useState('');
  const [witnessGap,setWitnessGap]=useState<Ql289WitnessGap>('ORIGINAL_PROOF_STILL_ABSENT');
  const [selectedAging,setSelectedAging]=useState<Ql270SourceId>('rosiedazzlers');
  const [agingRef,setAgingRef]=useState('');
  const [agingReason,setAgingReason]=useState<Ql289ReceiptAgingReason>('PIN_CHANGED_RECEIPT_NOT_RECEIVED');
  const [asOf,setAsOf]=useState(()=>new Date());
  const [feedback,setFeedback]=useState('QL-289 actual immutable source recheck: all six pins moved, all six original Proof-B paths still HTTP 404. Local matrix and queue controls do not transmit.');
  const report=ql289ExceptionReceiptAging(asOf,sourcePredecessors);
  const visible=report.rows.filter(row=>filter==='all'||(filter==='changed'?row.moved:!row.moved));
  const reviewer=reviewerPredecessors.find(row=>row.checkId===selectedReviewer)??reviewerPredecessors[0];
  const custodian=custodianPredecessors.find(row=>row.source===selectedWitness)??custodianPredecessors[0];
  const aging=sourcePredecessors.find(row=>row.source===selectedAging)??sourcePredecessors[0];
  const packet=ql289AuditPacket(challenges,witnesses,agingDrafts,asOf,sourcePredecessors);

  function prepareChallenge(){
    if(!reviewer){setFeedback('Prepare a QL-288 reviewer receipt independence gap audit first.');return;}
    const result=ql289PrepareReviewerChallenge(reviewer,challengeRef,reviewerFocus,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setChallenges(old=>[...old.filter(row=>row.checkId!==result.draft.checkId),result.draft]);
    setChallengeRef('');setFeedback('Local challenge matrix recorded. No challenge nonce issued; no independent receipt received or decision accepted.');
  }
  function prepareWitness(){
    if(!custodian){setFeedback('Prepare a QL-288 unresolved original custody preflight first.');return;}
    const result=ql289PrepareWitnessClosure(custodian,witnessRef,witnessGap,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setWitnesses(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setWitnessRef('');setFeedback('Witness closure readiness recorded locally. No witness identity authenticated and no original custody conflict closed.');
  }
  function prepareAging(){
    if(!aging){setFeedback('Prepare a QL-288 unsent immutable source exception queue item first.');return;}
    const result=ql289PrepareReceiptAging(aging,agingRef,agingReason,new Date());
    if(!result.ok){setFeedback(result.reason);return;}
    setAgingDrafts(old=>[...old.filter(row=>row.source!==result.draft.source),result.draft]);
    setAgingRef('');setFeedback('Receipt aging follow-up recorded locally. No new source GET, receipt delivery or external routing.');
  }
  async function copyPacket(){
    try{if(!navigator.clipboard?.writeText)throw Error('Unavailable');
      await navigator.clipboard.writeText(packet);setFeedback('QL-289 local unverified packet copied. Nothing was transmitted.');}
    catch{setFeedback('Clipboard unavailable. Packet remains read-only on screen; nothing sent.');}
  }

  return <section className="ql277-review ql280-desk ql281-desk ql282-desk ql283-desk ql284-desk ql285-desk ql286-desk ql287-desk ql288-desk ql289-desk" data-ql289-desk aria-labelledby="ql289-title">
    <header className="ql277-heading"><div><p className="ql271-eyebrow">QL-289 · Independent provenance and original witness checkpoints</p>
      <h4 id="ql289-title">Reviewer provenance challenge matrix · Custodian witness closure readiness · Six-app exception receipt aging</h4>
      <p>Review what evidence is still missing and carry only nonsecret, unverified local case references forward. No independent challenge, original custody resolution, or integration is executed here.</p>
    </div><span>DISCONNECTED / HOLD</span></header>
    <div className="ql277-stats" aria-label="QL-289 unverified receipt and public source status">
      <div><small>Authenticated reviewer challenges</small><strong>0 / 7</strong><em>{challenges.length} local challenge draft(s)</em></div>
      <div><small>Original witness closure gates</small><strong>0 / 6</strong><em>{witnesses.length} pending readiness item(s)</em></div>
      <div><small>Source pins moved / originals missing</small><strong>{report.moved} / {report.missing}</strong><em>{report.unchanged} unchanged · {agingDrafts.length} local aging item(s)</em></div>
      <div><small>ACK delivery evidence</small><strong className="ql282-review-value">Under Review</strong><em>Parked for later</em></div>
    </div>
    <nav className="ql277-tabs" aria-label="QL-289 review workstreams"><button type="button" className={topic==='reviewer'?'active':''} aria-current={topic==='reviewer'?'page':undefined} onClick={()=>setTopic('reviewer')}>01 Reviewer provenance</button>
      <button type="button" className={topic==='witness'?'active':''} aria-current={topic==='witness'?'page':undefined} onClick={()=>setTopic('witness')}>02 Custodian witness closure</button>
      <button type="button" className={topic==='aging'?'active':''} aria-current={topic==='aging'?'page':undefined} onClick={()=>setTopic('aging')}>03 Source receipt aging</button></nav>

    {topic==='reviewer'&&<section className="ql277-card" aria-labelledby="ql289-reviewer-title"><h5 id="ql289-reviewer-title">Independent reviewer receipt provenance challenge matrix <span>0 VERIFIED</span></h5>
      <p>Seven distinct authenticating gates must be independently supported before a reviewer decision may be accepted. Claimed case references from QL-288 do not establish an issuer, original signature, witness, challenge or owner authorization.</p>
      <div className="ql289-gate-matrix" aria-label="Seven open reviewer provenance challenge gates">{QL289_REVIEWER_CHALLENGE_GATES.map((row,i)=><div key={row.id}><b>{String(i+1).padStart(2,'0')}</b><span>{row.label}</span><strong>{row.status.replaceAll('_',' ')}</strong></div>)}</div>
      {reviewerPredecessors.length===0?<div className="ql279-empty"><strong>No QL-288 reviewer receipt gap audit in this session.</strong><p>Open QL-288 to prepare an unverified local predecessor. No authenticated decision will be invented.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql289-reviewer-case">QL-288 unverified reviewer audit
        <select id="ql289-reviewer-case" value={reviewer?.checkId??''} disabled={!reviewer} onChange={e=>setSelectedReviewer(e.target.value)}>{!reviewer?<option value="">No local audit</option>:reviewerPredecessors.map(row=><option key={row.checkId} value={row.checkId}>{row.checkId} · {row.reviewerReceiptReference} / {row.issuerAuthorityReference}</option>)}</select></label>
        <label htmlFor="ql289-reviewer-focus">Unresolved independent challenge focus
          <select id="ql289-reviewer-focus" value={reviewerFocus} onChange={e=>setReviewerFocus(e.target.value as Ql289ReviewerFocus)}>{QL289_REVIEWER_CHALLENGE_FOCUS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql289-reviewer-ref">New nonsecret challenge matrix case
          <input id="ql289-reviewer-ref" maxLength={32} value={challengeRef} onChange={e=>setChallengeRef(e.target.value)} placeholder="CHALLENGE-289-CASE"/></label></div>
      <div className="ql277-actions"><button type="button" disabled={!reviewer} onClick={prepareChallenge}>Prepare unissued provenance challenge</button><button type="button" className="secondary" onClick={onOpenQl288}>Open QL-288 receipt audit</button></div>
      <div className="ql277-results">{challenges.map(row=><article key={row.checkId}><strong>{row.checkId} · {row.challengeReference}</strong><span>{row.focus.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>Prior reviewer {row.reviewerCase} · issuer {row.issuerCase}</small><p>Seven gates open · challenge issued NO · original signed receipt NOT RECEIVED · accepted NO.</p></article>)}</div>
      <p className="ql277-warning">ⓘ This matrix never issues a challenge nonce, verifies a key pin or contacts a reviewer. Never enter a credential or original protected receipt.</p>
    </section>}

    {topic==='witness'&&<section className="ql277-card" aria-labelledby="ql289-witness-title"><h5 id="ql289-witness-title">Original Proof-B custodian witness closure readiness <span>NO CLOSURE</span></h5>
      <p>Six original custody checkpoints remain unmet for every affected source. A local readiness case does not witness an artifact, authenticate a person or reconcile the original chain of custody.</p>
      <div className="ql289-gate-matrix" aria-label="Six open original custody and witness closure gates">{QL289_WITNESS_CLOSURE_GATES.map((row,i)=><div key={row.id}><b>{String(i+1).padStart(2,'0')}</b><span>{row.label}</span><strong>{row.status.replaceAll('_',' ')}</strong></div>)}</div>
      {custodianPredecessors.length===0?<div className="ql279-empty"><strong>No QL-288 original custody preflight in this session.</strong><p>Open QL-288 and prepare an unresolved local preflight first.</p></div>:null}
      <div className="ql277-form-grid"><label htmlFor="ql289-custodian-source">QL-288 unresolved custodian preflight
        <select id="ql289-custodian-source" disabled={!custodian} value={custodian?.source??''} onChange={e=>setSelectedWitness(e.target.value as Ql270SourceId)}>{!custodian?<option value="">No local preflight</option>:custodianPredecessors.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
        <label htmlFor="ql289-witness-gap">Unmet original witness closure condition
          <select id="ql289-witness-gap" value={witnessGap} onChange={e=>setWitnessGap(e.target.value as Ql289WitnessGap)}>{QL289_WITNESS_GAPS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
        <label htmlFor="ql289-witness-ref">New nonsecret witness readiness case
          <input id="ql289-witness-ref" maxLength={32} value={witnessRef} onChange={e=>setWitnessRef(e.target.value)} placeholder="WITNESS-289-CASE"/></label></div>
      <div className="ql277-actions"><button type="button" disabled={!custodian} onClick={prepareWitness}>Prepare open witness closure review</button><button type="button" className="secondary" onClick={onOpenQl288}>Open QL-288 custody preflight</button><button type="button" className="secondary" onClick={onOpenEvidence}>Inspect original source evidence</button></div>
      <div className="ql277-results">{witnesses.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.gap.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>QL-288 {row.previousCase} · {row.priorSha.slice(0,10)} → {row.currentSha.slice(0,10)}</small><p>Witness NOT AUTHENTICATED · signed original NOT VERIFIED · closure approved NO · delivered NO.</p></article>)}</div>
      <p className="ql277-warning">ⓘ Original custody conflicts stay OPEN even when the public source pin moves. No receipt or signer is considered verified.</p>
    </section>}

    {topic==='aging'&&<section className="ql277-card" aria-labelledby="ql289-aging-title"><h5 id="ql289-aging-title">Six-app immutable source exception receipt aging <span>{report.freshness.replaceAll('_',' ')}</span></h5>
      <p>Fresh public-only source `main` resolution and immutable Proof-B path reads at <time dateTime={QL289_OBSERVED_AT}>{QL289_OBSERVED_AT}</time>. {report.moved} pins moved since QL-288, {report.unchanged} unchanged, {report.missing} still HTTP 404. No source app gateway was contacted.</p>
      <div className="ql283-timestamp-strip"><span><strong>Snapshot age</strong>{report.ageHours===null?'Clock review':`${report.ageHours} hour(s)`}</span><span><strong>24-hour recheck due</strong>{report.nextRecheckAt}</span><span><strong>Original receipts accepted</strong>0</span><span><strong>Unsent local aging items</strong>{agingDrafts.length}</span></div>
      <div className="ql282-filter-row" role="group" aria-label="Filter QL-289 original proof exceptions"><button type="button" aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All sources ({report.rows.length})</button><button type="button" aria-pressed={filter==='changed'} onClick={()=>setFilter('changed')}>Changed pins ({report.moved})</button><button type="button" aria-pressed={filter==='unchanged'} onClick={()=>setFilter('unchanged')}>Unchanged pins ({report.unchanged})</button></div>
      <div className="ql283-source-list" role="table" aria-label="QL-289 immutable original receipt aging ledger"><div className="ql283-source-row heading" role="row"><span role="columnheader">App</span><span role="columnheader">QL-288 → QL-289 SHA</span><span role="columnheader">Original receipt exception</span><span role="columnheader">Immutable public path</span></div>
        {visible.map(row=><div key={row.source} className="ql283-source-row" role="row"><strong role="cell">{nameFor(row.source)}</strong><code role="cell" title={`${row.previousSha} → ${row.sha}`}>{row.previousSha?.slice(0,9)} → {row.sha.slice(0,9)}</code><span role="cell"><b>{row.moved?'SHA moved':'SHA unchanged'}</b> · HTTP {row.http}<small>Original receipt NOT RECEIVED · {row.linkedLocalQueue} predecessor item(s)</small></span><a role="cell" href={ql289PinnedProofUrl(row.source)} target="_blank" rel="noopener noreferrer">Pinned public GET ↗</a></div>)}</div>
      <div className="ql284-subsection"><h6>Prepare a local, unsent original receipt aging follow-up</h6>
        {sourcePredecessors.length===0?<p className="ql284-secondary-copy">Every current public exception is visible. Local follow-up drafting requires a QL-288 unexecuted queue item from this session.</p>:null}
        <div className="ql277-form-grid"><label htmlFor="ql289-aging-source">QL-288 unsent immutable source queue item
          <select id="ql289-aging-source" value={aging?.source??''} disabled={!aging} onChange={e=>setSelectedAging(e.target.value as Ql270SourceId)}>{!aging?<option value="">No local queue item</option>:sourcePredecessors.map(row=><option key={row.source} value={row.source}>{nameFor(row.source)} · {row.reference}</option>)}</select></label>
          <label htmlFor="ql289-aging-reason">Unresolved receipt aging reason
            <select id="ql289-aging-reason" value={agingReason} onChange={e=>setAgingReason(e.target.value as Ql289ReceiptAgingReason)}>{QL289_RECEIPT_AGING_REASONS.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
          <label htmlFor="ql289-aging-ref">New nonsecret receipt aging case<input id="ql289-aging-ref" maxLength={32} value={agingRef} onChange={e=>setAgingRef(e.target.value)} placeholder="AGING-289-CASE"/></label></div>
        <div className="ql277-actions"><button type="button" disabled={!aging} onClick={prepareAging}>Prepare unsent receipt aging item</button><button type="button" className="secondary" onClick={()=>{setAsOf(new Date());setFeedback('Snapshot age recalculated only. No new GET was executed.');}}>Recalculate age only</button><button type="button" className="secondary" onClick={onOpenQl288}>Open QL-288 exception queue</button></div>
        <div className="ql277-results">{agingDrafts.map(row=><article key={row.source}><strong>{nameFor(row.source)} · {row.reference}</strong><span>{row.reason.replaceAll('_',' ')} · {row.state.replaceAll('_',' ')}</span><small>QL-288 {row.previousCase} · {row.priorSha.slice(0,10)} → {row.currentSha.slice(0,10)}</small><p>Original receipt NOT RECEIVED · scheduled NO · sent NO · executed NO · accepted NO.</p></article>)}</div></div>
      <p className="ql277-warning">ⓘ A later file appearance would not validate original signing authority, witness chain or tenant scope. A new authenticated GET requires its own separate authorization.</p>
    </section>}

    <section className="ql277-card ql283-parked-note" aria-labelledby="ql289-ack-title"><h5 id="ql289-ack-title">Six-App Acknowledgement Delivery Evidence Preconditions <span className="ql282-under-review">UNDER REVIEW</span></h5><p><strong>Parked for later.</strong> No ACK receipt, delivery notice, escalation, route or acceptance has been initiated. Six integrations remain DISCONNECTED / HOLD, independent of local audit drafting.</p></section>
    <section className="ql277-card" aria-labelledby="ql289-packet-title"><h5 id="ql289-packet-title">QL-289 independent provenance and receipt-aging packet <span>LOCAL · NOT SENT</span></h5><label className="ql277-note-label" htmlFor="ql289-packet">Read-only public refs and unattested local case matrix<textarea id="ql289-packet" rows={10} readOnly value={packet}/></label><div className="ql277-actions"><button type="button" onClick={()=>void copyPacket()}>Copy QL-289 local packet</button><button type="button" className="secondary" onClick={()=>{setChallenges([]);setWitnesses([]);setAgingDrafts([]);setFeedback('Only QL-289 local drafts cleared. Prior drafts, public proofs and parked ACK unchanged.');}}>Clear QL-289 local drafts</button></div><p role="status" aria-live="polite" className="ql287-feedback">{feedback}</p></section>
  </section>;
}
