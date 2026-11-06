import {useState,type ChangeEvent} from 'react';
import './ql344-receiver-off.css';

const sha=/^[a-f0-9]{64}$/;
const fields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];

type Observation={schema:string;state:string;capturedAt:string;computer:string;
  receiverOffObserved:boolean;originalReceiverStopped:boolean;
  originalIssuerEvidenceIndependentlyVerified:boolean;
  independentOriginalOwnerApproval:boolean;sourceSigned:boolean;masterSigned:boolean;
  requestMayBeSigned:boolean;receiverActivated:boolean;databaseEnrollmentCreated:boolean;
  connected:boolean;customerCommunications:boolean;deviceActions:boolean;
  receiverPort:number;localListenerCount:number;tailscaleServeNoConfig:boolean;
  windowsUser:string;inertDrillFileCount:number;
  tlsCertificateFileSha256:string;evidenceDigests:Record<string,string>};

/** Browser import checks only the public record's shape, not its authenticity. */
export function parseQl344Observation(value:unknown):Observation{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID');
  const v=value as Record<string,unknown>,hashes=v.evidenceDigests;
  if(v.schema!=='rosevear.hub.ql344.receiver-off-observation.v1'||
    v.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
    v.computer!=='DESKTOP-AE894KC'||v.windowsUser!=='Ree'||
    v.receiverPort!==8788||v.localListenerCount!==0||
    v.tailscaleServeNoConfig!==true||v.inertDrillFileCount!==1||
    v.receiverOffObserved!==true||v.originalReceiverStopped!==false||
    v.originalIssuerEvidenceIndependentlyVerified!==false||
    v.independentOriginalOwnerApproval!==false||v.sourceSigned!==false||
    v.masterSigned!==false||v.requestMayBeSigned!==false||
    v.receiverActivated!==false||v.databaseEnrollmentCreated!==false||
    v.connected!==false||v.customerCommunications!==false||v.deviceActions!==false||
    !sha.test(String(v.tlsCertificateFileSha256??''))||
    !hashes||typeof hashes!=='object'||Array.isArray(hashes)||
    Object.keys(hashes).length!==4||
    fields.some(k=>!sha.test(String((hashes as Record<string,unknown>)[k]??'')))||
    !Number.isFinite(Date.parse(String(v.capturedAt??''))))throw Error('INVALID');
  return v as unknown as Observation;
}

export function Ql344ReceiverOffPanel(){
  const [observation,setObservation]=useState<Observation|null>(null);
  const [error,setError]=useState('');
  async function importObservation(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0];setObservation(null);setError('');
    if(!file)return;
    if(file.size>32_768){setError('Observation exceeds the 32 KB public-evidence limit.');return;}
    try{setObservation(parseQl344Observation(JSON.parse(await file.text())));}
    catch{setError('Rejected: this observation claims unverified approval or receiver activity.');}
    event.currentTarget.value='';
  }
  return <section className="ql344" data-ql344-mode="offline-original-off-review" aria-labelledby="ql344-title">
    <header><div><small>QL-344 · Original receiver-OFF attestation</small>
      <h5 id="ql344-title">Observe OFF. Reconcile original evidence. Keep signing on HOLD.</h5>
      <p>Ree captures the current absence of a receiver listener and Tailscale Serve config. Jack checks the same nonsecret files independently. No browser key, credential, request signing or network call.</p></div>
      <strong>INDEPENDENT REVIEW · HOLD</strong></header>
    <div className="ql344-columns"><article><h6>01 · Ree’s original Windows computer</h6>
      <p>Run in PowerShell from the updated <code>rosevear-comms-hub-ql340</code> folder on DESKTOP-AE894KC.</p>
      <code>powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Status</code>
      <p>After confirming zero listeners on 8788 and “No serve config”, deliberately save a fresh nonsecret observation:</p>
      <code>powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Capture</code>
      <p>The local prompt requires <b>CAPTURE_RECEIVER_OFF_EVIDENCE</b>. The receiver is never started or stopped.</p>
    </article><article><h6>02 · Jack’s independent review</h6>
      <p>Transfer only the public observation and QL-343 review packet. Confirm their original source files and key IDs using the offline verifier:</p>
      <code>node .\runtimes\hub-relay\ql344-off-attestation.mjs --help</code>
      <p>File hashes show matching bytes; they do <b>not</b> independently establish who issued a TLS certificate, Tailnet policy, or an active receiver stop.</p>
      <label htmlFor="ql344-import">Optional nonsecret OFF observation (.json)</label>
      <input id="ql344-import" type="file" accept=".json,application/json" onChange={importObservation}/>
      <p role="status" className="ql344-state">{error||(!observation?'No original Windows observation imported.':
        `Port 8788: zero listeners reported · Tailscale Serve: OFF reported · ${fields.length} file digests · human review required`)}</p>
    </article></div>
    <footer>OBSERVED OFF ≠ ACTIVE STOP · FILE HASH ≠ INDEPENDENT ISSUER · NO OWNER SIGNATURES · NO TEST RECEIPT · CONNECTIONS HELD</footer>
  </section>;
}
