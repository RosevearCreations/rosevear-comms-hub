import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {createEnrollmentRequest} from './ql340b-enrollment.mjs';
import {reviewOriginalOwnerEvidence,inspectOwnerReviewPacket,
  compareSignedRequestToReview,ql343Cli} from './ql343-owner-evidence-review.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const now=Date.parse('2026-11-06T02:07:15.000Z');
const source=createOwnerAuthorityCandidate({role:'source',keyId:'synthetic-source-ql343',
  passphrase:'synthetic-source-passphrase'});
const master=createOwnerAuthorityCandidate({role:'master',keyId:'synthetic-master-ql343',
  passphrase:'synthetic-master-passphrase'});
const deviceKeys=generateKeyPairSync('ed25519');
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKeys.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(deviceKeys.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const inert={schema:'rosevear.hub.ql342a.inert-rollback-drill.v1',
  state:'INERT_LOOPBACK_PROCESS_STOPPED_OWNER_REVIEW_REQUIRED',
  computer:'DESKTOP-AE894KC',startedAt:new Date(now-1500).toISOString(),
  stoppedAt:new Date(now).toISOString(),stoppedInertPid:54321,
  loopbackAddress:'127.0.0.1',loopbackPort:53535,
  challengeSha256:'a'.repeat(64),inertChildSha256:'b'.repeat(64),
  exactInertChallengeVerified:true,inertProcessExitObserved:true,
  loopbackPortClosedAfterStop:true,originalReceiverStopped:false,
  originalReceiverPortUsed:false,databaseCredentialsRead:false,
  originalOwnerSignaturesCreated:false,databaseEnrollmentCreated:false,
  customerCommunications:false,deviceActions:false,connected:false};

function fixture(){
  const base=mkdtempSync(join(tmpdir(),'ql343-field-'));
  const save=(name,value)=>{
    const path=join(base,name);
    mkdirSync(join(path,'..'),{recursive:true});
    writeFileSync(path,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
    return path;
  };
  save('ql339b-hub.public-candidate.json',device);
  save('OwnerAuthorities/source/source.public-candidate.json',source.publicCandidate);
  save('Imports/jack-master.public-candidate.json',master.publicCandidate);
  save('Evidence/windows-process-readback.json',JSON.stringify({schema:'synthetic.windows',
    note:'TEST-only process inventory no actual field authority'}));
  save('Evidence/private-tls-chain.json',JSON.stringify({schema:'synthetic.tls',
    note:'TEST-only TLS document not a trusted certificate'}));
  save('Evidence/tailnet-grants-readback.hujson',JSON.stringify({schema:'synthetic.policy',
    note:'TEST-only ACL sample never a field authorization'}));
  const rollback=save('Evidence/ql342a-inert-rollback-drill-2026-11-06T02-07-12-109Z.json',inert);
  return {base,rollback};
}

test('real shape candidate keys + four evidence files yield only a held review inventory',()=>{
  const {base}=fixture();
  const packet=reviewOriginalOwnerEvidence({base,now});
  assert.equal(packet.state,'EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED');
  assert.equal(packet.rollbackKind,'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP');
  assert.equal(packet.originalReceiverStopped,false);
  assert.equal(packet.requestMayBeSigned,false);
  assert.equal(packet.independentOriginalOwnerApproval,false);
  assert.equal(packet.sourceSigned,false);
  assert.equal(packet.masterSigned,false);
  assert.equal(packet.databaseEnrollmentCreated,false);
  assert.equal(packet.receiverActivated,false);
  assert.equal(packet.connected,false);
  assert.equal(packet.customerCommunications,false);
  assert.equal(packet.deviceActions,false);
  assert.equal(new Set(Object.values(packet.evidenceDigests)).size,4);
  const readback=inspectOwnerReviewPacket(packet);
  assert.equal(readback.validFormat,true);
  assert.equal(readback.independentHumanReviewRequired,true);
  assert.equal(readback.requestMayBeSigned,false);
});

test('missing, multiple or tampered evidence remains HOLD and never signs',()=>{
  const {base,rollback}=fixture();
  const other=join(base,'Evidence','ql342a-inert-rollback-drill-2026-11-06T02-08-12-109Z.json');
  writeFileSync(other,JSON.stringify(inert));
  const ambiguous=reviewOriginalOwnerEvidence({base,now});
  assert.equal(ambiguous.state,'HOLD_MISSING_OR_AMBIGUOUS_FIELD_EVIDENCE');
  assert.equal(ambiguous.drillFileCount,2);
  const exact=reviewOriginalOwnerEvidence({base,rollbackPath:rollback,now});
  assert.equal(exact.rollbackKind,'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP');
  const tampered=join(base,'Evidence','tampered.json');
  writeFileSync(tampered,JSON.stringify({...inert,originalReceiverStopped:true}));
  const untrusted=reviewOriginalOwnerEvidence({base,rollbackPath:tampered,now});
  assert.equal(untrusted.rollbackKind,'UNRECOGNIZED_ROLLBACK_WITNESS');
  assert.equal(untrusted.originalReceiverStopped,false);
  assert.equal(inspectOwnerReviewPacket({...exact,independentOriginalOwnerApproval:true}).validFormat,false);
  assert.equal(inspectOwnerReviewPacket({...exact,requestMayBeSigned:true}).validFormat,false);
  assert.equal(inspectOwnerReviewPacket({...exact,receiverActivated:true}).validFormat,false);
  assert.throws(()=>reviewOriginalOwnerEvidence({base,rollbackPath:'/tmp/not-private.json',now}),
    /DENY_ROLLBACK_FILE_OUTSIDE_PRIVATE_EVIDENCE_FOLDER/);
});

test('a 20-minute request can be compared by Jack without signing or making a trust claim',()=>{
  const {base}=fixture();
  const packet=reviewOriginalOwnerEvidence({base,now});
  const witnessHashes=packet.evidenceDigests;
  const request=createEnrollmentRequest({device,source:source.publicCandidate,
    master:master.publicCandidate,witnessHashes,now});
  const valid=compareSignedRequestToReview(request,packet,now+1000);
  assert.equal(valid.state,'PUBLIC_REQUEST_MATCHES_REVIEWED_HASHES_OWNER_DECISION_STILL_REQUIRED');
  assert.match(valid.payloadSha256,/^[a-f0-9]{64}$/);
  assert.equal(valid.requestMayBeSigned,false);
  assert.equal(valid.sourceSigned,false);
  assert.equal(valid.masterSigned,false);
  assert.equal(compareSignedRequestToReview({...request,payload:{...request.payload,
    rollbackWitnessSha256:'f'.repeat(64)}},packet,now+1000).state,
    'DENY_TEST_REQUEST_EVIDENCE_CHANGED');
  assert.equal(compareSignedRequestToReview(request,packet,now+1_300_000).state,
    'HOLD_INVALID_OR_EXPIRED_PUBLIC_SIGNING_REQUEST');
  assert.equal(compareSignedRequestToReview(request,{...packet,sourceSigned:true},now+1000).state,
    'HOLD_INVALID_OR_EXPIRED_PUBLIC_SIGNING_REQUEST');
});

test('CLI help has no authorization path; non-original Windows hosts cannot stage owner evidence',async()=>{
  const help=await ql343Cli(['--help']);
  assert.equal(help.originalOwnerSigning,false);
  assert.equal(help.networkRequests,0);
  assert.equal(help.databaseMutations,0);
  assert.equal(help.receiverActivated,false);
  await assert.rejects(ql343Cli(['--review-local'],{
    COMPUTERNAME:'CI-RUNNER',LOCALAPPDATA:'/tmp'}),/HOLD_ORIGINAL_REE_WINDOWS_OWNER_HOST_REQUIRED/);
  await assert.rejects(ql343Cli(['--stage-local'],{
    COMPUTERNAME:'DESKTOP-AE894KC',LOCALAPPDATA:'/tmp',DATABASE_URL:'synthetic'}),
    /HOLD_ORIGINAL_REE_WINDOWS_OWNER_HOST_REQUIRED|HOLD_/);
  await assert.rejects(ql343Cli(['--sign','source','arbitrary']),
    /DENY_UNSUPERVISED_OR_UNKNOWN_OWNER_ENROLLMENT_ACTION/);
});

test('Jack can read the same public review and compare a request with no private signer or network',async()=>{
  const {base}=fixture(),packet=reviewOriginalOwnerEvidence({base,now});
  const request=createEnrollmentRequest({device,source:source.publicCandidate,
    master:master.publicCandidate,witnessHashes:packet.evidenceDigests,now:Date.now()});
  const packetPath=join(base,'review-to-Jack.json'),requestPath=join(base,'request-to-Jack.json');
  writeFileSync(packetPath,JSON.stringify(packet));
  writeFileSync(requestPath,JSON.stringify(request));
  const inspected=await ql343Cli(['--inspect-stage',packetPath]);
  assert.equal(inspected.validFormat,true);
  assert.equal(inspected.independentOriginalOwnerApproval,false);
  const compared=await ql343Cli(['--compare-request',requestPath,packetPath]);
  assert.equal(compared.state,'PUBLIC_REQUEST_MATCHES_REVIEWED_HASHES_OWNER_DECISION_STILL_REQUIRED');
  assert.equal(compared.sourceSigned,false);
  assert.equal(compared.masterSigned,false);
  assert.equal(compared.receiverActivated,false);
  assert.equal(compared.connected,false);
});
