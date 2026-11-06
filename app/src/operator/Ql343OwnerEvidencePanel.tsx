import {useState,type ChangeEvent} from 'react';
import './ql343-owner-evidence.css';

type Review={schema:string;state:string;rollbackKind:string;
  independentOriginalOwnerApproval:boolean;sourceSigned:boolean;masterSigned:boolean;
  originalReceiverStopped:boolean;receiverActivated:boolean;databaseEnrollmentCreated:boolean;
  customerCommunications:boolean;deviceActions:boolean;connected:boolean;
  evidenceDigests:Record<string,string>};
const sha=/^[a-f0-9]{64}$/;
const needed=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];

/** A format-only import for owner education; never a trusted source or grant. */
export function parseQl343OwnerReview(value:unknown):Review{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID');
  const v=value as Record<string,unknown>,digests=v.evidenceDigests;
  if(v.schema!=='rosevear.hub.ql343.original-owner-evidence-review.v1'||
    v.state!=='EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED'||
    !['INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
      'CLAIMED_REAL_RECEIVER_STOP_REQUIRES_INDEPENDENT_WITNESS',
      'UNRECOGNIZED_ROLLBACK_WITNESS'].includes(String(v.rollbackKind))||
    !digests||typeof digests!=='object'||Array.isArray(digests)||
    Object.keys(digests).length!==4||
    needed.some(k=>!sha.test(String((digests as Record<string,unknown>)[k]??'')))||
    v.independentOriginalOwnerApproval!==false||v.sourceSigned!==false||
    v.masterSigned!==false||v.originalReceiverStopped!==false||
    v.receiverActivated!==false||v.databaseEnrollmentCreated!==false||
    v.customerCommunications!==false||v.deviceActions!==false||v.connected!==false||
    v.requestMayBeSigned!==false)throw Error('INVALID');
  return v as unknown as Review;
}

export function Ql343OwnerEvidencePanel(){
  const [review,setReview]=useState<Review|null>(null);
  const [error,setError]=useState('');
  async function importReview(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0];setReview(null);setError('');
    if(!file)return;
    if(file.size>32_768){setError('File is too large for a public-only review packet.');return;}
    try{setReview(parseQl343OwnerReview(JSON.parse(await file.text())));}
    catch{setError('Rejected: the review packet is unfamiliar or claims unsupported approval.');}
    event.currentTarget.value='';
  }
  return <section className="ql343" data-ql343-mode="public-only-offline-review" aria-labelledby="ql343-title">
    <div className="ql343-head"><div><span>QL-343 · Original owner signing handoff</span>
      <h5 id="ql343-title">Review first. Sign independently. Keep the receiver OFF.</h5>
      <p>Ree and Jack each retain their own signing key. This page never signs, calls the database, activates a receiver or transmits an evidence file.</p></div>
      <strong>ENROLLMENT · HOLD</strong></div>
    <ol className="ql343-steps">
      <li><b>01 · Ree reviews original files</b><p>Run the first command on DESKTOP-AE894KC. It checks three public candidates and hashes the existing Windows, TLS, Tailnet and rollback records. File presence and hashes are not independent authority.</p></li>
      <li><b>02 · Jack reviews separately</b><p>Transfer only the nonsecret review packet and a future public TEST request to Jack's PC. Compare the exact four evidence hashes and owner key IDs before he decides whether to sign.</p></li>
      <li><b>03 · Each owner signs only after genuine review</b><p>Use the existing QL-340B offline ceremony with each owner's own private key and the exact reviewed 20-minute payload hash. Do not sign when original issuer or receiver-state evidence remains unresolved.</p></li>
    </ol>
    <div className="ql343-actions"><div><h6>Ree · local review, no writes</h6>
      <code>node .\runtimes\hub-relay\ql343-owner-evidence-review.mjs --review-local</code>
      <h6>Ree · save a new nonsecret review packet</h6>
      <code>node .\runtimes\hub-relay\ql343-owner-evidence-review.mjs --stage-local</code>
      <p>Only the original Windows computer can stage the packet and four-file path manifest. The local inert drill remains explicitly labelled <b>not a real receiver stop</b>.</p></div>
      <div><h6>Jack · compare before an independent signature</h6>
        <code>node .\runtimes\hub-relay\ql343-owner-evidence-review.mjs --compare-request REQUEST_JSON REVIEW_PACKET_JSON</code>
        <p>Replace the two example filenames only after a short-lived public request exists. Comparison is read-only and never gives signing approval.</p>
        <label htmlFor="ql343-review-import">Optional local public review packet (.json)</label>
        <input id="ql343-review-import" type="file" accept=".json,application/json" onChange={importReview}/>
        <p role="status" className="ql343-status">{error||(!review?'No owner review packet imported.':
          `${needed.length} evidence digests present · ${review.rollbackKind==='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'?'inert-only rollback drill':'rollback provenance pending'} · owners must review`)}</p>
      </div></div>
    <footer>FORMAT VALID ≠ INDEPENDENT WITNESS · NO PRIVATE KEY TRANSFER · NO DB CREDENTIAL · SIX PEERS STILL HELD</footer>
  </section>;
}
