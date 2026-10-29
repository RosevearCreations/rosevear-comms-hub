import test from 'node:test';
import assert from 'node:assert/strict';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { inspectQl249GithubOrigins } from '../ql249-public-github-origin-retest.mjs';
import { inspectQl254ReversiblePrivateRelay }
  from '../ql254-proof-followup-witness-relay.mjs';
import { QL255_RESPONSES,inspectQl255SixAppResponseDispositions,
  inspectQl255PrivateCustodyClosureRequest,inspectQl255MiniServerTestPreparation }
  from '../ql255-response-disposition-owner-relay.mjs';

const NOW=Date.UTC(2026,9,29,14,15);
const A='a'.repeat(40), B='b'.repeat(40);
const source=()=>({system:'yw',repository:'yw',sourceSha:A,mainSha:B,
  status:'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD'});
const publicRows=status=>QL247_SOURCES.map(s=>({...s,mainSha:B,
  sourceSha:null,proofRawSha256:null,status}));
const witnessed=()=>({status:'PRIVATE_REGISTRY_WITNESS_SIGNATURE_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD'});
const TRUSTED_TENANT='np-yard-test-tenant';
const custody=()=>({schemaVersion:'rosevear.ql255.private-custody-review.v1',
  system:'yw',repository:'yw',businessId:'yw',tenantId:'np-yard-test-tenant',
  sourceSha:A,proofSha:B,registrySnapshotSha256:'c'.repeat(64),
  presentedSignerSpkiSha256:'d'.repeat(64),registryReceiptId:'np-registry-ql255',
  custodyReceiptId:'np-custody-ql255',witnessReceiptId:'np-witness-ql255',
  witnessAlias:'independent_witness',independentVerifierAlias:'second_assessor',
  privateReviewRequestId:'np-review-ql255',
  reviewOutcome:'REQUEST_INDEPENDENT_PRIVATE_CUSTODY_REVIEW_ONLY',claimedAtMs:NOW-1000});
const relay=()=>({schemaVersion:'rosevear.ql254.private-relay-rehearsal.v1',
  role:'ROSEVEAR_AI_HUB_PRIVATE_RELAY_CANDIDATE',transport:'TAILSCALE_OR_PRIVATE_LAN',
  serviceEnabled:false,publicInbound:false,outboundOnly:true,restrictToGatewayApi:true,
  tenantIsolation:true,vaultAndCameraAccess:false,secretsInRepository:false,
  credentialExchangeEnabled:false,ownerTestAuthorized:false,ownerPilotAuthorized:false,
  stopProcedureRecorded:true,restoreProcedureRecorded:true,watchdogIntervalSeconds:60,
  rehearsalId:'np-relay-ql255'});
const events=()=>['BASELINE_DISABLED','SIMULATED_ENABLE','SIMULATED_STOP',
  'ROLLED_BACK_DISABLED'].map((step,i)=>({step,atMs:NOW-4000+i*1000,serviceActuallyStarted:false}));
const testRequest=()=>({schemaVersion:'rosevear.ql255.mini-server-test-preparation.v1',
  system:'yw',repository:'yw',businessId:'yw',tenantId:'np-yard-test-tenant',
  sourceSha:A,proofSha:B,privateReviewRequestId:'np-review-ql255',
  environment:'nonproduction',methods:['GET'],
  paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
  startUtc:new Date(NOW+60000).toISOString(),endUtc:new Date(NOW+120000).toISOString(),
  ownerTestDecision:'REQUEST_PRIVATE_OWNER_TEST_REVIEW_ONLY',ownerTestReceiptId:'NOT_AVAILABLE',
  relayRole:'ROSEVEAR_AI_HUB_PRIVATE_RELAY_CANDIDATE',relayEnabled:false,
  publicInbound:false,secretsInRepository:false,vaultOrCameraAccess:false,
  dedicatedServiceAccountPlanned:true,stopAndRollbackDocumented:true,ownerPilotEnabled:false});

test('QL255 six source reports are claims; independent 404s hold every integration',()=>{
  const result=inspectQl255SixAppResponseDispositions(publicRows('MISSING_PUBLIC_PROOF_AT_MAIN'));
  assert.equal(result.queue.length,6);
  assert.equal(result.stillPublic404,6);
  assert.equal(result.originalPublicProofAndExactCi,0);
  assert.ok(result.queue.every(x=>x.publicProof==='PUBLIC_IMMUTABLE_PROOF_404_HELD' &&
    x.connection==='DISCONNECTED' && x.ownerDecision==='NOT_GIVEN'));
  assert.equal(result.queue[4].report,'SOURCE_BUILD_VALIDATION_IN_PROGRESS');
  assert.equal(result.queue[5].report,'SOFTWARE_RELEASE_COMPLETE_INTEGRATION_HELD');
  assert.equal(result.livePilotHolds,12);
  assert.equal(result.actualGatewayGets,0);
  assert.equal(QL255_RESPONSES.length,6);
});

test('QL255 no-network never fabricates 404, malformed or shifted sources fail closed',async()=>{
  const noFetch=await inspectQl249GithubOrigins();
  const none=inspectQl255SixAppResponseDispositions(noFetch.rows);
  assert.equal(none.stillPublic404,0);
  assert.ok(none.queue.every(x=>x.publicProof==='NOT_RECHECKED_NO_NETWORK_HELD'));
  const incomplete=publicRows('MISSING_PUBLIC_PROOF_AT_MAIN').slice(1);
  assert.equal(inspectQl255SixAppResponseDispositions(incomplete).status,'DENIED_SIX_APP_RESPONSE_SCOPE');
  const badClaims=structuredClone(QL255_RESPONSES);badClaims[4].repository='not-icamp';
  assert.equal(inspectQl255SixAppResponseDispositions(publicRows('MISSING_PUBLIC_PROOF_AT_MAIN'),
    badClaims).status,'DENIED_SIX_APP_RESPONSE_SCOPE');
});

test('QL255 verified-looking private custody record is still merely a closure review request',()=>{
  const result=inspectQl255PrivateCustodyClosureRequest(source(),witnessed(),custody(),
    {now:NOW,expectedTenantId:TRUSTED_TENANT});
  assert.equal(result.status,'PRIVATE_CUSTODY_CLOSURE_REVIEW_REQUEST_ONLY_HELD');
  assert.equal(result.trustedSigners,0);
  assert.equal(result.independentlyAuthenticatedWitnesses,0);
  assert.equal(result.ownerTestAuthorization,'NOT_GIVEN');
});

test('QL255 custody closure rejects cross tenant, forged closure, same reviewer, replayed IDs and expired evidence',()=>{
  for(const mutate of [
    p=>{p.tenantId='np-foreign-tenant';},
    p=>{p.sourceSha='f'.repeat(40);},
    p=>{p.reviewOutcome='INDEPENDENTLY_CLOSED';},
    p=>{p.independentVerifierAlias=p.witnessAlias;},
    p=>{p.registryReceiptId=p.witnessReceiptId;},
    p=>{p.claimedAtMs=NOW-301000;},
    p=>{p.privateKey='never';}
  ]){
    const p=custody();mutate(p);
    assert.notEqual(inspectQl255PrivateCustodyClosureRequest(source(),witnessed(),p,
      {now:NOW,expectedTenantId:TRUSTED_TENANT}).status,
      'PRIVATE_CUSTODY_CLOSURE_REVIEW_REQUEST_ONLY_HELD');
  }
  assert.equal(inspectQl255PrivateCustodyClosureRequest(source(),null,custody(),
    {now:NOW,expectedTenantId:TRUSTED_TENANT}).status,
    'DENIED_CUSTODY_CLOSURE_UNTRUSTED_WITNESS');
});

test('QL255 bounded GET and mini-server owner review preparation never enables a gateway',()=>{
  const c=inspectQl255PrivateCustodyClosureRequest(source(),witnessed(),custody(),
    {now:NOW,expectedTenantId:TRUSTED_TENANT});
  const r=inspectQl254ReversiblePrivateRelay(relay(),events(),{now:NOW});
  const out=inspectQl255MiniServerTestPreparation(source(),c,r,testRequest(),{now:NOW});
  assert.equal(out.status,'OWNER_TEST_ONLY_PRIVATE_DECISION_REQUEST_PREPARED_HELD');
  assert.equal(out.authenticatedOwnerTests,0);
  assert.equal(out.scheduledGatewayGets,0);
  assert.equal(out.privateRelayEnabled,false);
  assert.equal(out.ownerPilotAuthorization,'NOT_GIVEN');
});

test('QL255 rejects forged owner approval, live relay, private paths and long or stale windows',()=>{
  const c=inspectQl255PrivateCustodyClosureRequest(source(),witnessed(),custody(),
    {now:NOW,expectedTenantId:TRUSTED_TENANT});
  const r=inspectQl254ReversiblePrivateRelay(relay(),events(),{now:NOW});
  for(const mutate of [
    p=>{p.ownerTestDecision='APPROVED_TEST_ONLY';},
    p=>{p.ownerTestReceiptId='np-fake-approval';},
    p=>{p.methods=['POST'];},
    p=>{p.paths=['/api/private/vault'];},
    p=>{p.endUtc=new Date(NOW+3600000).toISOString();},
    p=>{p.startUtc=new Date(NOW-1000).toISOString();},
    p=>{p.relayEnabled=true;},
    p=>{p.publicInbound=true;},
    p=>{p.vaultOrCameraAccess=true;},
    p=>{p.ownerPilotEnabled=true;},
    p=>{p.tenantId='np-foreign-tenant';},
    p=>{p.secret='should-not-be-here';}
  ]){
    const p=testRequest();mutate(p);
    assert.notEqual(inspectQl255MiniServerTestPreparation(source(),c,r,p,{now:NOW}).status,
      'OWNER_TEST_ONLY_PRIVATE_DECISION_REQUEST_PREPARED_HELD');
  }
  assert.equal(inspectQl255MiniServerTestPreparation(source(),null,r,testRequest(),{now:NOW}).status,
    'UPSTREAM_CUSTODY_OR_REVERSIBLE_RELAY_NOT_PREPARED_HELD');
});
