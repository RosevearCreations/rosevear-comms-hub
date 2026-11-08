import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPublicKey,generateKeyPairSync} from 'node:crypto';
import {SOURCES} from '../master-discovery/manifest.mjs';
import {QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {createQl366TestIntent,inspectQl366TestIntent,
  signQl366OwnerIntent,verifyQl366TwoOriginalOwners,
  inspectQl366OfflineSignatures,createQl366OnePrivateTestGate}
  from './ql366-owner-controlled-private-test.mjs';
import {ql366Cli} from './ql366-original-owner-test-cli.mjs';

const SHA='a'.repeat(64),COMMIT='b'.repeat(40);
function intent(sourceId='yw',issuedAt=Date.now()){
  return createQl366TestIntent({sourceId,sourceCommitSha:COMMIT,
    manifestSha256:SHA,contractSha256:'c'.repeat(64),
    sourceOrigin:'https://private.example.test',tlsSpkiSha256:'d'.repeat(64),
    issuedAt});
}

test('six exact source shells use a distinct narrow private TEST scope',()=>{
  for(const sourceId of Object.keys(SOURCES)){
    const one=intent(sourceId),checked=inspectQl366TestIntent(one);
    assert.equal(checked.valid,true);
    assert.equal(one.organizationId,'rosevear-creations');
    assert.equal(one.sourceAppId,SOURCES[sourceId].app);
    assert.equal(one.tenantBoundary,SOURCES[sourceId].boundary);
    assert.equal(one.method,'GET');
    assert.equal(one.path,'/api/integration/v1/shell/health');
    assert.equal(one.maxResponseBytes,4096);
    for(const key of ['automaticRetry','persistentConnectionAllowed',
      'customerDataAllowed','customerCommunications','deviceActions'])
      assert.equal(one[key],false,key);
  }
});

test('wrong scope, forged org, tenant substitution, origin and expiry deny',()=>{
  const one=intent('icamp');
  for(const changed of [
    {...one,organizationId:'camp-rosevear'},
    {...one,sourceId:'camp-rosevear'},
    {...one,tenantBoundary:'child_tenant'},
    {...one,customerDataAllowed:true},
    {...one,path:'/api/customers'},
    {...one,sourceOrigin:'http://private.example.test'},
    {...one,sourceCommitSha:'unverified'},
    {...one,automaticRetry:true},
    {...one,extraAuthorization:true}
  ])assert.equal(inspectQl366TestIntent(changed).valid,false);
  assert.equal(inspectQl366TestIntent(one,Date.parse(one.expiresAt)).valid,false);
});

test('original owner signers cannot be replaced by synthetic keys',async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  assert.throws(()=>signQl366OwnerIntent({intent:intent(),role:'source',
    localCandidate:{role:'source',keyId:QL365A_PINS.source.keyId,
      spkiSha256:QL365A_PINS.source.spkiSha256,
      publicKeyPem:publicKey.export({type:'spki',format:'pem'})},
    originalPublicBytes:Buffer.from('synthetic'),
    encryptedPrivateKeyPem:privateKey.export({type:'pkcs8',format:'pem'}),
    passphrase:'this is a synthetic passphrase'}),/DENY_QL366_NOT_ORIGINAL/);
  const denied=await verifyQl366TwoOriginalOwners({intent:intent(),
    approvals:{source:{},master:{}},
    resolveOriginalOwner:async()=>({role:'source',
      publicKeyPem:publicKey.export({type:'spki',format:'pem'})}),
    verifyOriginalOwnerCustody:async()=>({authenticated:true})});
  assert.equal(denied.approved,false);
  assert.equal(denied.connected,false);
  assert.equal(denied.connectionState,'DISCONNECTED / HOLD');
});

test('copied or unsigned owner approval files are never private authority',()=>{
  const denied=inspectQl366OfflineSignatures({intent:intent(),
    approvals:{source:{},master:{}},sourcePublic:{},masterPublic:{}});
  assert.equal(denied.valid,undefined);
  assert.equal(denied.privateTestAuthorized,false);
  assert.equal(denied.connected,false);
});

test('one-use gate fails closed before any private GET and denies replay',async()=>{
  let sends=0;
  const gate=createQl366OnePrivateTestGate({sourceAdapter:{
    sendSignedGet:async()=>{sends++;},
    verifySignedSourceReceipt:async()=>({})
  }});
  const one=intent();
  const missing=await gate.runOnce({intent:one});
  assert.equal(missing.state,'HOLD_QL366_ORIGINAL_PRIVATE_ADAPTERS_REQUIRED');
  const replay=await gate.runOnce({intent:one});
  assert.equal(replay.state,'DENY_QL366_REPLAYED_OR_MALFORMED_OPERATION');
  assert.equal(sends,0);
});

test('offline CLI never executes on CI or a nonoriginal laptop',async()=>{
  const help=await ql366Cli(['--help']);
  assert.equal(help.connected,false);
  assert.equal(help.privateTestAuthorized,false);
  await assert.rejects(ql366Cli(['--prepare']),/DENY_QL366_NONORIGINAL_OWNER_HOST/);
});

test('additive master org migration seeds only public pins and six held shells',()=>{
  const sql=readFileSync(new URL('../../supabase/migrations/20261108030735_rosevear_master_dual_owner_test_policy.sql',import.meta.url),'utf8');
  for(const sourceId of Object.keys(SOURCES))
    assert.match(sql,new RegExp(`'rosevear-creations','${sourceId}'`));
  for(const role of ['source','master']){
    assert.ok(sql.includes(QL365A_PINS[role].spkiSha256));
    assert.ok(sql.includes(QL365A_PINS[role].originalFileSha256));
  }
  assert.match(sql,/FORCE ROW LEVEL SECURITY/g);
  assert.match(sql,/REVOKE ALL ON TABLE/);
  assert.doesNotMatch(sql,/GRANT (INSERT|UPDATE|DELETE|ALL) ON TABLE/i);
  assert.match(sql,/PUBLIC_PIN_ONLY_NO_AUTH_SESSION/);
  assert.match(sql,/PENDING_VERIFIED_AUTH_USERS/);
  assert.match(sql,/DISCONNECTED \/ HOLD/);
});
