import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {createEnrollmentRequest,hashWitnessFiles} from './ql340b-enrollment.mjs';
import {QL355_ATTESTATION} from './ql355-independent-authority.mjs';
import {inspectQl356OwnerPublicRequest,inspectQl356IndependentIssuerPins,
  inspectQl356FirstFieldReceipt,ql356Cli} from './ql356-original-field-readback.mjs';

const now=Date.parse('2026-11-07T00:20:00Z');
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=createOwnerAuthorityCandidate({role:'source',keyId:'ree-source-ql356',
  passphrase:'synthetic-ree-custody-passphrase'});
const master=createOwnerAuthorityCandidate({role:'master',keyId:'jack-master-ql356',
  passphrase:'synthetic-jack-custody-passphrase'});
const devicePair=generateKeyPairSync('ed25519');
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:devicePair.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(devicePair.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const dir=mkdtempSync(join(tmpdir(),'ql356-original-'));
const evidencePaths={};
for(const label of ['windows','privateTls','tailnetAcl','rollback']){
  const path=join(dir,`${label}.json`);
  writeFileSync(path,JSON.stringify({syntheticWitnessOnly:true,role:label,unique:sha(label)}));
  evidencePaths[label]=path;
}
const request=createEnrollmentRequest({device,source:source.publicCandidate,
  master:master.publicCandidate,witnessHashes:hashWitnessFiles(evidencePaths),now});
const review=options=>inspectQl356OwnerPublicRequest({request,
  localCandidate:source.publicCandidate,role:'source',evidencePaths,now,...options});

test('Ree can verify real bytes and local public pin without ever authorizing enrollment',()=>{
  const r=review();
  assert.equal(r.requestReviewed,true);
  assert.equal(r.localOwnerPublicPinMatches,true);
  assert.equal(r.originalWitnessBytesMatch,true);
  assert.equal(r.databaseEnrollmentVerified,false);
  assert.equal(r.originalIssuerAuthenticated,false);
  assert.equal(r.connected,false);
  assert.equal(r.receiverActivated,false);
  assert.equal(r.payloadSha256,sha(canonicalize(request.payload)));
});

test('Jack sees exactly his own pinned master key but cannot claim original witness bytes',()=>{
  const r=review({role:'master',localCandidate:master.publicCandidate,
    evidencePaths:undefined});
  assert.equal(r.localOwnerPublicPinMatches,true);
  assert.equal(r.requestReviewed,false);
  assert.match(r.state,/REMOTE_ORIGINAL_WITNESS_BYTES_NOT_REVIEWED/);
  assert.notEqual(review({role:'master',localCandidate:source.publicCandidate}).localOwnerPublicPinMatches,true);
});

test('changed witness bytes, mismatched owner pin or expired request deny field review',()=>{
  const changed=join(dir,'changed.json');
  writeFileSync(changed,JSON.stringify({different:true,bytes:'X'.repeat(60)}));
  assert.match(review({evidencePaths:{...evidencePaths,rollback:changed}}).state,/DENY_ORIGINAL_FOUR_WITNESS_BYTES_CHANGED/);
  const other=createOwnerAuthorityCandidate({role:'source',keyId:'some-other-source',
    passphrase:'synthetic-another-source-owner'});
  assert.match(review({localCandidate:other.publicCandidate}).state,/DENY_OWNER_KEY/);
  assert.equal(review({now:now+1_201_000}).requestReviewed,false);
  assert.equal(ql356Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql356Cli(['--sign']),/DENY_UNSUPERVISED_QL356/);
});

test('two independently signed and pinned issuer/witness records clear only custody review',async()=>{
  const signer={original_issuer:generateKeyPairSync('ed25519'),
    field_witness:generateKeyPairSync('ed25519')};
  const keys={};
  const hash=sha(canonicalize(request.payload));
  for(const role of Object.keys(signer))keys[role]={role,
    spkiSha256:sha(signer[role].publicKey.export({type:'spki',format:'der'})),
    publicKeyPem:signer[role].publicKey.export({type:'spki',format:'pem'})};
  const attest=role=>{
    const payload={schema:QL355_ATTESTATION,role,
      audience:'rosevear-comms-hub:original-enrollment:TEST',
      enrollmentPayloadSha256:hash,scope:'one-original-device-test-only',
      issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+90_000).toISOString()};
    return {schema:QL355_ATTESTATION,payload,
      signature:sign(null,Buffer.from(canonicalize(payload)),signer[role].privateKey)
        .toString('base64url')};
  };
  const opts={request,issuerAttestation:attest('original_issuer'),
    witnessAttestation:attest('field_witness'),
    resolvePinnedAuthority:async role=>keys[role],
    verifyIndependentCustody:async({role,spkiSha256,requestSha256})=>({
      role,spkiSha256,requestSha256,authenticated:true,revoked:false}),now};
  const result=await inspectQl356IndependentIssuerPins(opts);
  assert.equal(result.originalIssuerAuthenticated,true);
  assert.equal(result.independentWitnessAuthenticated,true);
  assert.equal(result.ownersIndependentlyApproved,false);
  assert.equal(result.databaseEnrollmentVerified,false);
  assert.equal(result.connected,false);
  const fake=await inspectQl356IndependentIssuerPins({...opts,
    verifyIndependentCustody:async()=>({authenticated:true})});
  assert.equal(fake.originalIssuerAuthenticated,false);
  const samePin=await inspectQl356IndependentIssuerPins({...opts,
    resolvePinnedAuthority:async()=>keys.original_issuer});
  assert.equal(samePin.independentWitnessAuthenticated,false);
});

test('without authenticated operator, transport and original device receipt TEST remains HOLD',async()=>{
  const r=await inspectQl356FirstFieldReceipt({});
  assert.equal(r.firstPrivateTestAccepted,false);
  assert.equal(r.receiverActivated,false);
  assert.equal(r.connectionState,'DISCONNECTED / HOLD');
});
