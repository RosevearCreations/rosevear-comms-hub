/** QL-365B: offline original-key reviews and independently pinned policy decisions.
 * This NEVER enrolls an owner, satisfies QL-355, starts a receiver, or authorizes a TEST.
 * Its optional independent trust callbacks must be backed by a separately administered
 * original custody source, never by an attestation's claimed public key or an input file.
 */
import {createHash,createPrivateKey,createPublicKey,randomBytes,sign,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectQl365aPinnedOwner,inspectQl365aSignedCandidate,
  QL365A_PINS} from './ql365a-first-time-trust.mjs';

export const QL365B_REVIEW_SCHEMA='rosevear.hub.ql365b.original-owner-review.v1';
export const QL365B_DECISION_SCHEMA='rosevear.hub.ql365b.independent-trust-decision.v1';
export const QL365B_REPORT_SCHEMA='rosevear.hub.ql365b.supervised-test-readiness.v1';
const SHA=/^[0-9a-f]{64}$/;
const NONCE=/^[0-9a-f]{32}$/;
const sha=value=>createHash('sha256').update(value).digest('hex');
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key));
const ownerHost=Object.freeze({source:{host:'DESKTOP-AE894KC',user:'Ree'},
  master:{host:'TEMPLAR',user:'jfros'}});
const domain=role=>`rosevear.hub.ql365b.original-review.${role}:`;
const safeTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  new Date(Date.parse(value)).toISOString()===value?Date.parse(value):NaN;
const hold=(state,extra={})=>({schema:QL365B_REPORT_SCHEMA,state,valid:false,
  originalOwnerReviewsVerified:false,independentPolicyDecisionVerified:false,
  independentFieldWitnessVerified:false,originalIssuerAuthenticated:false,
  legacyQl355Satisfied:false,databaseEnrollmentAuthorized:false,
  receiverActivated:false,supervisedTestAuthorized:false,sixAppGrantsAuthorized:false,
  customerCommunications:false,deviceActions:false,connected:false,
  connectionState:'DISCONNECTED / HOLD',...extra});
const candidateHash=candidate=>sha(canonicalize(candidate));
const reviewHash=review=>sha(canonicalize(review));

/** Owner attests to reading the exact candidate, NOT to external trust or activation.
 * The original-Windows-only CLI enforces local custody and interactive confirmation.
 * A synthetic caller of this function has no authority to claim an original host.
 */
export function signQl365bOwnerReview({candidate,role,localCandidate,originalPublicBytes,
  encryptedPrivateKeyPem,passphrase,now=Date.now(),nonce=randomBytes(16).toString('hex'),
  pins=QL365A_PINS}={}){
  const inspected=inspectQl365aSignedCandidate(candidate,now,pins);
  if(!inspected.valid)throw Error(inspected.state);
  if(!ownerHost[role]||!Buffer.isBuffer(originalPublicBytes)||!NONCE.test(nonce))
    throw Error('DENY_QL365B_LOCAL_OWNER_OR_NONCE');
  const owner=inspectQl365aPinnedOwner(localCandidate,role,
    {originalBytes:originalPublicBytes,pins});
  if(!owner.verified||localCandidate.publicKeyPem!==
    candidate.request.payload.ownerPins[role].publicKeyPem)
    throw Error('DENY_QL365B_LOCAL_OWNER_PUBLIC_KEY_OR_BYTES');
  if(typeof passphrase!=='string'||passphrase.length<16)
    throw Error('DENY_QL365B_ORIGINAL_PASSPHRASE_REQUIRED');
  let key;
  try{key=createPrivateKey({key:encryptedPrivateKeyPem,format:'pem',passphrase});}
  catch{throw Error('DENY_QL365B_ORIGINAL_PRIVATE_KEY_DECRYPTION');}
  if(key.asymmetricKeyType!=='ed25519'||
    sha(createPublicKey(key).export({type:'spki',format:'der'}))!==owner.spkiSha256)
    throw Error('DENY_QL365B_LOCAL_PRIVATE_KEY_PIN_MISMATCH');
  const payload={schema:QL365B_REVIEW_SCHEMA,role,keyId:owner.keyId,
    originalHost:ownerHost[role].host,originalWindowsUser:ownerHost[role].user,
    candidateSha256:candidateHash(candidate),
    originalPayloadSha256:inspected.payloadSha256,
    decision:'REVIEWED_FIRST_TIME_CANDIDATE_ONLY_NO_TRUST_OR_TEST_AUTHORITY',
    receiverActivationAuthorized:false,databaseEnrollmentAuthorized:false,
    reviewedAt:new Date(now).toISOString(),nonce};
  return {schema:QL365B_REVIEW_SCHEMA,payload,
    signature:sign(null,Buffer.from(domain(role)+canonicalize(payload)),key)
      .toString('base64url')};
}

/** Reconcile distinct QL-365A approvals with distinct QL-365B original-key reviews.
 * This is cryptographic key possession evidence, not attestation of a physical PC.
 */
export function verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,
  now=Date.now(),pins=QL365A_PINS}={}){
  const inspected=inspectQl365aSignedCandidate(candidate,now,pins);
  if(!inspected.valid)return hold(inspected.state);
  for(const [role,review] of [['source',sourceReview],['master',masterReview]]){
    const payload=review?.payload,expected=ownerHost[role];
    if(!exact(review,['schema','payload','signature'])||
      review.schema!==QL365B_REVIEW_SCHEMA||
      !exact(payload,['schema','role','keyId','originalHost','originalWindowsUser',
        'candidateSha256','originalPayloadSha256','decision',
        'receiverActivationAuthorized','databaseEnrollmentAuthorized','reviewedAt','nonce'])||
      payload.schema!==QL365B_REVIEW_SCHEMA||payload.role!==role||
      payload.keyId!==pins[role].keyId||payload.originalHost!==expected.host||
      payload.originalWindowsUser!==expected.user||
      payload.candidateSha256!==candidateHash(candidate)||
      payload.originalPayloadSha256!==inspected.payloadSha256||
      payload.decision!=='REVIEWED_FIRST_TIME_CANDIDATE_ONLY_NO_TRUST_OR_TEST_AUTHORITY'||
      payload.receiverActivationAuthorized!==false||
      payload.databaseEnrollmentAuthorized!==false||!NONCE.test(payload.nonce??'')||
      !Number.isFinite(safeTime(payload.reviewedAt))||
      safeTime(payload.reviewedAt)<safeTime(candidate.request.payload.issuedAt)||
      safeTime(payload.reviewedAt)>now+5_000||
      safeTime(payload.reviewedAt)>=safeTime(candidate.request.payload.expiresAt)||
      !/^[A-Za-z0-9_-]{86}$/.test(review.signature??''))
      return hold(`DENY_QL365B_${role.toUpperCase()}_REVIEW_SCOPE_OR_TIME`);
    try{
      const signature=Buffer.from(review.signature,'base64url');
      if(signature.length!==64||!verify(null,
        Buffer.from(domain(role)+canonicalize(payload)),
        createPublicKey(candidate.request.payload.ownerPins[role].publicKeyPem),signature))
        return hold(`DENY_QL365B_${role.toUpperCase()}_REVIEW_SIGNATURE`);
    }catch{return hold(`DENY_QL365B_${role.toUpperCase()}_REVIEW_SIGNATURE`);}
  }
  return hold('ORIGINAL_OWNER_REVIEW_SIGNATURES_VALID_EXTERNAL_TRUST_STILL_HELD',{
    valid:true,originalOwnerReviewsVerified:true,
    candidateSha256:candidateHash(candidate),
    originalPayloadSha256:inspected.payloadSha256,
    sourceReviewSha256:reviewHash(sourceReview),masterReviewSha256:reviewHash(masterReview),
    expiresAt:inspected.expiresAt});
}

/** Accepts *only* separately pinned, distinct external reviewers with independent
 * custody/revocation verification. Decisions remain OFFLINE review evidence, not a
 * substitute for QL-355 issuer/witness and never permission for a live TEST.
 */
export async function verifyQl365bIndependentDecisions({candidate,sourceReview,masterReview,
  policyDecision,fieldWitnessDecision,resolvePinnedReviewer,
  verifyIndependentCustody,now=Date.now(),pins=QL365A_PINS}={}){
  const owner=verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,now,pins});
  if(!owner.valid)return owner;
  if(typeof resolvePinnedReviewer!=='function'||
    typeof verifyIndependentCustody!=='function')
    return hold('HOLD_QL365B_INDEPENDENT_EXTERNAL_PIN_AND_CUSTODY_REQUIRED',
      {originalOwnerReviewsVerified:true,candidateSha256:owner.candidateSha256});
  const decisions=[['policy_reviewer',policyDecision],['field_witness',fieldWitnessDecision]];
  const seen=new Set([pins.source.spkiSha256,pins.master.spkiSha256,
    candidate.request.payload.device.deviceSpkiSha256]);
  for(const [role,attestation] of decisions){
    const payload=attestation?.payload;
    if(!exact(attestation,['schema','payload','signature'])||
      attestation.schema!==QL365B_DECISION_SCHEMA||
      !exact(payload,['schema','role','audience','scope','decision',
        'candidateSha256','sourceReviewSha256','masterReviewSha256',
        'databaseEnrollmentAuthorized','receiverActivationAuthorized',
        'issuedAt','expiresAt','nonce'])||
      payload.schema!==QL365B_DECISION_SCHEMA||payload.role!==role||
      payload.audience!=='rosevear-comms-hub:ql365b:offline-first-trust:TEST'||
      payload.scope!=='independent-review-for-supervised-preflight-only'||
      payload.decision!=='ACCEPT_FOR_OFFLINE_PREFLIGHT_REVIEW_ONLY'||
      payload.candidateSha256!==owner.candidateSha256||
      payload.sourceReviewSha256!==owner.sourceReviewSha256||
      payload.masterReviewSha256!==owner.masterReviewSha256||
      payload.databaseEnrollmentAuthorized!==false||
      payload.receiverActivationAuthorized!==false||!NONCE.test(payload.nonce??'')||
      !Number.isFinite(safeTime(payload.issuedAt))||
      !Number.isFinite(safeTime(payload.expiresAt))||
      safeTime(payload.issuedAt)<safeTime(candidate.request.payload.issuedAt)||
      safeTime(payload.issuedAt)>now+5_000||safeTime(payload.expiresAt)<=now||
      safeTime(payload.expiresAt)-safeTime(payload.issuedAt)>600_000||
      safeTime(payload.expiresAt)>safeTime(candidate.request.payload.expiresAt)||
      !/^[A-Za-z0-9_-]{86}$/.test(attestation.signature??''))
      return hold(`DENY_QL365B_${role.toUpperCase()}_DECISION_SCOPE_OR_TIME`,
        {originalOwnerReviewsVerified:true});
    try{
      const pinned=await resolvePinnedReviewer(role);
      if(pinned?.role!==role||!SHA.test(pinned.spkiSha256??'')||
        typeof pinned.publicKeyPem!=='string'||pinned.publicKeyPem.length>2000||
        seen.has(pinned.spkiSha256))
        return hold('HOLD_QL365B_INDEPENDENT_DISTINCT_REVIEWER_PIN_REQUIRED',
          {originalOwnerReviewsVerified:true});
      const key=createPublicKey(pinned.publicKeyPem);
      if(key.asymmetricKeyType!=='ed25519'||
        sha(key.export({format:'der',type:'spki'}))!==pinned.spkiSha256)
        return hold('DENY_QL365B_INDEPENDENT_REVIEWER_KEY_DRIFT');
      const custody=await verifyIndependentCustody({role,spkiSha256:pinned.spkiSha256,
        candidateSha256:owner.candidateSha256});
      if(custody?.authenticated!==true||custody?.revoked!==false||
        custody.role!==role||custody.spkiSha256!==pinned.spkiSha256||
        custody.candidateSha256!==owner.candidateSha256)
        return hold('HOLD_QL365B_INDEPENDENT_CUSTODY_UNVERIFIED');
      const signature=Buffer.from(attestation.signature,'base64url');
      if(signature.length!==64||!verify(null,Buffer.from(canonicalize(payload)),
        key,signature))return hold('DENY_QL365B_INDEPENDENT_DECISION_SIGNATURE');
      seen.add(pinned.spkiSha256);
    }catch{return hold('HOLD_QL365B_INDEPENDENT_REVIEW_READBACK_FAILED');}
  }
  return hold('SUPERVISED_OFFLINE_TEST_PREFLIGHT_REVIEW_ELIGIBLE_NO_ACTIVATION',{
    valid:true,originalOwnerReviewsVerified:true,
    independentPolicyDecisionVerified:true,independentFieldWitnessVerified:true,
    candidateSha256:owner.candidateSha256,externalReviewsVerified:true,
    // Separate original issuer, QL-355, signed DB receipt and private transport
    // are still required; this is NOT a runnable TEST permit.
    originalIssuerAuthenticated:false,legacyQl355Satisfied:false,
    supervisedTestAuthorized:false});
}
