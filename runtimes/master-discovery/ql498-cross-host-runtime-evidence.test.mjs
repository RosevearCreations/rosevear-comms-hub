import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL498_RUNTIME_SCHEMA,reviewQl498SignedRuntimeClaims,
 reviewQl498WithOriginalEvidence} from './ql498-cross-host-runtime-evidence.mjs';

const now=Date.now(),hex=x=>x.repeat(64);
const names=['operator','owner','provider','master','impostor'];
const keys=Object.fromEntries(names.map(n=>[n,generateKeyPairSync('ed25519')]));
const pem=n=>keys[n].publicKey.export({type:'spki',format:'pem'});
const fp=n=>createHash('sha256').update(keys[n].publicKey.export(
 {type:'spki',format:'der'})).digest('hex');
const signed=(payload,name)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[name].privateKey).toString('base64url')});
function fixture(options={}){
 const enrollmentResult={state:'QL497_THREE_PARTY_MASTER_ENDPOINT_ENROLLMENT_REVIEW_HELD',
  enrollmentDigest:hex('a'),tlsFingerprint:hex('b'),
  deviceEnrollmentDigest:hex('c'),
  url:'https://master.private.rosevear.internal/internal/comms/master-delivery-trial',
  masterSignerDigest:fp('master')};
 const hardwareResult={state:'QL497_INDEPENDENT_DEVICE_HARDWARE_AUDIT_REVIEW_HELD',
  hardwareAuditDigest:hex('d'),trialId:'trial_ql498_00001'};
 const receiptResult={state:'QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD',
  trialId:'trial_ql498_00001',sourceId:'yw',clientRecordDigest:hex('e'),
  masterRecordDigest:hex('f')};
 const p={schema:QL498_RUNTIME_SCHEMA,
  ceremonyId:'ceremony_ql498_00001',
  enrollmentDigest:enrollmentResult.enrollmentDigest,
  hardwareAuditDigest:hardwareResult.hardwareAuditDigest,
  trialId:receiptResult.trialId,sourceId:receiptResult.sourceId,
  clientRecordDigest:receiptResult.clientRecordDigest,
  masterRecordDigest:receiptResult.masterRecordDigest,
  masterEndpointUrl:enrollmentResult.url,
  masterCertificateSha256:enrollmentResult.tlsFingerprint,
  deviceEnrollmentDigest:enrollmentResult.deviceEnrollmentDigest,
  runtimeInstanceDigest:hex('1'),observationDigest:hex('2'),
  role:'master-operator',actorId:'operator_ql498_01',
  observedAtMs:now-1500,issuedAtMs:now-500,expiresAtMs:now+60000,
  runtimeStateClaim:'RUNNING_REPORTED_NOT_CERTIFIED',
  requestedAction:'REVIEW_SUPERVISED_MASTER_RUNTIME_EVIDENCE_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 const make=(role,actorId,observationDigest,name,override={})=>
  signed({...p,role,actorId,observationDigest,...override},name);
 const runtimePackets={
  masterOperatorPacket:make('master-operator','operator_ql498_01',hex('2'),
   options.operatorSigner??'operator',options.operator??{}),
  originalOwnerPacket:make('original-host-owner','owner_ql498_001',hex('3'),
   options.ownerSigner??'owner',options.owner??{}),
  providerPacket:make('independent-provider','provider_ql498_01',hex('4'),
   options.providerSigner??'provider',options.provider??{})};
 const approvedPins={masterOperatorPublicKeyPem:pem('operator'),
  originalOwnerPublicKeyPem:pem('owner'),
  providerPublicKeyPem:pem('provider'),masterSignerPublicKeyPem:pem('master'),
  ...options.pins};
 return {enrollmentResult,hardwareResult,receiptResult,
  runtimePackets,approvedPins,now};
}
test('QL498 independently signed runtime observations remain HOLD, not activation',()=>{
 const out=reviewQl498SignedRuntimeClaims(fixture());
 assert.equal(out.state,'QL498_INDEPENDENT_SIGNED_RUNTIME_CLAIMS_REVIEW_HELD',
  JSON.stringify(out));
 assert.equal(out.threeDistinctWitnessSignaturesVerified,true);
 assert.equal(out.ql497RawInputsReverified,false);
 assert.equal(out.independentMasterActivationCertified,false);
 assert.equal(out.originalWindowsDeviceCertified,false);
 assert.equal(out.endToEndDeliveryCertified,false);
 assert.equal(out.customerWrites,false);
});
test('QL498 rejects forged roles, reused keys, stale observations and certificate drift',()=>{
 for(const change of [
  {operatorSigner:'impostor'}, {ownerSigner:'impostor'},
  {providerSigner:'impostor'},
  {provider:{role:'master-operator'}},
  {provider:{actorId:'owner_ql498_001'}},
  {provider:{observationDigest:hex('2')}},
  {owner:{masterCertificateSha256:hex('9')}},
  {provider:{runtimeInstanceDigest:hex('9')}},
  {provider:{masterEndpointUrl:'https://attacker.example/'}},
  {owner:{expiresAtMs:now-10}},
  {owner:{issuedAtMs:now-400000}},
  {operator:{customerDataIncluded:true}},
  {provider:{authorityTransfer:true}},
  {owner:{runtimeStateClaim:'RUNNING_CERTIFIED'}},
  {pins:{providerPublicKeyPem:pem('owner')}},
  {pins:{masterSignerPublicKeyPem:pem('impostor')}}
 ]){
  const out=reviewQl498SignedRuntimeClaims(fixture(change));
  assert.equal(out.state,'HOLD',JSON.stringify(change));
 }
});
test('QL498 rejects tampered signature and untrusted review state',()=>{
 const f=fixture();
 f.runtimePackets.originalOwnerPacket.signature='A'.repeat(86);
 assert.equal(reviewQl498SignedRuntimeClaims(f).state,'HOLD');
 const g=fixture();
 g.receiptResult.state='CERTIFIED';
 assert.equal(reviewQl498SignedRuntimeClaims(g).state,'HOLD');
 const h=fixture();
 h.enrollmentResult.url='https://other.example/';
 assert.equal(reviewQl498SignedRuntimeClaims(h).state,'HOLD');
});
test('QL498 original evidence entrypoint never accepts invented QL497 review projections',()=>{
 const f=fixture();
 assert.equal(reviewQl498WithOriginalEvidence({
  enrollmentResult:f.enrollmentResult,
  hardwareResult:f.hardwareResult,
  receiptResult:f.receiptResult,
  runtimePackets:f.runtimePackets,approvedPins:f.approvedPins,now
 }).state,'HOLD');
 const bad=reviewQl498WithOriginalEvidence({enrollmentEvidence:{},
  hardwareEvidence:{},receiptEvidence:{},runtimePackets:f.runtimePackets,
  approvedPins:f.approvedPins,now});
 assert.equal(bad.state,'HOLD');
 assert.equal(bad.independentMasterActivationCertified,false);
});
test('QL498 original Windows CLI remains inactive and no-send on CI',()=>{
 const cli=fileURLToPath(new URL('./ql498-original-host-cli.mjs',import.meta.url));
 const out=JSON.parse(execFileSync(process.execPath,[cli,'--status'],
  {encoding:'utf8'}));
 assert.equal(out.state,'QL498_MASTER_RUNTIME_ACTIVATION_NOT_ENROLLED');
 assert.equal(out.masterServiceActivationCertified,false);
 assert.equal(out.originalDeviceCertified,false);
 assert.equal(out.automaticNetworkSend,false);
 assert.equal(out.customerWrites,false);
 assert.throws(()=>execFileSync(process.execPath,[cli,'--activate'],
  {stdio:'pipe'}));
});
