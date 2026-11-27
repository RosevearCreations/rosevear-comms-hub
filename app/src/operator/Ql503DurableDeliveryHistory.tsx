import {useEffect,useMemo,useState} from 'react';
import {getSupabaseClient} from '../supabase/client';
import {getOwnerAuthClient} from '../supabase/ql367OwnerClient';
import type {OrganizationId} from './ql191Organizations';
import {ql503ReadOwnTenantHistory,ql503DescribeMessage,
 type Ql503ReadResult} from './ql503DeliveryRead';
import './ql503-delivery-history.css';

/** QL-503: genuinely authenticated, RLS-scoped read of durable metadata.
 * No provider connection, send, write, or owner approval is created by UI.
 * Defaults to inert on the public GitHub Pages disabled preview.
 */
export function Ql503DurableDeliveryHistory({organizationId}:{
 organizationId:OrganizationId
}){
 const client=useMemo(()=>getSupabaseClient()??getOwnerAuthClient(),[]);
 const [view,setView]=useState<Ql503ReadResult|null>(null);
 useEffect(()=>{
  let active=true,requestId=0;
  setView(null);
  const refresh=()=>{
   const current=++requestId;
   void ql503ReadOwnTenantHistory(
     client as Parameters<typeof ql503ReadOwnTenantHistory>[0],organizationId
   ).then(next=>{if(active&&current===requestId)setView(next)});
  };
  refresh();
  if(!client)return ()=>{active=false;requestId++};
  // QL-504 Comms-only automatic readback while an authorized session is
  // present. No manual refresh, provider subscription, write or send.
  const interval=window.setInterval(()=>{
   if(document.visibilityState==='visible')refresh();
  },45000);
  const onVisible=()=>{if(document.visibilityState==='visible')refresh()};
  document.addEventListener('visibilitychange',onVisible);
  const subscription=client.auth?.onAuthStateChange?.(()=>{
   queueMicrotask(()=>{if(active)refresh()});
  });
  return ()=>{
   active=false;requestId++;
   window.clearInterval(interval);
   document.removeEventListener('visibilitychange',onVisible);
   subscription?.data.subscription.unsubscribe();
  };
 },[client,organizationId]);
 const data=view;
 return <section className="ql503-history" aria-label="QL-503 authenticated delivery history"
  data-ql503-release="ql503-durable-tenant-scoped-read"
  data-ql503-public-sends="false" data-organization={organizationId}>
   <header>
    <p className="ql191-eyebrow">QL-504 · Automatic, durable tenant-scoped readback</p>
    <h5>Actual signed records · separate from demonstrations</h5>
    <p>Automatically rechecks only our authenticated, source-approved tenant when the session changes, the tab resumes, or the scheduled read interval elapses.
      Saved request, provider acceptance, delivered claim, and customer
      acknowledgement are different events. There is no send function here.</p>
   </header>
   {!data&&<p role="status">Checking the authenticated Comms history read boundary…</p>}
   {data&&data.state!=='READY'&&<p className="ql503-status" role="status">
     <strong>{data.state.replaceAll('_',' ')}.</strong> {data.reason}
     {' '}No synthetic receipt is substituted for a real one.
   </p>}
   {data?.state==='READY'&&<>
    <p className="ql503-status" role="status">
     <strong>Scoped database read verified.</strong> Authorized tenant:
     <code>{data.tenantDigest?.slice(0,12)}…</code> · Role: {data.accessRole}
     {' '}· {data.messages.length} immutable message versions ·
     {' '}{data.events.length} evidence events.
    </p>
    {data.messages.length===0?<p>No signed delivery metadata has been
      recorded for this approved tenant. This is not a provider outage claim.</p>:
     <ol aria-label="Authenticated message version and provider receipt history">
      {data.messages.map(m=>{
       const description=ql503DescribeMessage(m,data.messages,data.events);
       return <li key={[m.thread_digest,m.message_key,m.message_version].join(':')}>
        <strong>{m.message_key} · v{m.message_version}</strong>
        <span>{description.label}</span>
        <small>Source: {m.source_app} · Version: {m.message_version} ·
          {' '}Recorded: {m.recorded_at}</small>
        <p>Source packet: <code>{m.source_packet_digest.slice(0,16)}…</code>
          {' '}· Content hash: <code>{m.content_digest.slice(0,16)}…</code></p>
        {description.replyNeedsReview&&<p className="ql503-needs-review" role="note">
          Reply to superseded v{m.message_version} needs staff review.
          Current visible version: v{description.currentVersion}.
          Use the owning application to verify current guest instructions.
          No automatic response.
        </p>}
       </li>;
      })}
     </ol>}
   </>}
   <p className="ql503-boundary" role="note">
    <strong>Verification boundary:</strong> Even a provider-signed delivered
    claim is not proof a human read it. The QL-501 Master ACK does not prove
    customer delivery. Tenant access comes from server RLS, never the brand
    switcher. No access or missing provider is recorded as HOLD, not GREEN.
   </p>
 </section>;
}
