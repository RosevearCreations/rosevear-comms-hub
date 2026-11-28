import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {canonicalize} from './manifest.mjs';
import {
 QL506_ENROLLMENT_SCHEMA,ql506VerifyServiceIdentityClaim,
 ql506ProjectLedgerDigest,ql506ReconcileSignedExceptionReadback
} from './ql506-enrollment-reconciliation.mjs';

const now=Date.now(),hex=x=>x.repeat(64);
const keys=Object.fromEntries(['source','provider','reviewer','service','forged']
 .map(name=>[name,generateKeyPairSync('ed25519')]));
const pem=name=>keys[name].publicKey.export({type:'spki',format:'pem'});
const fp=name=>createHash('sha256').update(keys[name].publicKey.export({
 type:'spki',format:'der'})).digest('hex');
const signed=(payload,name)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[name].privateKey).toString('base64url')});
const expected={
 expectedSourceApp:'icamp',expectedTenantDigest:hex('a'),
 expectedWorkerBundleDigest:hex('b'),expectedJournalDigest:hex('c'),
 expectedJobDigest:hex('d'),
 sourcePublicKeyPem:pem('source'),providerPublicKeyPem:pem('provider'),
 reviewerPublicKeyPem:pem('reviewer'),
 serviceIdentityPublicKeyPem:pem('service'),now
};
const enrollment={
 schema:QL506_ENROLLMENT_SCHEMA,sourceApp:'icamp',tenantDigest:hex('a'),
 hostLabel:'DESKTOP-AE894KC',serviceId:'COMMS_PRIVATE_RECEIPT_WORKER',
 supabaseProject:'gxujcwpktaickcgzyvnu',workerBundleDigest:hex('b'),
 journalDigest:hex('c'),serviceIdentityDigest:fp('service'),
 issuedAtMs:now-100,expiresAtMs:now+50000,receiverDisabled:true,
 sendDisabled:true,metadataOnly:true,authorityTransfer:false
};
const rows=[{
 exception_id:hex('e'),source_app:'icamp',tenant_digest:hex('a'),
 job_digest:hex('d'),packet_digest:hex('f'),
 reason_code:'PRIVATE_RPC_UNAVAILABLE',status:'HOLD'
}];
const enrollmentPacket=signed(enrollment,'service');
function reviewerPacket(data=rows){
 const projection=ql506ProjectLedgerDigest(data);
 assert.equal(projection.state,'QL506_EXACT_METADATA_DIGEST_ONLY');
 return signed({
  schema:'rosevear.comms.ql505.independent-receipt-readback.v1',
  brand:'icamp',tenantDigest:hex('a'),jobDigest:hex('d'),
  receiptDigest:projection.digest,
  reviewerId:'independent_reviewer_ql506',recordCount:data.length,
  issuedAtMs:now-100,expiresAtMs:now+50000,
  origin:'INDEPENDENT_COMMS_FIELD_REVIEW',
  customerDataIncluded:false,authorityTransfer:false
 },'reviewer');
}
const reconciliation={...expected,enrollmentPacket,readbackPacket:reviewerPacket(),ledgerRows:rows};
test('QL506 distinct pinned service key proves only scoped signed identity claim',()=>{
 const status=ql506VerifyServiceIdentityClaim({...expected,packet:enrollmentPacket});
 assert.equal(status.state,'QL506_SIGNED_SERVICE_IDENTITY_CLAIM_FIELD_HOLD',JSON.stringify(status));
 assert.equal(status.serviceIdentitySignatureVerified,true);
 assert.equal(status.physicalHostAttested,false);
 assert.equal(status.serviceRunningVerified,false);
 assert.equal(status.customerMessageSent,false);
});
test('QL506 independently signed exact exception projection reconciles without field certification',()=>{
 const result=ql506ReconcileSignedExceptionReadback(reconciliation);
 assert.equal(result.state,'QL506_SIGNED_EXCEPTION_LEDGER_RECONCILED_FIELD_HOLD',
  JSON.stringify(result));
 assert.equal(result.recordCount,1);
 assert.equal(result.fieldCertified,false);
 assert.equal(result.providerDeliveryVerified,false);
 assert.equal(result.customerMessageSent,false);
});
test('QL506 forged, stale, wrong host, changed tenant and reused source key all fail closed',()=>{
 for(const changed of [
  {packet:signed(enrollment,'forged')},
  {packet:signed({...enrollment,hostLabel:'OTHER-PC'},'service')},
  {packet:signed({...enrollment,tenantDigest:hex('f')},'service')},
  {packet:signed({...enrollment,issuedAtMs:now-500000},'service')},
  {packet:signed({...enrollment,receiverDisabled:false},'service')},
  {packet:signed({...enrollment,metadataOnly:false},'service')},
  {packet:signed({...enrollment,serviceIdentityDigest:hex('f')},'service')},
  {serviceIdentityPublicKeyPem:pem('source')},
  {sourcePublicKeyPem:pem('service')}
 ]){
  assert.equal(ql506VerifyServiceIdentityClaim({
   ...expected,packet:enrollmentPacket,...changed
  }).state,'HOLD',JSON.stringify(Object.keys(changed)));
 }
});
test('QL506 cannot reconcile forged reviewer, altered rows, cross-tenant or duplicate ledger',()=>{
 const bad=[
  {readbackPacket:signed(reviewerPacket().payload,'forged')},
  {ledgerRows:rows.map(x=>({...x,reason_code:'IMMUTABLE_CONFLICT'}))},
  {ledgerRows:rows.map(x=>({...x,tenant_digest:hex('f')}))},
  {ledgerRows:rows.map(x=>({...x,status:'CLOSED'}))},
  {ledgerRows:[...rows,...rows]},
  {ledgerRows:[]},
  {expectedJobDigest:hex('f')},
  {readbackPacket:signed({...reviewerPacket().payload,recordCount:2},'reviewer')}
 ];
 for(const change of bad){
  assert.equal(ql506ReconcileSignedExceptionReadback({
   ...reconciliation,...change
  }).state,'HOLD',Object.keys(change).join(','));
 }
});
test('QL506 offline CLI never activates runtime and refuses simulated host commands',()=>{
 const base=['runtimes/master-discovery/ql506-original-host-cli.mjs'];
 const status=spawnSync(process.execPath,[...base,'--status'],{encoding:'utf8'});
 assert.equal(status.status,0,status.stderr);
 const state=JSON.parse(status.stdout);
 assert.equal(state.state,'CODE_READY_ORIGINAL_FIELD_HOLD');
 assert.equal(state.customerMessageSent,false);
 assert.equal(state.receiverStarted,false);
 assert.equal(state.networkListening,false);
 for(const flag of ['--drain-once','--start','--reconcile']){
  const attempt=spawnSync(process.execPath,[...base,flag],{encoding:'utf8'});
  assert.equal(attempt.status,2);
  assert.equal(JSON.parse(attempt.stdout).state,'HOLD');
 }
 const inspect=spawnSync(process.execPath,[...base,'--inspect'],{encoding:'utf8'});
 const result=JSON.parse(inspect.stdout);
 assert.equal(result.customerMessageSent,false);
 assert.equal(result.fieldCertified,false);
 if(process.platform!=='win32'||process.env.COMPUTERNAME!=='DESKTOP-AE894KC')
  assert.equal(result.state,'HOLD');
});
