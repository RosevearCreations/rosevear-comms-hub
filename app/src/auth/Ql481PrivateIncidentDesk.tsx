import {useEffect,useRef,useState} from 'react';
import {inspectQl481LocalHandover,type Ql481CaseSource,
 type Ql481LocalCaseReview} from './ql481PrivateIncidentDeskModel';
import './ql481PrivateIncidentDesk.css';

export function Ql481PrivateIncidentDesk({unlocked}:{unlocked:boolean}){
 const [source,setSource]=useState<Ql481CaseSource>('yard-workers');
 const [review,setReview]=useState<Ql481LocalCaseReview|null>(null);
 const [status,setStatus]=useState('No locally selected handover. No live cases verified.');
 const [busy,setBusy]=useState(false);
 const sequence=useRef(0);
 const input=useRef<HTMLInputElement>(null);
 const clear=()=>{
  ++sequence.current;
  setReview(null);
  setBusy(false);
  setStatus('Local selection cleared. No data was saved or uploaded.');
  if(input.current)input.current.value='';
 };
 useEffect(()=>{clear();return ()=>{++sequence.current}},[source,unlocked]);
 async function inspect(file?:File){
  const task=++sequence.current;
  setReview(null);
  if(!unlocked){
   setStatus('An enrolled, current AAL2 owner session is required.');
   return;
  }
  if(!file){setStatus('Choose a redacted QL-481 handover JSON file.');return}
  if(file.size>16000||!file.name.toLowerCase().endsWith('.json')){
   setStatus('Only redacted QL-481 JSON handovers up to 16 KB are accepted.');return;
  }
  setBusy(true);
  try{
   const raw=await file.text();
   if(task!==sequence.current)return;
   const check=inspectQl481LocalHandover(raw,source);
   if(!check.ok){setStatus(check.reason);return}
   setReview(check.review);
   setStatus('Local structure matches QL-481. Signatures and live source authenticity have NOT been independently verified.');
  }catch{if(task===sequence.current)setStatus('File could not be read locally.')}
  finally{if(task===sequence.current)setBusy(false)}
 }
 return <section className="ql481-desk" aria-labelledby="ql481-desk-title">
  <div className="ql481-desk-heading">
   <div>
    <p className="ql370-eyebrow">QL-481 · AUTHENTICATED OWNER AREA</p>
    <h4 id="ql481-desk-title">Private incident handover desk</h4>
    <p>Review a redacted, owner-selected case handover. Files stay in this browser's memory; nothing is uploaded, approved or transmitted.</p>
   </div>
   <strong className="ql481-hold">FIELD ACCEPTANCE HOLD</strong>
  </div>
  {!unlocked?<p role="alert">Private handover inspection is locked. A current enrolled owner with AAL2 must enter before selecting private case evidence.</p>:<>
   <div className="ql481-controls">
    <label htmlFor="ql481-app">Application
     <select id="ql481-app" value={source} onChange={event=>setSource(event.target.value as Ql481CaseSource)}>
      <option value="yard-workers">Yard Workers</option>
      <option value="icamp">iCamp</option>
     </select>
    </label>
    <label htmlFor="ql481-handover">Redacted QL-481 handover JSON (local inspection only)
     <input ref={input} id="ql481-handover" type="file" accept=".json,application/json"
      disabled={busy} onChange={event=>void inspect(event.currentTarget.files?.[0])}/>
    </label>
    <button type="button" onClick={clear}>Clear this local review</button>
   </div>
   <p className="ql481-notice" role="status" aria-live="polite">{status}</p>
   <div className="ql481-case-grid">
    <article><span>Selected source</span><strong>{source==='yard-workers'?'Yard Workers':'iCamp'}</strong>
     <small>Separate tenant, episode and source signer required</small></article>
    <article><span>Local case state</span><strong>{review?.caseStatus??'No verified case'}</strong>
     <small>{review?'Selected file only; never a live status':'No authorized production case feed'}</small></article>
    <article><span>Pending intents</span><strong>{review?.pendingCount??'Unknown'}</strong>
     <small>No provider/customer delivery is active</small></article>
   </div>
   {review&&<div className="ql481-review" aria-label="Unverified local handover fields">
    <h5>Selected redacted case — structurally consistent only</h5>
    <dl>
     <div><dt>Tenant scope</dt><dd><code>{review.tenantId}</code></dd></div>
     <div><dt>Episode</dt><dd><code>{review.episodeId}</code></dd></div>
     <div><dt>Case ID</dt><dd><code>{review.caseId}</code></dd></div>
     <div><dt>Handover ID</dt><dd><code>{review.handoverId}</code></dd></div>
     <div><dt>Journal SHA-256</dt><dd><code>{review.lastJournalDigest}</code></dd></div>
     <div><dt>Source receipt SHA-256</dt><dd><code>{review.lastReceiptDigest}</code></dd></div>
     <div><dt>Recorded source events</dt><dd>{review.lastSequence}</dd></div>
     <div><dt>Committed time</dt><dd>{new Date(review.committedAtMs).toLocaleString()}</dd></div>
    </dl>
    <p><strong>Not certified:</strong> public key trust, independent signature verification, original-host recovery, external delivery and source runtime. Confirm those separately using the private server ledger before making an operational decision.</p>
   </div>}
  </>}
  <details className="ql481-next">
   <summary>Field integration checklist and safe next actions</summary>
   <ol>
    <li>Enroll Yard Workers and iCamp separately with source-specific, independent signer pins and tenant-specific permissions.</li>
    <li>On the protected private backend, verify a signed missing-heartbeat event, recovery receipt and journal readback.</li>
    <li>Obtain independently signed owner/reviewer handover packets and durable readback; do not trust the browser-selected file alone.</li>
    <li>Confirm distinct operator closure, source recovery and delivery receipts before calling a real incident complete.</li>
   </ol>
  </details>
  <p className="ql481-boundary">Source links and customer accounts stay closed. This desk never starts a receiver, restarts Windows, signs a source event or sends a customer message.</p>
 </section>;
}
