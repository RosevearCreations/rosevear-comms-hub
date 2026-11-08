import {useEffect,useMemo,useState} from 'react';
import type {OwnerProgress} from './ql370OwnerProgress';
import {buildOwnerCeremonySteps,SAFE_OWNER_HANDOFF,type CeremonyStepStatus}
  from './ql371OwnerCeremony';
import {OwnerCeremonyWalkthrough} from './OwnerCeremonyWalkthrough';
import {OwnerReadinessSupport} from './OwnerReadinessSupport';

type Props={
  progress:OwnerProgress|null;
  mfaVerified:boolean;
  intentSupplied:boolean;
  ownerRole:'source'|'master';
};
const statusLabel:Record<CeremonyStepStatus,string>={
  verified:'Server verified',
  offline:'Original-device review',
  pending:'Not yet server verified',
  attention:'Renew or recheck'
};

/** Only the existing QL-370 protected status readback can establish progress.
 * This guide never modifies a database, authentication, or signing authority. */
export function OwnerCeremonyGuide({progress,mfaVerified,intentSupplied,ownerRole}:Props){
  const [nowMs,setNowMs]=useState(()=>Date.now());
  const [copyStatus,setCopyStatus]=useState('');
  useEffect(()=>{
    const timer=window.setInterval(()=>setNowMs(Date.now()),15000);
    return ()=>window.clearInterval(timer);
  },[]);
  const guide=useMemo(()=>buildOwnerCeremonySteps({
    progress,mfaVerified,intentSupplied,ownerRole,nowMs
  }),[progress,mfaVerified,intentSupplied,ownerRole,nowMs]);
  const alert=guide.stop||[guide.own,guide.peer].some(x=>
    x.severity==='urgent'||x.severity==='expired'||x.severity==='review');
  const warn=[guide.own,guide.peer].some(x=>x.severity==='soon');
  const actionable=guide.stop?null:guide.steps.find(x=>x.status==='attention')??
    guide.steps.find(x=>x.status==='pending')??null;
  const verified=guide.steps.filter(x=>x.status==='verified').length;

  async function copyHandoff(){
    try{
      if(!navigator.clipboard?.writeText)throw Error('COPY_UNAVAILABLE');
      await navigator.clipboard.writeText(SAFE_OWNER_HANDOFF);
      setCopyStatus('Safe instructions copied. No owner evidence or credentials were included.');
    }catch{
      setCopyStatus('Automatic copy was unavailable. Select the note below and copy it manually.');
    }
  }

  return <section className="ql371-guide" aria-label="QL-371 guided original-owner enrollment ceremony">
    <div className="ql371-topline">
      <div>
        <p className="ql370-eyebrow">QL-371 · GUIDED ORIGINAL-OWNER HANDOFF</p>
        <h3>Step-by-step enrollment checklist</h3>
      </div>
      <span className="ql371-progress-caption">{verified} of 7 checkpoints server verified</span>
    </div>
    <p className="ql368-help">Steps marked “Original-device review” are deliberately <strong>not</strong> treated as completed by a browser. The countdowns are estimates only; Supabase and the original signer enforce actual expiries.</p>
    {guide.stop&&<p role="alert" className="ql370-warning">
      <strong>STOP — original-owner evidence or application HOLD has drifted.</strong>
      Do not retry activation. Review the protected source records and signed packet.
    </p>}
    {(alert||warn)&&!guide.stop&&<div className={alert?'ql371-urgent':'ql371-soon'} role="status">
      <strong>{alert?'Attestation needs prompt review':'Attestation window ending soon'}</strong>
      <span>Refresh protected server status and verify both owners’ own sessions. An on-screen timer never extends or renews evidence.</span>
    </div>}
    <ol className="ql371-steps">
      {guide.steps.map((step,index)=><li key={step.id}
        className={`ql371-step ql371-${step.status}`}
        aria-current={step.id===actionable?.id?'step':undefined}>
        <div className="ql371-step-heading">
          <span className="ql371-number" aria-hidden="true">{index+1}</span>
          <h4>{step.title}</h4>
        </div>
        <p className="ql371-state">{statusLabel[step.status]}</p>
        <p>{step.details}</p>
      </li>)}
    </ol>
    <OwnerCeremonyWalkthrough key={ownerRole} steps={guide.steps} progress={progress}
      mfaVerified={mfaVerified} ownerRole={ownerRole} nowMs={nowMs}/>
    <OwnerReadinessSupport key={`ql373-${ownerRole}`} progress={progress} mfaVerified={mfaVerified}
      intentSupplied={intentSupplied} ownerRole={ownerRole} nowMs={nowMs}/>
    <div className="ql371-boundary" role="note">
      <strong>All six applications remain DISCONNECTED / HOLD.</strong>
      A completed checklist or master-owner membership does not approve private TEST, source access, customer operations or a connection.
    </div>
    <details className="ql371-handoff">
      <summary>Share safe instructions with the other owner</summary>
      <p>Copy this general handoff to Ree or Jack. The note contains <strong>no live status, hash, credential, signature, Auth token or private material</strong>. Share original evidence only through the established trusted device-to-device procedure.</p>
      <label htmlFor="ql371-safe-handoff">Safe, non-authorizing handoff note</label>
      <textarea id="ql371-safe-handoff" readOnly rows={9}
        onFocus={event=>event.currentTarget.select()} value={SAFE_OWNER_HANDOFF}/>
      <button type="button" className="ql368-link-button" onClick={()=>{void copyHandoff();}}>
        Copy safe handoff instructions
      </button>
      {copyStatus&&<p role="status" className="ql368-help">{copyStatus}</p>}
      <p className="ql368-help">For original Windows signer commands and exact approval fields, consult the <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-369_AUTHENTICATED_DUAL_OWNER_ENROLLMENT_CEREMONY.md" target="_blank" rel="noopener noreferrer">QL-369 original-owner procedure</a>.</p>
    </details>
  </section>;
}
