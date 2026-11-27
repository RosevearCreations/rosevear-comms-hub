import type {OrganizationId} from './ql191Organizations';
const HEX=/^[0-9a-f]{64}$/;
const APPS=['icamp','yw','rosiedazzlers','devilndove'];
type Client={auth:{getUser:()=>Promise<{data:{user:null|{id:string;is_anonymous?:boolean}};error?:unknown}>};from:(name:string)=>any};
export type Ql505OperatorException={
 source_app:string;tenant_digest:string;exception_id:string;job_digest:string;
 reason_code:string;status:'HOLD';recorded_at:string;
};
export type Ql505OperatorRead={
 state:'CONFIG_DISABLED'|'AUTH_REQUIRED'|'TENANT_GRANT_MISSING'|'HOLD'|'READY';
 sourceApp:OrganizationId;tenantDigest:string|null;
 exceptions:readonly Ql505OperatorException[];reason:string;
 sent:false;customerDeliveryVerified:false;
};
const empty=(sourceApp:OrganizationId,state:Ql505OperatorRead['state'],reason:string):Ql505OperatorRead=>
 ({state,sourceApp,tenantDigest:null,exceptions:[],reason,
  sent:false,customerDeliveryVerified:false});
const obj=(x:unknown):x is Record<string,unknown>=>
 !!x&&typeof x==='object'&&!Array.isArray(x);
/**
 * Public client: metadata SELECT only, under exact source + tenant RLS.
 * The browser NEVER gets a service_role key and cannot record incidents.
 */
export async function ql505ReadOwnExceptions(
 client:Client|null,sourceApp:OrganizationId
):Promise<Ql505OperatorRead>{
 if(!client)return empty(sourceApp,'CONFIG_DISABLED','Private tenant history is disabled in this preview.');
 if(!APPS.includes(sourceApp))return empty(sourceApp,'HOLD','Unknown source app.');
 try{
  const auth=await client.auth.getUser();
  const user=auth.data?.user;
  if(auth.error||!user?.id||user.is_anonymous===true)
   return empty(sourceApp,'AUTH_REQUIRED','A verified operator session is required.');
  const grants=await client.from('ql503_tenant_read_grants')
   .select('source_app,tenant_digest,user_id,access_role,active,expires_at')
   .eq('source_app',sourceApp).eq('user_id',user.id)
   .eq('active',true).gt('expires_at',new Date().toISOString())
   .order('expires_at',{ascending:false}).limit(10);
  if(grants.error)return empty(sourceApp,'HOLD','Tenant authorization cannot be checked.');
  const active=(Array.isArray(grants.data)?grants.data:[]).filter((v:unknown)=>
   obj(v)&&v.source_app===sourceApp&&v.user_id===user.id&&v.active===true&&
   typeof v.tenant_digest==='string'&&HEX.test(v.tenant_digest)&&
   ['operator','auditor'].includes(String(v.access_role))&&
   typeof v.expires_at==='string'&&Date.parse(v.expires_at)>Date.now());
  if(!active.length)return empty(sourceApp,'TENANT_GRANT_MISSING',
   'No active, source-approved Comms tenant grant. Other applications are not required for this view.');
  const tenant=String(active[0].tenant_digest);
  const result=await client.from('ql505_receipt_exceptions')
   .select('source_app,tenant_digest,exception_id,job_digest,reason_code,status,recorded_at')
   .eq('source_app',sourceApp).eq('tenant_digest',tenant)
   .order('recorded_at',{ascending:false}).limit(40);
  if(result.error)return empty(sourceApp,'HOLD','Exception ledger read failed under RLS.');
  const exceptions=(Array.isArray(result.data)?result.data:[]).filter((x:unknown)=>
   obj(x)&&x.source_app===sourceApp&&x.tenant_digest===tenant&&
   typeof x.exception_id==='string'&&HEX.test(x.exception_id)&&
   typeof x.job_digest==='string'&&HEX.test(x.job_digest)&&
   x.status==='HOLD'&&[
    'PRIVATE_RPC_UNAVAILABLE','PIN_EXPIRED_OR_REVOKED','PRIVATE_JOURNAL_HOLD',
    'IMMUTABLE_CONFLICT','FIELD_REVIEW_UNVERIFIED'
   ].includes(String(x.reason_code))) as Ql505OperatorException[];
  return {state:'READY',sourceApp,tenantDigest:tenant,exceptions,
   reason:'Authenticated, tenant-scoped exception metadata only.',
   sent:false,customerDeliveryVerified:false};
 }catch{
  return empty(sourceApp,'HOLD','Private exception history unavailable; no synthetic fallback.');
 }
}
