/** QL-365D — two-original-owner, one-source, OFFLINE first-private-TEST review.
 * A signed proposal is NEVER QL-355 original issuer/witness verification,
 * a QL-354 enrollment permit, a QL-362 GET grant or receiver activation.
 * Real independent evidence must be obtained from original private services.
 */
import {createHash,createPrivateKey,createPublicKey,randomBytes,randomUUID,sign,verify}
  from 'node:crypto';
import {canonicalize,SOURCES} from '../master-discovery/manifest.mjs';
import {inspectQl365aPinnedOwner,QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {verifyQl365bOwnerReviews} from './ql365b-original-reconciliation.mjs';
import {QL365C_CUSTODY,assessQl365cSupervisedTestPreflight}
  from './ql365c-reviewer-custody.mjs';
import {QL363_PATH,verifyQl363SourceHealthContract}
  from './ql363-six-source-health-adapters.mjs';

export const QL365D_REQUEST='rosevear.hub.ql365d.one-source-owner-test-review.v1';
export const QL365D_APPROVAL='rosevear.hub.ql365d.original-owner-review-signature.v1';
export const QL365D_SIGNED='rosevear.hub.ql365d.dual-owner-first-test-review.v1';
export const QL365D_RESULT='rosevear.hub.ql365d.first-private-test-review-gate.v1';
const SHA=/^[a-f0-9]{64}$/;
const NONCE=/^[a-f0-9]{32}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sha=v=>createHash('sha256').update(v).digest('hex');
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const same=(a,b)=>a!==undefined&&b!==undefined&&canonicalize(a)===canonicalize(b);
const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&
  new Date(Date.parse(v)).toISOString()===v?Date.parse(v):NaN;
const domain=role=>`rosevear.hub.ql365d.one-source-first-test-review.${role}:`;
const hold=(state,extra={})=>({schema:QL365D_RESULT,state,valid:false,
  dualOriginalOwnerSignaturesVerified:false,
  originalIssuerAuthenticated:false,independentWitnessAuthenticated:false,
  legacyQl355Satisfied:false,originalDatabaseEnrollmentVerified:false,
  privateTestAuthorized:false,oneSourceGetAuthorized:false,
  sourceConnectionAuthorized:false,receiverActivated:false,
  sixAppGrantsAuthorized:false,customerCommunications:false,
  deviceActions:false,connected:false,connectionState:'DISCONNECTED / HOLD',...extra});

function custodyShape(custody){
  const body=custody?.payload;
  return custody?.schema===QL365C_CUSTODY&&body?.schema===QL365C_CUSTODY&&
    body.scope==='append-only-review-evidence-no-private-test-permit'&&
    body.decision==='FILE_VERIFIED_OFFLINE_DECISIONS_ONLY'&&
    body.receiverActivationAuthorized===false&&
    body.databaseEnrollmentAuthorized===false&&
    typeof custody.signature==='string'&&/^[0-9A-Za-z_-]{86}$/.test(custody.signature);
}

/** Makes a public 90-second one-source proposal only; the QL-365C receipt is
 * hash-bound here but NOT independently verified until the private gate below.
 */
export function createQl365dFirstTestRequest({sourceId,candidate,sourceReview,
  masterReview,custodyReceipt,now=Date.now(),nonce=randomBytes(16).toString('hex'),
  operationId=randomUUID(),pins=QL365A_PINS}={}){
  const original=verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,now,pins});
  if(!original.valid)throw Error('HOLD_QL365D_ORIGINAL_QL365A_B_SIGNED_REVIEW_REQUIRED');
  if(!Object.hasOwn(SOURCES,sourceId)||!custodyShape(custodyReceipt)||
    !NONCE.test(nonce)||!UUID.test(operationId)||
    now+90_000>time(candidate.request.payload.expiresAt))
    throw Error('DENY_QL365D_ONE_SOURCE_FRESH_OFFLINE_CONTEXT_REQUIRED');
  const payload={schema:QL365D_REQUEST,
    mode:'DUAL_OWNER_ONE_SOURCE_TEST_REVIEW_PROPOSAL_ONLY',
    audience:'rosevear-comms-hub:ql365d:one-source-offline-TEST',
    environment:'TEST',sourceId,repository:`RosevearCreations/${SOURCES[sourceId].repo}`,
    sourceAppId:SOURCES[sourceId].app,tenantBoundary:SOURCES[sourceId].boundary,
    method:'GET',path:QL363_PATH,maxResponseBytes:4096,
    redirects:'DENY',automaticRetry:false,
    operationId,candidateSha256:original.candidateSha256,
    sourceReviewSha256:original.sourceReviewSha256,
    masterReviewSha256:original.masterReviewSha256,
    ql365cCustodySha256:sha(canonicalize(custodyReceipt)),
    externalCustodyIndependentlyVerified:false,
    originalIssuerAuthenticated:false,originalFieldWitnessAuthenticated:false,
    databaseEnrollmentAuthorized:false,receiverActivated:false,
    sourceGetAuthorized:false,sixAppGrantsAuthorized:false,
    customerCommunications:false,deviceActions:false,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+90_000).toISOString(),nonce};
  return {schema:QL365D_REQUEST,payload,
    state:'PUBLIC_UNSIGNED_FIRST_TEST_REVIEW_ONLY_NOT_AN_AUTHORIZATION',
    receiverActivated:false,databaseEnrollmentAuthorized:false,connected:false};
}

/** Checks exact request scope, original owner-review bytes, custody hash,
 * expiry and source-shell boundary without trusting a JSON approval flag.
 */
export function inspectQl365dFirstTestRequest({request,candidate,sourceReview,
  masterReview,custodyReceipt,now=Date.now(),pins=QL365A_PINS}={}){
  const original=verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,now,pins});
  if(!original.valid)return hold('HOLD_QL365D_ORIGINAL_SIGNED_OWNER_CHAIN_MISSING');
  const p=request?.payload,s=SOURCES[p?.sourceId];
  if(!exact(request,['schema','payload','state','receiverActivated',
    'databaseEnrollmentAuthorized','connected'])||request.schema!==QL365D_REQUEST||
    request.state!=='PUBLIC_UNSIGNED_FIRST_TEST_REVIEW_ONLY_NOT_AN_AUTHORIZATION'||
    request.receiverActivated!==false||request.databaseEnrollmentAuthorized!==false||
    request.connected!==false||
    !exact(p,['schema','mode','audience','environment','sourceId','repository',
      'sourceAppId','tenantBoundary','method','path','maxResponseBytes',
      'redirects','automaticRetry','operationId','candidateSha256',
      'sourceReviewSha256','masterReviewSha256','ql365cCustodySha256',
      'externalCustodyIndependentlyVerified','originalIssuerAuthenticated',
      'originalFieldWitnessAuthenticated','databaseEnrollmentAuthorized',
      'receiverActivated','sourceGetAuthorized','sixAppGrantsAuthorized',
      'customerCommunications','deviceActions','issuedAt','expiresAt','nonce'])||
    p.schema!==QL365D_REQUEST||
    p.mode!=='DUAL_OWNER_ONE_SOURCE_TEST_REVIEW_PROPOSAL_ONLY'||
    p.audience!=='rosevear-comms-hub:ql365d:one-source-offline-TEST'||
    p.environment!=='TEST'||!s||
    p.repository!==`RosevearCreations/${s.repo}`||p.sourceAppId!==s.app||
    p.tenantBoundary!==s.boundary||p.method!=='GET'||p.path!==QL363_PATH||
    p.maxResponseBytes!==4096||p.redirects!=='DENY'||
    p.automaticRetry!==false||!UUID.test(p.operationId??'')||
    p.candidateSha256!==original.candidateSha256||
    p.sourceReviewSha256!==original.sourceReviewSha256||
    p.masterReviewSha256!==original.masterReviewSha256||
    !custodyShape(custodyReceipt)||
    p.ql365cCustodySha256!==sha(canonicalize(custodyReceipt))||
    [p.externalCustodyIndependentlyVerified,p.originalIssuerAuthenticated,
      p.originalFieldWitnessAuthenticated,p.databaseEnrollmentAuthorized,
      p.receiverActivated,p.sourceGetAuthorized,p.sixAppGrantsAuthorized,
      p.customerCommunications,p.deviceActions].some(x=>x!==false)||
    !NONCE.test(p.nonce??'')||!Number.isFinite(time(p.issuedAt))||
    !Number.isFinite(time(p.expiresAt))||
    time(p.expiresAt)-time(p.issuedAt)!==90_000||
    time(p.issuedAt)<time(candidate.request.payload.issuedAt)||
    time(p.issuedAt)>now+5_000||time(p.expiresAt)<=now||
    time(p.expiresAt)>time(candidate.request.payload.expiresAt))
    return hold('DENY_QL365D_CHANGED_STALE_OR_BROAD_TEST_REVIEW');
  return hold('SINGLE_SOURCE_PUBLIC_REVIEW_DIGEST_VERIFIED_NOT_AUTHORIZED',{
    valid:true,sourceId:p.sourceId,operationId:p.operationId,
    requestSha256:sha(canonicalize(p)),expiresAt:p.expiresAt});
}

/** The original-Windows-only CLI enforces role, actual local public bytes,
 * encrypted owner-key custody and interactive confirmation before calling this.
 * Production CLI never accepts synthetic pin overrides.
 */
export function signQl365dOwnerReview({request,candidate,sourceReview,masterReview,
  custodyReceipt,role,localCandidate,originalPublicBytes,
  encryptedPrivateKeyPem,passphrase,now=Date.now(),pins=QL365A_PINS}={}){
  const check=inspectQl365dFirstTestRequest({request,candidate,sourceReview,
    masterReview,custodyReceipt,now,pins});
  if(!check.valid)throw Error(check.state);
  if(!['source','master'].includes(role)||!Buffer.isBuffer(originalPublicBytes))
    throw Error('DENY_QL365D_SEPARATE_ORIGINAL_OWNER_REQUIRED');
  const local=inspectQl365aPinnedOwner(localCandidate,role,
    {originalBytes:originalPublicBytes,pins});
  if(!local.verified||
    localCandidate.publicKeyPem!==candidate.request.payload.ownerPins[role].publicKeyPem||
    typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_QL365D_LOCAL_ORIGINAL_PIN_OR_PASSPHRASE');
  let key;
  try{key=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_QL365D_ORIGINAL_PRIVATE_KEY_DECRYPTION');}
  if(key.asymmetricKeyType!=='ed25519'||
    sha(createPublicKey(key).export({format:'der',type:'spki'}))!==local.spkiSha256)
    throw Error('DENY_QL365D_PRIVATE_KEY_NOT_ORIGINAL_PIN');
  return {schema:QL365D_APPROVAL,role,keyId:local.keyId,
    requestSha256:check.requestSha256,
    signature:sign(null,Buffer.from(domain(role)+canonicalize(request.payload)),key)
      .toString('base64url')};
}

export function verifyQl365dDualOwnerReview({request,candidate,sourceReview,
  masterReview,custodyReceipt,sourceApproval,masterApproval,now=Date.now(),
  pins=QL365A_PINS}={}){
  const check=inspectQl365dFirstTestRequest({request,candidate,sourceReview,
    masterReview,custodyReceipt,now,pins});
  if(!check.valid)return check;
  for(const [role,approval] of [['source',sourceApproval],['master',masterApproval]]){
    if(!exact(approval,['schema','role','keyId','requestSha256','signature'])||
      approval.schema!==QL365D_APPROVAL||approval.role!==role||
      approval.keyId!==pins[role].keyId||
      approval.requestSha256!==check.requestSha256||
      !/^[A-Za-z0-9_-]{86}$/.test(approval.signature??''))
      return hold(`DENY_QL365D_${role.toUpperCase()}_SIGNER_SCOPE`);
    try{
      const sig=Buffer.from(approval.signature,'base64url');
      if(sig.length!==64||!verify(null,
        Buffer.from(domain(role)+canonicalize(request.payload)),
        createPublicKey(candidate.request.payload.ownerPins[role].publicKeyPem),sig))
        return hold(`DENY_QL365D_${role.toUpperCase()}_SIGNATURE`);
    }catch{return hold(`DENY_QL365D_${role.toUpperCase()}_SIGNATURE`);}
  }
  return hold('TWO_ORIGINAL_OWNERS_SIGNED_ONE_SOURCE_REVIEW_NO_TEST_PERMISSION',{
    valid:true,dualOriginalOwnerSignaturesVerified:true,
    sourceId:check.sourceId,operationId:check.operationId,
    requestSha256:check.requestSha256,expiresAt:check.expiresAt});
}

export function assembleQl365dSignedReview(args={}){
  const result=verifyQl365dDualOwnerReview(args);
  if(!result.valid)throw Error(result.state);
  return {schema:QL365D_SIGNED,request:args.request,
    approvals:{source:args.sourceApproval,master:args.masterApproval},
    state:'DUAL_OWNER_FIRST_TEST_REVIEW_ONLY_EXTERNAL_AUTHORITY_REQUIRED',
    databaseEnrollmentCreated:false,receiverActivated:false,connected:false};
}

export function inspectQl365dSignedReview({signedReview,...rest}={}){
  if(!exact(signedReview,['schema','request','approvals','state',
    'databaseEnrollmentCreated','receiverActivated','connected'])||
    signedReview.schema!==QL365D_SIGNED||
    signedReview.state!=='DUAL_OWNER_FIRST_TEST_REVIEW_ONLY_EXTERNAL_AUTHORITY_REQUIRED'||
    signedReview.databaseEnrollmentCreated!==false||
    signedReview.receiverActivated!==false||signedReview.connected!==false||
    !exact(signedReview.approvals,['source','master']))
    return hold('DENY_QL365D_SIGNED_REVIEW_SCHEMA');
  return verifyQl365dDualOwnerReview({...rest,request:signedReview.request,
    sourceApproval:signedReview.approvals.source,
    masterApproval:signedReview.approvals.master});
}

/** Final private *review* gate. The genuine QL-365C original-source checks and
 * QL-363 independently pinned source contract are computed here. This still
 * does not create QL-355 issuer/witness enrollment, a QL-362 GET authorization,
 * a durable one-use operation claim, a listener or any network action.
 */
export async function assessQl365dOwnerGovernedFirstTestReview({signedReview,
  candidate,sourceReview,masterReview,custodyReceipt,ql365cArgs,
  sourceRecord,peer,resolvePinnedSigner,verifySignerCustody,
  now=Date.now(),pins=QL365A_PINS}={}){
  const owner=inspectQl365dSignedReview({signedReview,candidate,sourceReview,
    masterReview,custodyReceipt,now,pins});
  if(!owner.valid)return owner;
  if(!same(ql365cArgs?.custodyReceipt,custodyReceipt)||
    !same(ql365cArgs?.candidate,candidate)||
    !same(ql365cArgs?.sourceReview,sourceReview)||
    !same(ql365cArgs?.masterReview,masterReview))
    return hold('DENY_QL365D_CUSTODY_OR_OWNER_CONTEXT_SUBSTITUTION');
  const original=await assessQl365cSupervisedTestPreflight({...ql365cArgs,now});
  if(!original.valid||!original.decisionCustodyVerified||
    !original.originalReceiverOffVerified||
    !original.originalDatabaseNoLoginVerified||
    !original.allSixPeersHeldVerified||!original.ownerPresenceVerified)
    return hold('HOLD_QL365D_ORIGINAL_INDEPENDENT_Ql365C_PREFLIGHT_REQUIRED');
  if(sourceRecord?.sourceId!==owner.sourceId||peer?.peerId!==owner.sourceId)
    return hold('DENY_QL365D_ONE_SOURCE_CONTRACT_IDENTITY_DRIFT');
  const source=await verifyQl363SourceHealthContract({record:sourceRecord,peer,
    resolvePinnedSigner,verifySignerCustody,now});
  if(source.contractCompatible!==true||source.sourceId!==owner.sourceId)
    return hold('HOLD_QL365D_SEPARATELY_PINNED_SOURCE_CONTRACT_REQUIRED');
  return hold('OWNER_GOVERNED_FIRST_SOURCE_TEST_REVIEW_ELIGIBLE_NO_NETWORK_OR_ACTIVATION',{
    valid:true,manualReviewEligible:true,dualOriginalOwnerSignaturesVerified:true,
    independentReviewerCustodyVerified:true,
    originalReceiverOffVerified:true,originalDatabaseNoLoginVerified:true,
    sourceContractVerified:true,sourceId:owner.sourceId,
    operationId:owner.operationId,requestSha256:owner.requestSha256,
    sourceContractSha256:source.contractSha256,
    nextAction:'Only a separately verified QL-355 original issuer/witness, QL-354 enrollment, QL-362 one-use claim and supervised original private TEST can authorize a real GET.'});
}
