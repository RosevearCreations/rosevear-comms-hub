import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {SOURCES,canonicalize,payloadForSigning} from '../master-discovery/manifest.mjs';
import {QL362_SCHEMA,QL362_HEALTH_SCHEMA} from './ql362-source-owner-first-get.mjs';
import {QL363_SCHEMA,QL363_RECEIPT_SCHEMA,QL363_ENVELOPE_SCHEMA,
  QL363_CLOSURE_SCHEMA,QL363_PATH,verifyQl363SourceHealthContract,
  certifyQl363SixSourceCompatibility,createQl363SourceSignedReadOnlyAdapter,
  verifyQl363IndependentClosure,ql363Cli}
  from './ql363-six-source-health-adapters.mjs';

const t=Date.parse('2026-11-07T06:00:00.000Z');
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const spki=key=>createHash('sha256').update(key.publicKey.export({type:'spki',format:'der'})).digest('hex');
const signBody=(payload,key)=>sign(null,Buffer.from(canonicalize(payload)),key.privateKey).toString('base64url');
const signed=(schema,payload,key,keyId)=>({schema,payload,keyId,
  signature:signBody(payload,key)});
const fixture=JSON.parse(readFileSync(new URL('../master-discovery/fixture.json',import.meta.url)));
const sourceKeys=Object.fromEntries(Object.keys(SOURCES).map(id=>[id,{
  manifest:generateKeyPairSync('ed25519'),signer:generateKeyPairSync('ed25519')}]));
const closureKey=generateKeyPairSync('ed25519');
const operationId='d84b917e-671e-48b2-a5dd-673b4645a80a';
const peerRows=Object.entries(SOURCES).map(([id,s])=>({peer_id:id,
  peer_kind:['yw','icamp','rosiedazzlers','devilndove'].includes(id)?'business':'support',
  source_repo:s.repo,connection_state:'HOLD',source_test_authorized:false,
  customer_data_allowed:false}));
const makeRecord=id=>{
  const s=SOURCES[id],key=sourceKeys[id],commitSha='a'.repeat(40);
  const manifest={...structuredClone(fixture),source_id:id,
    source_app_id:s.app,source_role:s.role,
    repository:`RosevearCreations/${s.repo}`,
    source_revision:commitSha,issuer:s.app,
    tenant_boundary:s.boundary,
    legacy_integration_v1:{...fixture.legacy_integration_v1,app_id:s.app},
    signature:{algorithm:'Ed25519',key_id:`manifest-${id}-ql363`,
      value:'',state:'SIGNED'}};
  manifest.signature.value=sign(null,payloadForSigning(manifest),
    key.manifest.privateKey).toString('base64url');
  const manifestTrustPin={sourceId:id,issuer:s.app,
    keyId:`manifest-${id}-ql363`,
    publicKeyPem:key.manifest.publicKey.export({type:'spki',format:'pem'}),
    independentlyVerified:true,approvedSourceOwner:true,originalProofB:true};
  const payload={schema:QL363_SCHEMA,sourceId:id,sourceAppId:s.app,
    repository:`RosevearCreations/${s.repo}`,tenantBoundary:s.boundary,
    sourceCommitSha:commitSha,manifestSha256:sha(manifest),
    sourceOrigin:`https://${id}.private.example.invalid`,
    environment:'TEST',method:'GET',path:QL363_PATH,
    responseSchema:QL362_HEALTH_SCHEMA,receiptSchema:QL363_RECEIPT_SCHEMA,
    scope:'HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES',redirects:'DENY',
    maxResponseBytes:4096,persistentConnectionAllowed:false,
    issuedAt:new Date(t).toISOString(),expiresAt:new Date(t+60_000).toISOString()};
  return {sourceId:id,commitSha,manifest,manifestTrustPin,
    tlsSpkiSha256:'e'.repeat(64),
    contract:signed(QL363_SCHEMA,payload,key.signer,`health-${id}-ql363`)};
};
const records=Object.keys(SOURCES).map(makeRecord);
const byId=id=>records.find(r=>r.sourceId===id);
const resolvePinnedSigner=async id=>({role:'source_signer',sourceId:id,
  repository:`RosevearCreations/${SOURCES[id].repo}`,keyId:`health-${id}-ql363`,
  publicKeyPem:sourceKeys[id].signer.publicKey.export({type:'spki',format:'pem'}),
  spkiSha256:spki(sourceKeys[id].signer),revoked:false});
const verifySignerCustody=async args=>({
  state:'INDEPENDENT_ORIGINAL_SOURCE_SIGNER_AUTHENTICATED',
  ...args,revoked:false});
const body={schema:QL362_HEALTH_SCHEMA,sourceId:'yw',operationId,
  health:'ok',connected:false,customerDataAllowed:false,deviceActions:false};
const intent={schema:QL362_SCHEMA,sourceId:'yw',operationId,
  sourceCommitSha:byId('yw').commitSha,
  sourceOrigin:byId('yw').contract.payload.sourceOrigin,
  manifestSha256:sha(byId('yw').manifest),
  issuedAt:new Date(t).toISOString(),expiresAt:new Date(t+90_000).toISOString(),
  environment:'TEST',method:'GET',path:QL363_PATH,
  customerDataAllowed:false,deviceActionsAllowed:false,
  persistentConnectionAllowed:false};
const requestSha256=sha(intent);
const receiptPayload={schema:QL363_RECEIPT_SCHEMA,sourceId:'yw',operationId,
  requestSha256,receiptSha256:sha(body),sourceCommitSha:intent.sourceCommitSha,
  sourceOrigin:intent.sourceOrigin,environment:'TEST',method:'GET',path:QL363_PATH,
  scope:'HEALTH_METADATA_ONLY_NO_CUSTOMERS_OR_DEVICES',
  issuedAt:new Date(t).toISOString(),expiresAt:new Date(t+90_000).toISOString()};
const receipt=signed(QL363_RECEIPT_SCHEMA,receiptPayload,
  sourceKeys.yw.signer,'health-yw-ql363');
const responseEnvelope={schema:QL363_ENVELOPE_SCHEMA,health:body,receipt};

function setup(overrides={}){
  const counters={gets:0,tls:0,privateChecks:0};
  const opts={record:byId('yw'),now:()=>t+1000,
    resolvePinnedSigner,verifySignerCustody,
    assertOriginalPrivateExecution:async()=>{
      counters.privateChecks++;return {
        state:'QL362_ORIGINAL_REE_PRIVATE_APPROVED_SINGLE_GET',
        originalComputer:'DESKTOP-AE894KC',receiverStopped:true,requestSha256};},
    privatePinnedHttpsGet:async req=>{
      counters.gets++;const rawText=JSON.stringify(responseEnvelope);
      return {url:req.url,method:'GET',status:200,redirected:false,
        byteLength:Buffer.byteLength(rawText),rawText,
        contentType:'application/json',tlsSpkiSha256:'e'.repeat(64),
        privateTlsEvidence:{synthetic:true}};},
    verifyTransportAttestation:async ({sourceId,operationId:op,requestSha256:digest,
      expectedTlsSpkiSha256})=>{counters.tls++;return {
      state:'INDEPENDENT_ORIGINAL_PINNED_TLS_GET_VERIFIED',
      sourceId,operationId:op,requestSha256:digest,
      tlsSpkiSha256:expectedTlsSpkiSha256};},...overrides};
  return {adapter:createQl363SourceSignedReadOnlyAdapter(opts),counters};
}

test('QL-363 verifies six independently source-signed health contracts while all connections stay HOLD',async()=>{
  const result=await certifyQl363SixSourceCompatibility({records,peerRows,
    resolvePinnedSigner,verifySignerCustody,now:t+1000});
  assert.equal(result.compatibleCount,6,result.state);
  assert.equal(result.connectionState,'DISCONNECTED / HOLD');
  assert.equal(result.privateNetworkRequests,0);
  assert.equal(result.databaseWrites,0);
  assert.deepEqual(result.compatibility.map(c=>c.sourceId),Object.keys(SOURCES).sort());
  assert.equal(ql363Cli(['--help']).httpGets,0);
  assert.throws(()=>ql363Cli(['--connect','yw']),/DENY_UNSUPERVISED/);
});

test('QL-363 denies unsigned, forged, expired or cross-source contracts before any peer probe',async()=>{
  const bad=records.map(r=>r.sourceId==='yw'?{...r,contract:{...r.contract,
    payload:{...r.contract.payload,path:'/customers'}}}:r);
  assert.match((await certifyQl363SixSourceCompatibility({records:bad,
    peerRows,resolvePinnedSigner,verifySignerCustody,now:t+1000})).state,/UNVERIFIED/);
  const unsigned=await verifyQl363SourceHealthContract({
    record:{...byId('yw'),contract:{...byId('yw').contract,signature:'A'.repeat(86)}},
    peer:{peerId:'yw',repository:'yw'},resolvePinnedSigner,verifySignerCustody,now:t+1000});
  assert.match(unsigned.state,/SIGNER_NOT_PINNED/);
  const stale=await verifyQl363SourceHealthContract({record:byId('yw'),
    peer:{peerId:'yw',repository:'yw'},resolvePinnedSigner,verifySignerCustody,
    now:t+61_000});
  assert.match(stale.state,/INCOMPATIBLE/);
  const repeated=await certifyQl363SixSourceCompatibility({records:[...records.slice(0,5),records[0]],
    peerRows,resolvePinnedSigner,verifySignerCustody,now:t+1000});
  assert.match(repeated.state,/DUPLICATED/);
  const compromised=await certifyQl363SixSourceCompatibility({records,peerRows,
    resolvePinnedSigner,verifySignerCustody:async()=>({revoked:true}),now:t+1000});
  assert.match(compromised.state,/UNVERIFIED/);
});

test('QL-363 one approved private GET verifies source-signed envelope and binds QL-362 receipt',async()=>{
  const x=setup();const response=await x.adapter.sendSignedGet({request:intent,requestSha256});
  assert.equal(response.httpStatus,200);
  assert.deepEqual(response.body,body);
  const verified=await x.adapter.verifySignedSourceReceipt({request:intent,response,
    requestSha256,receiptSha256:sha(response.body),
    pinnedSource:{sourceId:'yw',commitSha:intent.sourceCommitSha}});
  assert.equal(verified.state,'INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED');
  assert.equal(verified.connected,false);
  assert.equal(verified.sourceSignerSpkiSha256,spki(sourceKeys.yw.signer));
  assert.equal(x.counters.gets,1);
  assert.equal(x.counters.tls,1);
  assert.match(await x.adapter.sendSignedGet({request:intent,requestSha256}).catch(e=>e.message),/REPLAY/);
  assert.equal(x.counters.gets,1);
});

test('QL-363 blocks missing original owner, TLS pin mismatch and redirect without accepting receipt',async()=>{
  const missing=setup({assertOriginalPrivateExecution:async()=>({state:'UNAUTHENTICATED'})});
  await assert.rejects(missing.adapter.sendSignedGet({request:intent,requestSha256}),/OFFLINE_APPROVAL/);
  assert.equal(missing.counters.gets,0);
  const badTls=setup({privatePinnedHttpsGet:async req=>({url:req.url,method:'GET',status:200,
    redirected:false,byteLength:100,rawText:'{}',contentType:'application/json',
    tlsSpkiSha256:'b'.repeat(64)})});
  await assert.rejects(badTls.adapter.sendSignedGet({request:intent,requestSha256}),/TRANSPORT_RESPONSE/);
  const redirect=setup({privatePinnedHttpsGet:async req=>({url:req.url,method:'GET',status:302,
    redirected:true,byteLength:100,rawText:'{}',contentType:'application/json',
    tlsSpkiSha256:'e'.repeat(64)})});
  await assert.rejects(redirect.adapter.sendSignedGet({request:intent,requestSha256}),/TRANSPORT_RESPONSE/);
});

test('QL-363 refuses unexpected customer fields and counterfeit source receipt, one GET only',async()=>{
  const leaked={...responseEnvelope,health:{...body,customerEmail:'test@example.invalid'}};
  const bad=setup({privatePinnedHttpsGet:async req=>{
    const rawText=JSON.stringify(leaked);
    return {url:req.url,method:'GET',status:200,redirected:false,
      byteLength:Buffer.byteLength(rawText),rawText,contentType:'application/json',
      tlsSpkiSha256:'e'.repeat(64)};}});
  await assert.rejects(bad.adapter.sendSignedGet({request:intent,requestSha256}),/UNEXPECTED_RESPONSE_FIELDS/);
  const forged=setup({privatePinnedHttpsGet:async req=>{
    const rawText=JSON.stringify({...responseEnvelope,receipt:{...receipt,
      signature:'A'.repeat(86)}});
    return {url:req.url,method:'GET',status:200,redirected:false,
      byteLength:Buffer.byteLength(rawText),rawText,contentType:'application/json',
      tlsSpkiSha256:'e'.repeat(64)};}});
  const response=await forged.adapter.sendSignedGet({request:intent,requestSha256});
  const verified=await forged.adapter.verifySignedSourceReceipt({request:intent,response,
    requestSha256,receiptSha256:sha(body),
    pinnedSource:{sourceId:'yw',commitSha:intent.sourceCommitSha}});
  assert.match(verified.state,/SIGNATURE|RECEIPT_INVALID/);
});

const syntheticQl362Result={schema:QL362_SCHEMA,
  state:'ONE_APPROVED_SOURCE_ONLY_HEALTH_GET_VERIFIED_SIX_APPS_STILL_HELD',
  originalArchivedTestVerified:true,sourceOwnerSignatureVerified:true,
  masterOwnerSignatureVerified:true,privateOperationClaimed:true,
  firstSourceGetVerified:true,sourceId:'yw',operationId,
  requestSha256,receiptSha256:sha(body),connected:false,
  connectionState:'DISCONNECTED / HOLD'};
const syntheticSourceReceipt={state:'INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED',
  sourceId:'yw',operationId,requestSha256,receiptSha256:sha(body),
  sourceSignerAuthenticated:true,nonproductionIsolationVerified:true,
  connected:false,connectionState:'DISCONNECTED / HOLD',
  sourceSignerSpkiSha256:spki(sourceKeys.yw.signer)};
const witness={state:'ORIGINAL_PRIVATE_IMMUTABLE_GET_WITNESS_READBACK',
  sourceId:'yw',operationId,requestSha256,receiptSha256:sha(body),
  immutableReadbackVerified:true};
const stopped={state:'ORIGINAL_REE_RECEIVER_AND_GATEWAY_OFF_AFTER_GET',
  originalComputer:'DESKTOP-AE894KC',receiverListenerCount:0,
  tailnetGatewayListenerCount:0,observedAt:t+1500};
const closurePayload={schema:QL363_CLOSURE_SCHEMA,sourceId:'yw',operationId,
  requestSha256,receiptSha256:sha(body),
  audience:'rosevear-comms-hub:independent-first-get-closure:TEST',
  decision:'FIRST_SOURCE_GET_CLOSED_SIX_APPS_STILL_HELD',peerCount:6,
  connectedCount:0,issuedAt:new Date(t).toISOString(),
  expiresAt:new Date(t+90_000).toISOString()};
const closure=signed(QL363_CLOSURE_SCHEMA,closurePayload,closureKey,'ql363-auditor');
const closureArgs={ql362Result:syntheticQl362Result,
  sourceReceipt:syntheticSourceReceipt,
  originalWitnessReadback:witness,receiverOffReadback:stopped,
  peerRows,independentlySignedClosure:closure,now:t+2000,
  readOriginalQl362ImmutableProof:async input=>({
    state:'ORIGINAL_QL362_DUAL_OWNER_SIGNED_GET_IMMUTABLE_READBACK',
    originalComputer:'DESKTOP-AE894KC',ownerOnlyAcl:true,
    sourceOwnerSignatureVerified:true,masterOwnerSignatureVerified:true,
    durableUniqueClaimVerified:true,...input}),
  resolveClosureAuditor:async()=>({role:'closure_auditor',revoked:false,
    publicKeyPem:closureKey.publicKey.export({format:'pem',type:'spki'}),
    spkiSha256:spki(closureKey),keyId:'ql363-auditor'}),
  verifyClosureAuditorCustody:async input=>({
    state:'INDEPENDENT_CLOSURE_AUDITOR_AUTHENTICATED',revoked:false,...input})};

test('QL-363 independently closes one real-format signed GET and retains six apps on HOLD',async()=>{
  const result=await verifyQl363IndependentClosure(closureArgs);
  assert.equal(result.independentClosureVerified,true,result.state);
  assert.equal(result.connected,false);
  assert.equal(result.peerCount,6);
  assert.equal(result.connectionState,'DISCONNECTED / HOLD');
});

test('QL-363 closure refuses fake QL-362 result, changed DB, absent STOP or auditor forgery',async()=>{
  const fake=await verifyQl363IndependentClosure({...closureArgs,
    ql362Result:{...syntheticQl362Result,sourceOwnerSignatureVerified:false}});
  assert.match(fake.state,/EVIDENCE_MISSING/);
  const connected=await verifyQl363IndependentClosure({...closureArgs,
    peerRows:peerRows.map(p=>p.peer_id==='yw'?{...p,connection_state:'CONNECTED'}:p)});
  assert.notEqual(connected.independentClosureVerified,true);
  const live=await verifyQl363IndependentClosure({...closureArgs,
    receiverOffReadback:{...stopped,receiverListenerCount:1}});
  assert.match(live.state,/EVIDENCE_MISSING/);
  const fakedOriginal=await verifyQl363IndependentClosure({...closureArgs,
    readOriginalQl362ImmutableProof:async()=>({state:'CLAIMED_BY_BROWSER'})});
  assert.match(fakedOriginal.state,/PROOF_NOT_RECORDED/);
  const unnamedSourceSigner=await verifyQl363IndependentClosure({...closureArgs,
    sourceReceipt:{...syntheticSourceReceipt,sourceSignerSpkiSha256:null}});
  assert.match(unnamedSourceSigner.state,/EVIDENCE_MISSING/);
  const forged=await verifyQl363IndependentClosure({...closureArgs,
    independentlySignedClosure:{...closure,signature:'A'.repeat(86)}});
  assert.match(forged.state,/SIGNATURE_INVALID/);
  const selfReview=await verifyQl363IndependentClosure({...closureArgs,
    resolveClosureAuditor:async()=>({role:'closure_auditor',revoked:false,
      spkiSha256:spki(sourceKeys.yw.signer),keyId:'ql363-auditor',
      publicKeyPem:sourceKeys.yw.signer.publicKey.export({format:'pem',type:'spki'})})});
  assert.match(selfReview.state,/SIGNATURE_INVALID/);
});
