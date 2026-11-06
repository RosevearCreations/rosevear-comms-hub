/** QL-353 — original-owner, authenticated private-operator and exact-one-receipt gate.
 * Server-only. Cannot mint a session, sign a TEST, insert enrollment, activate
 * the receiver, broaden a grant or turn any of the six peers into CONNECTED.
 * A future original Windows private sidecar must supply actual cryptographic
 * operator verification, short-lived server session storage and DB custody.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {createServer} from 'node:http';
import {QL342_RECEIPT_SCHEMA,verifyOneHeldTestReceipt} from './ql342-owner-decision.mjs';
import {IDS} from './ql349-six-peer-orchestrator.mjs';

export const QL353_SCHEMA='rosevear.hub.ql353.owner-session-receipt.v1';
export const QL353_ORIGIN='https://desktop-ae894kc.tailc43957.ts.net:8443';
export const QL353_COOKIE='__Host-rosevear-ql353';
const ORIGINAL_HOST='DESKTOP-AE894KC';
const OWNER='ree-original-windows-operator';
const SHA=/^[0-9a-f]{64}$/;
const LOOPBACK=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
const digest=value=>createHash('sha256').update(value).digest('hex');
const held=(state,other={})=>({schema:QL353_SCHEMA,state,
  authenticatedPrivateOperator:false,verifiedOriginalEnrollment:false,
  verifiedSignedReceipt:false,sourceTestAuthorized:false,
  connectedCount:0,connectionState:'DISCONNECTED / HOLD',
  customerCommunications:0,deviceActions:0,sourceRepositoryWrites:0,
  databaseMutations:0,automaticRetries:0,...other});
const count=(response)=>{
  const value=Number(response?.rows?.[0]?.count);
  if(!Number.isSafeInteger(value)||value<0)return null;
  return value;
};
const shaEqual=(left,right)=>{
  if(!SHA.test(left??'')||!SHA.test(right??''))return false;
  return timingSafeEqual(Buffer.from(left,'hex'),Buffer.from(right,'hex'));
};

/** A complete server-side original-owner session record is looked up by an
 * SHA-256 digest of the opaque cookie. HTTP claims never create authority.
 * Issuance/revocation are deliberately outside QL-353 and must be supplied by
 * the independently approved, original-Windows credential custodian.
 */
export function createQl353OperatorVerifier({lookupServerSession,
  verifyOriginalOwnerSession,now=()=>Date.now()}={}){
  if(typeof lookupServerSession!=='function'||
    typeof verifyOriginalOwnerSession!=='function'||typeof now!=='function')
    throw Error('HOLD_REAL_SERVER_SESSION_AND_ORIGINAL_OWNER_VERIFIER_REQUIRED');
  return async(request,action)=>{
    if(!['ql350:status','ql350:test:one','ql353:status'].includes(action))return null;
    if(!LOOPBACK.has(request?.socket?.remoteAddress))return null;
    if(request?.headers?.host!=='desktop-ae894kc.tailc43957.ts.net:8443')return null;
    if(request.headers.origin&&request.headers.origin!==QL353_ORIGIN)return null;
    if(action!=='ql353:status'&&action!=='ql350:status'&&
      (request.method!=='POST'||request.headers.origin!==QL353_ORIGIN||
       request.headers['sec-fetch-site']!=='same-origin'))return null;
    const rawCookies=request.headers.cookie;
    if(typeof rawCookies!=='string'||rawCookies.length>4096)return null;
    const matches=rawCookies.split(';').map(item=>item.trim()).filter(item=>
      item.startsWith(`${QL353_COOKIE}=`));
    if(matches.length!==1)return null;
    const token=matches[0].slice(QL353_COOKIE.length+1);
    if(!SHA.test(token))return null;
    const sessionDigest=digest(token);
    let session,ownerProof;
    try{
      session=await lookupServerSession(sessionDigest);
      if(session?.state!=='ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'||
        session.operatorId!==OWNER||session.originalComputer!==ORIGINAL_HOST||
        !shaEqual(session.sessionSha256,sessionDigest)||
        !SHA.test(session.originalIssuerDecisionSha256??'')||
        !SHA.test(session.sourceOwnerDecisionSha256??'')||
        !SHA.test(session.masterOwnerDecisionSha256??'')||
        !Number.isSafeInteger(session.issuedAt)||!Number.isSafeInteger(session.expiresAt)||
        session.issuedAt>now()||session.expiresAt<=now()||
        session.expiresAt-session.issuedAt>300_000||
        new Set([session.originalIssuerDecisionSha256,
          session.sourceOwnerDecisionSha256,session.masterOwnerDecisionSha256]).size!==3)
        return null;
      // Even a valid-looking server record is not enough: a separately owned
      // original issuer verifier must check its exact provenance and revocation.
      ownerProof=await verifyOriginalOwnerSession(session);
      if(ownerProof?.state!=='ORIGINAL_ISSUER_AND_DUAL_OWNER_SESSION_VERIFIED'||
        ownerProof.originalComputer!==ORIGINAL_HOST||
        !shaEqual(ownerProof.sessionSha256,sessionDigest)||
        !shaEqual(ownerProof.originalIssuerDecisionSha256,session.originalIssuerDecisionSha256)||
        !shaEqual(ownerProof.sourceOwnerDecisionSha256,session.sourceOwnerDecisionSha256)||
        !shaEqual(ownerProof.masterOwnerDecisionSha256,session.masterOwnerDecisionSha256)||
        ownerProof.replayOrRevocationFound!==false)
        return null;
      if(action==='ql350:test:one'){
        const csrf=request.headers['x-ql353-csrf'];
        if(typeof csrf!=='string'||!SHA.test(csrf)||
          !shaEqual(session.csrfSha256,digest(csrf)))return null;
      }
    }catch{return null;}
    // Only QL-350's internal trusted session type is returned; never the
    // original cookie, CSRF token, private key, signature or decision body.
    if(action==='ql353:status')return {state:'VERIFIED_QL353_OPERATOR_READ_ONLY',
      operatorId:OWNER,expiresAt:session.expiresAt};
    return {state:'AUTHENTICATED_PRIVATE_OPERATOR',action,
      privateOriginVerified:true,csrfVerified:true,
      source:'SERVER_VERIFIED_SESSION',expiresAt:session.expiresAt};
  };
}

/** Exactly one approved original enrollment, zero revocations, exactly one
 * immutable signed device TEST receipt and all six held peers are necessary.
 * Management SQL readbacks may diagnose HOLD; an actual verified receipt uses
 * only the existing limited ql340c_private_receiver read role and QL-342's
 * strict Ed25519/original-owner/receipt verifier. */
export function reconcileQl353VerifiedOneReceipt(result,evidence){
  if(result?.schema!==QL342_RECEIPT_SCHEMA||
    result.state!=='ORIGINAL_SIGNED_ONE_TEST_RECEIPT_VERIFIED_STILL_HELD'||
    result.verified!==true||result.connected!==false||
    result.peerConnections!==0||result.receiptCount!==1||
    result.deviceId!=='rosevear-windows-hub'||
    result.sourceTestAuthorized!==false||
    !SHA.test(result.ownerPayloadSha256??''))
    return held('HOLD_INDEPENDENT_SIGNATURE_OR_WITNESS_RECONCILIATION_FAILED',evidence);
  return held('ONE_ORIGINAL_SIGNED_TEST_RECEIPT_INDEPENDENTLY_VERIFIED_STILL_HELD',{
    ...evidence,verifiedOriginalEnrollment:true,verifiedSignedReceipt:true,
    originalOwnerPayloadSha256:result.ownerPayloadSha256,
    receivedAt:result.receivedAt,nextAction:'Separate source-owner authorization before any individual source TEST'});
}

export async function inspectQl353OriginalReceipt(query,{pins,packet,decision,
  now=Date.now()}={}){
  if(typeof query!=='function')
    return held('HOLD_PRIVATE_DATABASE_READER_REQUIRED');
  try{
    const role=await query('SELECT current_user AS receiver_role');
    if(role.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
      return held('DENY_UNVERIFIED_OR_LOGIN_ENABLED_RECEIVER_IDENTITY');
    const [enrollments,revocations,receipts,peers]=await Promise.all([
      query(`SELECT count(enrollment_id)::int AS count
        FROM public.master_hub_device_enrollments_ql339b
        WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
          AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`),
      query(`SELECT count(revocation_id)::int AS count
        FROM public.master_hub_device_revocations_ql339b
        WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
          AND key_id='hub-ql339b'`),
      query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338'),
      query(`SELECT peer_id,connection_state,source_test_authorized,customer_data_allowed
        FROM public.master_hub_private_peers_ql341 ORDER BY peer_id`)
    ]);
    const enrolled=count(enrollments),revoked=count(revocations),receiptCount=count(receipts);
    if(enrolled===null||revoked===null||receiptCount===null||enrolled>1||receiptCount>1||
      revoked>1)return held('DENY_AMBIGUOUS_OR_CORRUPT_PRIVATE_RECEIPT_COUNTS');
    if(!Array.isArray(peers.rows)||peers.rows.length!==6||
      !IDS.every(id=>peers.rows.some(p=>p.peer_id===id&&
        p.connection_state==='HOLD'&&p.source_test_authorized===false&&
        p.customer_data_allowed===false)))
      return held('DENY_PEER_CONNECTIONS_NOT_EXACTLY_SIX_HELD');
    const evidence={originalEnrollmentCount:enrolled,originalRevocationCount:revoked,
      originalReceiptCount:receiptCount,heldPeerCount:6};
    if(revoked!==0)return held('HOLD_ORIGINAL_OWNER_DEVICE_REVOKED',evidence);
    if(enrolled!==1)return held('HOLD_ORIGINAL_OWNER_DATABASE_ENROLLMENT_MISSING',evidence);
    if(receiptCount!==1)return held('HOLD_EXACTLY_ONE_SIGNED_DEVICE_TEST_RECEIPT_REQUIRED',evidence);
    if(!pins||!packet||!decision)return held('HOLD_ORIGINAL_SIGNED_PACKET_AND_OWNER_DECISION_REQUIRED',evidence);
    // QL-342 is not injectable here: the real original Ed25519 packet, owner
    // decision and fresh immutable database receipt are mandatory in production.
    const result=await verifyOneHeldTestReceipt(query,pins,packet,decision,now);
    return reconcileQl353VerifiedOneReceipt(result,evidence);
  }catch{return held('HOLD_PRIVATE_READBACK_UNAVAILABLE_NO_RETRY');}
}

/** The private server routes this read-only diagnostic only after a trusted,
 * externally-issued operator session. This cannot mint owner approval. */
export function createQl353AuthenticatedReadback({verifyOperator,query,
  pins,packet,decision,now}={}){
  if(typeof verifyOperator!=='function')throw Error('HOLD_VERIFIED_PRIVATE_SESSION_REQUIRED');
  return Object.freeze({async inspect(request){
    try{if(!await verifyOperator(request,'ql353:status'))
      return held('DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
    }catch{return held('DENY_PRIVATE_SESSION_VERIFICATION_FAILED');}
    const result=await inspectQl353OriginalReceipt(query,{pins,packet,decision,now});
    return {...result,authenticatedPrivateOperator:true};
  }});
}

/** Minimal private same-origin GET only. Caddy QL-352 intentionally does NOT
 * expose or reverse-proxy this until the original owner independently approves
 * a genuine operator session and an exact, supervised route change. */
export function createQl353ReadbackHttpHandler({readback}={}){
  if(typeof readback?.inspect!=='function')
    throw Error('HOLD_QL353_PRIVATE_READBACK_AND_AUTHENTICATOR_REQUIRED');
  return async(req,res)=>{
    const respond=(code,body)=>{res.writeHead(code,{
      'Content-Type':'application/json','Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
      'Content-Security-Policy':"default-src 'none'"});res.end(JSON.stringify(body));};
    if(!LOOPBACK.has(req.socket?.remoteAddress))
      return respond(403,held('DENY_NOT_PRIVATE_LOOPBACK'));
    if(req.method!=='GET'||req.url!=='/private/ql353/status')
      return respond(404,held('DENY_NO_PUBLIC_OR_MUTATING_QL353_ROUTE'));
    try{
      const result=await readback.inspect(req);
      if(result?.schema!==QL353_SCHEMA)return respond(503,held('HOLD_UNTRUSTED_PRIVATE_RESPONSE'));
      return respond(result.state.startsWith('DENY')?403:
        result.state.startsWith('HOLD')?202:200,result);
    }catch{return respond(503,held('HOLD_PRIVATE_READBACK_FAILURE'));}
  };
}

export async function startQl353LoopbackReadback(options,{port=0}={}){
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('DENY_QL353_PORT');
  const server=createServer(createQl353ReadbackHttpHandler(options));
  server.requestTimeout=5000;server.headersTimeout=5000;server.maxRequestsPerSocket=10;
  await new Promise((resolve,reject)=>{
    server.once('error',reject);server.listen(port,'127.0.0.1',resolve);
  });
  return server;
}
