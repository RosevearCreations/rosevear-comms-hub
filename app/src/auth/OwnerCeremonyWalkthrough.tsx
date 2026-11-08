import {useEffect,useRef,useState} from 'react';
import type {OwnerProgress} from './ql370OwnerProgress';
import type {CeremonyStep} from './ql371OwnerCeremony';
import {
  WALKTHROUGH_STEP_IDS,clearHelpPosition,mayOfferWalkthroughResume,
  readHelpPosition,saveHelpPosition,walkthroughStepGuidance,
  type OwnerRole,type WalkthroughStepId
} from './ql372OwnerResume';

type Props={
  steps:CeremonyStep[];
  progress:OwnerProgress|null;
  mfaVerified:boolean;
  ownerRole:OwnerRole;
  nowMs:number;
};

function tabStorage():Storage|null {
  try {return window.sessionStorage;} catch {return null;}
}

/** Non-authorizing, screen-reader-friendly help only. It cannot call any
 * Supabase operation, sign a packet, change MFA, or activate an owner. */
export function OwnerCeremonyWalkthrough({steps,progress,mfaVerified,ownerRole,nowMs}:Props){
  const [current,setCurrent]=useState<WalkthroughStepId>('ql368');
  const [saved,setSaved]=useState<WalkthroughStepId|null>(null);
  const [announcement,setAnnouncement]=useState('Start with step 1. Nothing has been approved by opening this walkthrough.');
  const restoredForRole=useRef(false);
  const moveFocus=useRef(false);
  const headingRef=useRef<HTMLHeadingElement>(null);
  const verifiedReadback=mayOfferWalkthroughResume(progress,mfaVerified,ownerRole,nowMs);

  useEffect(()=>{
    if (!verifiedReadback||restoredForRole.current)return;
    restoredForRole.current=true;
    const storage=tabStorage();
    if (storage)setSaved(readHelpPosition(ownerRole,storage));
  },[verifiedReadback,ownerRole]);

  useEffect(()=>{
    if (!moveFocus.current)return;
    moveFocus.current=false;
    headingRef.current?.focus();
  },[current]);

  const index=WALKTHROUGH_STEP_IDS.indexOf(current);
  const currentStep=steps.find(x=>x.id===current);
  const title=currentStep?.title??'Review original-owner instructions';
  const total=WALKTHROUGH_STEP_IDS.length;

  function selectStep(next:WalkthroughStepId,note='Viewing'){
    moveFocus.current=true;
    setCurrent(next);
    setSaved(null);
    const number=WALKTHROUGH_STEP_IDS.indexOf(next)+1;
    setAnnouncement(`${note} step ${number} of ${total}: ${steps.find(x=>x.id===next)?.title??'Original-owner review'}. This does not complete enrollment.`);
    const storage=tabStorage();
    if(verifiedReadback&&storage)saveHelpPosition(ownerRole,next,storage);
  }

  function startOver(){
    const storage=tabStorage();
    if(storage)clearHelpPosition(ownerRole,storage);
    moveFocus.current=true;
    setCurrent('ql368');
    setSaved(null);
    setAnnouncement('Help position cleared. We are back at step 1. No server evidence, MFA session, or enrollment approval was changed.');
    // When already at the first step, no state change fires the focus effect.
    if(current==='ql368')headingRef.current?.focus();
  }

  return <section className="ql372-walkthrough" aria-labelledby="ql372-walkthrough-title">
    <p className="ql370-eyebrow">QL-372 · SUPERVISED, READ-ONLY WALKTHROUGH</p>
    <h3 id="ql372-walkthrough-title">Review one step together</h3>
    <p className="ql368-help">Ree and Jack each work on their <strong>own</strong> trusted computer. We can discuss the instructions together, but cannot share an authenticator code, sign for each other or use this guide as consent.</p>
    {!verifiedReadback&&<p className="ql370-warning" role="status">
      <strong>Protected status needs verification.</strong>
      This help can be read, but restoring a previous step requires a fresh individual MFA-protected server readback. Refresh server status after completing MFA.
    </p>}
    {verifiedReadback&&saved&&saved!==current&&<div className="ql372-resume" role="group" aria-label="Resume a previous help-page position">
      <p>A non-sensitive help position from this browser tab is available. It does <strong>not</strong> restore enrollment, a signed approval, MFA, or the original intent.</p>
      <button type="button" className="ql368-link-button" onClick={()=>selectStep(saved,'Resumed viewing')}>
        Resume reading step {WALKTHROUGH_STEP_IDS.indexOf(saved)+1}
      </button>
    </div>}
    <p className="ql372-live" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <div id="ql372-current-step" className="ql372-current" role="group" aria-labelledby="ql372-step-heading">
      <p className="ql372-counter">Instruction {index+1} of {total}</p>
      <h4 id="ql372-step-heading" tabIndex={-1} ref={headingRef}>{title}</h4>
      <p className="ql372-status"><strong>Last server evidence:</strong> {verifiedReadback
        ? currentStep?.status==='verified'?'Verified at last protected readback':
          currentStep?.status==='offline'?'Original-device review required':
          currentStep?.status==='attention'?'Needs renewal or recheck':'Not verified'
        : 'Not currently verified; refresh before relying on this status'}</p>
      <p>{walkthroughStepGuidance(ownerRole,currentStep??{
        id:current,title,status:'pending',details:''
      })}</p>
      <p className="ql368-help">Navigation is only a reading aid. The original QL-368 evidence, QL-369 signatures, personal AAL2 MFA and final server activation remain separate.</p>
    </div>
    <div className="ql372-navigation" role="group" aria-label="Step-by-step walkthrough navigation">
      <button type="button" className="ql368-link-button" disabled={index===0}
        aria-controls="ql372-current-step" onClick={()=>selectStep(WALKTHROUGH_STEP_IDS[index-1])}>
        Previous step
      </button>
      <button type="button" disabled={index===total-1}
        aria-controls="ql372-current-step" onClick={()=>selectStep(WALKTHROUGH_STEP_IDS[index+1])}>
        Next instruction
      </button>
      <button type="button" className="ql368-link-button" onClick={startOver}>
        Clear help position and start over
      </button>
    </div>
    <p className="ql371-boundary"><strong>All six application shells remain DISCONNECTED / HOLD.</strong>
      Resuming or navigating instructions never activates an owner membership or a connection.</p>
  </section>;
}
