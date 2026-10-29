import test from 'node:test';
import assert from 'node:assert/strict';
import {QL256_PUBLIC_SNAPSHOT,inspectQl256SignerAndRoleDecisions,
  inspectQl256TrialSchedulingRequest,ql256CurrentHeldSnapshot}
  from '../ql256-connection-readiness.mjs';

const makeRows=()=>QL256_PUBLIC_SNAPSHOT.map(s=>({system:s.system,repository:s.repository,
  mainSha:s.mainSha,sourceASha:null,sourceCiUrl:null,
  signerDecision:'SIGNER_STATUS_UNKNOWN',proofBSha:null,proofHttpStatus:404,
  custodianAlias:null,witnessAlias:null,reviewerAlias:null}));
const now=Date.parse('2026-10-29T16:00:00Z');
const window=()=>({schemaVersion:'rosevear.ql256.owner-test-window-request.v1',
  requestId:'np-ql256-owner-window',system:'icamp',repository:'iCamp',
  environment:'nonproduction',startUtc:new Date(now+60000).toISOString(),
  endUtc:new Date(now+25*60000).toISOString(),methods:['GET'],
  paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
  ownerDecision:'NOT_GIVEN_REQUEST_PRIVATE_REVIEW',ownerReceiptId:null,
  dedicatedCredentialPlanned:true,outboundPrivateOnly:true,rollbackDocumented:true,
  relayEnabled:false,includesLiveData:false,ownerPilotEnabled:false});

test('six exact public 404 snapshots never become proof, verified signers or connected state',()=>{
  const r=ql256CurrentHeldSnapshot();
  assert.equal(r.status,'SIX_SIGNER_PROVISIONING_AND_ROLE_DECISIONS_HELD');
  assert.equal(r.actions.length,6);
  assert.equal(r.unassignedRoles,6);
  assert.equal(r.originalProofsAccepted,0);
  assert.equal(r.ownerTestAuthorization,'NOT_GIVEN');
  assert.equal(r.connection,'DISCONNECTED');
});
test('ordered system, exact fields, allowed signer decisions and role independence are enforced',()=>{
  const good=makeRows();
  good[0].signerDecision='SIGNER_NOT_PROVISIONED';
  good[0].custodianAlias='key_keeper'; good[0].witnessAlias='outside_witness';
  good[0].reviewerAlias='independent_reviewer';
  assert.equal(inspectQl256SignerAndRoleDecisions(good).actions[0].privateRoleAssignment,
    'PROPOSED_UNVERIFIED');
  const shifted=structuredClone(good);[shifted[0],shifted[1]]=[shifted[1],shifted[0]];
  assert.match(inspectQl256SignerAndRoleDecisions(shifted).status,/DENIED/);
  for(const mutation of [r=>r[0].extra='SECRET',r=>r[0].signerDecision='TRUSTED',
    r=>r[0].reviewerAlias='key_keeper',r=>r[0].witnessAlias=null,
    r=>r[0].proofHttpStatus=200]){
    const changed=structuredClone(good); mutation(changed);
    assert.match(inspectQl256SignerAndRoleDecisions(changed).status,/DENIED/);
  }
});
test('safe future bounded TEST proposal remains a request and does not schedule anything',()=>{
  const r=inspectQl256TrialSchedulingRequest(ql256CurrentHeldSnapshot(),window(),{now});
  assert.equal(r.status,'OWNER_TEST_WINDOW_PRIVATE_APPROVAL_REQUEST_ONLY_HELD');
  assert.equal(r.scheduledWindows,0);
  assert.equal(r.actualGatewayGets,0);
  assert.equal(r.relayEnabled,false);
});
test('test window rejects forged approval, private data, live pilot, broad paths and time scope',()=>{
  for(const mutation of [r=>r.ownerDecision='APPROVED',r=>r.ownerReceiptId='signed',
    r=>r.paths.push('/api/customer'),r=>r.methods.push('POST'),
    r=>r.startUtc=new Date(now-1).toISOString(),
    r=>r.endUtc=new Date(now+60*60000).toISOString(),
    r=>r.includesLiveData=true,r=>r.relayEnabled=true,r=>r.ownerPilotEnabled=true,
    r=>r.unexpected='credential']){
    const changed=window();mutation(changed);
    assert.match(inspectQl256TrialSchedulingRequest(ql256CurrentHeldSnapshot(),changed,{now}).status,/DENIED/);
  }
  assert.match(inspectQl256TrialSchedulingRequest({},window(),{now}).status,/UPSTREAM/);
});
