import {useState,type ChangeEvent} from 'react';
import './ql346-issuer-trust.css';

const QL346_SCHEMA='rosevear.hub.ql346.offline-test-readiness.v1';
const allowedStates=new Set([
  'ORIGINAL_DEVICE_SIGNATURE_AND_PIN_MATCH_FIELD_CUSTODY_HOLD',
  'CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD',
  'HOLD_INDEPENDENT_ORIGINAL_ISSUER_SIGNATURE_OR_PIN_REQUIRED',
  'HOLD_SEPARATE_QL340B_TEST_ENROLLMENT_SIGNATURES_REQUIRED',
  'HOLD_ORIGINAL_RECEIVER_OFF_OR_REVIEW_MISMATCH',
  'HOLD_TWO_SEPARATE_ORIGINAL_OWNER_REVIEW_SIGNATURES_REQUIRED',
  'HOLD_DIFFERENT_DEVICE_OWNER_OR_ORIGINAL_TEST_EVIDENCE',
  'HOLD_EXPIRED_OR_NONSTANDARD_ORIGINAL_HEARTBEAT',
  'HOLD_DEVICE_PUBLIC_KEY_OR_OUT_OF_BAND_PIN_MISMATCH',
  'DENY_WRONG_ORIGINAL_DEVICE_PACKET_SCOPE',
  'DENY_INVALID_ORIGINAL_ISSUER_SIGNATURE',
  'DENY_UNREADABLE_DEVICE_PUBLIC_KEY_OR_SIGNATURE',
  'OFFLINE_READ_ONLY_QL346_GUIDE',
]);
type Readback={schema:string;state:string;issuerSignatureCryptographicallyValid:boolean;
  devicePinMatches:boolean;originalIssuerIndependentlyAuthenticated:boolean;
  originalIssuerOutOfBandCustodyApproved:boolean;sourceOwnerTestSignatureValid:boolean;
  masterOwnerTestSignatureValid:boolean;readyForDatabaseEnrollment:boolean;
  independentHumanReviewRequired:boolean;originalReceiverStopped:boolean;
  receiverActivated:boolean;databaseEnrollmentCreated:boolean;connected:boolean;
  networkRequests:number;customerCommunications:boolean;deviceActions:boolean};

/** A presentation-only parser: never treats a local JSON flag as independent trust. */
export function parseQl346Readback(value:unknown):Readback{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID');
  const v=value as Record<string,unknown>;
  if(v.schema!==QL346_SCHEMA||typeof v.state!=='string'||!allowedStates.has(v.state)||
    v.originalIssuerIndependentlyAuthenticated!==false||
    v.originalIssuerOutOfBandCustodyApproved!==false||
    v.readyForDatabaseEnrollment!==false||v.independentHumanReviewRequired!==true||
    v.originalReceiverStopped!==false||v.receiverActivated!==false||
    v.databaseEnrollmentCreated!==false||v.connected!==false||
    v.networkRequests!==0||v.customerCommunications!==false||v.deviceActions!==false||
    typeof v.issuerSignatureCryptographicallyValid!=='boolean'||
    typeof v.devicePinMatches!=='boolean'||
    typeof v.sourceOwnerTestSignatureValid!=='boolean'||
    typeof v.masterOwnerTestSignatureValid!=='boolean')throw Error('INVALID');
  return v as Readback;
}

export function Ql346IssuerTrustPanel(){
  const [readback,setReadback]=useState<Readback|null>(null),[error,setError]=useState('');
  async function importReadback(e:ChangeEvent<HTMLInputElement>){
    const file=e.currentTarget.files?.[0];setReadback(null);setError('');
    if(!file)return;
    if(file.size>16_384){setError('Readback too large; only nonsecret status JSON is supported.');return;}
    try{setReadback(parseQl346Readback(JSON.parse(await file.text())));}
    catch{setError('Rejected: unsupported, activated, or claimed-authorized QL-346 readback.');}
    e.currentTarget.value='';
  }
  return <section className="ql346" data-ql346="offline-issuer-trust" aria-labelledby="ql346-title">
    <header><div><small>QL-346 · Independent issuer trust &amp; owner TEST approval</small>
      <h5 id="ql346-title">Verify the real signer. Keep authorization separate.</h5>
      <p>Offline checks only. Neither a matching public-key fingerprint nor a valid signature proves who originally issued it. Human trust and field approval stay separate.</p>
    </div><strong>CONTROLLED TEST · HOLD</strong></header>
    <ol className="ql346-steps">
      <li><h6>01 · Ree’s original Windows Hub</h6>
        <p>On the original machine only, use the existing signer’s <b>--sign-once</b> mode to produce one 90-second, health-only TEST packet. Do not use <b>--send-once</b>.</p></li>
      <li><h6>02 · Independent issuer fingerprint</h6>
        <p>Ree and Jack compare the original device key’s SHA-256 SPKI fingerprint through a separately witnessed channel. A fingerprint copied from the candidate file is not independent proof.</p></li>
      <li><h6>03 · Two different owner signatures</h6>
        <p>QL-345 REVIEW acknowledgements are not enrollment consent. Actual QL-340B TEST approvals require a separate decision by Ree as source and Jack as master.</p></li>
      <li><h6>04 · Final field witness remains HOLD</h6>
        <p>Confirm original receiver OFF, TLS, Tailnet policy, issuer custody and database authority independently before a future supervised enrollment. No peer is connected by this build.</p></li>
    </ol>
    <div className="ql346-actions"><div><h6>Read-only commands</h6>
      <code>node .\runtimes\hub-relay\ql346-issuer-test-readiness.mjs --help</code>
      <p>Use <b>--verify-issuer</b> for a public heartbeat, device candidate and independently checked fingerprint. <b>--preflight</b> checks two separate signed reviews plus two actual TEST approvals. Run locally while the 90-second packet is fresh.</p>
      <p><b>Never paste a private key, passphrase or database credential here.</b></p></div>
      <div><h6>Optional local status import</h6>
        <label htmlFor="ql346-import">Nonsecret QL-346 JSON readback</label>
        <input id="ql346-import" type="file" accept=".json,application/json" onChange={importReadback}/>
        <p className="ql346-status" role="status">{error||(!readback?'No QL-346 readback imported.':
          `${readback.issuerSignatureCryptographicallyValid?'Device signature checked':'Device signature not verified'} · ${readback.sourceOwnerTestSignatureValid&&readback.masterOwnerTestSignatureValid?'both TEST signatures checked':'owner TEST approval incomplete'} · issuer custody and enrollment HOLD`)}</p>
        <p>This display checks format only; uploaded files are not sent to any server. Original issuer authority cannot be self-certified in JSON.</p></div></div>
    <footer>ORIGINAL ISSUER CUSTODY · INDEPENDENT FIELD WITNESS · PRIVATE DATABASE AUTHORITY: ALL REQUIRE SEPARATE VERIFICATION</footer>
  </section>;
}
