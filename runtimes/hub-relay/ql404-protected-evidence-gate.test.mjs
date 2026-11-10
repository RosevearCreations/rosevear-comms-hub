import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {QL404_SCHEMA,QL404_REVIEW_SCHEMA,QL404_APPROVAL_SCHEMA,
  QL404_GATES,QL404_MAX_ORIGINAL_BYTES,ql404SigningBytes,createQl404ProtectedReview}
  from './ql404-protected-evidence-gate.mjs';

const now=Date.parse('2026-11-09T18:00:00Z');
const hash=data=>createHash('sha256').update(data).digest('hex');
const roleKeys=Object.fromEntries(['sourceOwner','independentReviewer','masterOwner'].map(role=>{
  const keys=generateKeyPairSync('ed25519');
  const publicKeyPem=keys.publicKey.export({type:'spki',format:'pem'});
  return [role,{...keys,pin:{keyId:`ql404-${role}-test`,publicKeyPem,
    spkiSha256:hash(keys.publicKey.export({type:'spki',format:'der'}))}}];
}));
const pins=Object.fromEntries(Object.entries(roleKeys).map(([role,key])=>[role,key.pin]));
const signPayload=(role,payload,keyRole)=>({payload,keyId:pins[keyRole].keyId,
  signature:sign(null,ql404SigningBytes(role,payload),roleKeys[keyRole].privateKey).toString('base64url')});
const originalBytesByGate=Object.fromEntries(QL404_GATES.map((gate,i)=>
  [gate,Buffer.from(`Independent original TEST-only artifact ${i} for ${gate}`)]));

function validPacket(){
  const payload={schema:QL404_SCHEMA,sourceId:'yw',sourceRevision:'a'.repeat(40),
    caseId:'case-ql404-0001',assignmentId:'assignment-ql400-0001',
    correlationId:'correlation-ql392-workshop',purpose:'original-evidence-review',
    environment:'TEST',issuedAt:new Date(now-30_000).toISOString(),
    expiresAt:new Date(now+270_000).toISOString(),nonce:'b'.repeat(32),
    evidence:QL404_GATES.map(gate=>({gate,
      originalSha256:hash(originalBytesByGate[gate]),
      opaqueReference:`original-ql404-${gate.toLowerCase()}`}))};
  const sourcePacket=signPayload('SOURCE_OWNER',payload,'sourceOwner');
  const packetSha256=hash(ql404SigningBytes('SOURCE_OWNER',payload));
  const reviewPayload={schema:QL404_REVIEW_SCHEMA,sourceId:payload.sourceId,
    caseId:payload.caseId,packetSha256,sourceSignatureSha256:hash(sourcePacket.signature),
    disposition:'ACCEPT_ORIGINALS',reasonCode:'ORIGINALS_MATCHED_AND_WITNESSED',
    reviewedAt:new Date(now-20_000).toISOString(),nonce:payload.nonce};
  const independentReview=signPayload('INDEPENDENT_REVIEWER',reviewPayload,'independentReviewer');
  const approvalPayload={schema:QL404_APPROVAL_SCHEMA,sourceId:payload.sourceId,
    caseId:payload.caseId,packetSha256,
    reviewSha256:hash(ql404SigningBytes('INDEPENDENT_REVIEWER',reviewPayload)),
    decision:'APPROVE_PROTECTED_REVIEW_ONLY',approvedAt:new Date(now-10_000).toISOString(),
    expiresAt:payload.expiresAt,nonce:payload.nonce};
  const masterDecision=signPayload('MASTER_OWNER',approvalPayload,'masterOwner');
  return {sourcePacket,independentReview,masterDecision,originalBytesByGate};
}

test('QL-404 verifies original bytes and three independent signed roles without connecting',()=>{
  const gate=createQl404ProtectedReview({trustedPins:pins,now:()=>now});
  assert.equal(gate.inspect().state,'PROTECTED_REVIEW_CONFIGURED_NO_CONNECTION');
  const result=gate.verify(validPacket());
  assert.equal(result.state,'SIGNED_ORIGINAL_REVIEW_VERIFIED_CONNECTION_STILL_HELD');
  assert.equal(result.originalEvidenceVerified,true);
  assert.equal(result.independentReviewerVerified,true);
  assert.equal(result.sourceOwnerSigned,true);
  assert.equal(result.masterOwnerSigned,true);
  assert.equal(result.authorizedTest,false);
  assert.equal(result.connected,false);
  assert.equal(result.receiverActivated,false);
  assert.equal(result.registryWrites,0);
  assert.equal(result.persisted,false);
  assert.equal(result.communicationsSent,0);
  assert.equal(gate.verify(validPacket()).state,'DENY_REPLAYED_OWNER_REVIEW');
});

test('QL-404 denies missing configuration, spoofed trusted key and self-reviewer',()=>{
  assert.equal(createQl404ProtectedReview().verify(validPacket()).state,
    'HOLD_INDEPENDENT_TRUSTED_KEY_PINS_REQUIRED');
  assert.equal(createQl404ProtectedReview({trustedPins:{...pins,
    sourceOwner:{...pins.sourceOwner,spkiSha256:'0'.repeat(64)}}}).verify(validPacket()).state,
    'HOLD_INDEPENDENT_TRUSTED_KEY_PINS_REQUIRED');
  assert.equal(createQl404ProtectedReview({trustedPins:{...pins,
    independentReviewer:pins.sourceOwner}}).verify(validPacket()).state,
    'HOLD_INDEPENDENT_TRUSTED_KEY_PINS_REQUIRED');
});

test('QL-404 rejects changed signatures, unknown source and altered evidence',()=>{
  const good=validPacket();
  for(const altered of [
    {...good,sourcePacket:{...good.sourcePacket,signature:'x'.repeat(86)}},
    {...good,sourcePacket:{...good.sourcePacket,payload:{...good.sourcePacket.payload,sourceId:'tenant-camp-rosevear'}}},
    {...good,independentReview:{...good.independentReview,signature:'x'.repeat(86)}},
    {...good,masterDecision:{...good.masterDecision,signature:'x'.repeat(86)}},
    {...good,originalBytesByGate:{...good.originalBytesByGate,SOURCE_PIN:Buffer.from('replacement')}}
  ]){
    const result=createQl404ProtectedReview({trustedPins:pins,now:()=>now}).verify(altered);
    assert.equal(result.connected,false);
    assert.equal(result.originalEvidenceVerified,false);
    assert.match(result.state,/^(DENY|HOLD)/);
  }
  assert.equal(createQl404ProtectedReview({trustedPins:pins,now:()=>now}).verify({
    ...good,originalBytesByGate:{...good.originalBytesByGate,
      CONSENT:Buffer.alloc(QL404_MAX_ORIGINAL_BYTES+1)}}).state,
  'DENY_ORIGINAL_ARTIFACT_HASH_OR_BOUNDS');
});

test('QL-404 denies reviewer rejection, changed master decision, forged source bindings',()=>{
  const good=validPacket();
  const reviewRejected={...good.independentReview,payload:{...good.independentReview.payload,
    disposition:'REJECT'}};
  const signedRejection=signPayload('INDEPENDENT_REVIEWER',reviewRejected.payload,'independentReviewer');
  assert.equal(createQl404ProtectedReview({trustedPins:pins,now:()=>now}).verify({
    ...good,independentReview:signedRejection}).state,
  'HOLD_INDEPENDENT_REVIEWER_OR_ORIGINAL_DISPOSITION');
  const decisionRejected={...good.masterDecision.payload,decision:'APPROVE_LIVE_CONNECTION'};
  assert.equal(createQl404ProtectedReview({trustedPins:pins,now:()=>now}).verify({
    ...good,masterDecision:signPayload('MASTER_OWNER',decisionRejected,'masterOwner')}).state,
  'HOLD_MASTER_OWNER_SCOPE_OR_DISPOSITION');
  const sourceBad={...good.sourcePacket.payload,sourceId:'unknown-source'};
  assert.equal(createQl404ProtectedReview({trustedPins:pins,now:()=>now}).verify({
    ...good,sourcePacket:signPayload('SOURCE_OWNER',sourceBad,'sourceOwner')}).state,
  'DENY_SOURCE_SCOPE_OR_EXPIRED_REVIEW_PACKET');
});

test('QL-404 denies expired packets and missing original independent gates',()=>{
  const good=validPacket();
  assert.equal(createQl404ProtectedReview({trustedPins:pins,now:()=>now+300_000})
    .verify(good).state,'DENY_SOURCE_SCOPE_OR_EXPIRED_REVIEW_PACKET');
  const less={...good.originalBytesByGate};delete less.CONSENT;
  assert.equal(createQl404ProtectedReview({trustedPins:pins,now:()=>now}).verify({
    ...good,originalBytesByGate:less}).state,'HOLD_FIVE_SOURCE_BOUND_ORIGINAL_ARTIFACTS_REQUIRED');
});
