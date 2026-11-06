import {useState,type ChangeEvent} from 'react';
import './ql345-issuer-owner.css';

type Challenge={schema:string;state:string;environment:string;audience:string;
  issuedAt:string;expiresAt:string;observationSha256:string;
  tlsCertificateFileSha256:string;rollbackKind:string;
  evidenceDigests:Record<string,string>;deviceKeyId:string;
  ownerAuthorityPins:{schema:string;source:{keyId:string;publicKeyPem:string};
    master:{keyId:string;publicKeyPem:string}};
  originalIssuerIndependentlyConfirmed:boolean;
  sourceOwnerEnrollmentApproved:boolean;masterOwnerEnrollmentApproved:boolean;
  requestMayBeSigned:boolean;receiverActivated:boolean;
  databaseEnrollmentCreated:boolean;connected:boolean};
const SHA=/^[a-f0-9]{64}$/;
const hashes=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];

/** Non-authoritative display only. The CLI performs full public-key validation. */
export function parseQl345Challenge(value:unknown):Challenge{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID');
  const v=value as Record<string,unknown>,w=v.evidenceDigests,
    pins=v.ownerAuthorityPins as Record<string,unknown>|undefined;
  if(v.schema!=='rosevear.hub.ql345.issuer-owner-review-challenge.v1'||
    v.state!=='ORIGINAL_ISSUER_AND_OWNER_REVIEW_ONLY_NOT_SIGNABLE'||
    v.environment!=='TEST'||v.audience!=='rosevear-comms-hub:nonproduction'||
    v.rollbackKind!=='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'||
    !SHA.test(String(v.observationSha256??''))||
    !SHA.test(String(v.tlsCertificateFileSha256??''))||
    !w||typeof w!=='object'||Array.isArray(w)||Object.keys(w).length!==4||
    hashes.some(k=>!SHA.test(String((w as Record<string,unknown>)[k]??'')))||
    pins?.schema!=='rosevear.hub.ql339b.owner-authorities.v1'||
    !pins.source||!pins.master||
    typeof (pins.source as Record<string,unknown>).keyId!=='string'||
    typeof (pins.master as Record<string,unknown>).keyId!=='string'||
    v.originalIssuerIndependentlyConfirmed!==false||
    v.sourceOwnerEnrollmentApproved!==false||v.masterOwnerEnrollmentApproved!==false||
    v.requestMayBeSigned!==false||v.receiverActivated!==false||
    v.databaseEnrollmentCreated!==false||v.connected!==false||
    !Number.isFinite(Date.parse(String(v.issuedAt??'')))||
    !Number.isFinite(Date.parse(String(v.expiresAt??'')))||
    Date.parse(String(v.expiresAt))-Date.parse(String(v.issuedAt))!==1_200_000)
    throw Error('INVALID');
  return v as unknown as Challenge;
}

export function Ql345IssuerOwnerPanel(){
  const [packet,setPacket]=useState<Challenge|null>(null),[error,setError]=useState('');
  async function importPacket(e:ChangeEvent<HTMLInputElement>){
    const file=e.currentTarget.files?.[0];setPacket(null);setError('');
    if(!file)return;
    if(file.size>32_768){setError('Public review packet exceeds the 32 KB limit.');return;}
    try{setPacket(parseQl345Challenge(JSON.parse(await file.text())));}
    catch{setError('Rejected: this document claims unauthorized owner or issuer approval.');}
    e.currentTarget.value='';
  }
  return <section className="ql345" data-ql345="original-issuer-and-separate-owners" aria-labelledby="ql345-title">
    <header><div><small>QL-345 · Original issuer confirmation and separate owner decisions</small>
      <h5 id="ql345-title">One public challenge. Two independent decisions. No automatic TEST signing.</h5>
      <p>Only the original source issuer can establish independent provenance. Ree and Jack can separately sign a review acknowledgement, HOLD, or REJECT using their own Windows-protected private keys. A review signature never authorizes enrollment.</p></div><strong>TEST ENROLLMENT · HOLD</strong></header>
    <ol className="ql345-grid"><li><h6>01 · Original issuer evidence</h6>
      <p>Reconcile QL-343/344 original Windows, TLS, Tailnet and inert-drill records. Cryptographic hashes alone cannot establish an external issuer or active receiver stop.</p></li>
      <li><h6>02 · Ree prepares the public challenge</h6>
        <p>On DESKTOP-AE894KC, stage a 20-minute nonsecret review challenge from the exact observed-OFF packet, original review, and three public candidates.</p></li>
      <li><h6>03 · Each owner decides independently</h6>
        <p>Ree signs only on her PC as <b>source</b>. Jack signs only on his PC as <b>master</b>. Both explicitly acknowledge <b>review-only, not enrollment consent</b>.</p></li>
      <li><h6>04 · Compare offline</h6>
        <p>Verify the two public signatures and identical challenge hash. An expired challenge, any rejection, or absent issuer provenance remains HOLD.</p></li></ol>
    <div className="ql345-actions"><div><h6>Read the safe local commands</h6>
      <code>node .\runtimes\hub-relay\ql345-issuer-owner-preflight.mjs --help</code>
      <p>The CLI provides <b>--stage-local</b>, <b>--decide</b>, <b>--inspect</b> and <b>--check</b>. It deliberately has no TEST enrollment or activation command.</p></div>
      <div><label htmlFor="ql345-import">Optional nonsecret public review challenge (.json)</label>
        <input id="ql345-import" type="file" accept=".json,application/json" onChange={importPacket}/>
        <p className="ql345-status" role="status">{error||(!packet?'No local public review challenge imported.':
          `Source: ${packet.ownerAuthorityPins.source.keyId} · Master: ${packet.ownerAuthorityPins.master.keyId} · 20-minute TEST review only · external issuer and owner consent held`)}</p>
        <p>File import is format-only; the page does not transmit evidence, verify hardware ownership, hold private keys or sign any request.</p></div></div>
    <footer>PUBLIC REVIEW SIGNATURE ≠ TEST ENROLLMENT SIGNATURE · ORIGINAL ISSUER HELD · NO DATABASE WRITES · NO CUSTOMER OR DEVICE EFFECTS</footer>
  </section>;
}
