import {useState} from 'react';
import {QL303_ROWS} from './ql303CapabilityReadiness';
import {QL307_EVIDENCE_KINDS,QL307_PUBLIC_RECHECK,ql307ClassifyPublicStatus,ql307IntakeDraft,ql307ReviewSummary,type Ql307EvidenceKind,type Ql307Intake,type Ql307ReviewState} from './ql307ProofEvidence';
import type {Ql270SourceId} from './ql270ConnectionCentre';
import './ql307-proof-evidence.css';

const labelFor=(id:Ql307EvidenceKind)=>QL307_EVIDENCE_KINDS.find(row=>row.id===id)?.label??id;
const stateLabels:Record<Ql307ReviewState,string>={AWAITING_INDEPENDENT_VERIFICATION:'Awaiting independent verification',REFERENCE_NEEDS_CORRECTION:'Reference needs correction',REFERRED_FOR_EXTERNAL_REVIEW:'Referred for external review · not accepted'};

export function Ql307ProofEvidence(){
  const [source,setSource]=useState<Ql270SourceId>('rosiedazzlers');
  const [kind,setKind]=useState<Ql307EvidenceKind>('ORIGINAL_PROOF_B');
  const [reference,setReference]=useState('');
  const [entries,setEntries]=useState<Ql307Intake[]>([]);
  const [error,setError]=useState('');
  const summary=ql307ReviewSummary(entries);
  const scoped=entries.filter(row=>row.source===source);
  function addReference(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const result=ql307IntakeDraft(source,kind,reference,entries);
    if(result.error||!result.entry){setError(result.error??'Reference could not be recorded.');return;}
    setEntries(previous=>[...previous,result.entry!]);setReference('');setError('');
  }
  function setReview(id:string,state:Ql307ReviewState){setEntries(previous=>previous.map(row=>row.id===id?{...row,state}:row));}

  return <section className="ql307" data-ql307-release="immutable-proof-review-v1" aria-labelledby="ql307-title">
    <header><div><p className="ql271-eyebrow">QL-307 · public proof evidence and independent reviewer intake</p><h3 id="ql307-title">Immutable source proof recheck</h3><p>Six pinned public paths rechecked independently. The queue accepts only nonsecret reference labels and does not verify a person, original signature or chain of custody.</p></div><strong>6 / 6 MISSING · HOLD</strong></header>
    <div className="ql307-metrics" aria-label="Proof readiness summary"><div><strong>{summary.missing} / {summary.sources}</strong><span>HTTP 404 at pinned paths</span></div><div><strong>{summary.pending}</strong><span>Local unverified references</span></div><div><strong>{summary.independentlyVerified}</strong><span>Independently accepted proofs</span></div><div><strong>{summary.approvedGates} / {summary.requiredGates}</strong><span>Release gates approved</span></div></div>
    <p className="ql307-note" role="note">Observed {QL307_PUBLIC_RECHECK[0]?.observedAt} UTC by public GitHub API lookups outside the application. A 403/429 means forbidden or rate-limited—not absent; a 200 means present but unverified. The browser makes zero source requests. All six integrations remain DISCONNECTED / HOLD; no source gateway GET, customer data, messages or ACKs.</p>
    <div className="ql307-table"><table><caption>Immutable source proof recheck · QL-303 prior observation compared with QL-307</caption><thead><tr><th scope="col">Source and role</th><th scope="col">Pinned commit</th><th scope="col">Earlier status</th><th scope="col">Latest status</th><th scope="col">Public evidence</th></tr></thead><tbody>{QL307_PUBLIC_RECHECK.map(row=>{const sourceInfo=QL303_ROWS.find(item=>item.id===row.source);return <tr key={row.source}><th scope="row">{sourceInfo?.label}<small>{sourceInfo?.kind}</small></th><td><code>{row.sha.slice(0,12)}</code></td><td>HTTP {row.priorHttp}<small>{row.priorAt}</small></td><td><strong>HTTP {row.http} · {ql307ClassifyPublicStatus(row.http)}</strong><small>{row.observedAt}</small></td><td><a href={row.url} target="_blank" rel="noopener noreferrer">Inspect immutable public URL ↗</a></td></tr>;})}</tbody></table></div>
    <div className="ql307-intake"><form onSubmit={addReference}><h4>Independent reviewer reference intake</h4><p>Prepare a local triage reference. Do not paste proof files, URLs, signer names, private keys or personal evidence. An entered reference is never a verified receipt.</p><label htmlFor="ql307-source">Source application</label><select id="ql307-source" value={source} onChange={event=>{setSource(event.target.value as Ql270SourceId);setError('');}}>{QL303_ROWS.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select><label htmlFor="ql307-kind">Evidence requirement</label><select id="ql307-kind" value={kind} onChange={event=>setKind(event.target.value as Ql307EvidenceKind)}>{QL307_EVIDENCE_KINDS.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select><label htmlFor="ql307-reference">Nonsecret case reference</label><input id="ql307-reference" value={reference} maxLength={40} autoComplete="off" placeholder="CASE_307_A" onChange={event=>setReference(event.target.value)} aria-describedby="ql307-reference-help"/><small id="ql307-reference-help">5–40 characters · letters, numbers, underscores and dashes only.</small><button type="submit">Add unverified reference locally</button><p role="status" aria-live="polite">{error||'No source, reviewer or owner approval is issued by this form.'}</p></form>
    <div className="ql307-queue"><h4>Source-specific follow-up queue</h4><p>{scoped.length} reference(s) for {QL303_ROWS.find(row=>row.id===source)?.label}. Status changes stay in this browser tab and cannot approve a release.</p>{scoped.length===0?<p className="ql307-empty">No references submitted for this source.</p>:<ul>{scoped.map(row=><li key={row.id}><strong>{row.reference}</strong><small>{labelFor(row.kind)}</small><label htmlFor={`ql307-review-${row.id}`}>Local review disposition</label><select id={`ql307-review-${row.id}`} value={row.state} onChange={event=>setReview(row.id,event.target.value as Ql307ReviewState)}>{Object.entries(stateLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></li>)}</ul>}<p className="ql307-note">Independent authority, signed original Proof-B, custody witness, scoped TEST tenant and owner TEST decision must be verified outside this preview. This queue cannot mark any gate approved.</p></div></div>
    <p className="ql307-note">ACK delivery evidence remains UNDER_REVIEW / PARKED_FOR_LATER. No notifications sent; 0 private requests; 0 owner TEST approvals.</p>
  </section>;
}
