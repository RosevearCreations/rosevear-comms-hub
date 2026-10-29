import test from 'node:test';
import assert from 'node:assert/strict';
import {QL257_RESPONSES,inspectQl257SixResponses,ql257VariableDestination}
  from '../ql257-six-response-config-routing.mjs';

test('six owner handoffs yield untrusted candidate signer, six missing proofs and no network',()=>{
  const out=inspectQl257SixResponses();
  assert.equal(out.queue.length,6);
  assert.equal(out.untrustedCandidateSigners,1);
  assert.equal(out.queue[0].nextAction,'INDEPENDENTLY_AUTHENTICATE_EXISTING_SIGNER_AND_CUSTODIAN');
  assert.equal(out.queue.filter(r=>r.originalProof==='PUBLIC_IMMUTABLE_404').length,6);
  assert.equal(out.ownerTestAuthorization,'NOT_GIVEN');
  assert.equal(out.realGatewayGets,0);
  assert.equal(out.connection,'DISCONNECTED');
});
test('reordered handoffs, fabricated custody or forged proof fail closed',()=>{
  const cases=[r=>{[r[0],r[1]]=[r[1],r[0]];},
    r=>{r[0].custodyAuthenticated=true;},
    r=>{r[2].originalProofHttpStatus=200;},
    r=>{r[1].proofB='a'.repeat(40);},
    r=>{r[4].ownerTestDecision='APPROVED';},
    r=>{r[0].candidatePublicSpkiSha256='untrusted';},
    r=>{r[3].secret='private';}];
  for(const mutate of cases){
    const rows=structuredClone(QL257_RESPONSES);mutate(rows);
    assert.equal(inspectQl257SixResponses(rows).status,'DENIED_RESPONSE_SCOPE_OR_FALSE_TRUST');
  }
});
test('Cloudflare build, GitHub Actions preview and private credentials route separately',()=>{
  assert.equal(ql257VariableDestination('VITE_SUPABASE_URL','cloudflare-production'),
    'CLOUDFLARE_WORKERS_BUILDS_VARIABLE');
  assert.equal(ql257VariableDestination('VITE_SUPABASE_URL','github-pages'),
    'GITHUB_ACTIONS_REPOSITORY_VARIABLE');
  assert.equal(ql257VariableDestination('ENABLE_GITHUB_PAGES_DISABLED_PREVIEW','github-pages'),
    'GITHUB_ACTIONS_REPOSITORY_VARIABLE');
  for(const name of ['DATABASE_URL','SUPABASE_SERVICE_ROLE_KEY',
    'YWI_QL256_SIGNER_PASSPHRASE','ROSEVEAR_INTEGRATION_HMAC_SECRET_V1']){
    assert.equal(ql257VariableDestination(name,'cloudflare-production'),
      'PRIVATE_APPROVED_SERVER_STORE_ONLY_NOT_STATIC_BUILD');
  }
  assert.equal(ql257VariableDestination('VITE_ENABLE_SUPABASE_CLIENT','cloudflare-production'),
    'KEEP_DISABLED_NO_CHANGE');
  assert.equal(ql257VariableDestination('ANY_SECRET_WHO_KNOWS','github-pages'),
    'NO_CHANGE_UNRECOGNIZED');
});
