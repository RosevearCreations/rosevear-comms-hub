import {useState} from 'react';
import type {OrganizationId,OperatorWorkspace} from './ql191Organizations';
import {operatorOrganizations} from './ql191Organizations';
import {ql299Checks,ql299Devices,type Ql299CheckId,type Ql299Device} from './ql299AccessibilityReview';
import {QL304_STEPS,type Ql304StepId} from './ql304OperatorAcceptance';
import {QL305_FINDINGS,QL305_MAX_CASES,ql305Append,ql305Coverage,ql305Queue,ql305Retest,ql305ValidateReference,type Ql305Case,type Ql305Disposition,type Ql305Finding,type Ql305Severity} from './ql305FeedbackTriage';
import './ql305-feedback-triage.css';

const dispositions:Record<Ql305Disposition,string>={needs_retest:'Retest required',reproduced_locally:'Reproduced locally',unable_to_reproduce:'Not reproduced locally',deferred:'Deferred'};
const severities:Record<Ql305Severity,string>={blocker:'Blocker',major:'Major',minor:'Minor'};

export function Ql305FeedbackTriage({organizationId,onSelectOrganization,onNavigate}:{organizationId:OrganizationId;onSelectOrganization:(id:OrganizationId)=>void;onNavigate:(workspace:OperatorWorkspace)=>void}){
  const [cases,setCases]=useState<readonly Ql305Case[]>([]);
  const [device,setDevice]=useState<Ql299Device>('desktop');
  const [filter,setFilter]=useState<'all'|Ql299Device>('all');
  const [check,setCheck]=useState<Ql299CheckId>('keyboard');
  const [step,setStep]=useState<Ql304StepId>('inbox');
  const [finding,setFinding]=useState<Ql305Finding>('FOCUS_ORDER');
  const [severity,setSeverity]=useState<Ql305Severity>('major');
  const [reference,setReference]=useState('');
  const [notice,setNotice]=useState('No locally entered feedback cases. Owner evidence remains unverified.');
  const current=ql305Coverage(cases,organizationId);
  const visible=ql305Queue(cases,organizationId,filter);
  function submit(){
    const problem=ql305ValidateReference(reference.trim());
    if(problem){setNotice(problem);return;}
    try{setCases(previous=>ql305Append(previous,{organizationId,device,check,step,finding,severity,reference:reference.trim(),disposition:'needs_retest'}));setReference('');setNotice('Local unverified feedback case recorded in this tab only; no owner or device evidence accepted.');}
    catch(error){setNotice(error instanceof Error&&error.message==='DUPLICATE_COMPANY_REFERENCE'?'This company already has that local case reference.':error instanceof Error&&error.message==='LOCAL_CASE_LIMIT'?'Maximum 24 session-only cases reached.':'Invalid local review selection.');}
  }
  return <section className="ql305" data-ql305-release="operator-feedback-device-retest-v1" aria-labelledby="ql305-title">
    <header><div><p className="ql271-eyebrow">QL-305 · Manual operator feedback triage</p><h3 id="ql305-title">Accessible device retest & finding queue</h3><p>Capture nonsecret local case references, prioritize reproducible accessibility concerns and revisit real operator workspaces. This does not simulate a test outcome or verify an owner submission.</p></div><strong>OWNER EVIDENCE · NOT VERIFIED</strong></header>
    <p className="ql305-warning" role="note">No real owner feedback, test-device observation, screen-reader pass, sign-off or external issue delivery has been received. Cases are manually entered in memory, not authenticated, stored, sent or accepted as proof. Set the actual viewport/device before testing.</p>
    <div className="ql305-companies" role="group" aria-label="Company feedback scope">{operatorOrganizations.map(company=><button type="button" key={company.id} aria-pressed={organizationId===company.id} onClick={()=>{onSelectOrganization(company.id);setNotice('Company scope changed; local cases stay separated.');}}>{company.name}</button>)}</div>
    <div className="ql305-stats" aria-label="Current company feedback totals"><div><small>Local cases</small><strong>{current.cases}</strong></div><div><small>Retest required</small><strong>{current.needRetest}</strong></div><div><small>Locally reproduced</small><strong>{current.locallyReproduced}</strong></div><div><small>Device/check combinations</small><strong>{current.checklistTotal}</strong></div><div><small>Verified owner / retests</small><strong>0 / 0</strong></div></div>
    <div className="ql305-form"><div><h4>Prepare a session-only finding</h4><p>No names, addresses, emails, passwords, screenshots or private case contents. Enter only a harmless tracking reference.</p><label>Device profile<select value={device} onChange={event=>setDevice(event.target.value as Ql299Device)}>{ql299Devices.map(id=><option key={id} value={id}>{id}</option>)}</select></label><label>Accessibility check<select value={check} onChange={event=>setCheck(event.target.value as Ql299CheckId)}>{ql299Checks.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Journey step<select value={step} onChange={event=>setStep(event.target.value as Ql304StepId)}>{QL304_STEPS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Finding category<select value={finding} onChange={event=>setFinding(event.target.value as Ql305Finding)}>{QL305_FINDINGS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Severity<select value={severity} onChange={event=>setSeverity(event.target.value as Ql305Severity)}>{Object.entries(severities).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>Nonsecret case reference<input value={reference} maxLength={32} placeholder="e.g. MOBILE_FOCUS_01" onChange={event=>setReference(event.target.value)} /></label><button type="button" disabled={cases.length>=QL305_MAX_CASES} onClick={submit}>Add unverified local case</button><p aria-live="polite" role="status">{notice}</p></div>
      <div className="ql305-instructions"><h4>Cross-device reproduction</h4><p><strong>Desktop:</strong> 1280px+ · <strong>Tablet:</strong> 768–1024px · <strong>Mobile:</strong> 320–430px. The selector alone does not resize the window.</p><ol>{ql299Checks.map(item=><li key={item.id}><strong>{item.label}</strong><p>{item.steps}</p><small>Expected: {item.expected}</small></li>)}</ol></div></div>
    <div className="ql305-queue"><div className="ql305-queue-heading"><div><h4>{operatorOrganizations.find(company=>company.id===organizationId)?.name} · Local triage</h4><p>Sorted by severity; dispositions describe only manual in-tab review. No owner validation or automatic retest pass.</p></div><label>Filter device<select value={filter} onChange={event=>setFilter(event.target.value as 'all'|Ql299Device)}><option value="all">All devices</option>{ql299Devices.map(id=><option key={id} value={id}>{id}</option>)}</select></label></div>{visible.length===0?<p className="ql305-empty">No local cases match this company and device filter. No confirmed issues or acceptance evidence are implied.</p>:<ol>{visible.map(item=><li key={item.id}><div><strong>{item.reference} · {severities[item.severity]}</strong><small>{item.device} · {ql299Checks.find(check=>check.id===item.check)?.label} · {QL305_FINDINGS.find(finding=>finding.id===item.finding)?.label}</small><small>{item.origin} · owner verified: NO · independent retest: NO</small></div><div><label>Local disposition<select aria-label={`${item.reference} local retest disposition`} value={item.disposition} onChange={event=>setCases(previous=>ql305Retest(previous,item.id,organizationId,event.target.value as Ql305Disposition))}>{Object.entries(dispositions).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><button type="button" onClick={()=>onNavigate(QL304_STEPS.find(step=>step.id===item.step)!.workspace)}>Open {QL304_STEPS.find(step=>step.id===item.step)!.label}</button></div></li>)}</ol>}</div>
    <p className="ql305-warning">Six source integrations: DISCONNECTED / HOLD · Original signed Proof-B/owner TEST approval: NOT VERIFIED · ACK delivery: UNDER_REVIEW / PARKED_FOR_LATER · External actions: 0.</p>
  </section>;
}
