import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {SOURCES,inspectManifest,sourceManifestUrl,discoverSource,compareManifest,payloadForSigning} from './manifest.mjs';
const locations={yw:'../../../../yw/public',icamp:'../../../../iCamp/public',rosiedazzlers:'../../../../rosiedazzlers',
  devilndove:'../../../../devilndove-site','ai-data-platform':'../../../../ai-data-platform/apps/web/public',
  'rosevear-ai-hub':'../../../../rosevear-ai-hub/apps/web/public'};
// CI clones only Comms Hub; immutable fixture establishes contract without a cross-repo checkout.
const fixture=JSON.parse(readFileSync(new URL('./fixture.json',import.meta.url)));
test('all six identities reconcile and no unsigned discovery grants connectivity',()=>{
  assert.equal(Object.keys(SOURCES).length,6);
  for(const [id,s] of Object.entries(SOURCES)){
    const m={...structuredClone(fixture),source_id:id,source_app_id:s.app,source_role:s.role,
      repository:`RosevearCreations/${s.repo}`,issuer:s.app,tenant_boundary:s.boundary,
      legacy_integration_v1:{...fixture.legacy_integration_v1,app_id:s.app}};
    assert.equal(inspectManifest(m).status,'DISCOVERED_UNSIGNED_HELD');
  }
  assert.equal(locations.yw,'../../../../yw/public');
});
test('missing, surplus, privileged, wrong issuer, audience, tenant and origin deny',()=>{
  for(const change of [m=>{delete m.failure_behavior},m=>{m.secret='token'},
    m=>{m.issuer='icamp'},m=>{m.audience='owned-child'},m=>{m.tenant_boundary='tenant'},
    m=>{m.transport.origin='https://attacker.invalid'},m=>{m.transport.redirects='FOLLOW'},
    m=>{m.legacy_integration_v1.allowed_paths.push('/api/customers')},
    m=>{m.legacy_integration_v1.app_id='yw'},m=>{m.manifest_version='2.0.0'},
    m=>{m.requested_scope='customer_read'},m=>{m.source_id='unknown'}]){
    const m=structuredClone(fixture);change(m);assert.match(inspectManifest(m).status,/^DENY_/);
  }
});
test('detached signature uses separately pinned public key and cannot itself authorize source',()=>{
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const m=structuredClone(fixture);
  m.signature={algorithm:'Ed25519',key_id:'source-key-receipted-1',value:'',state:'SIGNED'};
  m.signature.value=sign(null,payloadForSigning(m),privateKey).toString('base64url');
  const pin={sourceId:'yw',issuer:'yard-workers',keyId:m.signature.key_id,publicKeyPem:publicKey.export({format:'pem',type:'spki'}),
    independentlyVerified:true,approvedSourceOwner:true,originalProofB:true};
  assert.equal(inspectManifest(m).status,'NO_INDEPENDENT_TRUST_PIN_HELD');
  assert.equal(inspectManifest(m,pin).status,'SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD');
  assert.equal(inspectManifest({...m,source_revision:'a'.repeat(40)},pin).status,'DENY_INVALID_SIGNATURE');
  assert.equal(inspectManifest(m,{...pin,approvedSourceOwner:false}).verified,false);
});
test('pinned only immutable GitHub raw path and denies redirects, 404,409,429,5xx',async()=>{
  const sha='a'.repeat(40),url=sourceManifestUrl('yw',sha);
  assert.ok(url.endsWith(`${sha}/public/.well-known/rosevear-integration-manifest.json`));
  assert.throws(()=>sourceManifestUrl('yw','dev'));
  for(const status of [302,404,409,429,500,503]){
    const result=await discoverSource('yw',sha,async()=>({status}));
    assert.equal(result.connected,false);
  }
  assert.equal((await discoverSource('yw',sha,async()=>({status:200,url:'https://evil.invalid',arrayBuffer:async()=>Buffer.from('{}')}))).status,'DENY_REDIRECT');
  const valid=await discoverSource('yw',sha,async()=>({status:200,url,arrayBuffer:async()=>Buffer.from(JSON.stringify(fixture))}));
  assert.equal(valid.status,'DISCOVERED_UNSIGNED_HELD');
  assert.equal(valid.manifestSha256.length,64);
});
test('schema drift proposes, incompatible identity denies, replay cannot escalate',()=>{
  assert.equal(compareManifest(fixture,fixture).status,'NO_DRIFT_HELD');
  assert.equal(compareManifest(fixture,{...fixture,source_revision:'a'.repeat(40)}).status,'COMPATIBLE_PROPOSAL_REVIEW_REQUIRED_HELD');
  assert.equal(compareManifest(fixture,{...fixture,manifest_version:'2.0.0'}).status,'INCOMPATIBLE_REVIEW_REQUIRED_HELD');
  assert.equal(inspectManifest({...fixture,connection_state:'CONNECTED'}).verified,false);
});
