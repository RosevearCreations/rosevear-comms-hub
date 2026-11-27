import {useEffect,useMemo,useState} from 'react';
import {getSupabaseClient} from '../supabase/client';
import {getOwnerAuthClient} from '../supabase/ql367OwnerClient';
import type {OrganizationId} from './ql191Organizations';
import {ql505ReadOwnExceptions,type Ql505OperatorRead} from './ql505ExceptionRead';
import './ql505-exceptions.css';

/** Real tenant-scoped metadata. No send, exception update or grant UI. */
export function Ql505OperatorExceptionPanel({organizationId}:{
 organizationId:OrganizationId
}){
 const client=useMemo(()=>getSupabaseClient()??getOwnerAuthClient(),[]);
 const [view,setView]=useState<Ql505OperatorRead|null>(null);
 useEffect(()=>{
  let active=true,requestId=0;
  setView(null);
  const refresh=()=>{
   const id=++requestId;
   void ql505ReadOwnExceptions(
    client as Parameters<typeof ql505ReadOwnExceptions>[0],organizationId
   ).then(result=>{if(active&&id===requestId)setView(result)});
  };
  refresh();
  if(!client)return ()=>{active=false;requestId++};
  const interval=window.setInterval(()=>{
   if(document.visibilityState==='visible')refresh();
  },45000);
  const onVisible=()=>{if(document.visibilityState==='visible')refresh()};
  document.addEventListener('visibilitychange',onVisible);
  const session=client.auth?.onAuthStateChange?.(()=>{
   queueMicrotask(()=>{if(active)refresh()});
  });
  return ()=>{
   active=false;requestId++;
   window.clearInterval(interval);
   document.removeEventListener('visibilitychange',onVisible);
   session?.data.subscription.unsubscribe();
  };
 },[client,organizationId]);
 return <section className="ql505-exceptions"
   aria-label="QL-505 private signed-receipt exception history"
   data-ql505-source={organizationId} data-ql505-sends="false">
   <header>
    <p className="ql191-eyebrow">QL-505 · Private signed-receipt exceptions</p>
    <h5>Receipts needing Comms operator attention</h5>
    <p>Authorized tenant metadata only. A private RPC outage, expired signer or
     failed receipt never becomes proof that a guest received a message.</p>
   </header>
   {!view&&<p role="status">Checking authenticated exception history…</p>}
   {view&&view.state!=='READY'&&<p className="ql505-status" role="status">
    <strong>{view.state.replaceAll('_',' ')}.</strong> {view.reason}
    {' '}No invented provider receipt or operator case is substituted.
   </p>}
   {view?.state==='READY'&&<>
    <p className="ql505-status" role="status">
     <strong>Authenticated Comms tenant read.</strong> Tenant:
     {' '}<code>{view.tenantDigest?.slice(0,12)}…</code>.
     {' '}{view.exceptions.length} unresolved private receipt exceptions.
    </p>
    {view.exceptions.length===0?<p>No private receipt exceptions have
     been recorded for this authorized tenant. This does not certify live
     provider connectivity.</p>:
     <ol aria-label="Unresolved tenant-scoped receipt exceptions">
      {view.exceptions.map(item=><li key={item.exception_id}>
       <strong>HOLD · {item.reason_code.replaceAll('_',' ')}</strong>
       <span>Job <code>{item.job_digest.slice(0,16)}…</code> ·
        {' '}Recorded {item.recorded_at}</span>
       <p>Review the separately signed source/provider evidence in the
        private Comms runtime. Do not retry a customer send from this panel.</p>
      </li>)}
     </ol>}
   </>}
   <p className="ql505-boundary" role="note">
    Independent source/provider and reviewer signatures must be validated
    before accepting any field readback. A signed claim alone is not
    physical original-host evidence or human acknowledgement.
    This panel cannot send, start receivers, close exceptions or create access.
   </p>
 </section>;
}
