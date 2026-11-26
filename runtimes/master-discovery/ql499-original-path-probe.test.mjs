import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL499_PATH_SCHEMA,inspectQl499TlsSocket,
 probeQl499ActualTls,reviewQl499IndependentPathClaims,
 reviewQl499WithOriginalEvidence} from './ql499-original-path-probe.mjs';
const now=Date.now(),hex=c=>c.repeat(64);
const keys=Object.fromEntries(['owner','master','auditor','impostor'].map(n=>
 [n,generateKeyPairSync('ed25519')]));
const pem=n=>keys[n].publicKey.export({type:'spki',format:'pem'});
const signPacket=(payload,n)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[n].privateKey).toString('base64url')});
const cert=Buffer.alloc(512,13);
const fp=createHash('sha256').update(cert).digest('hex');
const url='https://master.private.rosevear.internal/internal/comms/master-delivery-trial';
function fakeSocket(changes={}){
 return {encrypted:true,authorized:true,getProtocol:()=> 'TLSv1.3',
  getPeerCertificate:()=>({raw:cert}),...changes};
}
const observe=()=>inspectQl499TlsSocket({socket:fakeSocket(),
 endpointUrl:url,expectedServerCertificateSha256:fp,observedAtMs:now});
function fixture(changes={}){
 const localProbe=observe();
 const ql498Result={state:'QL498_GENUINE_SIGNED_EVIDENCE_REVIEW_HELD',
  signedRuntimeEvidenceDigest:hex('a'),
  ceremonyId:'ceremony_ql499_001',trialId:'trial_ql499_001'};
 const base={schema:QL499_PATH_SCHEMA,ceremonyId:ql498Result.ceremonyId,
  trialId:ql498Result.trialId,role:'original-windows-owner',
  actorId:'original_owner_499',endpointUrl:url,
  serverCertificateSha256:fp,localProbeDigest:localProbe.localProbeDigest,
  ql498RuntimeEvidenceDigest:ql498Result.signedRuntimeEvidenceDigest,
  observationDigest:hex('1'),issuedAtMs:now-500,expiresAtMs:now+60000,
  requestedAction:'INDEPENDENT_NETWORK_PATH_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 const packet=(role,actorId,observationDigest,key,extra={})=>
  signPacket({...base,role,actorId,observationDigest,...extra},key);
 const witnessPackets={
  ownerPacket:packet('original-windows-owner','original_owner_499',hex('1'),
   changes.ownerSigner??'owner',changes.owner??{}),
  masterPacket:packet('master-operator','master_operator_499',hex('2'),
   changes.masterSigner??'master',changes.master??{}),
  auditorPacket:packet('independent-network-auditor','network_auditor_499',
   hex('3'),changes.auditorSigner??'auditor',changes.auditor??{})};
 const approvedPins={originalOwnerPublicKeyPem:pem('owner'),
  masterOperatorPublicKeyPem:pem('master'),
  networkAuditorPublicKeyPem:pem('auditor'),...changes.pins};
 return {ql498Result,localProbe,witnessPackets,approvedPins,now};
}
test('QL499 TLS socket validation is review-held even with synthetic authorized socket',()=>{
 const r=observe();
 assert.equal(r.state,'QL499_TLS13_SERVER_CERTIFICATE_PIN_OBSERVED_REVIEW_HELD');
 assert.equal(r.tls13PeerCertificateMatched,true);
 assert.equal(r.independentMasterNetworkPathCertified,false);
 assert.equal(r.deliveryCertified,false);
 assert.equal(r.httpRequestSent,false);
});
test('QL499 TLS rejects unpinned cert, unsigned original transport and wrong protocol',()=>{
 for(const s of [
  fakeSocket({authorized:false}),
  fakeSocket({encrypted:false}),
  fakeSocket({getProtocol:()=> 'TLSv1.2'}),
  fakeSocket({getPeerCertificate:()=>({})})
 ])assert.equal(inspectQl499TlsSocket({socket:s,endpointUrl:url,
  expectedServerCertificateSha256:fp}).state,'HOLD');
 assert.equal(inspectQl499TlsSocket({socket:fakeSocket(),endpointUrl:url,
  expectedServerCertificateSha256:hex('f')}).state,'HOLD');
 assert.equal(inspectQl499TlsSocket({socket:fakeSocket(),
  endpointUrl:'https://bad.example/internal/comms/master-delivery-trial',
  expectedServerCertificateSha256:fp}).state,'HOLD');
});
test('QL499 real probe refuses missing private mTLS material without any connection',async()=>{
 const r=await probeQl499ActualTls({endpointUrl:url,
  expectedServerCertificateSha256:fp});
 assert.equal(r.state,'HOLD');
 assert.equal(r.automaticNetworkSend,false);
});
test('QL499 distinct independent signed path witnesses are review only',()=>{
 const r=reviewQl499IndependentPathClaims(fixture());
 assert.equal(r.state,'QL499_SIGNED_CROSS_HOST_PATH_CLAIMS_REVIEW_HELD',
  JSON.stringify(r));
 assert.equal(r.threeDistinctPathSignaturesVerified,true);
 assert.equal(r.independentNetworkPathCertified,false);
 assert.equal(r.masterRuntimeActivationCertified,false);
});
test('QL499 denies forged keys, repeated actors, stale signatures and TLS pin drift',()=>{
 for(const c of [
  {ownerSigner:'impostor'}, {masterSigner:'impostor'},
  {auditorSigner:'impostor'},
  {auditor:{actorId:'original_owner_499'}},
  {auditor:{observationDigest:hex('1')}},
  {auditor:{role:'original-windows-owner'}},
  {auditor:{issuedAtMs:now-500000}},
  {owner:{expiresAtMs:now-5}},
  {master:{serverCertificateSha256:hex('a')}},
  {master:{localProbeDigest:hex('f')}},
  {auditor:{customerDataIncluded:true}},
  {owner:{authorityTransfer:true}},
  {pins:{networkAuditorPublicKeyPem:pem('owner')}}
 ])assert.equal(reviewQl499IndependentPathClaims(fixture(c)).state,
  'HOLD',JSON.stringify(c));
 const x=fixture();x.ql498Result.state='CERTIFIED';
 assert.equal(reviewQl499IndependentPathClaims(x).state,'HOLD');
 const y=fixture();y.witnessPackets.ownerPacket.signature='A'.repeat(86);
 assert.equal(reviewQl499IndependentPathClaims(y).state,'HOLD');
});
test('QL499 original evidence entrypoint rejects fabricated QL498 decision flags',()=>{
 const f=fixture();
 assert.equal(reviewQl499WithOriginalEvidence({ql498Evidence:{
   ql498Result:f.ql498Result},localProbe:f.localProbe,
   witnessPackets:f.witnessPackets,approvedPins:f.approvedPins,now}).state,'HOLD');
 assert.equal(reviewQl499WithOriginalEvidence({}).state,'HOLD');
});
test('QL499 Windows CLI status never probes network on CI',()=>{
 const cli=fileURLToPath(new URL('./ql499-original-host-cli.mjs',import.meta.url));
 const r=JSON.parse(execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'}));
 assert.equal(r.state,'QL499_ORIGINAL_HOST_MTLS_PROBE_NOT_EXECUTED');
 assert.equal(r.networkPathCertified,false);
 assert.equal(r.customerWrites,false);
 assert.equal(r.automaticNetworkSend,false);
 if(process.env.CI==='true'||process.platform!=='win32')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--probe'],{stdio:'pipe'}));
});
