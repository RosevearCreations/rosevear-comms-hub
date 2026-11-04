/** QL-334 private workflow kernel: source-aware, fail-closed, zero communication writes. */
import {createHash} from 'node:crypto';
import {SOURCES} from '../master-discovery/manifest.mjs';

export const REQUIRED_STEPS=Object.freeze([
  'DISCOVER','VERIFY_SOURCE','VERIFY_OWNER','RESOLVE_VAULT_HANDLE',
  'READONLY_TEST','VERIFY_RECEIPT','MONITOR','HOLD'
]);
export const EXTRA_STEPS=Object.freeze(['REVIEW_FOLLOWUP','CHECK_FRESHNESS','MEASURE_LATENCY']);
export const PROCEDURES=Object.freeze(['connect_readonly','client_portal_tracking','management_reporting']);
export const MAX_ATTEMPTS=5,MIN_BACKOFF_MS=15_000,MAX_BACKOFF_MS=15*60_000;
export const PUBLIC_MANIFEST='/.well-known/rosevear-integration-manifest.json';
const frozen={privateGets:0,writes:0,communicationsSent:0,childGrants:0,credentialValues:0};
const answer=(decision,detail,changes={})=>Object.freeze({decision,detail,...frozen,...changes});
export const isDigest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const receiptDigest=value=>createHash('sha256').update(value).digest('hex');

/** Code-mandated gates cannot be changed by a database procedure draft. */
export function validateVersion(p){
  if(!p||!Object.hasOwn(SOURCES,p.shellId)||!PROCEDURES.includes(p.code)||
    !Number.isSafeInteger(p.revision)||p.revision<1||p.revision>10000||
    !Array.isArray(p.steps)||p.steps.length<8||p.steps.length>18||
    new Set(p.steps).size!==p.steps.length||
    p.steps.some(s=>!REQUIRED_STEPS.includes(s)&&!EXTRA_STEPS.includes(s)))return 'INVALID_PROCEDURE_SCHEMA';
  const indexes=REQUIRED_STEPS.map(s=>p.steps.indexOf(s));
  if(indexes.some(i=>i<0)||indexes.some((n,i)=>i>0&&n<=indexes[i-1]))return 'MANDATORY_GATE_ORDER';
  if(p.steps[p.steps.length-1]!=='HOLD')return 'MISSING_FINAL_HOLD';
  return 'VALID_DRAFT';
}

export function proposeVersion(base,extra,{actorId,expectedOptimisticVersion,reason}={}){
  if(validateVersion(base)!=='VALID_DRAFT'||!EXTRA_STEPS.includes(extra)||
    typeof actorId!=='string'||!/^[a-f0-9]{8}-[a-f0-9-]{27,36}$/.test(actorId)||
    !Number.isSafeInteger(expectedOptimisticVersion)||expectedOptimisticVersion!==base.optimisticVersion||
    typeof reason!=='string'||reason.length<8||reason.length>250)
    return answer('DENY_UNAUTHORIZED_OR_STALE_REVISION','Draft requires a verified author and exact optimistic version.');
  if(base.status!=='DRAFT'||base.steps.includes(extra)||base.steps.length>=18)
    return answer('DENY_IMMUTABLE_OR_DUPLICATE_DRAFT','Draft cannot rewrite an approved revision or duplicate a step.');
  const steps=[...base.steps];steps.splice(steps.length-1,0,extra);
  const next={shellId:base.shellId,code:base.code,revision:base.revision+1,
    optimisticVersion:1,status:'DRAFT',steps,authorId:actorId,parentRevision:base.revision,
    reviewerId:null,reason};
  if(validateVersion(next)!=='VALID_DRAFT')return answer('DENY_UNSAFE_REVISION','Gate order changed.');
  return answer('DRAFT_PROPOSED','Versioned proposal; no remote procedure modified.',{next});
}

export function reviewApproval({authorId,reviewerId,ownerReceipt,sourceReceipt,reviewerReceipt,peerVerified,masterVerified,activate=false}={}){
  if(!masterVerified||!authorId||!reviewerId||authorId===reviewerId||
    !isDigest(ownerReceipt)||!isDigest(reviewerReceipt))return answer('DENY_REVIEW_AUTHORITY','Separate authenticated author and reviewer plus original owner receipt required.');
  if(activate&&(!isDigest(sourceReceipt)||!peerVerified))
    return answer('DENY_SOURCE_ACTIVATION','Independent source signer, owner TEST scope and peer evidence missing.');
  return answer(activate?'APPROVAL_READY_FOR_PRIVATE_COMMIT':'REVIEWED_FOR_PRIVATE_COMMIT',
    'Commit only through the authenticated server-side optimistic transaction.');
}

export function backoffMs(attempt){
  if(!Number.isSafeInteger(attempt)||attempt<1||attempt>MAX_ATTEMPTS)return MAX_BACKOFF_MS;
  return Math.min(MAX_BACKOFF_MS,MIN_BACKOFF_MS*2**(attempt-1));
}
const transientCode=(status)=>status===429||status>=500&&status<=599||status==='TIMEOUT'||status==='OFFLINE';
const deniedCode=(status)=>[401,403,404,409].includes(status)||status==='REPLAY'||status==='SIGNATURE_INVALID';

/** No arbitrary network destination or HTTP verb is ever taken from a stored procedure. */
export function evaluateJob(job,proof={},outcome={}){
  if(!job||!Object.hasOwn(SOURCES,job.shellId)||job.tenantId||job.childId||
    job.origin||job.host||job.url||job.sourceAppId&&job.sourceAppId!==SOURCES[job.shellId]?.app||
    !['PUBLIC_DISCOVERY','SIGNED_READONLY_TEST'].includes(job.jobType))
    return answer('DENY_SHELL_OR_CHILD','Unknown shell, child-as-connector or cross-tenant request.');
  if(!job.workloadVerified)return answer('HOLD_UNVERIFIED_WORKLOAD','No attested server-only workload may claim the queue.');
  if(job.method!==undefined&&job.method!=='GET')return answer('DENY_METHOD','No POST, PUT, PATCH, DELETE or dispatch.');
  if(job.path!==undefined&&job.path!==PUBLIC_MANIFEST&&
    !['/api/integration/v1/health','/api/integration/v1/capabilities'].includes(job.path))
    return answer('DENY_PATH','Only pinned public manifest or exact signed v1 health/capabilities GET.');
  if(outcome.redirect||outcome.originChanged)return answer('HOLD_ORIGIN_CHANGED','No redirect or unpinned origin is allowed.',{nextState:'HOLD'});
  if(!Number.isSafeInteger(job.attempts)||job.attempts<0||job.attempts>MAX_ATTEMPTS)
    return answer('DENY_ATTEMPT_COUNTER','Queue attempt limit is invalid.');
  if(deniedCode(outcome.httpStatus))return answer('HOLD_PEER_DENIED','Source denied identity, issuer, scope or replay.',
    {nextState:'HOLD',quarantine:true,failureCode:'PEER_DENIED'});
  if(transientCode(outcome.httpStatus)){
    const next=job.attempts+1;
    return next>=MAX_ATTEMPTS?answer('DEAD_LETTER','Retry budget exhausted.',
      {nextState:'DEAD_LETTER',attempts:next,circuit:'OPEN'}):
      answer('BOUNDED_RETRY','Retry later, never on a different shell or hostname.',
      {nextState:'RETRY',attempts:next,retryAfterMs:backoffMs(next),circuit:next>=3?'OPEN':'CLOSED'});
  }
  if(job.jobType==='PUBLIC_DISCOVERY'){
    if(job.path&&job.path!==PUBLIC_MANIFEST)return answer('DENY_PUBLIC_SCOPE','Public discovery cannot call legacy private v1.');
    if(outcome.httpStatus!==200||!outcome.manifestValidated||!isDigest(outcome.rawSha256))
      return answer('HOLD_PUBLIC_PROOF','Require current immutable public origin and exact content digest.');
    return answer('PUBLIC_DISCOVERY_OBSERVED','Nonsecret observation only, source signature remains untrusted.',
      {nextState:'COMPLETED',observedDigest:outcome.rawSha256});
  }
  if(!proof.originalSourceSigner||!proof.ownerTestAuthorized||!proof.sourceOwnerAuthorized||
    !proof.keyHandleActive||!proof.issuerBound||!proof.tenantScopeApproved)
    return answer('HOLD_MISSING_AUTHORITY','Authentic proof, source-owner grant, owner TEST, key custody and tenant scope are required.',{nextState:'HOLD'});
  if(job.path!=='/api/integration/v1/health'&&job.path!=='/api/integration/v1/capabilities')
    return answer('DENY_PRIVATE_SCOPE','Signed TEST permits only source-owned health/capabilities GET.');
  if(outcome.httpStatus!==200||!outcome.signedReceiptVerified||!outcome.nonceUnique)
    return answer('HOLD_UNVERIFIED_RECEIPT','No independently verified signed receipt or unique nonce.',{nextState:'HOLD'});
  // Actual private exchange is performed only by a separate approved gateway.
  return answer('SIGNED_TEST_RECEIPT_ACCEPTED','Private broker must persist its independently verified receipt.',
    {nextState:'COMPLETED',privateGets:1});
}

/** Trust, owner identity and source grant are checked BEFORE taking the SQL lease. */
export function schedulerGate(workload,source,nowMs=Date.now()){
  if(!workload||workload.state!=='VERIFIED'||!isDigest(workload.attestationSha256)||
    !Number.isSafeInteger(workload.expiresAtMs)||workload.expiresAtMs<=nowMs)
    return answer('SCHEDULER_HOLD','No independently verified live workload; no job claims or network calls.');
  if(!source||!Object.hasOwn(SOURCES,source.shellId)||source.breaker==='OPEN')
    return answer('SCHEDULER_QUARANTINED','Unknown or circuit-open source.');
  return answer('SCHEDULER_LEASE_ELIGIBLE','Only an approved private queue runner may use an atomic SQL lease.');
}
