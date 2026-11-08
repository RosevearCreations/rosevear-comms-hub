/** Rosevear Creations owner-governed, one-source, private health TEST policy.
 * Alternative to the external-reviewer QL-355/365C ceremony, NEVER evidence
 * that those old external approvals happened. This module cannot enroll a user,
 * grant customer access, start a receiver or create a source signing key.
 * All private callbacks are supplied only by an original-host operator.
 */
import {createHash,createPrivateKey,createPublicKey,randomBytes,randomUUID,
  sign,verify} from 'node:crypto';
import {canonicalize,SOURCES} from '../master-discovery/manifest.mjs';
import {inspectQl365aPinnedOwner,QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {QL362_SCHEMA} from './ql362-source-owner-first-get.mjs';
import {QL363_PATH,verifyQl363SourceHealthContract}
  from './ql363-six-source-health-adapters.mjs';

export const QL366_ORGANIZATION='rosevear-creations';
export const QL366_INTENT='rosevear.hub.ql366.two-owner-one-source-test-intent.v1';
export const QL366_APPROVAL='rosevear.hub.ql366.original-owner-approval.v1';
export const QL366_SIGNED='rosevear.hub.ql366.two-owner-offline-review.v1';
export const QL366_RESULT='rosevear.hub.ql366.private-test-disposition.v1';
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const NONCE=/^[a-f0-9]{32}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const exact=(v,fields)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===fields.length&&Object.keys(v).every(k=>fields.includes(k));
const domain=role=>`rosevear.hub.ql366.original-${role}-test-only:`;
const nowISO=ms=>new Date(ms).toISOString();
const hold=(state,extra={})=>({schema:QL366_RESULT,state,
  organizationId:QL366_ORGANIZATION,approved:false,
  genuinePrivateTestVerified:false,persistentConnectionAuthorized:false,
  privateTestAuthorized:false,receiverActivated:false,
  customerDataAllowed:false,customerCommunications:false,deviceActions:false,
  connected:false,connectionState:'DISCONNECTED / HOLD',...extra});
const ownerHost={source:{host:'DESKTOP-AE894KC',windowsUser:'ree'},
  master:{host:'TEMPLAR',windowsUser:'jfros'}};
function validOrigin(s){
  try{const u=new URL(s);return u.protocol==='https:'&&u.origin===s&&
    u.pathname==='/'&&!u.username&&!u.password&&!u.search&&!u.hash;}
  catch{return false;}
}

/** Public intent. Its hash includes the exact source, revision, contract,
 * source-owned HTTPS/TLS pin, operation UUID, and 90-second TEST scope. */
export function createQl366TestIntent({sourceId,sourceCommitSha,manifestSha256,
  contractSha256,sourceOrigin,tlsSpkiSha256,issuedAt=Date.now(),
  operationId=randomUUID(),nonce=randomBytes(16).toString('hex')}={}){
  const intent={schema:QL366_INTENT,organizationId:QL366_ORGANIZATION,
    sourceId,repository:SOURCES[sourceId]?.repo,
    sourceAppId:SOURCES[sourceId]?.app,
    tenantBoundary:SOURCES[sourceId]?.boundary,
    operationId,sourceCommitSha,manifestSha256,contractSha256,sourceOrigin,
    tlsSpkiSha256,environment:'TEST',method:'GET',path:QL363_PATH,
    maxResponseBytes:4096,redirects:'DENY',automaticRetry:false,
    persistentConnectionAllowed:false,customerDataAllowed:false,
    customerCommunications:false,deviceActions:false,
    issuedAt:nowISO(issuedAt),expiresAt:nowISO(issuedAt+90_000),nonce};
  const check=inspectQl366TestIntent(intent,issuedAt);
  if(!check.valid)throw Error(check.state);
  return intent;
}

export function inspectQl366TestIntent(intent,at=Date.now()){
  const s=SOURCES[intent?.sourceId];
  const fields=['schema','organizationId','sourceId','repository','sourceAppId',
    'tenantBoundary','operationId','sourceCommitSha','manifestSha256',
    'contractSha256','sourceOrigin','tlsSpkiSha256','environment','method',
    'path','maxResponseBytes','redirects','automaticRetry',
    'persistentConnectionAllowed','customerDataAllowed',
    'customerCommunications','deviceActions','issuedAt','expiresAt','nonce'];
  const issued=Date.parse(intent?.issuedAt),expires=Date.parse(intent?.expiresAt);
  if(!exact(intent,fields)||!s||intent.schema!==QL366_INTENT||
    intent.organizationId!==QL366_ORGANIZATION||intent.repository!==s.repo||
    intent.sourceAppId!==s.app||intent.tenantBoundary!==s.boundary||
    !UUID.test(intent.operationId??'')||!COMMIT.test(intent.sourceCommitSha??'')||
    ![intent.manifestSha256,intent.contractSha256,intent.tlsSpkiSha256]
      .every(x=>SHA.test(x??''))||!validOrigin(intent.sourceOrigin)||
    intent.environment!=='TEST'||intent.method!=='GET'||intent.path!==QL363_PATH||
    intent.maxResponseBytes!==4096||intent.redirects!=='DENY'||
    [intent.automaticRetry,intent.persistentConnectionAllowed,
      intent.customerDataAllowed,intent.customerCommunications,intent.deviceActions]
      .some(x=>x!==false)||!NONCE.test(intent.nonce??'')||
    !Number.isFinite(issued)||!Number.isFinite(expires)||
    intent.issuedAt!==nowISO(issued)||intent.expiresAt!==nowISO(expires)||
    expires-issued!==90_000||issued>at+5_000||at>=expires)
    return hold('DENY_QL366_UNSCOPED_CHANGED_OR_EXPIRED_INTENT',{valid:false});
  return hold('EXACT_ONE_SOURCE_TEST_INTENT_REVIEWABLE_NO_PERMISSION',{
    valid:true,intentSha256:sha(intent),operationId:intent.operationId,
    sourceId:intent.sourceId,expiresAt:intent.expiresAt});
}

/** Called only by a host-restricted interactive original-key CLI. */
export function signQl366OwnerIntent({intent,role,localCandidate,
  originalPublicBytes,encryptedPrivateKeyPem,passphrase,now=Date.now()}={}){
  const checked=inspectQl366TestIntent(intent,now),pin=QL365A_PINS[role];
  if(!checked.valid)throw Error(checked.state);
  if(!pin||!Buffer.isBuffer(originalPublicBytes)||
    !inspectQl365aPinnedOwner(localCandidate,role,
      {originalBytes:originalPublicBytes}).verified||
    typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_QL366_NOT_ORIGINAL_PINNED_OWNER');
  let key;
  try{key=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_QL366_ORIGINAL_OWNER_KEY_DECRYPTION');}
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(createPublicKey(key).export({format:'der',type:'spki'}))
      .digest('hex')!==pin.spkiSha256)
    throw Error('DENY_QL366_OWNER_KEY_PIN_DRIFT');
  const payload={schema:QL366_APPROVAL,organizationId:QL366_ORGANIZATION,
    sourceId:intent.sourceId,operationId:intent.operationId,role,
    intentSha256:checked.intentSha256,decision:'APPROVE_ONE_PRIVATE_HEALTH_TEST_ONLY',
    issuedAt:intent.issuedAt,expiresAt:intent.expiresAt};
  return {schema:QL366_APPROVAL,payload,signature:sign(null,
    Buffer.from(domain(role)+canonicalize(payload)),key).toString('base64url')};
}

/** An offline signature check is useful to the owners, but cannot authenticate
 * original-host custody, issue a database permit or satisfy a private TEST. */
export function inspectQl366OfflineSignatures({intent,approvals,sourcePublic,
  masterPublic,now=Date.now()}={}){
  const checked=inspectQl366TestIntent(intent,now);
  if(!checked.valid)return checked;
  if(!exact(approvals,['source','master']))
    return hold('HOLD_QL366_TWO_OWNER_APPROVAL_FILES_REQUIRED');
  for(const [role,candidate] of [['source',sourcePublic],['master',masterPublic]]){
    const approval=approvals[role],p=approval?.payload;
    if(!inspectQl365aPinnedOwner(candidate,role).verified||
      !exact(approval,['schema','payload','signature'])||
      approval.schema!==QL366_APPROVAL||
      !exact(p,['schema','organizationId','sourceId','operationId','role',
        'intentSha256','decision','issuedAt','expiresAt'])||
      p.schema!==QL366_APPROVAL||p.role!==role||
      p.organizationId!==QL366_ORGANIZATION||p.sourceId!==intent.sourceId||
      p.operationId!==intent.operationId||p.intentSha256!==checked.intentSha256||
      p.decision!=='APPROVE_ONE_PRIVATE_HEALTH_TEST_ONLY'||
      p.issuedAt!==intent.issuedAt||p.expiresAt!==intent.expiresAt||
      !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??''))
      return hold('DENY_QL366_OFFLINE_APPROVAL_SCOPE_OR_PIN');
    try{
      if(!verify(null,Buffer.from(domain(role)+canonicalize(p)),
        createPublicKey(candidate.publicKeyPem),
        Buffer.from(approval.signature,'base64url')))
        return hold('DENY_QL366_OFFLINE_SIGNATURE_INVALID');
    }catch{return hold('DENY_QL366_OFFLINE_SIGNATURE_INVALID');}
  }
  return hold('TWO_OWNER_SIGNATURE_BYTES_VERIFIED_ORIGINAL_HOST_CUSTODY_STILL_HELD',{
    valid:true,sourceId:intent.sourceId,intentSha256:checked.intentSha256,
    operationId:intent.operationId});
}

/** Resolver and custody are server-side original-host functions, not supplied
 * by the unsigned request. Neither a copied public key nor role flag suffices. */
export async function verifyQl366TwoOriginalOwners({intent,approvals,
  resolveOriginalOwner,verifyOriginalOwnerCustody,now=Date.now()}={}){
  const checked=inspectQl366TestIntent(intent,now);
  if(!checked.valid)return checked;
  if(typeof resolveOriginalOwner!=='function'||
    typeof verifyOriginalOwnerCustody!=='function'||
    !exact(approvals,['source','master']))
    return hold('HOLD_QL366_TWO_ORIGINAL_SIGNERS_AND_CUSTODY_REQUIRED');
  const pins=[];
  try{
    for(const role of ['source','master']){
      const pin=QL365A_PINS[role],host=ownerHost[role];
      const original=await resolveOriginalOwner(role),approval=approvals[role];
      const p=approval?.payload;
      if(original?.role!==role||original.keyId!==pin.keyId||
        original.spkiSha256!==pin.spkiSha256||
        original.originalPublicFileSha256!==pin.originalFileSha256||
        original.originalHost!==host.host||
        original.windowsUser?.toLowerCase()!==host.windowsUser||
        typeof original.publicKeyPem!=='string'||
        !exact(approval,['schema','payload','signature'])||
        approval.schema!==QL366_APPROVAL||
        !exact(p,['schema','organizationId','sourceId','operationId','role',
          'intentSha256','decision','issuedAt','expiresAt'])||
        p.schema!==QL366_APPROVAL||p.organizationId!==QL366_ORGANIZATION||
        p.sourceId!==intent.sourceId||p.operationId!==intent.operationId||
        p.role!==role||p.intentSha256!==checked.intentSha256||
        p.decision!=='APPROVE_ONE_PRIVATE_HEALTH_TEST_ONLY'||
        p.issuedAt!==intent.issuedAt||p.expiresAt!==intent.expiresAt||
        !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??''))
        return hold('DENY_QL366_CHANGED_OWNER_APPROVAL_OR_HOST');
      const key=createPublicKey(original.publicKeyPem);
      if(key.asymmetricKeyType!=='ed25519'||
        createHash('sha256').update(key.export({format:'der',type:'spki'}))
          .digest('hex')!==pin.spkiSha256||
        !verify(null,Buffer.from(domain(role)+canonicalize(p)),key,
          Buffer.from(approval.signature,'base64url')))
        return hold('DENY_QL366_OWNER_SIGNATURE_OR_PIN_INVALID');
      const custody=await verifyOriginalOwnerCustody({role,
        originalHost:host.host,windowsUser:host.windowsUser,
        spkiSha256:pin.spkiSha256,intentSha256:checked.intentSha256});
      if(custody?.state!=='ORIGINAL_OWNER_LOCAL_CUSTODY_AUTHENTICATED'||
        custody.role!==role||custody.originalHost!==host.host||
        custody.spkiSha256!==pin.spkiSha256||
        custody.originalPublicFileSha256!==pin.originalFileSha256||
        custody.intentSha256!==checked.intentSha256||
        custody.revoked!==false||
        !Number.isFinite(custody.observedAt)||
        Math.abs(now-custody.observedAt)>30_000)
        return hold('HOLD_QL366_ORIGINAL_OWNER_CUSTODY_NOT_FRESH');
      pins.push(pin.spkiSha256);
    }
    if(pins[0]===pins[1])return hold('DENY_QL366_NONINDEPENDENT_OWNER_KEYS');
    return hold('TWO_DISTINCT_ORIGINAL_OWNERS_SIGNED_ONE_PRIVATE_TEST_INTENT',{
      approved:true,intentSha256:checked.intentSha256,
      sourceId:intent.sourceId,operationId:intent.operationId,
      ownerSpkiSha256:pins});
  }catch{return hold('HOLD_QL366_ORIGINAL_SIGNER_VERIFICATION_UNAVAILABLE');}
}

/** Callable only in the separately authenticated original-private operator.
 * The adapter enforces TLS pin, no redirects, size cap and source signature.
 * The durable one-use claim happens BEFORE any outbound GET. Always verify STOP.
 */
export function createQl366OnePrivateTestGate({resolveOriginalOwner,
  verifyOriginalOwnerCustody,resolvePinnedSigner,verifySignerCustody,
  verifyOriginalPrivateOperator,readAllSixHeldPeers,readReceiverOff,
  claimOneUseOperation,sourceAdapter,appendSignedReceipt,verifyReceiverStopped,
  now=()=>Date.now()}={}){
  const spent=new Set();let busy=false;
  return Object.freeze({
    async runOnce({intent,approvals,sourceRecord,peer}={}){
      if(busy)return hold('HOLD_QL366_ANOTHER_TEST_IN_PROGRESS');
      if(!UUID.test(intent?.operationId??'')||spent.has(intent.operationId))
        return hold('DENY_QL366_REPLAYED_OR_MALFORMED_OPERATION');
      spent.add(intent.operationId);busy=true;
      let attempted=false,result=hold('HOLD_QL366_PRIVATE_OPERATION_NOT_STARTED');
      try{
        const required=[resolveOriginalOwner,verifyOriginalOwnerCustody,
          resolvePinnedSigner,verifySignerCustody,verifyOriginalPrivateOperator,
          readAllSixHeldPeers,readReceiverOff,claimOneUseOperation,
          appendSignedReceipt,verifyReceiverStopped];
        if(required.some(fn=>typeof fn!=='function')||
          typeof sourceAdapter?.sendSignedGet!=='function'||
          typeof sourceAdapter?.verifySignedSourceReceipt!=='function')
          return hold('HOLD_QL366_ORIGINAL_PRIVATE_ADAPTERS_REQUIRED');
        const approval=await verifyQl366TwoOriginalOwners({intent,approvals,
          resolveOriginalOwner,verifyOriginalOwnerCustody,now:now()});
        if(!approval.approved)return approval;
        const [operator,peers,off,contract]=await Promise.all([
          verifyOriginalPrivateOperator({sourceId:intent.sourceId,
            operationId:intent.operationId,intentSha256:approval.intentSha256}),
          readAllSixHeldPeers(),readReceiverOff(),
          verifyQl363SourceHealthContract({record:sourceRecord,peer,
            resolvePinnedSigner,verifySignerCustody,now:now()})]);
        if(operator?.state!=='ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'||
          operator.originalComputer!=='DESKTOP-AE894KC'||
          operator.originalUser?.toLowerCase()!=='ree'||
          operator.replayOrRevocationFound!==false||
          !Number.isFinite(operator.expiresAt)||operator.expiresAt<=now()||
          peers?.state!=='SIX_HELD_PEERS'||peers.held!==6||
          peers.connected!==0||peers.grants!==0||
          off?.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
          off.computer!=='DESKTOP-AE894KC'||off.listenerCount!==0||
          off.receiverActivated!==false||
          !Number.isFinite(off.observedAt)||
          Math.abs(now()-off.observedAt)>30_000)
          return hold('HOLD_QL366_PRIVATE_OPERATOR_OR_SIX_HELD_PEERS_NOT_VERIFIED');
        if(contract.contractCompatible!==true||
          contract.sourceId!==intent.sourceId||
          contract.sourceCommitSha!==intent.sourceCommitSha||
          contract.manifestSha256!==intent.manifestSha256||
          contract.contractSha256!==intent.contractSha256||
          contract.sourceOrigin!==intent.sourceOrigin||
          sourceRecord?.tlsSpkiSha256!==intent.tlsSpkiSha256||
          QL365A_PINS.source.spkiSha256===contract.sourceSignerSpkiSha256||
          QL365A_PINS.master.spkiSha256===contract.sourceSignerSpkiSha256)
          return hold('HOLD_QL366_SIGNED_SOURCE_CONTRACT_AND_TLS_PIN_REQUIRED');
        const claim=await claimOneUseOperation({organizationId:QL366_ORGANIZATION,
          sourceId:intent.sourceId,operationId:intent.operationId,
          intentSha256:approval.intentSha256,expiresAt:intent.expiresAt,
          ownerSpkiSha256:approval.ownerSpkiSha256});
        if(claim?.state!=='ORIGINAL_PRIVATE_ONE_USE_OPERATION_CLAIMED'||
          claim.durableUniqueClaim!==true||
          claim.operationId!==intent.operationId||
          claim.intentSha256!==approval.intentSha256)
          return hold('HOLD_QL366_DURABLE_ONE_USE_CLAIM_REQUIRED');
        if(now()>=Date.parse(intent.expiresAt))
          return hold('HOLD_QL366_TEST_EXPIRED_BEFORE_PRIVATE_GET');
        const request={schema:QL362_SCHEMA,kind:'ONE_PRIVATE_HEALTH_GET_INTENT',
          archiveId:'rosevear-creations-dual-owner-test',
          handoffSha256:approval.intentSha256,sourceId:intent.sourceId,
          repository:intent.repository,operationId:intent.operationId,
          sourceCommitSha:intent.sourceCommitSha,
          manifestSha256:intent.manifestSha256,sourceOrigin:intent.sourceOrigin,
          environment:'TEST',method:'GET',path:QL363_PATH,
          issuedAt:intent.issuedAt,expiresAt:intent.expiresAt,
          customerDataAllowed:false,deviceActionsAllowed:false,
          persistentConnectionAllowed:false};
        const requestSha256=sha(request);
        attempted=true;
        const response=await sourceAdapter.sendSignedGet({request,requestSha256});
        const receiptSha256=sha(response.body);
        const receipt=await sourceAdapter.verifySignedSourceReceipt({request,
          response,requestSha256,receiptSha256,
          pinnedSource:{sourceId:intent.sourceId,
            commitSha:intent.sourceCommitSha}});
        if(receipt.state!=='INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED'||
          receipt.sourceId!==intent.sourceId||
          receipt.operationId!==intent.operationId||
          receipt.requestSha256!==requestSha256||
          receipt.receiptSha256!==receiptSha256)
          throw Error('HOLD_QL366_GENUINE_SOURCE_SIGNATURE_AND_RECEIPT_REQUIRED');
        const archived=await appendSignedReceipt({organizationId:QL366_ORGANIZATION,
          sourceId:intent.sourceId,operationId:intent.operationId,
          intentSha256:approval.intentSha256,requestSha256,receiptSha256,
          ownerDecisionsSha256:sha(approvals)});
        if(archived?.state!=='ORIGINAL_APPEND_ONLY_SIGNED_RECEIPT_SAVED'||
          archived.operationId!==intent.operationId||
          archived.receiptSha256!==receiptSha256||archived.immutable!==true)
          throw Error('HOLD_QL366_ORIGINAL_SIGNED_RECEIPT_NOT_ARCHIVED');
        result=hold('PRIVATE_TEST_SIGNED_RECEIPT_ARCHIVED_STOP_STILL_REQUIRED',{
          sourceId:intent.sourceId,operationId:intent.operationId,
          receiptSha256,intentSha256:approval.intentSha256});
      }catch(error){
        result=hold(error?.message?.startsWith('HOLD_QL366_')?error.message:
          'HOLD_QL366_PRIVATE_OPERATION_FAILED_NO_AUTO_RETRY',{attempted});
      }finally{
        // Even a failed source response needs an independently observed STOP.
        if(attempted){
          try{
            const stopped=await verifyReceiverStopped({sourceId:intent.sourceId,
              operationId:intent.operationId});
            if(stopped?.state!=='ORIGINAL_RECEIVER_STOP_INDEPENDENTLY_VERIFIED'||
              stopped.computer!=='DESKTOP-AE894KC'||stopped.listenerCount!==0||
              !Number.isFinite(stopped.observedAt)||
              Math.abs(now()-stopped.observedAt)>30_000)
              result=hold('HOLD_QL366_RECEIVER_STOP_NOT_VERIFIED');
            else if(result.state==='PRIVATE_TEST_SIGNED_RECEIPT_ARCHIVED_STOP_STILL_REQUIRED')
              result=hold('ONE_SUPERVISED_PRIVATE_TEST_VERIFIED_SIX_APPS_STILL_HELD',{
                genuinePrivateTestVerified:true,sourceId:result.sourceId,
                operationId:result.operationId,
                receiptSha256:result.receiptSha256,
                intentSha256:result.intentSha256,receiverStopVerified:true});
            else result={...result,receiverStopVerified:true};
          }catch{result=hold('HOLD_QL366_RECEIVER_STOP_READBACK_FAILED');}
        }
        busy=false;
      }
      return result;
    }
  });
}
