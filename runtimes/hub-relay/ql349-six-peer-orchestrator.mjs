/** QL-349 — private six-source TEST coordinator. All real authority, signing,
 * transport, and receipt verification are injected from independently approved
 * private components. This module never connects from a public browser. */
import {createHash} from 'node:crypto';
import {SOURCES,inspectManifest,canonicalize} from '../master-discovery/manifest.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';

export const QL349_SCHEMA='rosevear.hub.ql349.six-source-test-orchestration.v1';
export const IDS=Object.freeze(['rosiedazzlers','devilndove','yw','icamp',
  'ai-data-platform','rosevear-ai-hub']);
const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const held=(state,extra={})=>({schema:QL349_SCHEMA,state,authenticatedTest:false,
  connected:false,sourceWrites:0,customerDataAccess:false,
  communicationsSent:0,deviceActions:0,...extra});

/** Public source descriptor is metadata, never a private grant. */
export function inspectPublicSixSourceInventory(rows){
  if(!Array.isArray(rows)||rows.length!==6)
    return held('HOLD_EXACT_SIX_SOURCE_INVENTORY_REQUIRED');
  const seen=new Set(),sources=[];
  for(const row of rows){
    if(!Object.hasOwn(SOURCES,row?.sourceId)||seen.has(row.sourceId)||
      !/^[a-f0-9]{40}$/.test(row.commitSha??''))
      return held('DENY_UNKNOWN_DUPLICATE_OR_UNPINNED_SOURCE');
    seen.add(row.sourceId);
    const inspected=inspectManifest(row.manifest);
    if(inspected.status.startsWith('DENY'))
      return held('DENY_INCOMPATIBLE_SOURCE_MANIFEST',{sourceId:row.sourceId});
    if(row.manifest?.source_id!==row.sourceId)
      return held('DENY_SOURCE_IDENTITY_MISMATCH');
    sources.push({sourceId:row.sourceId,repository:row.manifest.repository,
      commitSha:row.commitSha,manifestSha256:sha(row.manifest),
      publicDescriptorState:inspected.status,
      privateAuthorityVerified:false,connected:false});
  }
  if(seen.size!==6)return held('HOLD_EXACT_SIX_SOURCE_INVENTORY_REQUIRED');
  return held('PUBLIC_SIX_SOURCE_INVENTORY_RECONCILED_TRUST_HELD',{
    sources:IDS.map(id=>sources.find(s=>s.sourceId===id)),sourceCount:6});
}

/** A private database readback can be used to plan, never to grant an identity. */
export function inspectSixPeerPrivateQueue(rows){
  try{
    const peers=validateSixHeldPeers(rows);
    return held('SIX_PRIVATE_PEERS_READY_FOR_INDEPENDENT_TEST_REVIEW',{
      peerCount:6,connectedCount:0,
      queue:IDS.map(id=>({sourceId:id,
        repository:peers.find(p=>p.peerId===id).repository,
        state:'DISCONNECTED / HOLD',nextAction:'INDEPENDENT_SOURCE_SIGNER_AND_TEST_GRANT_REQUIRED'}))});
  }catch{return held('HOLD_PRIVATE_SIX_PEER_REGISTRY_INVALID');}
}

/** Future app onboarding is one non-authorizing proposal, not a new credential
 * ceremony for every peer or an arbitrary URL that the private broker fetches. */
export function proposeFutureSource({sourceId,repository,kind,manifestSha256}={}){
  if(typeof sourceId!=='string'||!/^[a-z][a-z0-9-]{2,40}$/.test(sourceId)||
    Object.hasOwn(SOURCES,sourceId)||
    typeof repository!=='string'||
    !/^RosevearCreations\/[A-Za-z0-9._-]{2,80}$/.test(repository)||
    !['business_shell','support_broker','local_support'].includes(kind)||
    !SHA.test(manifestSha256??''))
    return held('DENY_UNREVIEWED_FUTURE_SOURCE_PROPOSAL');
  return held('FUTURE_SOURCE_PROPOSAL_INDEPENDENT_REVIEW_HELD',{
    proposal:{sourceId,repository,kind,manifestSha256,
      required:'source-signed manifest, independent pin, owner/source TEST grants and separate tenant boundary'},
    registryWrites:0,privateNetworkRequests:0});
}

/** One attempt at a time, with independent authority, source KMS receipt
 * verification and no silent retries. The returned result is TEST-only and
 * never upgrades a persistent source connection to CONNECTED. */
export function createQl349Coordinator({authorize,sendSignedGet,verifyReceipt,
  now=()=>Date.now()}={}){
  let active=false;
  const spent=new Set();
  return Object.freeze({
    async runOne({sourceId,operationId,manifest,commitSha}={}){
      if(active)return held('HOLD_ANOTHER_SOURCE_TEST_IN_PROGRESS');
      if(!Object.hasOwn(SOURCES,sourceId)||!UUID.test(operationId??'')||
        !/^[a-f0-9]{40}$/.test(commitSha??'')||
        manifest?.source_id!==sourceId||
        inspectManifest(manifest).status.startsWith('DENY'))
        return held('DENY_UNKNOWN_SOURCE_OR_UNPINNED_MANIFEST');
      if(spent.has(operationId))return held('DENY_REPLAYED_SOURCE_TEST_OPERATION');
      spent.add(operationId);
      if(typeof authorize!=='function'||typeof sendSignedGet!=='function'||
        typeof verifyReceipt!=='function')
        return held('HOLD_PRIVATE_SIGNER_TRANSPORT_AND_WITNESS_REQUIRED');
      active=true;
      const startedAt=now();
      try{
        const request={sourceId,operationId,commitSha,
          manifestSha256:sha(manifest),environment:'TEST',
          method:'GET',path:'/api/integration/v1/shell/health',
          expiresAt:startedAt+90_000};
        // The private callback must authenticate original owner/source TEST
        // receipts, signer provenance, isolated origin and exact broker scope.
        const authority=await authorize(request);
        if(authority?.status!=='INDEPENDENT_PRIVATE_TEST_AUTHORITY_VERIFIED'||
          authority.requestSha256!==sha(request)||
          authority.originalOwnerVerified!==true||
          authority.sourceOwnerVerified!==true||
          authority.sourceSignerVerified!==true||
          authority.nonproductionIsolationVerified!==true)
          return held('HOLD_INDEPENDENT_SOURCE_OWNER_OR_ISSUER_AUTHORITY');
        if(now()>request.expiresAt)
          return held('HOLD_SOURCE_TEST_AUTHORITY_EXPIRED');
        const response=await sendSignedGet(request,authority);
        if(response?.redirected!==false||response?.httpStatus!==200||
          response?.sourceId!==sourceId||response?.operationId!==operationId||
          response?.method!=='GET'||response?.path!==request.path||
          !Number.isSafeInteger(response?.byteLength)||response.byteLength>8192||
          response.byteLength<1)
          return held('RECOVERY_REVIEW_REQUIRED_SOURCE_RESPONSE_DENIED',{
            failedSourceId:sourceId,retryAutomatically:false});
        const checked=await verifyReceipt(request,response,authority);
        if(checked?.status!=='ORIGINAL_SOURCE_SIGNED_TEST_RECEIPT_VERIFIED'||
          checked.sourceId!==sourceId||checked.operationId!==operationId||
          !SHA.test(checked.receiptSha256??'')||now()>request.expiresAt)
          return held('RECOVERY_REVIEW_REQUIRED_INDEPENDENT_RECEIPT_FAILURE',{
            failedSourceId:sourceId,retryAutomatically:false});
        return held('ONE_SOURCE_SIGNED_TEST_VERIFIED_STILL_HELD',{
          sourceId,operationId,receiptSha256:checked.receiptSha256,
          authenticatedTest:true,verifiedAt:new Date(now()).toISOString(),
          nextAction:'Independently reconcile private append-only receipt and source grant before persistent connection'});
      }catch{return held('RECOVERY_REVIEW_REQUIRED_PRIVATE_TEST_FAILURE',{
        failedSourceId:sourceId,retryAutomatically:false});}
      finally{active=false;}
    },
    inspect(){return held(active?'ONE_SOURCE_TEST_IN_PROGRESS':'COORDINATOR_IDLE',{
      attemptedCount:spent.size,activeCount:active?1:0});}
  });
}
