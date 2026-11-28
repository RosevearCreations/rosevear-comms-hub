import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL506_ENROLLMENT_SCHEMA} from './ql506-enrollment-reconciliation.mjs';
import {QL502_SOURCE_SCHEMA,QL502_PROVIDER_SCHEMA}
 from './ql502-provider-delivery-proof.mjs';
import {QL507_WITNESS_SCHEMA,ql507ReviewPilotPreparation,
 ql507PilotGateSummary} from './ql507-field-pilot-preflight.mjs';
const now=Date.now(),hex=v=>v.repeat(64);
const keys=Object.fromEntries(['source','provider','reviewer','service','observer','forger']
 .map(name=>[name,generateKeyPairSync('ed25519')]));
const pub=name=>keys[name].publicKey.export({format:'pem',type:'spki'});
const fp=name=>createHash('sha256').update(keys[name].publicKey.export({
 format:'der',type:'spki'})).digest('hex');
const hash=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const signed=(payload,name)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[name].privateKey).toString('base64url')});
const identity=signed({
 schema:QL506_ENROLLMENT_SCHEMA,sourceApp:'icamp',tenantDigest:hex('a'),
 hostLabel:'DESKTOP-AE894KC',serviceId:'COMMS_PRIVATE_RECEIPT_WORKER',
 supabaseProject:'gxujcwpktaickcgzyvnu',
 workerBundleDigest:hex('b'),journalDigest:hex('c'),
 serviceIdentityDigest:fp('service'),issuedAtMs:now-1000,
 expiresAtMs:now+50000,receiverDisabled:true,sendDisabled:true,
 metadataOnly:true,authorityTransfer:false
},'service');
const source=signed({
 schema:QL502_SOURCE_SCHEMA,sourceEventId:'original_source_ql507_01',
 brand:'icamp',tenantDigest:hex('a'),threadDigest:hex('b'),
 messageId:'one_intent_ql507_01',contentDigest:hex('d'),
 messageVersion:2,purpose:'SERVICE_INSTRUCTIONS_VERSIONED',
 issuedAtMs:now-1200,expiresAtMs:now+50000,
 customerDataIncluded:false,authorityTransfer:false
},'source');
const provider=signed({
 schema:QL502_PROVIDER_SCHEMA,eventId:'provider_accept_ql507_01',
 brand:'icamp',tenantDigest:hex('a'),messageId:source.payload.messageId,
 messageVersion:2,sourcePacketDigest:hash(source),
 providerReceiptId:'accepted_receipt_ql507_01',
 providerActorId:'independent_prov_ql507',
 stage:'PROVIDER_ACCEPTED',claimedAtMs:now-1100,
 issuedAtMs:now-900,expiresAtMs:now+50000,
 customerDataIncluded:false,authorityTransfer:false
},'provider');
const witnessPayload={
 schema:QL507_WITNESS_SCHEMA,sourceApp:'icamp',tenantDigest:hex('a'),
 hostLabel:'DESKTOP-AE894KC',serviceId:'COMMS_PRIVATE_RECEIPT_WORKER',
 enrollmentPacketDigest:hash(identity),
 sourcePacketDigest:hash(source),providerPacketDigest:hash(provider),
 observerId:'independent_observer_ql507',
 serviceMode:'MANUAL_NOT_STARTED',receiverOff:true,senderOff:true,
 metadataOnly:true,observedAtMs:now-800,expiresAtMs:now+50000,
 customerDataIncluded:false,authorityTransfer:false
};
const witness=signed(witnessPayload,'observer');
const options={
 enrollmentPacket:identity,witnessPacket:witness,
 sourcePacket:source,providerPacket:provider,
 sourcePublicKeyPem:pub('source'),providerPublicKeyPem:pub('provider'),
 reviewerPublicKeyPem:pub('reviewer'),
 serviceIdentityPublicKeyPem:pub('service'),
 observerPublicKeyPem:pub('observer'),
 expectedSourceApp:'icamp',expectedTenantDigest:hex('a'),
 expectedWorkerBundleDigest:hex('b'),expectedJournalDigest:hex('c'),
 currentVersion:2,now
};
test('QL507 5 independent pins + provider ACCEPTED only produce HOLD not activation',()=>{
 const result=ql507ReviewPilotPreparation(options);
 assert.equal(result.state,'QL507_SIGNED_PILOT_PREPARATION_CLAIMS_FIELD_HOLD',
  JSON.stringify(result));
 assert.equal(result.fiveDistinctSignerPinsVerified,true);
 assert.equal(result.sourceProviderAcceptanceClaimVerified,true);
 assert.equal(result.fieldCertified,false);
 assert.equal(result.receiverStarted,false);
 assert.equal(result.customerMessageSent,false);
 assert.equal(result.providerDeliveryObserved,false);
 const gate=ql507PilotGateSummary(result);
 assert.equal(gate.state,'FIELD_HOLD');
 assert.equal(gate.signedPreparationClaimsVerified,true);
 assert.equal(gate.sendAuthorized,false);
});
test('QL507 rejects forged witness, stale, changed host, changed scope and reused signer',()=>{
 const changes=[
  {witnessPacket:signed(witnessPayload,'forger')},
  {witnessPacket:signed({...witnessPayload,hostLabel:'WRONG_PC'},'observer')},
  {witnessPacket:signed({...witnessPayload,tenantDigest:hex('f')},'observer')},
  {witnessPacket:signed({...witnessPayload,serviceMode:'RUNNING'},'observer')},
  {witnessPacket:signed({...witnessPayload,receiverOff:false},'observer')},
  {witnessPacket:signed({...witnessPayload,observedAtMs:now-500000},'observer')},
  {witnessPacket:signed({...witnessPayload,sourcePacketDigest:hex('d')},'observer')},
  {observerPublicKeyPem:pub('provider')},
  {expectedTenantDigest:hex('f')},
  {enrollmentPacket:signed(identity.payload,'forger')},
  {providerPacket:signed(provider.payload,'forger')},
  {sourcePacket:signed(source.payload,'forger')},
  {currentVersion:3}
 ];
 for(const change of changes){
  const result=ql507ReviewPilotPreparation({...options,...change});
  assert.equal(result.state,'HOLD',Object.keys(change).join(','));
 }
});
test('QL507 rejects a forged provider DELIVERED claim used as a pilot authorization',()=>{
 const delivered=signed({...provider.payload,stage:'PROVIDER_DELIVERED'},'provider');
 const changed=ql507ReviewPilotPreparation({...options,providerPacket:delivered,
  witnessPacket:signed({...witnessPayload,providerPacketDigest:hash(delivered)},'observer')});
 assert.equal(changed.state,'HOLD');
});
test('QL507 CLI cannot start worker, send, or assert real original Windows proof',()=>{
 const cli=fileURLToPath(new URL('./ql507-original-host-cli.mjs',import.meta.url));
 const read=(args)=>{
  const p=spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
  return {status:p.status,response:JSON.parse(p.stdout),stderr:p.stderr};
 };
 const defaultStatus=read(['--status']);
 assert.equal(defaultStatus.status,0,defaultStatus.stderr);
 assert.equal(defaultStatus.response.fieldCertified,false);
 assert.equal(defaultStatus.response.customerMessageSent,false);
 assert.equal(defaultStatus.response.serviceStarted,false);
 for(const arg of ['--start','--send','--activate','--pilot','--run-once']){
  const result=read([arg]);
  assert.equal(result.status,2);
  assert.equal(result.response.state,'HOLD');
  assert.equal(result.response.receiverStarted,false);
 }
 const inspect=read(['--inspect']);
 assert.equal(inspect.response.fieldCertified,false);
 assert.equal(inspect.response.privateKeyRead,false);
 if(process.platform!=='win32'||process.env.COMPUTERNAME!=='DESKTOP-AE894KC')
  assert.equal(inspect.response.state,'HOLD');
});
