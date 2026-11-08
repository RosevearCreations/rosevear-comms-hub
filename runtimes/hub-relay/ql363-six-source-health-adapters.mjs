/** QL-363: Node-only private source health contract/receipt adapters.
 * Source contracts are capability descriptions, not enrollment or grants.
 * A QL-362 owner-authorized one-use private GET remains mandatory before use.
 */
import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {SOURCES,canonicalize,inspectManifest} from '../master-discovery/manifest.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';
import {QL362_SCHEMA,QL362_HEALTH_SCHEMA} from './ql362-source-owner-first-get.mjs';

export const QL363_SCHEMA='rosevear.hub.ql363.six-source-health-contract.v1';
export const QL363_RECEIPT_SCHEMA='rosevear.hub.ql363.source-signed-health-receipt.v1';
export const QL363_ENVELOPE_SCHEMA='rosevear.hub.ql363.source-health-envelope.v1';
export const QL363_CLOSURE_SCHEMA='rosevear.hub.ql363.independent-first-get-closure.v1';
export const QL363_PATH='/api/integration/v1/shell/health';
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const digest=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const sameSha=(a,b)=>SHA.test(a??'')&&SHA.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const keys=(value,names)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join('|')===names.slice().sort().join('|');
const hold=(state,extra={})=>({schema:QL363_SCHEMA,state,connected:false,
  connectionState:'DISCONNECTED / HOLD',connectedCount:0,
  customerDataAllowed:false,customerCommunications:false,deviceActions:false,
  sourceRepositoryWrites:0,automaticRetry:false,...extra});
const contractFields=['schema','sourceId','sourceAppId','repository',
  'tenantBoundary','sourceCommitSha','manifestSha256','sourceOrigin',
  'environment','method','path','responseSchema','receiptSchema',
  'scope','redirects','maxResponseBytes','persistentConnectionAllowed',
  'issuedAt','expiresAt'];
const receiptFields=['schema','sourceId','operationId','requestSha256',
  'receiptSha256','sourceCommitSha','sourceOrigin','environment','method',
  'path','scope','issuedAt','expiresAt'];
const validTime=(start,end,now,maxAge)=>typeof start==='string'&&
  typeof end==='string'&&Number.isFinite(Date.parse(start))&&
  Number.isFinite(Date.parse(end))&&
  start===new Date(Date.parse(start)).toISOString()&&
  end===new Date(Date.parse(end)).toISOString()&&
  Date.parse(start)<=now+5_000&&Date.parse(end)>now&&
  Date.parse(end)>Date.parse(start)&&
  Date.parse(end)-Date.parse(start)<=maxAge;
const validOrigin=origin=>{
  if(typeof origin!=='string'||origin.length>250)return false;
  try{const u=new URL(origin);return u.protocol==='https:'&&u.origin===origin&&
    !u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/';}
  catch{return false;}
};
function pinnedKey(pin){
  try{
    if(!pin||!SHA.test(pin.spkiSha256??'')||
      typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000)return null;
    const key=createPublicKey(pin.publicKeyPem);
    const actual=createHash('sha256').update(key.export({format:'der',type:'spki'})).digest('hex');
    return key.asymmetricKeyType==='ed25519'&&sameSha(actual,pin.spkiSha256)?key:null;
  }catch{return null;}
}
function verifySignedEnvelope(envelope,payloadFields,key,pin){
  if(!keys(envelope,['schema','payload','signature','keyId'])||
    envelope.schema!==envelope.payload?.schema||
    envelope.keyId!==pin?.keyId||
    !keys(envelope.payload,payloadFields)||
    !/^[A-Za-z0-9_-]{86}$/.test(envelope.signature??''))return false;
  try{
    const signature=Buffer.from(envelope.signature,'base64url');
    return signature.length===64&&
      verify(null,Buffer.from(canonicalize(envelope.payload)),key,signature);
  }catch{return false;}
}

/** An independently pinned source signer, not the contract itself, is trusted.
 * The trust callback MUST authenticate source-controlled custody out-of-band. */
export async function verifyQl363SourceHealthContract({record,peer,
  resolvePinnedSigner,verifySignerCustody,now=Date.now()}={}){
  try{
    const id=record?.sourceId,s=SOURCES[id],p=record?.contract?.payload;
    if(!s||peer?.peerId!==id||peer.repository!==s.repo||
      !COMMIT.test(record.commitSha??'')||
      !SHA.test(record.tlsSpkiSha256??'')||
      record.manifest?.source_id!==id||
      inspectManifest(record.manifest,record.manifestTrustPin).status!==
        'SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD'||
      !keys(p,contractFields)||p.schema!==QL363_SCHEMA||
      p.sourceId!==id||p.sourceAppId!==s.app||
      p.repository!==`RosevearCreations/${s.repo}`||
      p.tenantBoundary!==s.boundary||
      p.sourceCommitSha!==record.commitSha||
      !sameSha(p.manifestSha256,digest(record.manifest))||
      !validOrigin(p.sourceOrigin)||p.environment!=='TEST'||
      p.method!=='GET'||p.path!==QL363_PATH||
      p.responseSchema!==QL362_HEALTH_SCHEMA||
      p.receiptSchema!==QL363_RECEIPT_SCHEMA||
      p.scope!=='HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES'||
      p.redirects!=='DENY'||p.maxResponseBytes!==4096||
      p.persistentConnectionAllowed!==false||
      !validTime(p.issuedAt,p.expiresAt,now,86_400_000)||
      typeof resolvePinnedSigner!=='function'||
      typeof verifySignerCustody!=='function')return hold('HOLD_SOURCE_CONTRACT_INCOMPATIBLE');
    const pin=await resolvePinnedSigner(id);
    const key=pinnedKey(pin);
    if(!key||pin.role!=='source_signer'||pin.sourceId!==id||
      pin.repository!==p.repository||pin.revoked!==false||
      !verifySignedEnvelope(record.contract,contractFields,key,pin))
      return hold('HOLD_SOURCE_CONTRACT_SIGNER_NOT_PINNED');
    const custody=await verifySignerCustody({sourceId:id,
      spkiSha256:pin.spkiSha256,contractSha256:digest(p)});
    if(custody?.state!=='INDEPENDENT_ORIGINAL_SOURCE_SIGNER_AUTHENTICATED'||
      custody.sourceId!==id||custody.revoked!==false||
      !sameSha(custody.spkiSha256,pin.spkiSha256)||
      !sameSha(custody.contractSha256,digest(p)))
      return hold('HOLD_INDEPENDENT_SOURCE_SIGNER_CUSTODY_MISSING');
    return hold('SIGNED_SOURCE_HEALTH_CONTRACT_VERIFIED_STILL_HELD',{
      sourceId:id,repository:s.repo,sourceCommitSha:p.sourceCommitSha,
      manifestSha256:p.manifestSha256,sourceOrigin:p.sourceOrigin,
      sourceSignerSpkiSha256:pin.spkiSha256,
      contractSha256:digest(p),expiresAt:p.expiresAt,
      contractCompatible:true,sourceTestAuthorized:false});
  }catch{return hold('HOLD_SOURCE_CONTRACT_VERIFICATION_UNAVAILABLE');}
}

/** Six separate signer/tenant compatibility decisions. Never connects peers. */
export async function certifyQl363SixSourceCompatibility({records,peerRows,
  resolvePinnedSigner,verifySignerCustody,now=Date.now()}={}){
  try{
    if(!Array.isArray(records)||records.length!==6)return hold('HOLD_SIX_SOURCE_CONTRACTS_REQUIRED');
    const peers=validateSixHeldPeers(peerRows);
    if(peers.length!==6)return hold('HOLD_SIX_HELD_PEERS_REQUIRED');
    const seen=new Set(),signers=new Set(),compatibility=[];
    for(const record of records){
      if(!Object.hasOwn(SOURCES,record?.sourceId)||seen.has(record.sourceId))
        return hold('DENY_UNKNOWN_OR_DUPLICATED_SOURCE_CONTRACT');
      seen.add(record.sourceId);
      const result=await verifyQl363SourceHealthContract({record,
        peer:peers.find(p=>p.peerId===record.sourceId),
        resolvePinnedSigner,verifySignerCustody,now});
      if(!result.contractCompatible)return hold('HOLD_ONE_OR_MORE_SOURCE_CONTRACTS_UNVERIFIED',{
        blockedSourceId:record.sourceId,reason:result.state});
      if(signers.has(result.sourceSignerSpkiSha256))
        return hold('DENY_SHARED_SIGNER_ACROSS_SOURCE_TENANTS');
      signers.add(result.sourceSignerSpkiSha256);
      compatibility.push({sourceId:record.sourceId,repository:result.repository,
        contractSha256:result.contractSha256,
        state:'SOURCE_HEALTH_CONTRACT_SIGNED_COMPATIBLE_CONNECTION_HELD'});
    }
    return hold('SIX_SOURCE_SIGNED_HEALTH_CONTRACTS_COMPATIBLE_STILL_HELD',{
      compatibleCount:6,sourceTestAuthorized:false,
      compatibility:compatibility.sort((a,b)=>a.sourceId.localeCompare(b.sourceId)),
      privateNetworkRequests:0,databaseWrites:0});
  }catch{return hold('HOLD_SIX_SOURCE_PRIVATE_CONTRACT_READBACK_UNAVAILABLE');}
}

/** QL-362 injectable adapters: exactly one private GET, then verification.
 * Transport is private and MUST validate pinned HTTPS certificate itself.
 * Missing independent transport attestation fails CLOSED before any success. */
export function createQl363SourceSignedReadOnlyAdapter({record:sourceRecord,
  resolvePinnedSigner,verifySignerCustody,
  assertOriginalPrivateExecution,privatePinnedHttpsGet,
  verifyTransportAttestation,now=()=>Date.now()}={}){
  // Snapshot caller metadata so a late mutation cannot change the trusted
  // source/commit/origin between authorization and receipt verification.
  const record=sourceRecord===undefined?undefined:structuredClone(sourceRecord);
  const spent=new Set(),pending=new Map();let active=false;
  const fail=reason=>{throw Error(`HOLD_QL363_${reason}`);};
  return Object.freeze({
    async sendSignedGet({request,requestSha256}={}){
      const id=record?.sourceId,p=record?.contract?.payload;
      if(active||!Object.hasOwn(SOURCES,id)||
        !UUID.test(request?.operationId??'')||spent.has(request.operationId))
        fail('ONE_SOURCE_OPERATION_OR_REPLAY');
      spent.add(request.operationId);active=true;
      try{
        const at=now();
        if(request?.schema!==QL362_SCHEMA||request?.sourceId!==id||
          request?.method!=='GET'||request?.path!==QL363_PATH||
          request.environment!=='TEST'||request.customerDataAllowed!==false||
          request.deviceActionsAllowed!==false||
          request.persistentConnectionAllowed!==false||
          !SHA.test(record.tlsSpkiSha256??'')||
          !sameSha(digest(request),requestSha256)||
          request.sourceCommitSha!==record.commitSha||
          request.sourceOrigin!==p?.sourceOrigin||
          !sameSha(request.manifestSha256,p?.manifestSha256)||
          !validTime(request.issuedAt,request.expiresAt,at,90_000)||
          typeof assertOriginalPrivateExecution!=='function'||
          typeof privatePinnedHttpsGet!=='function'||
          typeof verifyTransportAttestation!=='function')
          fail('ORIGINAL_ONE_GET_AUTHORIZATION_REQUIRED');
        const privateProof=await assertOriginalPrivateExecution({
          sourceId:id,operationId:request.operationId,requestSha256});
        // QL-366 is a separately owner-approved TEST-only alternative to the
        // former external-reviewer gate. Neither proof is supplied by HTTP.
        if(!['QL362_ORIGINAL_REE_PRIVATE_APPROVED_SINGLE_GET',
          'QL366_ORIGINAL_REE_DUAL_OWNER_APPROVED_SINGLE_GET']
          .includes(privateProof?.state)||
          privateProof.originalComputer!=='DESKTOP-AE894KC'||
          privateProof.receiverStopped!==true||
          !sameSha(privateProof.requestSha256,requestSha256))
          fail('ORIGINAL_PRIVATE_OPERATOR_OR_OFFLINE_APPROVAL_REQUIRED');
        const compatible=await verifyQl363SourceHealthContract({record,
          peer:{peerId:id,repository:SOURCES[id].repo},
          resolvePinnedSigner,verifySignerCustody,now:at});
        if(!compatible.contractCompatible)fail('PINNED_SOURCE_CONTRACT_REQUIRED');
        if(now()>Date.parse(request.expiresAt))fail('OPERATION_EXPIRED');
        const url=`${p.sourceOrigin}${QL363_PATH}`;
        // The private transport owns TLS cert pinning, timeout, content cap,
        // no redirects, and prohibits authentication headers outside scope.
        const remote=await privatePinnedHttpsGet({url,sourceId:id,
          operationId:request.operationId,requestSha256,
          method:'GET',redirects:'DENY',timeoutMs:4000,maxBytes:4096,
          expectedTlsSpkiSha256:record.tlsSpkiSha256});
        if(remote?.url!==url||remote?.method!=='GET'||remote?.status!==200||
          remote.redirected!==false||!Number.isSafeInteger(remote.byteLength)||
          remote.byteLength<1||remote.byteLength>4096||
          !sameSha(remote.tlsSpkiSha256,record.tlsSpkiSha256)||
          typeof remote.rawText!=='string'||
          Buffer.byteLength(remote.rawText,'utf8')!==remote.byteLength||
          remote.contentType!=='application/json')fail('TRANSPORT_RESPONSE_NOT_EXACT');
        const tls=await verifyTransportAttestation({
          sourceId:id,operationId:request.operationId,requestSha256,
          url,expectedTlsSpkiSha256:record.tlsSpkiSha256,
          observedTlsSpkiSha256:remote.tlsSpkiSha256,
          evidence:remote.privateTlsEvidence});
        if(tls?.state!=='INDEPENDENT_ORIGINAL_PINNED_TLS_GET_VERIFIED'||
          tls.sourceId!==id||tls.operationId!==request.operationId||
          !sameSha(tls.requestSha256,requestSha256)||
          !sameSha(tls.tlsSpkiSha256,record.tlsSpkiSha256))
          fail('PRIVATE_TLS_PIN_NOT_INDEPENDENTLY_VERIFIED');
        let envelope;
        try{envelope=JSON.parse(remote.rawText);}catch{fail('UNPARSABLE_SOURCE_ENVELOPE');}
        if(!keys(envelope,['schema','health','receipt'])||
          envelope.schema!==QL363_ENVELOPE_SCHEMA||
          !keys(envelope.health,['schema','sourceId','operationId',
            'health','connected','customerDataAllowed','deviceActions'])||
          envelope.health.schema!==QL362_HEALTH_SCHEMA||
          envelope.health.sourceId!==id||
          envelope.health.operationId!==request.operationId||
          envelope.health.health!=='ok'||envelope.health.connected!==false||
          envelope.health.customerDataAllowed!==false||
          envelope.health.deviceActions!==false)
          fail('CUSTOMER_DEVICE_OR_UNEXPECTED_RESPONSE_FIELDS');
        const response={sourceId:id,operationId:request.operationId,
          sourceOrigin:p.sourceOrigin,method:'GET',path:QL363_PATH,
          httpStatus:200,redirected:false,byteLength:remote.byteLength,
          body:envelope.health};
        pending.set(request.operationId,{requestSha256,
          receiptSha256:digest(envelope.health),receipt:envelope.receipt,
          sourceCommitSha:record.commitSha});
        return response;
      }finally{active=false;}
    },
    async verifySignedSourceReceipt({request,response,requestSha256,
      receiptSha256,pinnedSource}={}){
      const id=record?.sourceId,entry=pending.get(request?.operationId);
      pending.delete(request?.operationId);
      const deny=reason=>hold(reason);
      try{
        if(!entry||request?.sourceId!==id||response?.sourceId!==id||
          request?.operationId!==response.operationId||
          pinnedSource?.sourceId!==id||
          pinnedSource.commitSha!==record.commitSha||
          !sameSha(entry.requestSha256,requestSha256)||
          !sameSha(entry.receiptSha256,receiptSha256)||
          !sameSha(digest(response.body),receiptSha256))
          return deny('HOLD_EXACT_SOURCE_GET_RECEIPT_CONTEXT_MISMATCH');
        const pin=await resolvePinnedSigner(id),key=pinnedKey(pin);
        const payload=entry.receipt?.payload;
        if(!key||pin.role!=='source_signer'||pin.sourceId!==id||
          pin.repository!==`RosevearCreations/${SOURCES[id].repo}`||
          pin.revoked!==false||
          !verifySignedEnvelope(entry.receipt,receiptFields,key,pin)||
          payload.schema!==QL363_RECEIPT_SCHEMA||
          payload.sourceId!==id||payload.operationId!==request.operationId||
          !sameSha(payload.requestSha256,requestSha256)||
          !sameSha(payload.receiptSha256,receiptSha256)||
          payload.sourceCommitSha!==entry.sourceCommitSha||
          payload.sourceOrigin!==request.sourceOrigin||
          payload.environment!=='TEST'||payload.method!=='GET'||
          payload.path!==QL363_PATH||
          payload.scope!=='HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES'||
          !validTime(payload.issuedAt,payload.expiresAt,now(),90_000))
          return deny('HOLD_SOURCE_SIGNED_RECEIPT_INVALID_OR_EXPIRED');
        const trust=await verifySignerCustody({sourceId:id,
          spkiSha256:pin.spkiSha256,receiptSha256,requestSha256});
        if(trust?.state!=='INDEPENDENT_ORIGINAL_SOURCE_SIGNER_AUTHENTICATED'||
          trust.sourceId!==id||trust.revoked!==false||
          !sameSha(trust.spkiSha256,pin.spkiSha256)||
          !sameSha(trust.receiptSha256,receiptSha256)||
          !sameSha(trust.requestSha256,requestSha256))
          return deny('HOLD_SOURCE_RECEIPT_INDEPENDENT_CUSTODY_MISSING');
        return {state:'INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED',
          sourceId:id,operationId:request.operationId,requestSha256,
          receiptSha256,sourceSignerAuthenticated:true,
          sourceSignerSpkiSha256:pin.spkiSha256,
          nonproductionIsolationVerified:true,
          connected:false,connectionState:'DISCONNECTED / HOLD'};
      }catch{return deny('HOLD_SOURCE_RECEIPT_VERIFIER_UNAVAILABLE');}
    },
    inspect(){return hold(active?'PRIVATE_SOURCE_GET_IN_FLIGHT':'SOURCE_ADAPTER_IDLE',{
      attemptedCount:spent.size,pendingSignatures:pending.size});}
  });
}

/** Post-GET closeout is independently witnessed, still NOT a connection. */
export async function verifyQl363IndependentClosure({ql362Result,sourceReceipt,
  originalWitnessReadback,receiverOffReadback,peerRows,
  independentlySignedClosure,resolveClosureAuditor,verifyClosureAuditorCustody,
  readOriginalQl362ImmutableProof,
  now=Date.now()}={}){
  try{
    const r=ql362Result,id=r?.sourceId;
    if(r?.schema!==QL362_SCHEMA||r.firstSourceGetVerified!==true||
      r.sourceOwnerSignatureVerified!==true||
      r.masterOwnerSignatureVerified!==true||
      r.originalArchivedTestVerified!==true||
      r.privateOperationClaimed!==true||r.connected!==false||
      r.connectionState!=='DISCONNECTED / HOLD'||
      !Object.hasOwn(SOURCES,id)||!UUID.test(r.operationId??'')||
      !SHA.test(r.requestSha256??'')||!SHA.test(r.receiptSha256??'')||
      sourceReceipt?.state!=='INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED'||
      sourceReceipt.sourceId!==id||sourceReceipt.operationId!==r.operationId||
      !sameSha(sourceReceipt.requestSha256,r.requestSha256)||
      !sameSha(sourceReceipt.receiptSha256,r.receiptSha256)||
      !SHA.test(sourceReceipt.sourceSignerSpkiSha256??'')||
      sourceReceipt.sourceSignerAuthenticated!==true||
      sourceReceipt.nonproductionIsolationVerified!==true||
      sourceReceipt.connected!==false||
      sourceReceipt.connectionState!=='DISCONNECTED / HOLD'||
      originalWitnessReadback?.state!=='ORIGINAL_PRIVATE_IMMUTABLE_GET_WITNESS_READBACK'||
      originalWitnessReadback.sourceId!==id||
      originalWitnessReadback.operationId!==r.operationId||
      !sameSha(originalWitnessReadback.requestSha256,r.requestSha256)||
      !sameSha(originalWitnessReadback.receiptSha256,r.receiptSha256)||
      originalWitnessReadback.immutableReadbackVerified!==true||
      receiverOffReadback?.state!=='ORIGINAL_REE_RECEIVER_AND_GATEWAY_OFF_AFTER_GET'||
      receiverOffReadback.originalComputer!=='DESKTOP-AE894KC'||
      receiverOffReadback.receiverListenerCount!==0||
      receiverOffReadback.tailnetGatewayListenerCount!==0||
      !Number.isFinite(receiverOffReadback.observedAt)||
      Math.abs(now-receiverOffReadback.observedAt)>30_000||
      typeof readOriginalQl362ImmutableProof!=='function')
      return hold('HOLD_ORIGINAL_FIRST_GET_CLOSURE_EVIDENCE_MISSING');
    const original=await readOriginalQl362ImmutableProof({sourceId:id,
      operationId:r.operationId,requestSha256:r.requestSha256,
      receiptSha256:r.receiptSha256});
    if(original?.state!=='ORIGINAL_QL362_DUAL_OWNER_SIGNED_GET_IMMUTABLE_READBACK'||
      original.originalComputer!=='DESKTOP-AE894KC'||
      original.ownerOnlyAcl!==true||
      original.sourceOwnerSignatureVerified!==true||
      original.masterOwnerSignatureVerified!==true||
      original.durableUniqueClaimVerified!==true||
      original.sourceId!==id||original.operationId!==r.operationId||
      !sameSha(original.requestSha256,r.requestSha256)||
      !sameSha(original.receiptSha256,r.receiptSha256))
      return hold('HOLD_ORIGINAL_SIGNED_DUAL_OWNER_GET_PROOF_NOT_RECORDED');
    const peers=validateSixHeldPeers(peerRows);
    if(peers.length!==6||!peers.some(p=>p.peerId===id))
      return hold('HOLD_SIX_SOURCE_POST_GET_DATABASE_STATE_DRIFT');
    const payload=independentlySignedClosure?.payload;
    if(!keys(payload,['schema','sourceId','operationId','requestSha256',
      'receiptSha256','audience','decision','peerCount','connectedCount',
      'issuedAt','expiresAt'])||payload.schema!==QL363_CLOSURE_SCHEMA||
      payload.sourceId!==id||payload.operationId!==r.operationId||
      !sameSha(payload.requestSha256,r.requestSha256)||
      !sameSha(payload.receiptSha256,r.receiptSha256)||
      payload.audience!=='rosevear-comms-hub:independent-first-get-closure:TEST'||
      payload.decision!=='FIRST_SOURCE_GET_CLOSED_SIX_APPS_STILL_HELD'||
      payload.peerCount!==6||payload.connectedCount!==0||
      !validTime(payload.issuedAt,payload.expiresAt,now,90_000)||
      typeof resolveClosureAuditor!=='function'||
      typeof verifyClosureAuditorCustody!=='function')
      return hold('HOLD_INDEPENDENT_CLOSURE_AUDITOR_SIGNATURE_REQUIRED');
    const pin=await resolveClosureAuditor();const key=pinnedKey(pin);
    if(!key||pin.role!=='closure_auditor'||pin.revoked!==false||
      sameSha(pin.spkiSha256,sourceReceipt.sourceSignerSpkiSha256)||
      !verifySignedEnvelope(independentlySignedClosure,[
        'schema','sourceId','operationId','requestSha256','receiptSha256',
        'audience','decision','peerCount','connectedCount','issuedAt','expiresAt'],key,pin))
      return hold('HOLD_INDEPENDENT_CLOSURE_SIGNATURE_INVALID');
    const custody=await verifyClosureAuditorCustody({spkiSha256:pin.spkiSha256,
      sourceId:id,operationId:r.operationId,
      requestSha256:r.requestSha256,receiptSha256:r.receiptSha256});
    if(custody?.state!=='INDEPENDENT_CLOSURE_AUDITOR_AUTHENTICATED'||
      custody.revoked!==false||
      !sameSha(custody.spkiSha256,pin.spkiSha256)||
      !sameSha(custody.requestSha256,r.requestSha256)||
      !sameSha(custody.receiptSha256,r.receiptSha256)||
      custody.sourceId!==id||custody.operationId!==r.operationId)
      return hold('HOLD_INDEPENDENT_CLOSURE_AUDITOR_CUSTODY_MISSING');
    return hold('FIRST_SIGNED_SOURCE_GET_INDEPENDENTLY_CLOSED_ALL_SIX_STILL_HELD',{
      sourceId:id,operationId:r.operationId,
      requestSha256:r.requestSha256,receiptSha256:r.receiptSha256,
      independentClosureVerified:true,peerCount:6,
      nextAction:'Separate original source owner review required for any persistent connection'});
  }catch{return hold('HOLD_INDEPENDENT_ORIGINAL_CLOSURE_VERIFICATION_UNAVAILABLE');}
}

export function ql363Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return hold('SIX_SOURCE_HEALTH_CONTRACT_GUIDE_ONLY',{
    availableCommands:['--help'],httpGets:0,receiverStarts:0,
    originalOwnerApprovals:0,sourceWrites:0,databaseWrites:0});
  throw Error('DENY_UNSUPERVISED_QL363_RECEIVER_OR_SOURCE_GET');
}
if(process.argv[1]?.endsWith('ql363-six-source-health-adapters.mjs')){
  try{process.stdout.write(JSON.stringify(ql363Cli())+'\n');}
  catch(e){process.stderr.write(`HOLD_QL363: ${e.message}\n`);process.exitCode=1;}
}
