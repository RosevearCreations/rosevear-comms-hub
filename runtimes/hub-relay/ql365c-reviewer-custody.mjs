/** QL-365C: independently verified reviewer identity, immutable decision custody
 * and ORIGINAL-OWNER read-only private TEST preflight. All operations fail closed.
 * Trusted identity, custody, archive and original-host callbacks MUST be supplied
 * from separately administered private services, never from submitted JSON.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {verifyQl365bOwnerReviews,verifyQl365bIndependentDecisions}
  from './ql365b-original-reconciliation.mjs';

export const QL365C_PROOF='rosevear.hub.ql365c.independent-reviewer-enrollment-proof.v1';
export const QL365C_REGISTRY='rosevear.hub.ql365c.provisional-reviewer-registry.v1';
export const QL365C_CUSTODY='rosevear.hub.ql365c.signed-decision-custody.v1';
export const QL365C_RESULT='rosevear.hub.ql365c.supervised-private-test-preflight.v1';
const HASH=/^[a-f0-9]{64}$/;
const NONCE=/^[a-f0-9]{32}$/;
const ID=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{5,95}$/;
const ROLES=['policy_reviewer','field_witness'];
const sha=value=>createHash('sha256').update(value).digest('hex');
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key));
const time=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  new Date(Date.parse(value)).toISOString()===value?Date.parse(value):NaN;
const held=(state,detail={})=>({schema:QL365C_RESULT,state,valid:false,
  reviewerIdentitiesEnrolled:false,originalOwnerReviewsVerified:false,
  independentPolicyReviewerVerified:false,independentFieldWitnessVerified:false,
  decisionCustodyVerified:false,originalIssuerAuthenticated:false,
  legacyQl355Satisfied:false,privateTestAuthorized:false,
  databaseEnrollmentAuthorized:false,receiverActivated:false,
  sixAppGrantsAuthorized:false,customerCommunications:false,
  deviceActions:false,connected:false,connectionState:'DISCONNECTED / HOLD',...detail});
const signed=(payload,signature,key)=>typeof signature==='string'&&
  /^[A-Za-z0-9_-]{86}$/.test(signature)&&Buffer.from(signature,'base64url').length===64&&
  verify(null,Buffer.from(canonicalize(payload)),key,Buffer.from(signature,'base64url'));

/** Requires a separately authenticated original reviewer ID, externally pinned
 * Ed25519 key, independent custody/revocation and proof of possession. The
 * returned registry is PROVISIONAL, not a self-authorizing live trust store.
 */
export async function prepareQl365cReviewerEnrollment({candidate,sourceReview,masterReview,
  proofs,resolveIndependentIdentity,verifyIdentityCustody,registeredAt,
  now=Date.now(),pins=QL365A_PINS}={}){
  const owners=verifyQl365bOwnerReviews({candidate,sourceReview,masterReview,now,pins});
  if(!owners.valid)return held('HOLD_QL365C_GENUINE_TWO_OWNER_REVIEW_REQUIRED');
  if(typeof resolveIndependentIdentity!=='function'||
    typeof verifyIdentityCustody!=='function')
    return held('HOLD_QL365C_EXTERNAL_IDENTITY_AND_CUSTODY_REQUIRED');
  if(!exact(proofs,ROLES))return held('HOLD_QL365C_TWO_DISTINCT_REVIEWER_PROOFS_REQUIRED');
  const seenSpki=new Set([pins.source.spkiSha256,pins.master.spkiSha256,
    candidate.request.payload.device.deviceSpkiSha256]);
  const seenIds=new Set();
  const reviewers={};
  let expiry=time(candidate.request.payload.expiresAt);
  let latestProofAt=time(candidate.request.payload.issuedAt);
  const latestOwnerReviewAt=Math.max(time(sourceReview.payload.reviewedAt),
    time(masterReview.payload.reviewedAt));
  for(const role of ROLES){
    try{
      const identity=await resolveIndependentIdentity(role);
      if(identity?.role!==role||!ID.test(identity.identityId??'')||
        !HASH.test(identity.spkiSha256??'')||
        !HASH.test(identity.issuerAnchorSha256??'')||
        typeof identity.publicKeyPem!=='string'||identity.publicKeyPem.length>2000||
        identity.independentlyAuthenticated!==true||identity.revoked!==false||
        seenSpki.has(identity.spkiSha256)||
        seenSpki.has(identity.issuerAnchorSha256)||
        identity.spkiSha256===identity.issuerAnchorSha256||
        seenIds.has(identity.identityId))
        return held('HOLD_QL365C_SEPARATELY_AUTHENTICATED_DISTINCT_IDENTITY_REQUIRED');
      const key=createPublicKey(identity.publicKeyPem);
      if(key.asymmetricKeyType!=='ed25519'||
        sha(key.export({format:'der',type:'spki'}))!==identity.spkiSha256)
        return held('DENY_QL365C_REVIEWER_PUBLIC_KEY_PIN_DRIFT');
      const custody=await verifyIdentityCustody({role,identityId:identity.identityId,
        spkiSha256:identity.spkiSha256,issuerAnchorSha256:identity.issuerAnchorSha256,
        candidateSha256:owners.candidateSha256});
      if(custody?.authenticated!==true||custody?.verified!==true||
        custody?.revoked!==false||custody.role!==role||
        custody.identityId!==identity.identityId||
        custody.spkiSha256!==identity.spkiSha256||
        custody.issuerAnchorSha256!==identity.issuerAnchorSha256||
        custody.candidateSha256!==owners.candidateSha256)
        return held('HOLD_QL365C_INDEPENDENT_ORIGINAL_CUSTODY_UNVERIFIED');
      const proof=proofs[role],body=proof?.payload;
      if(!exact(proof,['schema','payload','signature'])||proof.schema!==QL365C_PROOF||
        !exact(body,['schema','role','identityId','spkiSha256','audience','scope',
          'candidateSha256','sourceReviewSha256','masterReviewSha256',
          'liveEnrollmentAuthorized','issuedAt','expiresAt','nonce'])||
        body.schema!==QL365C_PROOF||body.role!==role||
        body.identityId!==identity.identityId||body.spkiSha256!==identity.spkiSha256||
        body.audience!=='rosevear-comms-hub:ql365c:private-offline:TEST'||
        body.scope!=='provisional-original-reviewer-identity-only'||
        body.candidateSha256!==owners.candidateSha256||
        body.sourceReviewSha256!==owners.sourceReviewSha256||
        body.masterReviewSha256!==owners.masterReviewSha256||
        body.liveEnrollmentAuthorized!==false||!NONCE.test(body.nonce??'')||
        !Number.isFinite(time(body.issuedAt))||!Number.isFinite(time(body.expiresAt))||
        time(body.issuedAt)<latestOwnerReviewAt||
        time(body.issuedAt)>now+5_000||time(body.expiresAt)<=now||
        time(body.expiresAt)-time(body.issuedAt)>600_000||
        time(body.expiresAt)>time(candidate.request.payload.expiresAt)||
        !signed(body,proof.signature,key))
        return held('DENY_QL365C_CHANGED_EXPIRED_OR_FORGED_REVIEWER_PROOF');
      reviewers[role]={identityId:identity.identityId,spkiSha256:identity.spkiSha256,
        issuerAnchorSha256:identity.issuerAnchorSha256,
        proofSha256:sha(canonicalize(proof))};
      seenIds.add(identity.identityId);seenSpki.add(identity.spkiSha256);
      expiry=Math.min(expiry,time(body.expiresAt));
      latestProofAt=Math.max(latestProofAt,time(body.issuedAt));
    }catch{return held('HOLD_QL365C_INDEPENDENT_IDENTITY_READBACK_FAILED');}
  }
  const created=registeredAt===undefined?now:time(registeredAt);
  if(!Number.isFinite(created)||created>now+5_000||
    created<latestProofAt||created>=expiry)
    return held('DENY_QL365C_REGISTRY_CREATION_TIME');
  const registry={schema:QL365C_REGISTRY,
    state:'PROVISIONAL_OFFLINE_IDENTITY_CANDIDATE_NOT_LIVE_ENROLLMENT',
    candidateSha256:owners.candidateSha256,
    sourceReviewSha256:owners.sourceReviewSha256,
    masterReviewSha256:owners.masterReviewSha256,
    reviewers,createdAt:new Date(created).toISOString(),expiresAt:new Date(expiry).toISOString(),
    reviewerIdentitiesEnrolled:false,liveTrustAuthorized:false,
    databaseEnrollmentAuthorized:false,receiverActivated:false,connected:false};
  return held('PROVISIONAL_REVIEWER_IDENTITIES_CRYPTOGRAPHICALLY_VERIFIED_NO_LIVE_ENROLLMENT',
    {valid:true,originalOwnerReviewsVerified:true,registry,
      registrySha256:sha(canonicalize(registry))});
}

/** Optional independently protected append-only storage. Never creates live
 * reviewer grants. A unique idempotency key and exact original byte readback
 * are compulsory; public/request-controlled callbacks cannot be passed here.
 */
export async function recordQl365cProvisionalEnrollment({appendOriginalRegistry,
  readOriginalRegistry,...args}={}){
  const verified=await prepareQl365cReviewerEnrollment(args);
  if(!verified.valid)return verified;
  if(typeof appendOriginalRegistry!=='function'||typeof readOriginalRegistry!=='function')
    return held('HOLD_QL365C_ORIGINAL_APPEND_ONLY_REGISTRY_REQUIRED');
  try{
    const bytes=Buffer.from(canonicalize(verified.registry));
    const receipt=await appendOriginalRegistry({idempotencyKey:verified.registrySha256,
      bytes,mode:'PROVISIONAL_ONLY_NO_LOGIN_OR_TEST'});
    if(receipt?.committed!==true||receipt.sha256!==verified.registrySha256||
      receipt.immutable!==true||receipt.active!==false)
      return held('HOLD_QL365C_PROVISIONAL_APPEND_NOT_PROVEN');
    const original=await readOriginalRegistry({sha256:verified.registrySha256});
    if(!Buffer.isBuffer(original?.bytes)||
      sha(original.bytes)!==verified.registrySha256||
      original.originalPrivateStoreVerified!==true)
      return held('DENY_QL365C_ORIGINAL_REGISTRY_BYTE_READBACK_MISMATCH');
    return held('PROVISIONAL_ORIGINAL_REGISTRY_BYTES_RECONCILED_NOT_ACTIVE',{
      valid:true,originalOwnerReviewsVerified:true,
      registrySha256:verified.registrySha256,reviewerIdentitiesEnrolled:false});
  }catch{return held('HOLD_QL365C_ORIGINAL_REGISTRY_COMMIT_FAILED');}
}

/** Verify a separately signed archive decision plus exact original byte readback.
 * No state here grants authority. QL-365B reviewer verification still checks
 * external independent pins on every call, not the provisional registry itself.
 */
export async function verifyQl365cDecisionCustody({candidate,sourceReview,masterReview,
  proofs,registry,policyDecision,fieldWitnessDecision,
  resolveIndependentIdentity,verifyIdentityCustody,
  custodyReceipt,resolveArchiveSigner,verifyArchiveSignerCustody,
  readOriginalCustody,now=Date.now(),pins=QL365A_PINS}={}){
  const enrollment=await prepareQl365cReviewerEnrollment({candidate,sourceReview,masterReview,
    proofs,resolveIndependentIdentity,verifyIdentityCustody,
    registeredAt:registry?.createdAt,now,pins});
  if(!enrollment.valid)return enrollment;
  if(canonicalize(enrollment.registry)!==canonicalize(registry))
    return held('DENY_QL365C_REGISTRY_PIN_OR_PROOF_DRIFT');
  if(time(policyDecision?.payload?.issuedAt)<time(registry.createdAt)||
    time(fieldWitnessDecision?.payload?.issuedAt)<time(registry.createdAt))
    return held('DENY_QL365C_DECISION_PRECEDES_REVIEWER_ENROLLMENT');
  const decisions=await verifyQl365bIndependentDecisions({candidate,sourceReview,
    masterReview,policyDecision,fieldWitnessDecision,
    resolvePinnedReviewer:async role=>{
      const identity=await resolveIndependentIdentity(role),pinned=registry.reviewers[role];
      if(identity?.identityId!==pinned?.identityId||
        identity?.spkiSha256!==pinned?.spkiSha256||
        identity?.issuerAnchorSha256!==pinned?.issuerAnchorSha256)
        throw Error('DENY_QL365C_DECISION_REVIEWER_IDENTITY_DRIFT');
      return identity;
    },
    verifyIndependentCustody:async ({role,spkiSha256,candidateSha256})=>{
      const pinned=registry.reviewers[role];
      if(!pinned||pinned.spkiSha256!==spkiSha256)
        throw Error('DENY_QL365C_DECISION_CUSTODY_PIN_DRIFT');
      return verifyIdentityCustody({role,identityId:pinned.identityId,spkiSha256,
        issuerAnchorSha256:pinned.issuerAnchorSha256,candidateSha256});
    },now,pins});
  if(!decisions.valid||!decisions.externalReviewsVerified)
    return held('HOLD_QL365C_INDEPENDENT_REVIEWER_DECISIONS_NOT_VERIFIED');
  if(typeof resolveArchiveSigner!=='function'||
    typeof verifyArchiveSignerCustody!=='function'||
    typeof readOriginalCustody!=='function')
    return held('HOLD_QL365C_INDEPENDENT_ARCHIVE_AND_ORIGINAL_READBACK_REQUIRED');
  try{
    const payload=custodyReceipt?.payload;
    if(!exact(custodyReceipt,['schema','payload','signature'])||
      custodyReceipt.schema!==QL365C_CUSTODY||
      !exact(payload,['schema','audience','scope','registrySha256','candidateSha256',
        'policyDecisionSha256','fieldWitnessDecisionSha256','decision',
        'databaseEnrollmentAuthorized','receiverActivationAuthorized',
        'issuedAt','expiresAt','nonce'])||payload.schema!==QL365C_CUSTODY||
      payload.audience!=='rosevear-comms-hub:ql365c:offline-custody:TEST'||
      payload.scope!=='append-only-review-evidence-no-private-test-permit'||
      payload.registrySha256!==enrollment.registrySha256||
      payload.candidateSha256!==enrollment.registry.candidateSha256||
      payload.policyDecisionSha256!==sha(canonicalize(policyDecision))||
      payload.fieldWitnessDecisionSha256!==sha(canonicalize(fieldWitnessDecision))||
      payload.decision!=='FILE_VERIFIED_OFFLINE_DECISIONS_ONLY'||
      payload.databaseEnrollmentAuthorized!==false||
      payload.receiverActivationAuthorized!==false||!NONCE.test(payload.nonce??'')||
      !Number.isFinite(time(payload.issuedAt))||
      !Number.isFinite(time(payload.expiresAt))||
      time(payload.issuedAt)<time(registry.createdAt)||
      time(payload.issuedAt)>now+5_000||time(payload.expiresAt)<=now||
      time(payload.expiresAt)-time(payload.issuedAt)>600_000||
      time(payload.expiresAt)>time(registry.expiresAt))
      return held('DENY_QL365C_CUSTODY_SCOPE_HASH_OR_EXPIRY');
    const signer=await resolveArchiveSigner();
    const excluded=new Set([pins.source.spkiSha256,pins.master.spkiSha256,
      candidate.request.payload.device.deviceSpkiSha256,
      registry.reviewers.policy_reviewer.spkiSha256,
      registry.reviewers.field_witness.spkiSha256]);
    if(!HASH.test(signer?.spkiSha256??'')||excluded.has(signer.spkiSha256)||
      typeof signer.publicKeyPem!=='string'||signer.publicKeyPem.length>2000)
      return held('HOLD_QL365C_SEPARATE_ARCHIVE_SIGNER_PIN_REQUIRED');
    const key=createPublicKey(signer.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      sha(key.export({type:'spki',format:'der'}))!==signer.spkiSha256)
      return held('DENY_QL365C_ARCHIVE_KEY_PIN_DRIFT');
    const custody=await verifyArchiveSignerCustody({spkiSha256:signer.spkiSha256,
      registrySha256:enrollment.registrySha256});
    if(custody?.authenticated!==true||custody?.revoked!==false||
      custody.spkiSha256!==signer.spkiSha256||
      custody.registrySha256!==enrollment.registrySha256||
      !signed(payload,custodyReceipt.signature,key))
      return held('DENY_QL365C_INDEPENDENT_ARCHIVE_SIGNATURE_OR_CUSTODY');
    const archived=await readOriginalCustody({sha256:sha(canonicalize(custodyReceipt))});
    if(!Buffer.isBuffer(archived?.bytes)||
      sha(archived.bytes)!==sha(canonicalize(custodyReceipt))||
      archived.originalPrivateStoreVerified!==true||
      !Number.isFinite(time(archived.readAt))||
      Math.abs(now-time(archived.readAt))>30_000)
      return held('DENY_QL365C_ORIGINAL_SIGNED_CUSTODY_BYTE_READBACK');
    return held('INDEPENDENT_SIGNED_DECISIONS_AND_ORIGINAL_CUSTODY_VERIFIED_NO_TEST_PERMIT',{
      valid:true,originalOwnerReviewsVerified:true,
      independentPolicyReviewerVerified:true,independentFieldWitnessVerified:true,
      decisionCustodyVerified:true,registrySha256:enrollment.registrySha256,
      custodySha256:sha(canonicalize(custodyReceipt)),reviewerIdentitiesEnrolled:false});
  }catch{return held('HOLD_QL365C_INDEPENDENT_CUSTODY_READBACK_FAILED');}
}

/** Fresh original readbacks are required even after authenticated custody.
 * A successful result is a checklist for a human-supervised NEXT procedure,
 * never a receiver start, SQL grant, signed TEST receipt, or six-peer CONNECTED.
 */
export async function assessQl365cSupervisedTestPreflight({readOriginalReceiver,
  readOriginalDatabase,readSixOriginalPeers,verifyBothOriginalOwners,
  now=Date.now(),...custodyArgs}={}){
  const checked=await verifyQl365cDecisionCustody({...custodyArgs,now});
  if(!checked.valid)return checked;
  if([readOriginalReceiver,readOriginalDatabase,readSixOriginalPeers,
    verifyBothOriginalOwners].some(fn=>typeof fn!=='function'))
    return held('HOLD_QL365C_GENUINE_ORIGINAL_READBACK_AND_BOTH_OWNERS_REQUIRED');
  try{
    const [receiver,db,peers,owners]=await Promise.all([
      readOriginalReceiver(),readOriginalDatabase(),readSixOriginalPeers(),
      verifyBothOriginalOwners()]);
    const fresh=value=>Number.isFinite(time(value?.observedAt))&&
      now-time(value.observedAt)>=-5_000&&now-time(value.observedAt)<=30_000;
    if(![receiver,db,peers,owners].every(fresh)||
      receiver.state!=='RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP'||
      receiver.computer!=='DESKTOP-AE894KC'||receiver.port!==8788||
      receiver.listenerCount!==0||receiver.tailnetServeNoConfig!==true||
      receiver.receiverActivated!==false||
      receiver.originalActiveStopWitness!==false||
      db.state!=='ORIGINAL_PRIVATE_DATABASE_READ_ONLY'||
      db.receiverRole!=='NOLOGIN'||db.enrollmentCount!==0||
      db.signedReceiptCount!==0||peers.state!=='SIX_HELD_PEERS'||
      peers.held!==6||peers.connected!==0||peers.grants!==0||
      owners.state!=='TWO_INDEPENDENT_ORIGINAL_OWNER_SESSIONS'||
      owners.sourceHost!=='DESKTOP-AE894KC'||owners.masterHost!=='TEMPLAR'||
      owners.sourceAuthenticated!==true||owners.masterAuthenticated!==true)
      return held('HOLD_QL365C_ORIGINAL_TEST_PREFLIGHT_MISSING_FRESH_PROOF');
    return held('OWNER_SUPERVISED_PRIVATE_TEST_PREFLIGHT_REVIEW_ONLY_ALL_ACTIONS_HELD',{
      valid:true,originalOwnerReviewsVerified:true,
      independentPolicyReviewerVerified:true,independentFieldWitnessVerified:true,
      decisionCustodyVerified:true,ownerPresenceVerified:true,
      originalReceiverOffVerified:true,originalDatabaseNoLoginVerified:true,
      allSixPeersHeldVerified:true,
      nextAction:'Separate original QL-355 issuer/witness authorization and owner-supervised private TEST ceremony still required.'});
  }catch{return held('HOLD_QL365C_ORIGINAL_TEST_READBACK_FAILED');}
}
