/**
 * QL-255: honest six-app response triage and offline preparation of separately
 * witnessed key custody and a bounded private mini-server GET trial request.
 * There are NO network calls, owner approvals, private hosts, schedulers or
 * credential provisioning in this module.
 */
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';
import { QL254_SOURCES_SNAPSHOT } from './ql255-source-snapshot.mjs';

export const QL255_RELEASE = 'ql255-six-app-original-proof-custody-owner-mini-server-review-held-v1';
export const QL255_RESPONSES = Object.freeze([
  { system: 'ai-data-platform', repository: 'ai-data-platform',
    ownerResponse: 'PUBLIC_404_REPORTED', description: 'Source proof 404 at reported immutable main.' },
  { system: 'devilndove', repository: 'devilndove-site',
    ownerResponse: 'PUBLIC_404_REPORTED', description: 'Source proof 404; custody and owner TEST not verified.' },
  { system: 'rosiedazzlers', repository: 'rosiedazzlers',
    ownerResponse: 'PUBLIC_404_REPORTED', description: 'Source proof 404; no gateway or gift resend.' },
  { system: 'yw', repository: 'yw',
    ownerResponse: 'INTEGRATION_HELD_REPORTED', description: 'No genuine signed source proof or independent private witness.' },
  { system: 'icamp', repository: 'iCamp',
    ownerResponse: 'SOURCE_BUILD_VALIDATION_IN_PROGRESS',
    description: 'Tests passing; DB contract and optimized build still under verification at report time.' },
  { system: 'rosevear-ai-hub', repository: 'rosevear-ai-hub',
    ownerResponse: 'SOFTWARE_RELEASE_COMPLETE_INTEGRATION_HELD',
    description: 'Source team reports release complete, but connectivity explicitly held.' }
]);

const SHA = /^[0-9a-f]{40}$/;
const HEX = /^[0-9a-f]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const ALIAS = /^[a-z][a-z0-9_-]{5,70}$/;
const METHODS = ['GET'];
const PATHS = ['/api/integration/v1/health','/api/integration/v1/capabilities'];
const exact = (o, fields) => !!o && typeof o === 'object' && !Array.isArray(o) &&
  Object.getPrototypeOf(o) === Object.prototype && Object.keys(o).length === fields.length &&
  Object.keys(o).every(key => fields.includes(key));
const business = s => s === 'ai-data-platform' ? 'devilndove' : s;
const tenantOk = (s, v) => ['yw','icamp'].includes(s) ? ID.test(v || '') : v === null;
const hold = (status, reason, extra={}) => Object.freeze({
  release: QL255_RELEASE, status, reason, ...extra,
  trustedSigners: 0, independentlyAuthenticatedWitnesses: 0,
  authenticatedOwnerTests: 0, ownerTestAuthorization: 'NOT_GIVEN',
  ownerPilotAuthorization: 'NOT_GIVEN', actualGatewayGets: 0,
  scheduledGatewayGets: 0, privateRelayEnabled: false,
  connectionState: 'DISCONNECTED', livePilotHolds: 12,
  writes: 0, calls: 0, sms: 0, dispatch: 0
});

/** Incoming owner-supplied claims are informational, not independent proof. */
export function inspectQl255SixAppResponseDispositions(rows, claims=QL255_RESPONSES,
  previous=QL254_SOURCES_SNAPSHOT) {
  if (!Array.isArray(rows) || !Array.isArray(claims) || !Array.isArray(previous) ||
    rows.length !== 6 || claims.length !== 6 || previous.length !== 6 ||
    !QL247_SOURCES.every((source,i) =>
      rows[i]?.system === source.system && rows[i]?.repository === source.repository &&
      claims[i]?.system === source.system && claims[i]?.repository === source.repository &&
      typeof claims[i]?.description === 'string' && claims[i].description.length <= 256 &&
      ['PUBLIC_404_REPORTED','INTEGRATION_HELD_REPORTED',
        'SOURCE_BUILD_VALIDATION_IN_PROGRESS','SOFTWARE_RELEASE_COMPLETE_INTEGRATION_HELD']
        .includes(claims[i].ownerResponse) &&
      previous[i]?.system === source.system && previous[i]?.repository === source.repository &&
      SHA.test(previous[i].mainSha) &&
      (rows[i].mainSha === null || SHA.test(rows[i].mainSha)) &&
      (rows[i].sourceSha == null || SHA.test(rows[i].sourceSha)) &&
      (rows[i].proofRawSha256 == null || HEX.test(rows[i].proofRawSha256))))
    return hold('DENIED_SIX_APP_RESPONSE_SCOPE', 'Six ordered known, bounded source response records required.');
  const queue=rows.map((r,i)=>{
    const observed=r.status==='MISSING_PUBLIC_PROOF_AT_MAIN'
      ? 'PUBLIC_IMMUTABLE_PROOF_404_HELD'
      : r.status==='PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD'
        ? 'PUBLIC_A_B_CI_OBSERVED_PRIVATE_CUSTODY_HELD'
        : r.status==='NOT_FETCHED_NO_NETWORK_REQUESTED'
          ? 'NOT_RECHECKED_NO_NETWORK_HELD' : 'UNVERIFIED_PUBLIC_PROOF_EXCEPTION_HELD';
    return Object.freeze({system:r.system,repository:r.repository,
      observedMainSha:r.mainSha, previousMainSha:previous[i].mainSha,
      sourceAdvanced:r.mainSha !== null && r.mainSha !== previous[i].mainSha,
      report:claims[i].ownerResponse, reportedSummary:claims[i].description,
      publicProof:observed, sourceSignerAction: observed==='PUBLIC_IMMUTABLE_PROOF_404_HELD'
        ? 'PUBLISH_AUTHENTIC_SIGNED_A_B_PROOF_WITH_EXACT_CI' :
          'REVERIFY_ORIGINAL_PUBLIC_PROOF_AND_INDEPENDENT_TRUST',
      ownerDecision:'NOT_GIVEN',connection:'DISCONNECTED'});
  });
  return hold('SIX_APP_RESPONSE_CLAIMS_DISPOSED_ORIGINAL_PROOF_REQUIRED_HELD',
    'A release complete or passing test report is not the original QL-246 signature, independent custody, or TEST-only authorization.',
    {queue:Object.freeze(queue),stillPublic404:queue.filter(x=>x.publicProof==='PUBLIC_IMMUTABLE_PROOF_404_HELD').length,
      originalPublicProofAndExactCi:queue.filter(x=>x.publicProof==='PUBLIC_A_B_CI_OBSERVED_PRIVATE_CUSTODY_HELD').length});
}

const CUSTODY_FIELDS=['schemaVersion','system','repository','businessId','tenantId',
  'sourceSha','proofSha','registrySnapshotSha256','presentedSignerSpkiSha256',
  'registryReceiptId','custodyReceiptId','witnessReceiptId','witnessAlias',
  'independentVerifierAlias','privateReviewRequestId','reviewOutcome','claimedAtMs'];

/** A proposed closure receipt remains untrusted until independently checked in private. */
export function inspectQl255PrivateCustodyClosureRequest(origin,witnessResult,claim,
  {now=Date.now(),expectedTenantId=null}={}) {
  if (!exact(claim,CUSTODY_FIELDS) || !Number.isSafeInteger(now) || now<=0)
    return hold('DENIED_CUSTODY_CLOSURE_REQUEST_SCHEMA','Exact non-secret custody review request required.');
  const s=QL247_SOURCES.find(x=>x.system===claim.system);
  if (!s || claim.schemaVersion!=='rosevear.ql255.private-custody-review.v1' ||
    claim.repository!==s.repository || claim.businessId!==business(s.system) ||
    !tenantOk(s.system,claim.tenantId) ||
    claim.tenantId!==expectedTenantId ||
    origin?.system!==s.system || origin?.repository!==s.repository ||
    origin?.status!=='PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD' ||
    claim.sourceSha!==origin.sourceSha || claim.proofSha!==origin.mainSha ||
    !SHA.test(claim.sourceSha||'') || !SHA.test(claim.proofSha||'') ||
    claim.sourceSha===claim.proofSha || !HEX.test(claim.registrySnapshotSha256||'') ||
    !HEX.test(claim.presentedSignerSpkiSha256||'') ||
    ![claim.registryReceiptId,claim.custodyReceiptId,claim.witnessReceiptId,
      claim.privateReviewRequestId].every(v=>ID.test(v||'')) ||
    new Set([claim.registryReceiptId,claim.custodyReceiptId,claim.witnessReceiptId,
      claim.privateReviewRequestId]).size!==4 ||
    !ALIAS.test(claim.witnessAlias||'') || !ALIAS.test(claim.independentVerifierAlias||'') ||
    claim.witnessAlias===claim.independentVerifierAlias ||
    claim.reviewOutcome!=='REQUEST_INDEPENDENT_PRIVATE_CUSTODY_REVIEW_ONLY' ||
    !Number.isSafeInteger(claim.claimedAtMs) || claim.claimedAtMs>now+30000 ||
    claim.claimedAtMs<now-300000)
    return hold('DENIED_CUSTODY_CLOSURE_SOURCE_TENANT_ROLE_OR_SCOPE',
      'Source A/B, tenant, distinct receipts, independent reviewer or freshness incorrect.');
  if (witnessResult?.status!=='PRIVATE_REGISTRY_WITNESS_SIGNATURE_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD')
    return hold('DENIED_CUSTODY_CLOSURE_UNTRUSTED_WITNESS',
      'A valid upstream original witness signature claim is required.');
  return hold('PRIVATE_CUSTODY_CLOSURE_REVIEW_REQUEST_ONLY_HELD',
    'Private reviewer identity and actual registry custody cannot be authenticated from a submitted record.',
    {system:claim.system,sourceSha:claim.sourceSha,proofSha:claim.proofSha,
      tenantId:claim.tenantId,privateReviewRequestId:claim.privateReviewRequestId});
}

const WINDOW_FIELDS=['schemaVersion','system','repository','businessId','tenantId',
  'sourceSha','proofSha','privateReviewRequestId','environment','methods','paths',
  'startUtc','endUtc','ownerTestDecision','ownerTestReceiptId',
  'relayRole','relayEnabled','publicInbound','secretsInRepository','vaultOrCameraAccess',
  'dedicatedServiceAccountPlanned','stopAndRollbackDocumented','ownerPilotEnabled'];

/** Prepare a test authorization *request*, never a decision or scheduled job. */
export function inspectQl255MiniServerTestPreparation(origin,custodyResult,relayResult,
  request,{now=Date.now()}={}) {
  if (!exact(request,WINDOW_FIELDS) || !Number.isSafeInteger(now) || now<=0)
    return hold('DENIED_TEST_PREPARATION_SCHEMA','Exact bounded TEST-only proposal required.');
  const s=QL247_SOURCES.find(x=>x.system===request.system);
  if (!s || request.schemaVersion!=='rosevear.ql255.mini-server-test-preparation.v1' ||
    request.repository!==s.repository || request.businessId!==business(s.system) ||
    !tenantOk(s.system,request.tenantId) ||
    origin?.system!==s.system || origin?.repository!==s.repository ||
    origin?.status!=='PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD' ||
    request.sourceSha!==origin.sourceSha || request.proofSha!==origin.mainSha ||
    !SHA.test(request.sourceSha||'') || !SHA.test(request.proofSha||'') ||
    !ID.test(request.privateReviewRequestId||'') ||
    request.environment!=='nonproduction' ||
    JSON.stringify(request.methods)!==JSON.stringify(METHODS) ||
    JSON.stringify(request.paths)!==JSON.stringify(PATHS) ||
    request.ownerTestDecision!=='REQUEST_PRIVATE_OWNER_TEST_REVIEW_ONLY' ||
    request.ownerTestReceiptId!=='NOT_AVAILABLE' ||
    typeof request.startUtc!=='string' || typeof request.endUtc!=='string' ||
    !Number.isFinite(Date.parse(request.startUtc)) ||
    !Number.isFinite(Date.parse(request.endUtc)) ||
    Date.parse(request.startUtc)<=now || Date.parse(request.endUtc)<=Date.parse(request.startUtc) ||
    Date.parse(request.endUtc)-Date.parse(request.startUtc)>1800000 ||
    request.relayRole!=='ROSEVEAR_AI_HUB_PRIVATE_RELAY_CANDIDATE' ||
    request.relayEnabled!==false || request.publicInbound!==false ||
    request.secretsInRepository!==false || request.vaultOrCameraAccess!==false ||
    request.dedicatedServiceAccountPlanned!==true ||
    request.stopAndRollbackDocumented!==true || request.ownerPilotEnabled!==false)
    return hold('DENIED_TEST_PREPARATION_SCOPE_OR_FALSE_APPROVAL',
      'Only future <=30-minute GET-only private relay review with no credentials or owner approval claim is allowed.');
  if (custodyResult?.status!=='PRIVATE_CUSTODY_CLOSURE_REVIEW_REQUEST_ONLY_HELD' ||
    custodyResult.system!==request.system ||
    custodyResult.tenantId!==request.tenantId ||
    custodyResult.sourceSha!==request.sourceSha ||
    custodyResult.proofSha!==request.proofSha ||
    custodyResult.privateReviewRequestId!==request.privateReviewRequestId ||
    relayResult?.status!=='REVERSIBLE_PRIVATE_RELAY_SIMULATION_ONLY_HELD' ||
    relayResult.rollbackEndState!=='DISABLED')
    return hold('UPSTREAM_CUSTODY_OR_REVERSIBLE_RELAY_NOT_PREPARED_HELD',
      'Public source and private custody request plus disabled rollback rehearsal must match.');
  return hold('OWNER_TEST_ONLY_PRIVATE_DECISION_REQUEST_PREPARED_HELD',
    'Request prepared; real owner identity and permission, original gateway receipts and private server installation remain unverified.');
}
