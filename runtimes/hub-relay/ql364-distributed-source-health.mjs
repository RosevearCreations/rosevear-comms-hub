/** QL-364 cross-repository source handler and independently signed contract gate.
 * A GitHub source file, template, or test signature is never an owner grant.
 */
import {createHash} from 'node:crypto';
import {SOURCES} from '../master-discovery/manifest.mjs';
import {certifyQl363SixSourceCompatibility,QL363_PATH,QL363_SCHEMA,
  QL363_RECEIPT_SCHEMA} from './ql363-six-source-health-adapters.mjs';

export const QL364_SCHEMA='rosevear.hub.ql364.distributed-source-health.v1';
export const QL364_HANDLER_PATHS=Object.freeze({
  yw:'server/ql364-source-health.mjs',
  icamp:'lib/integration-v1/ql364-source-health.mjs',
  rosiedazzlers:'functions/api/_lib/ql364-source-health.mjs',
  devilndove:'functions/api/_lib/ql364-source-health.mjs',
  'ai-data-platform':'apps/web/lib/ql364-source-health.mjs',
  'rosevear-ai-hub':'server/src/rosevear_ai_hub/api/ql364_source_health.py'
});
const SHA=/^[a-f0-9]{64}$/,COMMIT=/^[a-f0-9]{40}$/;
const held=(state,extra={})=>({schema:QL364_SCHEMA,state,
  connected:false,connectionState:'DISCONNECTED / HOLD',
  approvedSourceGets:0,customerDataAllowed:false,
  customerCommunications:false,deviceActions:false,
  sourceRepositoryWrites:0,...extra});
const hex=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Each source controls its own immutable implementation and signing key.
 * verifySourceRevision MUST independently read the repository at the pinned
 * SHA (not trust caller-provided content, HEAD, or a mutable URL).
 */
export async function verifyQl364DistributedSourceHandlers({artifacts,contracts,
  peerRows,verifySourceRevision,resolvePinnedSigner,verifySignerCustody,
  now=Date.now()}={}){
  try{
    if(!Array.isArray(artifacts)||artifacts.length!==6||
      typeof verifySourceRevision!=='function')
      return held('HOLD_SIX_SOURCE_OWNED_HANDLER_ATTESTATIONS_REQUIRED');
    const seen=new Set(),handlerResults=[];
    for(const artifact of artifacts){
      const id=artifact?.sourceId,s=SOURCES[id];
      if(!s||seen.has(id)||artifact.repository!==`RosevearCreations/${s.repo}`||
        artifact.handlerPath!==QL364_HANDLER_PATHS[id]||
        artifact.path!==QL363_PATH||artifact.method!=='GET'||
        artifact.contractSchema!==QL363_SCHEMA||
        artifact.receiptSchema!==QL363_RECEIPT_SCHEMA||
        !COMMIT.test(artifact.sourceCommitSha??'')||
        !SHA.test(artifact.handlerSha256??'')||
        artifact.originalOwnerTestAuthorized!==false||
        artifact.connectionState!=='DISCONNECTED / HOLD')
        return held('DENY_HANDLER_SOURCE_REVISION_OR_SCOPE_MISMATCH',{blockedSourceId:id});
      seen.add(id);
      const proof=await verifySourceRevision({repository:artifact.repository,
        sourceCommitSha:artifact.sourceCommitSha,path:artifact.handlerPath});
      if(proof?.repository!==artifact.repository||
        proof.sourceCommitSha!==artifact.sourceCommitSha||
        proof.path!==artifact.handlerPath||
        typeof proof.rawSource!=='string'||
        hex(proof.rawSource)!==artifact.handlerSha256)
        return held('HOLD_INDEPENDENT_GITHUB_SOURCE_HANDLER_READBACK_MISSING',{
          blockedSourceId:id});
      handlerResults.push({sourceId:id,sourceCommitSha:artifact.sourceCommitSha,
        handlerSha256:artifact.handlerSha256});
    }
    const certificates=await certifyQl363SixSourceCompatibility({
      records:contracts,peerRows,resolvePinnedSigner,verifySignerCustody,now});
    if(certificates.compatibleCount!==6)
      return held('HOLD_SOURCE_SIGNED_CONTRACTS_NOT_AUTHENTICATED',{
        contractReason:certificates.state,handlersVerified:6});
    for(const item of contracts){
      if(!handlerResults.some(h=>h.sourceId===item.sourceId&&
        h.sourceCommitSha===item.commitSha))
        return held('DENY_SIGNED_CONTRACT_POINTS_TO_DIFFERENT_SOURCE_REVISION');
    }
    return held('SIX_SOURCE_HANDLERS_AND_SIGNED_CONTRACTS_VERIFIED_TEST_STILL_HELD',{
      handlersVerified:6,contractsVerified:6,
      independentlyAuthenticatedOriginalOwnerTest:false,
      sourceOnlyGetExecutionAllowed:false,customerDataAllowed:false,
      verifiedHandlers:handlerResults.sort((a,b)=>a.sourceId.localeCompare(b.sourceId))});
  }catch{return held('HOLD_DISTRIBUTED_SOURCE_HANDLER_AUDIT_UNAVAILABLE');}
}
