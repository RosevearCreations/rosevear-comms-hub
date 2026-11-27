/**
 * QL-503 public client read-only facade.
 *
 * The only authorization is a real Supabase Auth session plus server-side
 * exact-tenant RLS. The UI selector cannot grant any tenant membership.
 * No remote writes or service_role key are used in this module.
 */
import type {OrganizationId} from './ql191Organizations';
const HEX=/^[a-f0-9]{64}$/;
export type Ql503DeliveryMessage={
 source_app:string;tenant_digest:string;thread_digest:string;
 message_key:string;message_version:number;content_digest:string;
 source_packet_digest:string;issued_at:string;recorded_at:string;
};
export type Ql503DeliveryEvent={
 source_app:string;tenant_digest:string;thread_digest:string;
 message_key:string;message_version:number;event_id:string;
 evidence_kind:'PROVIDER_ACCEPTED'|'PROVIDER_DELIVERED'|'INBOUND_REPLY';
 evidence_packet_digest:string;provider_receipt_id:string|null;
 signed_by:'ORIGINAL_SOURCE'|'INDEPENDENT_PROVIDER';
 reply_current_version:number|null;occurred_at:string;recorded_at:string;
};
export type Ql503ReadResult={
 state:'CONFIG_DISABLED'|'AUTH_REQUIRED'|'TENANT_GRANT_MISSING'|'ERROR'|'READY';
 reason:string;sourceApp:OrganizationId;tenantDigest:string|null;
 accessRole:string|null;messages:readonly Ql503DeliveryMessage[];
 events:readonly Ql503DeliveryEvent[];allowedTenants:number;
 isLiveProviderConnected:false;customerAcknowledged:false;
 canSend:false;serverWrites:false;
};
type Client={
 auth:{getUser:()=>Promise<{data:{user:null|{id:string;is_anonymous?:boolean}};error?:unknown}>};
 from:(table:string)=>any;
};
const blank=(sourceApp:OrganizationId,state:Ql503ReadResult['state'],reason:string):Ql503ReadResult=>
 ({state,reason,sourceApp,tenantDigest:null,accessRole:null,messages:[],
  events:[],allowedTenants:0,isLiveProviderConnected:false,
  customerAcknowledged:false,canSend:false,serverWrites:false});
const valid=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);

/** All requests go through the user's publishable-key client and RLS. */
export async function ql503ReadOwnTenantHistory(
 client:Client|null,sourceApp:OrganizationId
):Promise<Ql503ReadResult>{
 if(!client)return blank(sourceApp,'CONFIG_DISABLED','Authenticated database access is disabled for this deployment.');
 if(!['icamp','yw','devilndove','rosiedazzlers'].includes(sourceApp))
  return blank(sourceApp,'ERROR','Unrecognized source app.');
 try{
  const who=await client.auth.getUser(); // server-verifies access JWT
  const user=who.data?.user;
  if(who.error||!user?.id||user.is_anonymous===true)
   return blank(sourceApp,'AUTH_REQUIRED','Authenticated, non-anonymous owner or operator session required.');
  const grants=await client.from('ql503_tenant_read_grants')
   .select('source_app,tenant_digest,access_role,expires_at')
   .eq('source_app',sourceApp).eq('user_id',user.id).eq('active',true)
   .gt('expires_at',new Date().toISOString())
   .order('expires_at',{ascending:false}).limit(10);
  if(grants.error)return blank(sourceApp,'ERROR','Exact-tenant grant read could not be verified.');
  const trusted=(Array.isArray(grants.data)?grants.data:[]).filter(v=>
   valid(v)&&v.source_app===sourceApp&&typeof v.tenant_digest==='string'&&
   HEX.test(v.tenant_digest)&&['operator','auditor'].includes(String(v.access_role))&&
   typeof v.expires_at==='string'&&Date.parse(v.expires_at)>Date.now());
  if(!trusted.length)return blank(sourceApp,'TENANT_GRANT_MISSING',
   'No active, source-approved Comms tenant access. Other applications are not blocking this read path.');
  const selected=trusted[0],tenant=String(selected.tenant_digest);
  // Explicit equality filters assist defense in depth. RLS is authoritative.
  const [m,e]=await Promise.all([
   client.from('ql503_delivery_messages')
    .select('source_app,tenant_digest,thread_digest,message_key,message_version,content_digest,source_packet_digest,issued_at,recorded_at')
    .eq('source_app',sourceApp).eq('tenant_digest',tenant)
    .order('recorded_at',{ascending:false}).limit(25),
   client.from('ql503_delivery_evidence')
    .select('source_app,tenant_digest,thread_digest,message_key,message_version,event_id,evidence_kind,evidence_packet_digest,provider_receipt_id,signed_by,reply_current_version,occurred_at,recorded_at')
    .eq('source_app',sourceApp).eq('tenant_digest',tenant)
    .order('occurred_at',{ascending:false}).limit(75)
  ]);
  if(m.error||e.error)return blank(sourceApp,'ERROR','Authenticated, scoped receipt read failed.');
  const messages=(Array.isArray(m.data)?m.data:[]).filter(row=>
   valid(row)&&row.source_app===sourceApp&&row.tenant_digest===tenant&&
   Number.isSafeInteger(row.message_version)&&Number(row.message_version)>0&&
   HEX.test(String(row.thread_digest))&&HEX.test(String(row.content_digest))) as Ql503DeliveryMessage[];
  const keys=new Set(messages.map(row=>[row.thread_digest,row.message_key,row.message_version].join(':')));
  const events=(Array.isArray(e.data)?e.data:[]).filter(row=>
   valid(row)&&row.source_app===sourceApp&&row.tenant_digest===tenant&&
   keys.has([row.thread_digest,row.message_key,row.message_version].join(':'))&&
   ['PROVIDER_ACCEPTED','PROVIDER_DELIVERED','INBOUND_REPLY'].includes(String(row.evidence_kind))) as Ql503DeliveryEvent[];
  return {state:'READY',reason:'Authenticated exact-tenant, read-only database response.',
   sourceApp,tenantDigest:tenant,accessRole:String(selected.access_role),
   messages,events,allowedTenants:trusted.length,
   isLiveProviderConnected:false,customerAcknowledged:false,
   canSend:false,serverWrites:false};
 }catch{return blank(sourceApp,'ERROR','Authenticated history read unavailable; no fallback to public sample data.');}
}
export function ql503DescribeMessage(row:Ql503DeliveryMessage,
 all:readonly Ql503DeliveryMessage[],events:readonly Ql503DeliveryEvent[]){
 const relevant=events.filter(e=>e.thread_digest===row.thread_digest&&
  e.message_key===row.message_key&&e.message_version===row.message_version);
 const versions=all.filter(m=>m.thread_digest===row.thread_digest&&
  m.message_key===row.message_key).map(m=>m.message_version);
 const latest=Math.max(row.message_version,...versions);
 const claimedDelivered=relevant.some(e=>e.evidence_kind==='PROVIDER_DELIVERED');
 const providerAccepted=relevant.some(e=>e.evidence_kind==='PROVIDER_ACCEPTED');
 const pendingReply=relevant.some(e=>e.evidence_kind==='INBOUND_REPLY'&&
  (e.reply_current_version??0)>row.message_version);
 return {currentVersion:latest,
  superseded:row.message_version<latest,providerAccepted,
  providerDeliveredClaim:claimedDelivered,replyNeedsReview:pendingReply,
  label:pendingReply?'Old-version reply needs staff review':
   row.message_version<latest?'Superseded instructions':
   claimedDelivered?'Provider-signed delivered claim (not human read)':
   providerAccepted?'Provider accepted; delivery unverified':
   'Saved source intent; no provider receipt',
  humanAcknowledged:false,canSend:false};
}
