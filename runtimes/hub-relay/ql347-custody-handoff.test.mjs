import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reconcileCustodyHandoff,ql347Cli,QL347_SCHEMA} from './ql347-custody-handoff.mjs';

const now=Date.parse('2026-11-06T15:00:00Z');
const ql346={schema:'rosevear.hub.ql346.offline-test-readiness.v1',
  state:'CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD',
  issuerSignatureCryptographicallyValid:true,devicePinMatches:true,
  sourceOwnerTestSignatureValid:true,masterOwnerTestSignatureValid:true,
  originalIssuerIndependentlyAuthenticated:false,
  originalIssuerOutOfBandCustodyApproved:false,readyForDatabaseEnrollment:false,
  receiverActivated:false,databaseEnrollmentCreated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,
  ownerRequestPayloadSha256:'a'.repeat(64),signedEnvelopeSha256:'b'.repeat(64)};
const issuerReceipt={issuerEvidenceSha256:'c'.repeat(64),custodyDecision:'HOLD',
  externalWitnessReference:'independent-review-pending',observedDeviceSpkiSha256:'d'.repeat(64),
  signedEnvelopeSha256:ql346.signedEnvelopeSha256};
const ownerDecisions=['source','master'].map(role=>({role,
  decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT',requestPayloadSha256:ql346.ownerRequestPayloadSha256,
  independentReviewReference:'owner-review-pending',observedAt:'2026-11-06T14:00:00Z'}));
const input={ql346,issuerReceipt,ownerDecisions,now};

test('reconciles distinct roles and exact request without inventing authorization',()=>{
  const result=reconcileCustodyHandoff(input);
  assert.equal(result.schema,QL347_SCHEMA);
  assert.equal(result.state,'RECONCILED_OFFLINE_HANDOFF_INDEPENDENT_AUTHORITY_HOLD');
  assert.match(result.receiptSha256,/^[a-f0-9]{64}$/);
  for(const field of ['issuerCustodyVerified','ownerEnrollmentAuthorized','receiverActivated',
    'databaseEnrollmentCreated','connected','customerCommunications','deviceActions'])
    assert.equal(result[field],false,field);
  assert.equal(result.networkRequests,0);
});

test('rejects self-certified readiness and mismatched owner/issuer evidence',()=>{
  for(const mutation of [
    {ql346:{...ql346,readyForDatabaseEnrollment:true}},
    {ql346:{...ql346,connected:true}},
    {ql346:{...ql346,sourceOwnerTestSignatureValid:false}},
    {issuerReceipt:{...issuerReceipt,signedEnvelopeSha256:'0'.repeat(64)}},
    {issuerReceipt:{...issuerReceipt,custodyDecision:'APPROVED'}},
    {ownerDecisions:[ownerDecisions[0],ownerDecisions[0]]},
    {ownerDecisions:[ownerDecisions[0],{...ownerDecisions[1],requestPayloadSha256:'0'.repeat(64)}]},
    {ownerDecisions:[ownerDecisions[0],{...ownerDecisions[1],observedAt:'2099-01-01T00:00:00Z'}]}
  ]){
    const result=reconcileCustodyHandoff({...input,...mutation});
    assert.match(result.state,/^HOLD_/);
    assert.equal(result.receipt,undefined);
  }
});

test('an explicit rejection stays rejected and no CLI activates a receiver',()=>{
  assert.equal(reconcileCustodyHandoff({...input,ownerDecisions:[ownerDecisions[0],
    {...ownerDecisions[1],decision:'REJECT'}]}).state,'REJECTED_NO_ENROLLMENT');
  assert.equal(ql347Cli(['--help']).state,'OFFLINE_READ_ONLY_QL347_GUIDE');
  for(const command of ['--activate','--enroll','--send-once'])
    assert.throws(()=>ql347Cli([command]),/DENY_QL347/);
});
