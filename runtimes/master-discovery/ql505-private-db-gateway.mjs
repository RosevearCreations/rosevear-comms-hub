/**
 * QL-505 original Windows Comms-only RPC gateway. Explicit one-shot caller
 * only; no listener/startup task/service install. Never exported to React.
 * The original host check is a defense in depth, not hardware attestation.
 * Only externally approved service-role credentials can actually authorize.
 *
 * As of Supabase 2026-11, sb_secret_ keys are API keys, NOT bearer JWTs.
 * Send them via apikey only, never Authorization: Bearer sb_secret_*.
 */
import {hostname,userInfo} from 'node:os';

const PROJECT='https://gxujcwpktaickcgzyvnu.supabase.co';
const RPCS=new Set(['ql503_record_verified_delivery','ql505_record_receipt_exception']);
const hold=reason=>({state:'HOLD',reason,customerMessageSent:false,
 receiverStarted:false,originalDeviceAttested:false});
function original(){
 try{return process.platform==='win32'&&
  hostname()==='DESKTOP-AE894KC'&&
  userInfo().username.toLowerCase()==='ree'&&
  (process.env.COMPUTERNAME??'').toUpperCase()==='DESKTOP-AE894KC';
 }catch{return false}
}
export function ql505OriginalRuntimeReadiness(){
 return {state:original()?'ORIGINAL_HOST_NAME_MATCH_NOT_ATTESTED':'ORIGINAL_HOST_REQUIRED',
  project:PROJECT,receiverStarted:false,customerMessageSent:false,
  privateGatewayEnrolled:false,fieldCertified:false};
}
export function ql505CreateOriginalPrivateRpcGateway({
 serviceKey,projectUrl=PROJECT,fetchImpl=globalThis.fetch
}={}){
 if(!original())return hold('QL505_ORIGINAL_REE_WINDOWS_RUNTIME_REQUIRED');
 if(projectUrl!==PROJECT||typeof serviceKey!=='string'||
  serviceKey.length<24||serviceKey.length>4096||
  !(serviceKey.startsWith('sb_secret_')||
    /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(serviceKey))||
  typeof fetchImpl!=='function')
  return hold('QL505_PREAPPROVED_COMMS_SERVICE_CREDENTIAL_AND_ENDPOINT_REQUIRED');
 const legacyJwt=!serviceKey.startsWith('sb_secret_');
 // No credential or service key is serialized into the returned state.
 return {state:'ORIGINAL_ONLY_PRIVATE_RPC_CLIENT_PREPARED_FIELD_HOLD',
  customerMessageSent:false,receiverStarted:false,fieldCertified:false,
  async rpc(name,args){
   if(!RPCS.has(name)||!args||typeof args!=='object'||Array.isArray(args)||
    JSON.stringify(args).length>12000)
    return {data:null,error:{code:'QL505_RPC_NOT_ALLOWED'}};
   const headers={apikey:serviceKey,'content-type':'application/json',
    'prefer':'return=representation'};
   if(legacyJwt)headers.Authorization='Bearer '+serviceKey;
   try{
    const response=await fetchImpl(PROJECT+'/rest/v1/rpc/'+name,{
     method:'POST',headers,body:JSON.stringify(args),
     redirect:'error',signal:AbortSignal.timeout(8000)
    });
    if(!response.ok)return {data:null,error:{code:'QL505_SERVER_RPC_HTTP_HOLD'}};
    const raw=await response.text();
    if(raw.length>12000)return {data:null,error:{code:'QL505_RPC_RESPONSE_OVERSIZE'}};
    const data=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))
     return {data:null,error:{code:'QL505_RPC_INVALID_RESPONSE'}};
    return {data,error:null};
   }catch{return {data:null,error:{code:'QL505_RPC_TIMEOUT_OR_NETWORK_HOLD'}}}
  }
 };
}
