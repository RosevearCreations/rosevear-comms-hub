import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL495_TRIAL_SCHEMA,verifyQl495MasterTrialReceipt}
 from './ql495-source-provenance-master-trial.mjs';
import {QL496_PATH,QL496_CHALLENGE_SCHEMA,QL496_DEVICE_SCHEMA,
 QL496_REVIEW_SCHEMA,observeQl496ActualMutualTls,
 validateQl496MasterEndpointTrial,createQl496MasterReceiverLedger,
 createQl496MasterEndpointContract,verifyQl496IndependentDeviceEvidence,
 reconcileQl496SignedDelivery}
 from './ql496-master-endpoint-contract.mjs';

const keys=Object.fromEntries(['master','attestor','owner','reviewer','impostor']
 .map(id=>[id,generateKeyPairSync('ed25519')]));
const pub=id=>keys[id].publicKey.export({format:'pem',type:'spki'});
const packet=(payload,id)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[id].privateKey).toString('base64url')});
const digest=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const hash=c=>c.repeat(64);
const at=Date.now(),clientPin=hash('a'),masterHead=hash('b'),
 receiptDigest=hash('c'),provenanceDigest=hash('d'),auditDigest=hash('e');
const trial={
 schema:QL495_TRIAL_SCHEMA,trialId:'trial_ql496_0001',
 sourceId:'yw',receiptId:'receipt_ql496_0001',
 recordDigest:receiptDigest,masterAuditDigest:auditDigest,
 masterJournalHead:masterHead,provenanceDigest,
 sentAtMs:at-50,requestedAction:'ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY',
 customerDataIncluded:false,authorityTransfer:false};
const request=()=>({method:'POST',url:QL496_PATH,
 headers:{'content-type':'application/json'},
 socket:{encrypted:true,authorized:true,getProtocol:()=> 'TLSv1.3',
  getPeerCertificate:()=>({fingerprint256:clientPin.toUpperCase()})}});
const clientPins={clientCertificateSha256:clientPin,masterPublicKeyPem:pub('master')};
const audit=()=>({state:'QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD',
 sixSourceAuditDigest:auditDigest,ql493Head:masterHead,
 masterNetworkDeliveryVerified:false,realSourcesVerified:0,
 sourceAuthorized:false,customerWrites:false});
const provenance=()=>({
 state:'QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD',
 sourceId:'yw',receiptId:trial.receiptId,
 sourceRecordDigest:trial.recordDigest,masterAuditDigest:trial.masterAuditDigest,
 masterJournalHead:trial.masterJournalHead,provenanceDigest:trial.provenanceDigest,
 trialEligibleWhileSourcePacketFresh:true,
 sourceSignatureHistoricallyVerified:true,originalHardwareProvenanceVerified:false});
function setup(t,opts={}){
 const directory=mkdtempSync(join(tmpdir(),'ql496-custody-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const ledger=createQl496MasterReceiverLedger({directory,now:()=>at});
 const handler=createQl496MasterEndpointContract({
  ledger,clientPins:opts.clientPins??clientPins,
  readMasterAudit:opts.audit??audit,
  readSourceProvenance:opts.provenance??provenance,
  signMasterAck:opts.signer??(async p=>packet(p,'master')),
  now:()=>at});
 return {directory,ledger,handler};
}
test('QL496 endpoint has no public listener or automatic transport by default',t=>{
 const f=setup(t);
 assert.equal(f.handler.networkListener,false);
 assert.equal(f.handler.automaticReceiver,false);
 assert.equal(f.ledger.summary().count,0);
 assert.equal(f.ledger.summary().productionMasterAccepted,false);
});
test('QL496 authorized TLS 1.3 peer certificate must come from socket, never proxy header',()=>{
 const r=request();
 assert.equal(observeQl496ActualMutualTls(r).state,
 'QL496_ORIGIN_TLS13_MTLS_OBSERVATION_UNVERIFIED');
 assert.equal(observeQl496ActualMutualTls({...r,socket:null}).state,'HOLD');
 assert.equal(observeQl496ActualMutualTls({...r,
  socket:{...r.socket,authorized:false}}).state,'HOLD');
 assert.equal(observeQl496ActualMutualTls({...r,
  socket:{...r.socket,getProtocol:()=> 'TLSv1.2'}}).state,'HOLD');
 assert.equal(observeQl496ActualMutualTls({...r,
  headers:{...r.headers,'x-forwarded-client-cert':'fabricated'}}).state,'HOLD');
});
test('QL496 signed first-source audit and Master trial request validate only as HELD',()=>{
 const v=validateQl496MasterEndpointTrial({request:request(),trial,
  clientPins,readMasterAudit:audit,readSourceProvenance:provenance,now:at});
 assert.equal(v.state,'QL496_SIGNED_FIRST_SOURCE_MASTER_TRIAL_CONTRACT_READY_HELD',
  JSON.stringify(v));
 assert.equal(v.originalDevicePhysicallyCertified,false);
 assert.equal(v.productionMasterAccepted,false);
});
test('QL496 rejects bad method, path, content type, client pin, stale trial, changed Master audit',()=>{
 const cases=[
  {request:{...request(),method:'GET'}},
  {request:{...request(),url:'/api/public/master'}},
  {request:{...request(),headers:{'content-type':'text/plain'}}},
  {clientPins:{...clientPins,clientCertificateSha256:hash('f')}},
  {trial:{...trial,sentAtMs:at-300000}},
  {trial:{...trial,requestedAction:'PRODUCTION_MASTER_APPROVAL'}},
  {trial:{...trial,customerDataIncluded:true}},
  {readMasterAudit:()=>({...audit(),ql493Head:hash('f')})},
  {readMasterAudit:()=>({...audit(),realSourcesVerified:1})},
  {readSourceProvenance:()=>({...provenance(),trialEligibleWhileSourcePacketFresh:false})},
  {readSourceProvenance:()=>({...provenance(),provenanceDigest:hash('f')})}
 ];
 for(const opts of cases){
  const result=validateQl496MasterEndpointTrial({
   request:opts.request??request(),trial:opts.trial??trial,
   clientPins:opts.clientPins??clientPins,
   readMasterAudit:opts.readMasterAudit??audit,
   readSourceProvenance:opts.readSourceProvenance??provenance,now:at});
  assert.equal(result.state,'HOLD',JSON.stringify(opts));
 }
});
test('QL496 genuinely signed response contract is a non-authorizing HELD and fsynced replay gate',async t=>{
 const f=setup(t);
 const r=await f.handler.handle({request:request(),trial});
 assert.equal(r.state,'QL496_SIGNED_PRIVATE_MASTER_TRIAL_RESPONSE_READY_HELD',
  JSON.stringify(r));
 assert.equal(r.statusCode,200);
 assert.equal(r.clientReceivedResponseVerified,false);
 assert.equal(r.productionMasterAccepted,false);
 assert.equal(verifyQl495MasterTrialReceipt({requestPayload:trial,
  responsePacket:r.signedResponsePacket,
  masterPublicKeyPem:pub('master'),now:at}).state,
 'QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD');
 assert.equal(f.ledger.summary().count,1);
 assert.equal(f.ledger.find(trial.trialId).trialId,trial.trialId);
 assert.equal((await f.handler.handle({request:request(),trial})).state,'HOLD');
 const recon=reconcileQl496SignedDelivery({ledger:f.ledger,trial,
  masterPacket:r.signedResponsePacket,masterPublicKeyPem:pub('master'),
  originalClientVerified:true});
 assert.equal(recon.state,'QL496_SOURCE_MASTER_SIGNED_DELIVERY_RECONCILED_HELD');
 assert.equal(recon.clientReportedReceipt,true);
 assert.equal(recon.networkDeliveryToClientCertified,false);
 assert.equal(recon.originalDevicePhysicallyCertified,false);
});
test('QL496 wrong Master signer or wrong source contents fail before ledger write',async t=>{
 const f=setup(t,{signer:async body=>packet(body,'impostor')});
 const r=await f.handler.handle({request:request(),trial});
 assert.equal(r.state,'HOLD');
 assert.equal(f.ledger.summary().count,0);
});
test('QL496 invalid or tampered Master ledger fails closed without replay',async t=>{
 const f=setup(t);
 const r=await f.handler.handle({request:request(),trial});
 assert.equal(r.state,'QL496_SIGNED_PRIVATE_MASTER_TRIAL_RESPONSE_READY_HELD');
 const path=join(f.directory,'ql496-master-receiver-trial.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace(trial.receiptId,
  'receipt_changed_00496'));
 assert.equal(f.ledger.summary().state,'HOLD');
 assert.equal(f.ledger.find(trial.trialId).state,'HOLD');
 assert.equal((await f.handler.handle({request:request(),trial})).state,'HOLD');
});
test('QL496 four-authority challenge + physical observation is independently signed but NOT certification',async()=>{
 const ackPayload={schema:'rosevear.comms.ql495.signed-master-trial-receipt.v1',
  trialId:trial.trialId,sourceId:trial.sourceId,receiptId:trial.receiptId,
  recordDigest:trial.recordDigest,trialDigest:digest(trial),
  masterAuditDigest:trial.masterAuditDigest,
  masterJournalHead:trial.masterJournalHead,
  decision:'HOLD_FOR_INDEPENDENT_REVIEW',
  masterActorId:'independent_master_ql496',
  issuedAtMs:at-30,expiresAtMs:at+50000,
  customerDataIncluded:false,authorityTransfer:false};
 const masterPacket=packet(ackPayload,'master');
 const enrollment=hash('9');
 const challengePacket=packet({schema:QL496_CHALLENGE_SCHEMA,
  challengeId:'challenge_ql496_0001',sourceId:'yw',receiptId:trial.receiptId,
  trialId:trial.trialId,deviceEnrollmentDigest:enrollment,
  issuedAtMs:at-300,expiresAtMs:at+60000,
  customerDataIncluded:false,authorityTransfer:false},'master');
 const evidence={schema:QL496_DEVICE_SCHEMA,
  evidenceId:'device_evidence_496',challengeId:challengePacket.payload.challengeId,
  sourceId:'yw',receiptId:trial.receiptId,trialId:trial.trialId,
  sourceRecordDigest:trial.recordDigest,masterPacketDigest:digest(masterPacket),
  deviceEnrollmentDigest:enrollment,witnessActorId:'physical_attestor_496',
  observedAtMs:at-100,issuedAtMs:at-50,expiresAtMs:at+40000,
  devicePhysicallyObserved:true,customerDataIncluded:false,authorityTransfer:false};
 const attestationPacket=packet(evidence,'attestor');
 const common={schema:QL496_REVIEW_SCHEMA,
  reviewId:'field_review_ql496',evidenceId:evidence.evidenceId,
  challengeId:evidence.challengeId,sourceId:'yw',trialId:trial.trialId,
  masterPacketDigest:evidence.masterPacketDigest,
  deviceEvidenceDigest:digest(attestationPacket),
  role:'owner',actorId:'owner_actor_496',
  issuedAtMs:at-20,expiresAtMs:at+40000,
  decision:'REVIEW_ONLY_NO_PRODUCTION_AUTHORITY',
  customerDataIncluded:false,authorityTransfer:false};
 const ownerPacket=packet(common,'owner');
 const reviewerPacket=packet({...common,role:'independent-reviewer',
  actorId:'independent_review_496'},'reviewer');
 const pins={attestorPublicKeyPem:pub('attestor'),
  ownerPublicKeyPem:pub('owner'),
  reviewerPublicKeyPem:pub('reviewer'),
  masterPublicKeyPem:pub('master'),
  deviceEnrollmentDigest:enrollment};
 const args={challengePacket,attestationPacket,ownerPacket,reviewerPacket,
  pins,trial,masterPacket,now:at};
 const r=verifyQl496IndependentDeviceEvidence(args);
 assert.equal(r.state,'QL496_INDEPENDENT_SIGNED_DEVICE_EVIDENCE_REVIEW_HELD',
  JSON.stringify(r));
 assert.equal(r.externalFieldWitnessSignaturesVerified,true);
 assert.equal(r.originalDevicePhysicallyCertified,false);
 assert.equal(r.hardwareIdentityIndependentlyAudited,false);
 assert.equal(verifyQl496IndependentDeviceEvidence({...args,
  pins:{...pins,attestorPublicKeyPem:pub('impostor')}}).state,'HOLD');
 assert.equal(verifyQl496IndependentDeviceEvidence({...args,
  challengePacket:packet({...challengePacket.payload,
   challengeId:'challenge_wrong_00496'},'master')}).state,'HOLD');
 assert.equal(verifyQl496IndependentDeviceEvidence({...args,
  reviewerPacket:packet({...reviewerPacket.payload,
   actorId:'owner_actor_496'},'reviewer')}).state,'HOLD');
 assert.equal(verifyQl496IndependentDeviceEvidence({...args,
  masterPacket:{...masterPacket,signature:'A'.repeat(86)}}).state,'HOLD');
 assert.equal(verifyQl496IndependentDeviceEvidence({...args,
  now:at+400000}).state,'HOLD');
});
test('QL496 signed delivery reconciliation rejects wrong signers and source digests',async t=>{
 const f=setup(t),r=await f.handler.handle({request:request(),trial});
 assert.equal(r.state,'QL496_SIGNED_PRIVATE_MASTER_TRIAL_RESPONSE_READY_HELD');
 assert.equal(reconcileQl496SignedDelivery({ledger:f.ledger,trial,
  masterPacket:r.signedResponsePacket,masterPublicKeyPem:pub('impostor')}).state,
 'HOLD');
 assert.equal(reconcileQl496SignedDelivery({ledger:f.ledger,
  trial:{...trial,provenanceDigest:hash('f')},
  masterPacket:r.signedResponsePacket,masterPublicKeyPem:pub('master')}).state,
 'HOLD');
});
test('QL496 original Windows CLI stays no-send and no listener on CI',()=>{
 const cli=fileURLToPath(new URL('./ql496-original-host-cli.mjs',import.meta.url));
 const status=JSON.parse(execFileSync(process.execPath,[cli,'--status'],
  {encoding:'utf8'}));
 assert.equal(status.state,'QL496_MASTER_RECEIVER_OFF_BY_DEFAULT');
 assert.equal(status.firstSourceFieldCertified,false);
 assert.equal(status.masterEndpointListening,false);
 assert.equal(status.customerWrites,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--evidence-summary'],
   {stdio:'pipe'}));
});
