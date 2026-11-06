import {useState,type ChangeEvent} from 'react';
import {parseQl342Preflight,type Ql342Preflight} from './ql342OwnerGate';
import './ql342-owner-gate.css';

export function Ql342OwnerGatePanel(){
  const [readback,setReadback]=useState<Ql342Preflight|null>(null);
  const [error,setError]=useState('');
  const steps=[
    {number:'01',title:'Independent owner review',detail:'Ree signs only on the Windows Hub; Jack signs only on his laptop. Four original field records must match the short-lived TEST request.',seen:Boolean(readback?.signedEnrollmentPresent&&readback.approvedPublicPinsPresent)},
    {number:'02',title:'Private credential handoff',detail:'An independently authorized database administrator issues the dedicated receiver credential. Ree stores it only in Windows current-user DPAPI.',seen:Boolean(readback?.privateCredentialEncryptedOnDisk)},
    {number:'03',title:'One genuine TEST receipt',detail:'A single device-signed health-only heartbeat must match its exact append-only private DB receipt. Duplicates and missing evidence remain HOLD.',seen:false},
    {number:'04',title:'Six-app connection release',detail:'Separate scoped peer enrollment and owner approval are still required before any application exchange.',seen:false}
  ];
  async function importReadback(e:ChangeEvent<HTMLInputElement>){
    const file=e.currentTarget.files?.[0];setReadback(null);setError('');
    if(!file)return;
    if(file.size>16_384){setError('This local preflight file is larger than 16 KB.');return;}
    try{setReadback(parseQl342Preflight(JSON.parse(await file.text())));}
    catch{setError('Rejected: an activated or unrecognized QL-342 status cannot be imported.');}
    e.currentTarget.value='';
  }
  return <section className="ql342" aria-labelledby="ql342-title" data-ql342-mode="local-import-no-network">
    <header><div><span className="ql342-tag">QL-342 · Independent owner custody</span>
      <h4 id="ql342-title">First authentic TEST receipt</h4>
      <p>A guided handoff from the two original owners to one independently verified TEST heartbeat. No credential, private signing key or network connection is ever processed in this page.</p></div>
      <span className="ql342-badge">FIELD APPROVAL · HOLD</span></header>
    <div className="ql342-progress" role="list" aria-label="Independent original owner authorization steps">
      {steps.map(step=><article role="listitem" key={step.number}>
        <div><span className="ql342-step">{step.number}</span><span className="ql342-step-state">{step.seen?'FILE PRESENT · REVIEW REQUIRED':'NOT VERIFIED'}</span></div>
        <h5>{step.title}</h5><p>{step.detail}</p>
      </article>)}
    </div>
    <div className="ql342-handoff">
      <div><h5>Ree’s safe first command</h5>
        <p>Update the clean Windows checkout, then run this read-only prerequisite check:</p>
        <code>powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -OwnerPreflight</code>
        <p>The output describes locally present files and missing next steps. A real signature, database grant or TEST receipt cannot be created by clicking here.</p></div>
      <div><label htmlFor="ql342-import">Optional nonsecret owner preflight (.json)</label>
        <input id="ql342-import" type="file" accept=".json,application/json" onChange={importReadback}/>
        <span className="ql342-import-status" role="status">{error||(!readback?'No original Windows preflight imported.':
          `${readback.candidateFileCount}/3 public candidates present · ${readback.signedEnrollmentPresent?'signed enrollment file present':'signatures not locally present'} · receiver OFF`)}</span>
        <p>Imported statuses remain owner-supplied claims until independently checked on Ree’s machine. Never upload credentials or private keys.</p></div>
    </div>
    <footer>NO LIVE CONNECTIONS · NO CUSTOMER CALLS OR SMS · NO HOME DEVICE ACTIONS · ORIGINAL OWNERS RETAIN ALL SIGNING AUTHORITY</footer>
  </section>;
}
