import {describe,it,expect} from 'vitest';
import {inspectQl481LocalHandover} from '../ql481PrivateIncidentDeskModel';
const sig='A'.repeat(86)+'==';
const handover={
 schema:'rosevear.comms.ql481.private-operator-handover.v1',
 handoverId:'handover_001',sourceApp:'yard-workers',environment:'PRIVATE_STAGING',
 tenantId:'rosevear-landscaping',episodeId:'episode_0001',
 caseId:'abc123456789abcdefabcdefabc12345',caseStatus:'RECOVERY_PENDING_OPERATOR_REVIEW',
 lastSequence:2,lastJournalDigest:'a'.repeat(64),lastReceiptDigest:'b'.repeat(64),
 sourceRevision:'c'.repeat(40),operatorId:'operator_main',intentCount:2,pendingCount:2,
 preparedAtMs:Date.now()-30000,expiresAtMs:Date.now()+60000,
 scopeClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
 customerDeliveryVerified:false,productionAcceptance:false,
 sourceRuntimeVerified:false,authorityTransfer:false};
const ack={
 schema:'rosevear.comms.ql481.durable-handover-ack.v1',
 handoverId:handover.handoverId,caseId:handover.caseId,
 handoverDigest:'d'.repeat(64),sourceApp:handover.sourceApp,
 environment:handover.environment,tenantId:handover.tenantId,
 episodeId:handover.episodeId,ownerSignerPin:'owner-spki-redacted',
 reviewerSignerPin:'reviewer-spki-redacted',committedAtMs:Date.now(),
 durableReadBack:true,disposition:'SIGNED_READ_ONLY_HANDOVER_HELD',authorityTransfer:false};
function fixture(changes:Record<string,unknown>={},ackChanges:Record<string,unknown>={}){
 const p={...handover,...changes};
 return JSON.stringify({requestDigest:'e'.repeat(64),
 ownerPacket:{payload:p,signature:sig},
 reviewerPacket:{payload:p,signature:sig},ack:{...ack,...ackChanges}});
}
describe('QL481 local owner file inspection remains untrusted and no customer data is accepted',()=>{
 it('shows only exact redacted fields with an explicit UNVERIFIED state',()=>{
  const r=inspectQl481LocalHandover(fixture(),'yard-workers');
  expect(r.ok).toBe(true);
  if(r.ok){
   expect(r.review.tenantId).toBe('rosevear-landscaping');
   expect(r.review.caseStatus).toBe('RECOVERY_PENDING_OPERATOR_REVIEW');
   expect(r.review.state).toBe('LOCAL_FILE_STRUCTURAL_REVIEW_NOT_AUTHENTICATED');
  }
 });
 it('blocks cross-app, malformed, customer, fake authority, bad disposition and added fields',()=>{
  for(const raw of [
   fixture(),fixture({customerEmail:'private@example.com'}),
   fixture({customerDeliveryVerified:true}),
   fixture({authorityTransfer:true}),
   fixture({tenantId:'wrong!tenant'}),
   fixture({pendingCount:100}),
   fixture({}, {durableReadBack:false}),
   fixture({}, {authorityTransfer:true}),
   fixture({}, {customerNotes:'not-safe'}),
   '{', 'x'.repeat(16001)
  ].slice(1)){
   expect(inspectQl481LocalHandover(raw,'yard-workers').ok).toBe(false);
  }
  expect(inspectQl481LocalHandover(fixture(),'icamp').ok).toBe(false);
 });
});
