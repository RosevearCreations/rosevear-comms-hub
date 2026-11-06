/** QL-350 — private authenticated connection-control bridge.
 * This is a server-only library. A trusted Windows/Tailnet sidecar injects the
 * operator authenticator, original signed DB readback, source signer, secure
 * GET transport and append-only witness. No public client has any of these.
 */
import {createServer} from 'node:http';
import {createQl349Coordinator,IDS} from './ql349-six-peer-orchestrator.mjs';
import {readPrivateSixPeerSnapshot} from './ql341-private-readback.mjs';

export const QL350_SCHEMA='rosevear.hub.ql350.private-connection-control.v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const LOOPBACK=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
const held=(state,extra={})=>({schema:QL350_SCHEMA,state,connectedCount:0,
  customerDataAccess:false,communicationsSent:0,deviceActions:0,
  privateKeysExported:0,sourceRepositoryWrites:0,...extra});
const validSession=(session,action,now)=>session?.state==='AUTHENTICATED_PRIVATE_OPERATOR'&&
  session.action===action&&session.privateOriginVerified===true&&
  session.csrfVerified===true&&session.source==='SERVER_VERIFIED_SESSION'&&
  typeof session.expiresAt==='number'&&session.expiresAt>now&&
  session.expiresAt<=now+300_000;

/** Uses only the existing dedicated receiver role, original-device receipt and
 * six FORCE-RLS peers. No new database grant or enrollment is made. */
export async function readQl350PrivateSnapshot(query,{pins,packet,now=Date.now()}={}){
  const snapshot=await readPrivateSixPeerSnapshot(query,{pins,packet,now});
  const enrollment=await query(`SELECT count(enrollment_id)::int AS count
    FROM public.master_hub_device_enrollments_ql339b
    WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
      AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
  const enrolled=Number(enrollment.rows?.[0]?.count);
  if(!Number.isSafeInteger(enrolled)||enrolled<0||enrolled>1)
    throw Error('HOLD_ORIGINAL_DEVICE_ENROLLMENT_COUNT_INVALID');
  const firstReceipt=Boolean(snapshot.witness?.verified)&&enrolled===1&&
    snapshot.heldDeviceReceiptCount>=1;
  return {schema:QL350_SCHEMA,source:'PRIVATE_POSTGRES_AND_ORIGINAL_SIGNER',
    peerCount:6,peers:snapshot.peers,originalEnrollmentCount:enrolled,
    originalReceiptCount:snapshot.heldDeviceReceiptCount,
    firstOriginalSignedReceiptVerified:firstReceipt,
    readyForOneSourceTest:firstReceipt,connectedCount:0};
}

/** Independent session and source grants are evaluated on the SERVER; neither
 * booleans nor manifests from an HTTP request are trusted. */
export function createQl350PrivateControl({authenticate,readSnapshot,
  resolvePinnedSource,authorizeSource,sendSignedGet,verifySourceReceipt,
  appendIndependentWitness,now=()=>Date.now()}={}){
  if(typeof authenticate!=='function'||typeof readSnapshot!=='function')
    throw Error('QL350_PRIVATE_AUTHENTICATOR_AND_READBACK_REQUIRED');
  const coordinator=createQl349Coordinator({authorize:authorizeSource,
    sendSignedGet,verifyReceipt:verifySourceReceipt,now});
  let active=false;
  const spent=new Set();
  const authorize=async(request,action)=>{
    try{return validSession(await authenticate(request,action),action,now());}
    catch{return false;}
  };
  const snapshot=async()=>{
    const data=await readSnapshot();
    if(data?.schema!==QL350_SCHEMA||data.source!=='PRIVATE_POSTGRES_AND_ORIGINAL_SIGNER'||
      data.peerCount!==6||data.connectedCount!==0||
      !Array.isArray(data.peers)||data.peers.length!==6||
      !IDS.every(id=>data.peers.some(peer=>peer.peerId===id&&
        peer.connection==='DISCONNECTED / HOLD'&&
        peer.sourceTestAuthorized===false&&peer.customerDataAllowed===false))||
      !Number.isSafeInteger(data.originalEnrollmentCount)||
      !Number.isSafeInteger(data.originalReceiptCount)||
      data.originalEnrollmentCount<0||data.originalEnrollmentCount>1||
      data.originalReceiptCount<0||
      (data.firstOriginalSignedReceiptVerified===true&&
        (data.originalEnrollmentCount!==1||data.originalReceiptCount<1))||
      (data.readyForOneSourceTest===true&&
        data.firstOriginalSignedReceiptVerified!==true))
      throw Error('HOLD_UNTRUSTED_PRIVATE_SNAPSHOT');
    return data;
  };
  return Object.freeze({
    async inspect(request){
      if(!await authorize(request,'ql350:status'))
        return held('DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
      try{
        const data=await snapshot();
        return held(data.firstOriginalSignedReceiptVerified===true&&
          data.originalEnrollmentCount===1&&data.readyForOneSourceTest===true?
          'ORIGINAL_TEST_RECEIPT_VERIFIED_PER_SOURCE_AUTHORITY_PENDING':
          'HOLD_ORIGINAL_WINDOWS_ENROLLMENT_AND_SIGNED_RECEIPT',{
          authenticatedPrivateOperator:true,peerCount:6,
          originalEnrollmentCount:data.originalEnrollmentCount,
          originalReceiptCount:data.originalReceiptCount,
          originalReceiptVerified:data.firstOriginalSignedReceiptVerified===true,
          readyForOneSourceTest:data.firstOriginalSignedReceiptVerified===true&&
            data.originalEnrollmentCount===1&&data.readyForOneSourceTest===true,
          peers:IDS.map(id=>({sourceId:id,state:'DISCONNECTED / HOLD'}))});
      }catch{return held('HOLD_PRIVATE_DATABASE_OR_RECEIPT_READBACK_FAILURE');}
    },
    async runOne(request,{sourceId,operationId}={}){
      if(!await authorize(request,'ql350:test:one'))
        return held('DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
      if(!IDS.includes(sourceId)||!UUID.test(operationId??''))
        return held('DENY_UNREGISTERED_SOURCE_OR_OPERATION');
      if(active)return held('HOLD_OTHER_SOURCE_TEST_ACTIVE');
      if(spent.has(operationId))return held('DENY_REPLAYED_PRIVATE_TEST_INTENT');
      spent.add(operationId);
      active=true;
      try{
        const data=await snapshot();
        if(data.originalEnrollmentCount!==1||
          data.firstOriginalSignedReceiptVerified!==true||
          data.readyForOneSourceTest!==true)
          return held('HOLD_FIRST_ORIGINAL_ENROLLMENT_AND_RECEIPT_REQUIRED');
        if([resolvePinnedSource,authorizeSource,sendSignedGet,
          verifySourceReceipt,appendIndependentWitness]
          .some(fn=>typeof fn!=='function'))
          return held('HOLD_PRIVATE_SIGNER_AND_WITNESS_ADAPTERS_NOT_CONFIGURED');
        const pin=await resolvePinnedSource(sourceId);
        if(pin?.sourceId!==sourceId||!/^[a-f0-9]{40}$/.test(pin.commitSha??''))
          return held('HOLD_INDEPENDENT_IMMUTABLE_SOURCE_PIN_REQUIRED');
        const attempt=await coordinator.runOne({sourceId,operationId,
          manifest:pin.manifest,commitSha:pin.commitSha});
        if(attempt.state!=='ONE_SOURCE_SIGNED_TEST_VERIFIED_STILL_HELD'||
          attempt.authenticatedTest!==true)
          return held('SOURCE_TEST_HELD_INDEPENDENT_REVIEW_REQUIRED',{
            sourceId,sourceTestState:attempt.state,retryAutomatically:false});
        // A signed response is not a durable receipt until the independent
        // source's append-only private witness confirms exact custody.
        const witness=await appendIndependentWitness({sourceId,operationId,
          receiptSha256:attempt.receiptSha256,commitSha:pin.commitSha});
        if(witness?.state!=='INDEPENDENT_APPEND_ONLY_TEST_WITNESS_CONFIRMED'||
          witness.sourceId!==sourceId||witness.operationId!==operationId||
          witness.receiptSha256!==attempt.receiptSha256)
          return held('HOLD_SOURCE_WITNESS_NOT_INDEPENDENTLY_PERSISTED',{
            sourceId,retryAutomatically:false});
        return held('ONE_SOURCE_SIGNED_TEST_WITNESS_VERIFIED_STILL_HELD',{
          sourceId,operationId,receiptSha256:attempt.receiptSha256,
          authenticatedTest:true,retryAutomatically:false,
          nextAction:'Separate persistent connection grant and tenant review required'});
      }catch{return held('RECOVERY_REVIEW_REQUIRED_PRIVATE_BRIDGE_FAILURE',{
        sourceId,retryAutomatically:false});}
      finally{active=false;}
    },
    inspectRuntime(){return held(active?'ONE_SOURCE_TEST_ACTIVE':'PRIVATE_BRIDGE_IDLE',{
      activeCount:active?1:0,attemptedOperations:spent.size});}
  });
}

/** The browser calls only a same-origin PRIVATE Caddy/Tailnet deployment.
 * Static GitHub Pages never runs this handler, and there is no CORS allowance.
 * A private sidecar must authenticate session and CSRF from request headers. */
export function createQl350PrivateHttpHandler({control,authenticateRequest,
  expectedOrigin}={}){
  if(!control||typeof authenticateRequest!=='function'||
    typeof expectedOrigin!=='string'||!/^https:\/\//.test(expectedOrigin))
    throw Error('QL350_AUTHENTICATED_TLS_ORIGIN_REQUIRED');
  return async(req,res)=>{
    const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json',
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer'});res.end(JSON.stringify(data));};
    if(!LOOPBACK.has(req.socket?.remoteAddress))
      return send(403,held('DENY_NOT_PRIVATE_LOOPBACK'));
    const status=req.method==='GET'&&req.url==='/private/ql350/status';
    const test=req.method==='POST'&&req.url==='/private/ql350/test';
    if(!status&&!test)return send(404,held('DENY_UNKNOWN_PRIVATE_ROUTE'));
    if(req.headers.origin&&req.headers.origin!==expectedOrigin)
      return send(403,held('DENY_CROSS_ORIGIN_REQUEST'));
    if(test&&(req.headers.origin!==expectedOrigin||
      req.headers['sec-fetch-site']!=='same-origin'||
      !/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type']??'')))
      return send(403,held('DENY_PRIVATE_CSRF_OR_MEDIA_TYPE'));
    let operator;
    try{operator=await authenticateRequest(req,test?'ql350:test:one':'ql350:status');}
    catch{return send(403,held('DENY_PRIVATE_SESSION'))};
    if(!operator)return send(403,held('DENY_PRIVATE_SESSION'));
    if(status){try{const result=await control.inspect(operator);
      return send(result.state.startsWith('DENY')?403:200,result);}
      catch{return send(503,held('HOLD_PRIVATE_STATUS_FAILURE'));}}
    if(Number(req.headers['content-length']??0)>2048)
      return send(413,held('DENY_OVERSIZE_PRIVATE_INTENT'));
    const parts=[];let bytes=0;
    try{
      for await(const part of req){bytes+=part.length;
        if(bytes>2048)return send(413,held('DENY_OVERSIZE_PRIVATE_INTENT'));
        parts.push(part);}
      const body=JSON.parse(Buffer.concat(parts).toString('utf8'));
      if(!body||Array.isArray(body)||typeof body!=='object'||
        Object.keys(body).sort().join(',')!=='operationId,sourceId')
        return send(400,held('DENY_PRIVATE_INTENT_SCHEMA'));
      const result=await control.runOne(operator,body);
      return send(result.state.startsWith('DENY')?403:
        result.authenticatedTest===true?200:202,result);
    }catch{return send(400,held('DENY_MALFORMED_PRIVATE_INTENT'));}
  };
}

export async function startQl350LoopbackBridge(options,{port=0}={}){
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('INVALID_PRIVATE_PORT');
  const server=createServer(createQl350PrivateHttpHandler(options));
  server.requestTimeout=5000;server.headersTimeout=5000;server.maxRequestsPerSocket=20;
  await new Promise((resolve,reject)=>{
    server.once('error',reject);server.listen(port,'127.0.0.1',resolve);
  });
  return server;
}
