/** QL-369 owner-only ceremony. Supabase gateway MUST verify JWT=true.
 * This function never accepts browser admin credentials. The service-role key
 * stays in Supabase Edge environment and is never returned or logged.
 */
import { inspectQl369ActivationPacket } from './verify.mjs';

const ORIGIN='https://rosevear-comms-hub.devilndovelive.workers.dev';
const REPLY_HEADERS={'content-type':'application/json','cache-control':'no-store',
  'x-content-type-options':'nosniff'};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const exact=(o:unknown,fields:string[]):boolean=>Boolean(o&&typeof o==='object'&&
  !Array.isArray(o)&&Object.keys(o).length===fields.length&&
  Object.keys(o).every(k=>fields.includes(k)));

function response(status:number,state:string,extra:Record<string,unknown>={},origin=''){
  const headers={...REPLY_HEADERS,...(origin===ORIGIN?{
    'access-control-allow-origin':ORIGIN,'vary':'Origin'}:{})};
  return new Response(JSON.stringify({state,...extra}),{status,headers});
}
function decodeClaims(jwt:string):Record<string,unknown>|null{
  try{
    const fragment=jwt.split('.');
    if(fragment.length!==3)return null;
    return JSON.parse(atob(fragment[1].replaceAll('-','+').replaceAll('_','/')));
  }catch{return null;}
}
async function invokePrivateRpc(url:string,serviceKey:string,rpc:string,params:object){
  const result=await fetch(`${url}/rest/v1/rpc/${rpc}`,{
    method:'POST',headers:{'apikey':serviceKey,'authorization':`Bearer ${serviceKey}`,
      'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify(params),signal:AbortSignal.timeout(12000)});
  if(!result.ok)throw Error('HOLD_QL369_PRIVILEGED_SERVER_VALIDATION_FAILED');
  return await result.json();
}

Deno.serve(async (request:Request)=>{
  const origin=request.headers.get('origin')??'';
  if(origin!==ORIGIN)return response(403,'DENY_QL369_UNTRUSTED_ORIGIN');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'access-control-allow-origin':ORIGIN,
    'access-control-allow-methods':'POST, OPTIONS',
    'access-control-allow-headers':'authorization, apikey, content-type, x-client-info',
    'access-control-max-age':'3600','vary':'Origin'}});
  if(request.method!=='POST')return response(405,'DENY_QL369_POST_ONLY',{},origin);
  const authHeader=request.headers.get('authorization')??'';
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(authHeader))
    return response(401,'DENY_QL369_VERIFIED_AUTH_REQUIRED',{},origin);
  if(Number(request.headers.get('content-length')??0)>100000)
    return response(413,'DENY_QL369_OVERSIZED_REQUEST',{},origin);

  const url=Deno.env.get('SUPABASE_URL')?.replace(/\/$/,'');
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!serviceKey)return response(503,'HOLD_QL369_SERVER_CONFIGURATION',{},origin);
  try{
    const authResponse=await fetch(`${url}/auth/v1/user`,{headers:{
      'apikey':serviceKey,'authorization':authHeader},signal:AbortSignal.timeout(12000)});
    if(!authResponse.ok)return response(401,'DENY_QL369_VERIFIED_AUTH_REQUIRED',{},origin);
    const user=await authResponse.json();
    const claims=decodeClaims(authHeader.slice(7));
    const now=Math.floor(Date.now()/1000);
    if(!UUID.test(user?.id??'')||!claims||claims.sub!==user.id||
      claims.iss!==`${url}/auth/v1`||claims.aud!=='authenticated'||
      claims.aal!=='aal2'||!UUID.test(claims.session_id as string??'')||
      !Number.isInteger(claims.exp)||Number(claims.exp)<=now||
      claims.is_anonymous===true)
      return response(403,'DENY_QL369_CURRENT_AAL2_OWNER_SESSION_REQUIRED',{},origin);

    const raw=await request.text();
    if(raw.length>100000)return response(413,'DENY_QL369_OVERSIZED_REQUEST',{},origin);
    const body=JSON.parse(raw);
    // QL-370: AAL2 verified read-only status. The server, not the browser,
    // resolves the original owner and reads private attestation/audit state.
    // No recovery, signing, grant or membership mutation is available here.
    if(body?.action==='status'&&
      (exact(body,['action'])||exact(body,['action','intentSha256']))){
      const intentSha256=body.intentSha256??null;
      if(intentSha256!==null&&(typeof intentSha256!=='string'||
        !SHA.test(intentSha256)||intentSha256==='0'.repeat(64)))
        return response(400,'DENY_QL370_VALID_INTENT_HASH_REQUIRED',{},origin);
      const result=await invokePrivateRpc(url,serviceKey,'ql370_get_original_owner_progress',{
        p_user_id:user.id,p_session_id:claims.session_id,p_intent_sha256:intentSha256});
      return response(200,result.state,result,origin);
    }
    if(exact(body,['action','intentSha256'])&&body.action==='attest'){
      if(!SHA.test(body.intentSha256)||body.intentSha256==='0'.repeat(64))
        return response(400,'DENY_QL369_INTENT_SHA256_REQUIRED',{},origin);
      const result=await invokePrivateRpc(url,serviceKey,'ql369_record_original_owner_mfa',{
        p_user_id:user.id,p_session_id:claims.session_id,p_intent_sha256:body.intentSha256});
      return response(200,result.state,result,origin);
    }
    if(exact(body,['action','signedPacket','sourceCandidateText','masterCandidateText'])&&
      body.action==='activate'){
      const evidence=await inspectQl369ActivationPacket({activationPacket:body.signedPacket,
        sourceCandidateText:body.sourceCandidateText,
        masterCandidateText:body.masterCandidateText});
      if(!evidence.valid)return response(403,evidence.state,{},origin);
      if(user.id!==evidence.sourceUserId)
        return response(403,'DENY_QL369_ONLY_ORIGINAL_SOURCE_OWNER_MAY_ACTIVATE',{},origin);
      const result=await invokePrivateRpc(url,serviceKey,'ql369_activate_original_dual_owner_once',{
        p_actor_user_id:user.id,p_actor_session_id:claims.session_id,
        p_source_user_id:evidence.sourceUserId,p_master_user_id:evidence.masterUserId,
        p_intent_sha256:evidence.intentSha256,
        p_approvals_sha256:evidence.approvalsSha256,
        p_signed_packet_sha256:evidence.signedPacketSha256});
      return response(200,result.state,result,origin);
    }
    return response(400,'DENY_QL369_UNAPPROVED_OWNER_ACTION',{},origin);
  }catch{
    return response(409,'HOLD_QL369_INCOMPLETE_OR_STALE_OWNER_ENROLLMENT',{},origin);
  }
});
