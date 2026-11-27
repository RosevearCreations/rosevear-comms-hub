import {useMemo,useState} from 'react';
import type {OrganizationId} from './ql191Organizations';
import {ql502ReviewScenario,type Ql502Scenario} from './ql502DeliveredVersionReview';
import './ql502-delivery-truth.css';
const examples:ReadonlyArray<{value:Ql502Scenario;label:string}>=Object.freeze([
 {value:'saved_only',label:'Saved request only'},
 {value:'version_changed',label:'Gate changed · v2 supersedes v1'},
 {value:'outdated_reply',label:'Guest replies to old gate instructions'},
 {value:'opted_out',label:'Guest opted out · retry blocked'},
 {value:'provider_outage',label:'Provider outage · delivery unverified'}
]);
/** Explicitly in-memory preview. Does not accept real private records. */
export function Ql502DeliveryTruthPanel({organizationId}:{
  organizationId:OrganizationId
}){
 const [scenario,setScenario]=useState<Ql502Scenario>('outdated_reply');
 const review=useMemo(()=>ql502ReviewScenario(organizationId,scenario),
   [organizationId,scenario]);
 if(review.state==='ACCESS_DENIED')return null;
 return <section className="ql502-panel" aria-label="QL-502 delivered version and reply rehearsal"
   data-ql502-release="ql502-synthetic-versioned-delivery-hold"
   data-ql502-live="false">
   <header>
    <p className="ql191-eyebrow">QL-502 · Versioned delivery truth rehearsal</p>
    <h5>What did the guest actually receive?</h5>
    <p><strong>DEMONSTRATION ONLY.</strong> These are invented events for {review.displayTenant}.
      No message was sent; no provider or guest delivery was independently verified.</p>
   </header>
   <label htmlFor="ql502-scenario">Choose a controlled test case</label>
   <select id="ql502-scenario" value={scenario}
      onChange={e=>setScenario(e.target.value as Ql502Scenario)}>
      {examples.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
   </select>
   <div className="ql502-current" role="status">
     Current example: instructions v{review.currentVersion} ·
     {review.replyNeedsAttention?' Older-version reply needs staff review':' No pending reply in this example'}
   </div>
   <ol aria-label="Synthetic versioned message evidence">
     {review.steps.map((s,index)=><li key={s.id} data-ql502-state={s.state}>
      <strong>Step {index+1}: {s.title}</strong>
      <span>Version {s.version} · {s.state.replaceAll('_',' ').toLowerCase()}</span>
      <p>{s.explanation}</p>
     </li>)}
   </ol>
   {review.replyNeedsAttention&&<p className="ql502-reply" role="note">
     <strong>Operator action:</strong> Reply under the Camp Rosevear brand using
     the current v2 instructions after checking stay membership and recipient
     preferences. This screen cannot send.
   </p>}
   <p className="ql502-truth" role="note"><strong>Verification boundary:</strong>
     Saved ≠ provider accepted ≠ delivered ≠ human acknowledged.
     QL-501 Master ACKs also do not prove customer delivery.
     A real provider-delivery record needs independent signed evidence;
     an inbound reply requires authorized owning-tenant attribution.</p>
   <button type="button" disabled aria-label="Live reply not available until provider and tenant authorization">
     Send disabled · provider not connected
   </button>
 </section>;
}
