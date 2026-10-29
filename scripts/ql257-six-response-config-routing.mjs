/**
 * QL-257: reconcile owner-forwarded six QL-256 handoffs against a dated public
 * GitHub-only proof check. No environment writes, credential storage, runtime
 * probing, key generation, identity verification or gateway requests.
 */
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';

export const QL257_RELEASE = 'ql257-six-app-real-signer-returns-static-build-variable-routing-held-v1';
export const QL257_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
export const QL257_OBSERVED_DATE = '2026-10-29';
export const QL257_RESPONSES = Object.freeze([
  {system:'ai-data-platform',repository:'ai-data-platform',
    mainSha:'15ccd72f098b6238d4b1d357a97676d6a2836df2',
    auditedSourceSha:'15ccd72f098b6238d4b1d357a97676d6a2836df2',
    reportedSigner:'SIGNER_EXISTS_CUSTODY_NOT_VERIFIED',
    candidatePublicSpkiSha256:'d16f21ab82c12760c88b1cdaa7d2fe7491148e9efd4a8762c4a0e9be137311c6'},
  {system:'devilndove',repository:'devilndove-site',
    mainSha:'58713dcaaac487eb5b9634e9e21e42aa83ea436e',
    auditedSourceSha:'340d6da39abed229094527dfc91a7fd423fabd02',
    reportedSigner:'SIGNER_STATUS_UNKNOWN',candidatePublicSpkiSha256:null},
  {system:'rosiedazzlers',repository:'rosiedazzlers',
    mainSha:'4da5a7fc78cf3dec21852f7fb79907e45f779279',
    auditedSourceSha:'79751649527a3b4a887ce252f8a1c5b93a9434bd',
    reportedSigner:'SIGNER_STATUS_UNKNOWN',candidatePublicSpkiSha256:null},
  {system:'yw',repository:'yw',
    mainSha:'eb4b5baa6fbca39165c630ba71e3839e82df19e7',
    auditedSourceSha:'2c7b07037beb1b0ac239eb1b994cb6a87fd1923e',
    reportedSigner:'SIGNER_STATUS_UNKNOWN',candidatePublicSpkiSha256:null},
  {system:'icamp',repository:'iCamp',
    mainSha:'d04bcaba6adbd551db0a66ec9cf363919bae1088',
    auditedSourceSha:'32b7c466ad34f7018863c8b837f94c5a3b1103a5',
    reportedSigner:'SIGNER_STATUS_UNKNOWN',candidatePublicSpkiSha256:null},
  {system:'rosevear-ai-hub',repository:'rosevear-ai-hub',
    mainSha:'b992fdf6a30c62ad627f561c3808f39d4bf6f816',
    auditedSourceSha:'9cac2ebcb386bec7dfcf2379acb0998c531c6aa1',
    reportedSigner:'SIGNER_STATUS_UNKNOWN',candidatePublicSpkiSha256:null}
].map(row=>Object.freeze({...row,originalProofHttpStatus:404,
  custodyAuthenticated:false,proofB:null,ownerTestDecision:'NOT_GIVEN'})));

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const FIELDS=['system','repository','mainSha','auditedSourceSha','reportedSigner',
  'candidatePublicSpkiSha256','originalProofHttpStatus','custodyAuthenticated',
  'proofB','ownerTestDecision'];
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.getPrototypeOf(v)===Object.prototype&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const held=(status,extra={})=>Object.freeze({
  release:QL257_RELEASE,status,...extra,
  originalPublicProofsVerified:0,authenticatedCustodians:0,
  ownerTestAuthorization:'NOT_GIVEN',realGatewayGets:0,
  privateRelayRunning:false,connection:'DISCONNECTED',livePilotHolds:12,
  writes:0,calls:0,sms:0,dispatch:0
});

/** A candidate public key and a green deployment are never trusted custody. */
export function inspectQl257SixResponses(rows=QL257_RESPONSES){
  if(!Array.isArray(rows)||rows.length!==6||!QL247_SOURCES.every((source,i)=>{
    const r=rows[i];
    return exact(r,FIELDS)&&r.system===source.system&&r.repository===source.repository&&
      SHA.test(r.mainSha||'')&&SHA.test(r.auditedSourceSha||'')&&
      ['SIGNER_STATUS_UNKNOWN','SIGNER_EXISTS_CUSTODY_NOT_VERIFIED',
        'SIGNER_NOT_PROVISIONED'].includes(r.reportedSigner)&&
      (r.candidatePublicSpkiSha256===null||HEX.test(r.candidatePublicSpkiSha256||''))&&
      r.originalProofHttpStatus===404&&r.custodyAuthenticated===false&&
      r.proofB===null&&r.ownerTestDecision==='NOT_GIVEN';
  }))return held('DENIED_RESPONSE_SCOPE_OR_FALSE_TRUST');
  const queue=rows.map(r=>Object.freeze({
    system:r.system,repository:r.repository,checkedMainSha:r.mainSha,
    reportedAuditedSourceSha:r.auditedSourceSha,
    mainAdvancedPastAuditedSource:r.mainSha!==r.auditedSourceSha,
    signerDisposition:r.reportedSigner,
    candidatePublicFingerprint:r.candidatePublicSpkiSha256===null
      ?'NOT_AVAILABLE':'UNTRUSTED_CANDIDATE_ONLY',
    originalProof:'PUBLIC_IMMUTABLE_404',
    nextAction:r.reportedSigner==='SIGNER_EXISTS_CUSTODY_NOT_VERIFIED'
      ?'INDEPENDENTLY_AUTHENTICATE_EXISTING_SIGNER_AND_CUSTODIAN'
      :'OWNER_SELECT_PRIVATE_CUSTODIAN_AND_VERIFY_REAL_SIGNER_STATUS'
  }));
  return held('SIX_RESPONSES_RECONCILED_SIGNER_CUSTODY_AND_ORIGINAL_PROOF_HELD',
    {queue:Object.freeze(queue),untrustedCandidateSigners:queue.filter(
      row=>row.candidatePublicFingerprint==='UNTRUSTED_CANDIDATE_ONLY').length});
}

const RUNTIME_SECRETS=new Set(['DATABASE_URL','DATABASE_READONLY_URL',
  'SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','INTAKE_SHARED_SECRET',
  'ROSEVEAR_INTEGRATION_HMAC_SECRET_V1','ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64',
  'ED25519_PRIVATE_KEY','QL256_SIGNER_PRIVATE_KEY','YWI_QL256_SIGNER_PASSPHRASE']);
const PUBLIC_BUILD=new Set(['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_DEFAULT_BRAND','VITE_STORAGE_KEY']);
const DISABLED_FLAGS=new Set(['VITE_ENABLE_SUPABASE_CLIENT','VITE_ENABLE_HOSTED_DATABASE',
  'VITE_ENABLE_SUPABASE_LIVE_READS','VITE_ENABLE_SUPABASE_LIVE_WRITES',
  'VITE_QL_ENABLE_SUPABASE_READS','ENABLE_PROTECTED_INTAKE_ENDPOINT']);

/** Returns routing advice only; it never sets environment variables. */
export function ql257VariableDestination(name,target){
  if(typeof name!=='string'||typeof target!=='string')
    return 'NO_CHANGE_UNRECOGNIZED';
  if(RUNTIME_SECRETS.has(name)||name.includes('PRIVATE_KEY')||
    name.includes('HMAC_SECRET'))return 'PRIVATE_APPROVED_SERVER_STORE_ONLY_NOT_STATIC_BUILD';
  if(DISABLED_FLAGS.has(name))return 'KEEP_DISABLED_NO_CHANGE';
  if(name==='ENABLE_GITHUB_PAGES_DISABLED_PREVIEW')
    return target==='github-pages'?'GITHUB_ACTIONS_REPOSITORY_VARIABLE':'NO_CHANGE_WRONG_TARGET';
  if(PUBLIC_BUILD.has(name))
    return target==='cloudflare-production'?'CLOUDFLARE_WORKERS_BUILDS_VARIABLE'
      :target==='github-pages'?'GITHUB_ACTIONS_REPOSITORY_VARIABLE'
      :'NO_CHANGE_WRONG_TARGET';
  return 'NO_CHANGE_UNRECOGNIZED';
}
