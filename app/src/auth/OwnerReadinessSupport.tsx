import {useState} from 'react';
import type {OwnerProgress} from './ql370OwnerProgress';
import type {OwnerRole} from './ql372OwnerResume';
import {
  ACCEPTANCE_CHECKS,BLOCKER_OPTIONS,EMPTY_ACCEPTANCE,OWNER_HELP_LINKS,
  ownerReadinessIssue,safeAcceptanceNote,
  type AcceptanceAnswers,type AcceptanceBlocker,type AcceptanceResult
} from './ql373OwnerReadiness';

type Props={
  progress:OwnerProgress|null;
  mfaVerified:boolean;
  intentSupplied:boolean;
  ownerRole:OwnerRole;
  nowMs:number;
};

/** QL-373 UI-only observations. No new browser/network request, persisted
 * acceptance receipt, credential collection, or original-owner signing. */
export function OwnerReadinessSupport({progress,mfaVerified,intentSupplied,ownerRole,nowMs}:Props){
  const [answers,setAnswers]=useState<AcceptanceAnswers>(()=>({...EMPTY_ACCEPTANCE}));
  const [blocker,setBlocker]=useState<AcceptanceBlocker>('none');
  const [copyStatus,setCopyStatus]=useState('');
  const diagnosis=ownerReadinessIssue({progress,mfaVerified,intentSupplied,ownerRole,nowMs});
  const note=safeAcceptanceNote(ownerRole,answers,blocker);

  async function copyNote(){
    try{
      if(!navigator.clipboard?.writeText)throw Error('COPY_UNAVAILABLE');
      await navigator.clipboard.writeText(note);
      setCopyStatus('Self-reported usability note copied. No credentials or enrollment evidence were included.');
    }catch{
      setCopyStatus('Automatic copy unavailable. Select the read-only note and copy it manually.');
    }
  }

  function clearNotes(){
    setAnswers({...EMPTY_ACCEPTANCE});
    setBlocker('none');
    setCopyStatus('This device’s observations were cleared. Nothing was stored on a server or sent.');
  }

  return <section className="ql373-support" aria-labelledby="ql373-help-title">
    <p className="ql370-eyebrow">QL-373 · READINESS HELP & INDEPENDENT DEVICE NOTES</p>
    <h3 id="ql373-help-title">What can we safely check next?</h3>
    <div className={`ql373-diagnosis ql373-${diagnosis.priority}`}
      role={diagnosis.priority==='stop'?'alert':'status'} aria-label="Enrollment readiness troubleshooting">
      <strong>{diagnosis.heading}</strong>
      <p>{diagnosis.explanation}</p>
      <p><strong>Safe next step:</strong> {diagnosis.nextAction}</p>
      <a href={diagnosis.helpLink} target="_blank" rel="noopener noreferrer">
        Read the relevant original-owner help
      </a>
      {diagnosis.code==='READBACK_UNAVAILABLE'||diagnosis.code==='REFRESH_STATUS'?<p>
        <a href="#ql370-refresh-status">Go to protected status refresh</a>
      </p>:null}
    </div>
    <nav aria-label="Safe owner help links" className="ql373-resources">
      <h4>Verified reference instructions</h4>
      <ul>{OWNER_HELP_LINKS.map(link=><li key={link.href}>
        <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
      </li>)}</ul>
      <p className="ql368-help">These fixed links contain no account details, session tokens, intent hash, or sensitive signed packet.</p>
    </nav>
    <details className="ql373-acceptance">
      <summary>Record a separate usability note on this device</summary>
      <p>Each of us can test the portal on our own computer and copy a <strong>self-reported, non-authorizing</strong> note. These observations are held only in this page until it is refreshed or closed. There is no upload, shared account, signed acceptance or database write.</p>
      <p className="ql368-help" id="ql373-no-secrets">Do not type or paste passwords, MFA codes, intent hashes, private keys, email addresses or signed files. Only choose the fixed outcomes below.</p>
      <fieldset className="ql373-fieldset" aria-describedby="ql373-no-secrets">
        <legend>{ownerRole==='source'?'Ree’s':'Jack’s'} own-device observations</legend>
        {ACCEPTANCE_CHECKS.map(item=><div className="ql373-observation" key={item.id}>
          <label htmlFor={`ql373-${item.id}`}>{item.label}</label>
          <select id={`ql373-${item.id}`} value={answers[item.id]}
            onChange={event=>{
              setAnswers(prev=>({...prev,[item.id]:event.target.value as AcceptanceResult}));
              setCopyStatus('');
            }}>
            <option value="not_tested">Not tested</option>
            <option value="worked">Worked on this device</option>
            <option value="blocked">Blocked on this device</option>
          </select>
        </div>)}
      </fieldset>
      <div className="ql373-observation">
        <label htmlFor="ql373-blocker">Broad blocker category (no private details)</label>
        <select id="ql373-blocker" value={blocker}
          onChange={event=>{setBlocker(event.target.value as AcceptanceBlocker);setCopyStatus('');}}>
          {BLOCKER_OPTIONS.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      </div>
      <label htmlFor="ql373-safe-note" className="ql373-note-label">Read-only observation note</label>
      <textarea id="ql373-safe-note" readOnly rows={12} value={note}
        onFocus={event=>event.currentTarget.select()}/>
      <div className="ql373-note-buttons" role="group" aria-label="Self-reported observation actions">
        <button type="button" onClick={()=>{void copyNote();}}>Copy safe observation note</button>
        <button type="button" className="ql368-link-button" onClick={clearNotes}>Clear observations</button>
      </div>
      {copyStatus&&<p role="status" aria-live="polite" className="ql368-help">{copyStatus}</p>}
      <p className="ql371-boundary"><strong>Not an owner signature or activation.</strong>
        No review note can alter original-owner membership, MFA, evidence validity, private TEST or any application HOLD.</p>
    </details>
  </section>;
}
