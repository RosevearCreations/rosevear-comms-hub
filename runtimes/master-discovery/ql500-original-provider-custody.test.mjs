import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL500_CUSTODY_SCHEMA,discoverQl500OriginalProviderConfig,
 reviewQl500ProviderReceiptClaims,reviewQl500WithOriginalEvidence,
 readQl500PrivateCustody,appendQl500OriginalCustody}
 from './ql500-original-provider-custody.mjs';

const now=Date.now(),hex=c=>c.repeat(64);
const keys=Object.fromEntries(['provider','owner','master','impostor'].map(x=>
 [x,generateKeyPairSync('ed25519')]));
const pem=x=>keys[x].publicKey.export({type:'spki',format:'pem'});
const packet=(value,name)=>({payload:value,signature:sign(null,
 Buffer.from(canonicalize(value)),keys[name].privateKey).toString('base64url')});
const endpoint='https://master.private.rosevear.internal/internal/comms/master-delivery-trial';
function privateSetup(t){
 const directory=mkdtempSync(join(tmpdir(),'ql500-private-'));
 chmodSync(directory,0o700);
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const config={endpointUrl:endpoint,serverCertificateSha256:hex('a'),
  caFile:'original-ca-500.pem',
  clientCertificateFile:'original-client-500.pem',
  clientKeyFile:'original-secret-500.pem',
  explicitOwnerApproval:'ONE_SUPERVISED_TLS_HANDSHAKE_NO_HTTP'};
 for(const x of [config.caFile,config.clientCertificateFile,config.clientKeyFile])
  writeFileSync(join(directory,x),'FAKE_TEST_ONLY_'+('X'.repeat(64)),{mode:0o600});
 const write=(value)=>writeFileSync(join(directory,'ql499-owner-approved-probe.json'),
  JSON.stringify(value),{mode:0o600});
 write(config);return {directory,config,write};
}
function fixture(t,opts={}){
 const p=privateSetup(t);
 const discovery=discoverQl500OriginalProviderConfig({directory:p.directory});
 const pathReview={state:'QL499_ORIGINAL_SIGNED_PATH_REVIEW_HELD',
  ceremonyId:'ceremony_ql500_001',trialId:'trial_ql500_001',
  pathWitnessDigest:hex('b')};
 const reconciliation={state:'QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD',
  trialId:pathReview.trialId,sourceId:'yw',
  clientRecordDigest:hex('c'),masterRecordDigest:hex('d')};
 const clientReadback={state:'QL497_SIGNED_CLIENT_TRIAL_JOURNAL_RECORD_READ_HELD',
  record:{trialId:pathReview.trialId,sourceId:'yw',recordDigest:hex('c')},
  journalHead:hex('e')};
 const masterReadback={state:'QL497_SIGNED_MASTER_TRIAL_JOURNAL_RECORD_READ_HELD',
  record:{trialId:pathReview.trialId,sourceId:'yw',recordDigest:hex('d')},
  journalHead:hex('f')};
 const base={schema:QL500_CUSTODY_SCHEMA,custodyId:'custody_ql500_001',
  ceremonyId:pathReview.ceremonyId,trialId:pathReview.trialId,sourceId:'yw',
  masterEndpointUrl:endpoint,masterCertificateSha256:hex('a'),
  configDigest:discovery.configDigest,pathWitnessDigest:hex('b'),
  clientReceiptDigest:hex('c'),masterReceiptDigest:hex('d'),
  clientJournalHead:hex('e'),masterJournalHead:hex('f'),
  providerRuntimeDigest:hex('1'),role:'independent-provider',
  actorId:'provider_ql500_001',issuedAtMs:now-100,
  expiresAtMs:now+60000,
  requestedAction:'REVIEW_ORIGINAL_PROVIDER_RECEIPT_CUSTODY_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 return {directory:p.directory,discovery,pathReview,clientReadback,
  masterReadback,reconciliation,
  providerPacket:packet({...base,...opts.provider},opts.providerSigner??'provider'),
  ownerPacket:packet({...base,role:'original-windows-owner',
   actorId:'original_owner_500',...opts.owner},opts.ownerSigner??'owner'),
  approvedPins:{providerPublicKeyPem:pem('provider'),
   ownerPublicKeyPem:pem('owner'),masterPublicKeyPem:pem('master'),
   ...opts.pins},now};
}
test('QL500 original provider discovery checks references without reading secret bytes',t=>{
 const f=privateSetup(t),r=discoverQl500OriginalProviderConfig(f);
 assert.equal(r.state,'QL500_ORIGINAL_PROVIDER_CONFIG_DISCOVERED_REVIEW_HELD');
 assert.equal(r.privateKeyBytesRead,false);
 assert.equal(r.actualMasterEndpointReached,false);
 assert.equal(r.originalLiveReceiptCertified,false);
 assert.equal(JSON.stringify(r).includes('FAKE_TEST_ONLY'),false);
});
test('QL500 configuration inventory rejects fake enrollment, file reuse and extra scope',t=>{
 const f=privateSetup(t);
 for(const changes of [
  {serverCertificateSha256:hex('z')},
  {endpointUrl:'https://invalid.example/internal/comms/master-delivery-trial'},
  {clientKeyFile:'../outside.pem'},
  {clientKeyFile:f.config.clientCertificateFile},
  {explicitOwnerApproval:'ACTIVATE'},
  {customerDataIncluded:false}
 ]){
  f.write({...f.config,...changes});
  assert.equal(discoverQl500OriginalProviderConfig({directory:f.directory}).state,
   'HOLD',JSON.stringify(Object.keys(changes)));
 }
});
test('QL500 independently signed provider and client custody claims remain HOLD',t=>{
 const f=fixture(t),r=reviewQl500ProviderReceiptClaims(f);
 assert.equal(r.state,'QL500_SIGNED_PROVIDER_RECEIPT_CUSTODY_CLAIMS_REVIEW_HELD',
  JSON.stringify(r));
 assert.equal(r.independentOwnerProviderSignaturesChecked,true);
 assert.equal(r.originalLiveReceiptCertified,false);
 assert.equal(r.actualNetworkDeliveryCertified,false);
});
test('QL500 rejects signature forgeries, signer reuse, stale packets and receipt drift',t=>{
 for(const changes of [
  {providerSigner:'impostor'}, {ownerSigner:'impostor'},
  {owner:{role:'independent-provider'}},
  {owner:{actorId:'provider_ql500_001'}},
  {owner:{configDigest:hex('3')}},
  {owner:{clientReceiptDigest:hex('4')}},
  {owner:{clientJournalHead:hex('5')}},
  {provider:{issuedAtMs:now-300000}},
  {provider:{customerDataIncluded:true}},
  {owner:{expiresAtMs:now-1}},
  {owner:{authorityTransfer:true}},
  {pins:{ownerPublicKeyPem:pem('provider')}}
 ]){
  const f=fixture(t,changes);
  assert.equal(reviewQl500ProviderReceiptClaims(f).state,'HOLD',
   JSON.stringify(changes));
 }
 const f=fixture(t);f.masterReadback.record.recordDigest=hex('8');
 assert.equal(reviewQl500ProviderReceiptClaims(f).state,'HOLD');
});
test('QL500 original live evidence entrypoint never accepts projections alone',t=>{
 const f=fixture(t);
 const r=reviewQl500WithOriginalEvidence({directory:f.directory,
  ql499Evidence:{pathReview:f.pathReview},
  ql497ReceiptEvidence:{reconciliation:f.reconciliation},
  providerPacket:f.providerPacket,ownerPacket:f.ownerPacket,
  approvedPins:f.approvedPins,now});
 assert.equal(r.state,'HOLD');
 assert.equal(r.providerRuntimeCertified,false);
});
test('QL500 private custody writer refuses arbitrary caller-verified claim flags',t=>{
 const f=fixture(t),proj=reviewQl500ProviderReceiptClaims(f);
 assert.equal(appendQl500OriginalCustody({directory:f.directory,
  evidence:{verifiedReview:{...proj,state:'CERTIFIED'}},now}).state,'HOLD');
 assert.equal(readQl500PrivateCustody({directory:f.directory}).count,0);
});
test('QL500 Windows CLI status never reads configuration or connects',()=>{
 const cli=fileURLToPath(new URL('./ql500-original-host-cli.mjs',import.meta.url));
 const r=JSON.parse(execFileSync(process.execPath,[cli,'--status'],
  {encoding:'utf8'}));
 assert.equal(r.state,'QL500_PROVIDER_DISCOVERY_OFF_BY_DEFAULT');
 assert.equal(r.automaticNetworkSend,false);
 assert.equal(r.customerWrites,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--inventory'],{stdio:'pipe'}));
});
