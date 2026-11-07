import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyQl364DistributedSourceHandlers,QL364_HANDLER_PATHS}
  from './ql364-distributed-source-health.mjs';
import {SOURCES} from '../master-discovery/manifest.mjs';

test('QL364 refuses unsigned or missing distributed handler inventory',async()=>{
  const result=await verifyQl364DistributedSourceHandlers({artifacts:[]});
  assert.equal(result.connected,false);
  assert.equal(result.state,'HOLD_SIX_SOURCE_OWNED_HANDLER_ATTESTATIONS_REQUIRED');
});
test('QL364 every source must match its canonical immutable repository and route',async()=>{
  const artifacts=Object.entries(SOURCES).map(([sourceId,s])=>({
    sourceId,repository:`RosevearCreations/${s.repo}`,
    handlerPath:QL364_HANDLER_PATHS[sourceId],
    path:'/api/integration/v1/shell/health',method:'GET',
    contractSchema:'rosevear.hub.ql363.six-source-health-contract.v1',
    receiptSchema:'rosevear.hub.ql363.source-signed-health-receipt.v1',
    sourceCommitSha:'a'.repeat(40),handlerSha256:'b'.repeat(64),
    originalOwnerTestAuthorized:false,connectionState:'DISCONNECTED / HOLD'}));
  const read=async()=>({repository:'wrong-repo'});
  const result=await verifyQl364DistributedSourceHandlers({
    artifacts,verifySourceRevision:read});
  assert.equal(result.connected,false);
  assert.equal(result.state,'HOLD_INDEPENDENT_GITHUB_SOURCE_HANDLER_READBACK_MISSING');
  const bad=structuredClone(artifacts);
  bad[0].repository='RosevearCreations/other';
  const denied=await verifyQl364DistributedSourceHandlers({
    artifacts:bad,verifySourceRevision:read});
  assert.match(denied.state,/DENY_HANDLER_SOURCE_REVISION/);
});
