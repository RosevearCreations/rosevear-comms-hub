import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIRED_STEPS,EXTRA_STEPS,MAX_ATTEMPTS,validateVersion,proposeVersion,
  reviewApproval,evaluateJob,schedulerGate,backoffMs,receiptDigest,PUBLIC_MANIFEST} from './engine.mjs';
import {privateProcedureStore} from './postgres-store.mjs';

const hash=receiptDigest('owner-source-independent-nonsecret-fixture');
const uuid='00000000-1111-4222-8333-444444444444';
const other='00000000-1111-4222-8333-555555555555';
const base={shellId:'yw',code:'connect_readonly',revision:1,optimisticVersion:1,status:'DRAFT',steps:[...REQUIRED_STEPS]};
const publicJob={shellId:'yw',sourceAppId:'yard-workers',jobType:'PUBLIC_DISCOVERY',attempts:0,
  workloadVerified:true,path:PUBLIC_MANIFEST};
const privateJob={shellId:'icamp',sourceAppId:'icamp',jobType:'SIGNED_READONLY_TEST',attempts:0,
  workloadVerified:true,path:'/api/integration/v1/health'};
const proof={originalSourceSigner:true,ownerTestAuthorized:true,sourceOwnerAuthorized:true,
  keyHandleActive:true,issuerBound:true,tenantScopeApproved:true};

test('QL334 mandatory core gates are exact and stored versions validate',()=>{
  assert.equal(REQUIRED_STEPS.length,8);
  assert.equal(EXTRA_STEPS.length,3);
  assert.equal(validateVersion(base),'VALID_DRAFT');
  for(const mutate of [p=>p.steps.splice(2,1),p=>p.steps.reverse(),p=>p.steps.push('SEND_SMS'),
    p=>p.steps.push('DISCOVER'),p=>p.steps.splice(0,0,'HOLD'),p=>p.shellId='camp-rosevear-demo',
    p=>p.code='authorize_payment',p=>p.revision=0]){
    const x=structuredClone(base);mutate(x);assert.notEqual(validateVersion(x),'VALID_DRAFT');
  }
});
test('Safe version proposal retains gates, CAS, author separation and immutable previous revision',()=>{
  const before=structuredClone(base);
  const created=proposeVersion(base,'MEASURE_LATENCY',{
    actorId:uuid,expectedOptimisticVersion:1,reason:'Add measured latency evidence'});
  assert.equal(created.decision,'DRAFT_PROPOSED');
  assert.equal(created.next.revision,2);
  assert.equal(created.next.steps.at(-1),'HOLD');
  assert.equal(validateVersion(created.next),'VALID_DRAFT');
  assert.deepEqual(base,before);
  assert.equal(proposeVersion(base,'MEASURE_LATENCY',{actorId:uuid,expectedOptimisticVersion:2,
    reason:'Add measured latency evidence'}).decision,'DENY_UNAUTHORIZED_OR_STALE_REVISION');
  assert.notEqual(proposeVersion({...base,status:'ACTIVE'},'CHECK_FRESHNESS',{
    actorId:uuid,expectedOptimisticVersion:1,reason:'Cannot mutate active'}).decision,'DRAFT_PROPOSED');
});
test('Author cannot approve own procedure or invent missing source and owner receipts',()=>{
  const p={authorId:uuid,reviewerId:other,ownerReceipt:hash,reviewerReceipt:hash,masterVerified:true};
  assert.equal(reviewApproval({...p,reviewerId:uuid}).decision,'DENY_REVIEW_AUTHORITY');
  assert.equal(reviewApproval({...p,ownerReceipt:null}).decision,'DENY_REVIEW_AUTHORITY');
  assert.equal(reviewApproval({...p,activate:true}).decision,'DENY_SOURCE_ACTIVATION');
  assert.equal(reviewApproval({...p,activate:true,sourceReceipt:hash,peerVerified:true}).decision,
    'APPROVAL_READY_FOR_PRIVATE_COMMIT');
});
test('All six public manifests are observable, but never count as authenticated peers',()=>{
  const all=['yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub'];
  for(const shellId of all){
    const m=evaluateJob({...publicJob,shellId,sourceAppId:shellId==='yw'?'yard-workers':shellId},
      {},{httpStatus:200,manifestValidated:true,rawSha256:hash});
    assert.equal(m.decision,'PUBLIC_DISCOVERY_OBSERVED');
    assert.equal(m.privateGets,0);assert.equal(m.writes,0);assert.equal(m.communicationsSent,0);
  }
});
test('Wrong tenant, source, destination, origin, path, method and missing workload fail closed',()=>{
  for(const extra of [{shellId:'unknown'},{shellId:'camp-rosevear-demo'},{tenantId:'camp-rosevear-demo'},
    {childId:'rosevear-landscaping-demo'},{sourceAppId:'icamp'},{origin:'https://attacker.invalid'},
    {url:'https://attacker.invalid'},{path:'/api/customers'},{method:'POST'},
    {workloadVerified:false}]){
    const r=evaluateJob({...publicJob,...extra},{},{httpStatus:200,manifestValidated:true,rawSha256:hash});
    assert.notEqual(r.decision,'PUBLIC_DISCOVERY_OBSERVED');
    assert.equal(r.privateGets,0);assert.equal(r.writes,0);
  }
});
test('401/403/404/409, replay, bad signatures and redirects quarantine immediately',()=>{
  for(const status of [401,403,404,409,'REPLAY','SIGNATURE_INVALID']){
    const r=evaluateJob(privateJob,proof,{httpStatus:status});
    assert.equal(r.decision,'HOLD_PEER_DENIED');assert.equal(r.nextState,'HOLD');
    assert.equal(r.privateGets,0);assert.equal(r.writes,0);
  }
  assert.equal(evaluateJob(publicJob,{}, {redirect:true}).decision,'HOLD_ORIGIN_CHANGED');
  assert.equal(evaluateJob(publicJob,{}, {originChanged:true}).decision,'HOLD_ORIGIN_CHANGED');
});
test('429, 5xx, timeouts and offline retry with cap, then dead letter; circuit breaker opens',()=>{
  for(const status of [429,500,502,503,599,'TIMEOUT','OFFLINE']){
    const r=evaluateJob({...publicJob,attempts:0},{},{httpStatus:status});
    assert.equal(r.decision,'BOUNDED_RETRY');assert.equal(r.nextState,'RETRY');
    assert.equal(r.retryAfterMs,backoffMs(1));assert.equal(r.attempts,1);
    const last=evaluateJob({...publicJob,attempts:MAX_ATTEMPTS-1},{},{httpStatus:status});
    assert.equal(last.decision,'DEAD_LETTER');assert.equal(last.circuit,'OPEN');
    assert.equal(last.attempts,MAX_ATTEMPTS);
  }
  assert.ok(backoffMs(2)>backoffMs(1));assert.ok(backoffMs(5)<=15*60_000);
});
test('Private signed GET needs ALL verified external authorities and independent nonce',()=>{
  for(const key of Object.keys(proof)){
    const r=evaluateJob(privateJob,{...proof,[key]:false},{httpStatus:200,signedReceiptVerified:true,nonceUnique:true});
    assert.equal(r.decision,'HOLD_MISSING_AUTHORITY');assert.equal(r.privateGets,0);
  }
  assert.equal(evaluateJob(privateJob,proof,{httpStatus:200,signedReceiptVerified:false,nonceUnique:true}).decision,
    'HOLD_UNVERIFIED_RECEIPT');
  assert.equal(evaluateJob(privateJob,proof,{httpStatus:200,signedReceiptVerified:true,nonceUnique:false}).decision,
    'HOLD_UNVERIFIED_RECEIPT');
  const accepted=evaluateJob(privateJob,proof,{httpStatus:200,signedReceiptVerified:true,nonceUnique:true});
  assert.equal(accepted.decision,'SIGNED_TEST_RECEIPT_ACCEPTED');
  assert.equal(accepted.privateGets,1);assert.equal(accepted.writes,0);
});
test('Scheduler without exact verified workload cannot touch database or remote sources',async()=>{
  const never=()=>{throw Error('UNAUTHENTICATED_DB_QUERY');};
  const repo=privateProcedureStore(never);
  const denied=await repo.claimDue({id:uuid,state:'PENDING',subjectAttested:false});
  assert.equal(denied.decision,'SCHEDULER_HOLD');
  assert.equal(schedulerGate({state:'VERIFIED',attestationSha256:hash,expiresAtMs:0},{shellId:'yw'}).decision,'SCHEDULER_HOLD');
  assert.equal(schedulerGate({state:'VERIFIED',attestationSha256:hash,
    expiresAtMs:Date.now()+60_000},{shellId:'yw',breaker:'OPEN'}).decision,'SCHEDULER_QUARANTINED');
  assert.equal((await repo.propose({shellId:'yw'}, {userId:uuid,authVerified:false,role:'owner'})).decision,
    'DENY_AUTHORIZED_MASTER_REQUIRED');
});
test('Private store persists a new draft with parameterized SQL and append-only decision',async()=>{
  const seen=[];
  const repo=privateProcedureStore(async action=>action({query:async(sql,params)=>{
    seen.push([sql,params]);
    if(sql.includes('FROM public.master_procedure_versions'))return {rows:[{
      revision:1,optimistic_version:1,status:'DRAFT',core_steps:[...REQUIRED_STEPS],procedure_version_id:uuid}]};
    if(sql.includes('INSERT INTO public.master_procedure_versions'))return {rows:[{procedure_version_id:other}]};
    return {rows:[]};
  }}));
  const result=await repo.propose({shellId:'yw',code:'connect_readonly',extra:'CHECK_FRESHNESS',
    reason:'Track approved freshness',expectedOptimisticVersion:1},{userId:uuid,role:'owner',authVerified:true});
  assert.equal(result.decision,'DRAFT_PERSISTED');
  assert.equal(seen.length,3);
  assert.ok(seen.every(x=>x[0].includes('$1')));
  assert.ok(seen.every(x=>!x[0].includes(uuid)));
});
test('Private store review rejects missing original proof and self-review before database access',async()=>{
  const repo=privateProcedureStore(()=>{throw Error('DATABASE_MUST_NOT_BE_TOUCHED');});
  const req={shellId:'yw',procedureVersionId:uuid,expectedOptimisticVersion:1,
    ownerReceipt:hash,reviewerReceipt:hash,
    ownerProofIndependentlyVerified:true,reviewerProofIndependentlyVerified:true};
  assert.equal((await repo.review({...req,ownerProofIndependentlyVerified:false},
    {userId:other,role:'owner',authVerified:true})).decision,'DENY_UNVERIFIED_REVIEW');
  assert.equal((await repo.approve({shellId:'yw',procedureVersionId:uuid,sourceReceipt:hash,
    ownerTestReceiptVerified:true,sourceOwnerReceiptVerified:false,independentSignatureVerified:true},
  {userId:other,role:'owner',authVerified:true})).decision,'DENY_UNVERIFIED_SOURCE_APPROVAL');
});
test('Review ledger requires two different enrolled active identities and inserts append-only proof',async()=>{
  const seen=[];
  const repo=privateProcedureStore(async action=>action({query:async(sql,params)=>{
    seen.push([sql,params]);
    if(sql.includes('LEFT JOIN public.master_principals'))return {rows:[{
      procedure_version_id:uuid,author_user_id:uuid,status:'DRAFT',optimistic_version:1,author_active:true}]};
    if(sql.includes('SELECT 1 FROM public.master_principals'))return {rows:[{one:1}]};
    if(sql.includes('UPDATE public.master_procedure_versions'))return {rows:[{procedure_version_id:uuid}]};
    return {rows:[]};
  }}));
  const review={shellId:'yw',procedureVersionId:uuid,expectedOptimisticVersion:1,
    ownerReceipt:hash,reviewerReceipt:hash,
    ownerProofIndependentlyVerified:true,reviewerProofIndependentlyVerified:true};
  assert.equal((await repo.review(review,{userId:uuid,role:'owner',authVerified:true})).decision,
    'DENY_STALE_OR_SELF_REVIEW');
  const ok=await repo.review(review,{userId:other,role:'owner',authVerified:true});
  assert.equal(ok.decision,'REVIEW_RECORDED_NO_SOURCE_ACTIVATION');
  assert.equal(seen.some(([sql])=>sql.includes('INSERT INTO public.master_procedure_decisions')),true);
  assert.ok(seen.every(([sql])=>!sql.includes(other)));
});
test('Approval with no actual trusted peer manifest cannot fake private connectivity',async()=>{
  const repo=privateProcedureStore(async action=>action({query:async(sql)=>{
    if(sql.includes('FROM public.master_procedure_versions'))return {rows:[{
      procedure_version_id:uuid,author_user_id:uuid,reviewer_user_id:other,
      status:'REVIEWED',optimistic_version:2,owner_authorization_sha256:hash}]};
    return {rows:[]};
  }}));
  const out=await repo.approve({shellId:'yw',procedureVersionId:uuid,
    expectedOptimisticVersion:2,sourceReceipt:hash,ownerTestReceiptVerified:true,
    sourceOwnerReceiptVerified:true,independentSignatureVerified:true},
  {userId:other,role:'owner',authVerified:true});
  assert.equal(out.decision,'HOLD_NO_ORIGINAL_VERIFIED_SOURCE_PROOF');
});
test('An untrusted scheduler cannot recover or replay a claimed job',async()=>{
  const repo=privateProcedureStore(()=>{throw Error('DATABASE_MUST_NOT_BE_TOUCHED');});
  assert.equal((await repo.quarantineExpired({id:uuid,state:'REVOKED',subjectAttested:true,
    expiresAtMs:Date.now()+60_000})).decision,'SCHEDULER_HOLD');
  assert.equal((await repo.recordOutcome({state:'PENDING'}, {job:{job_id:uuid},leaseToken:'bad'})).decision,
    'DENY_UNTRUSTED_JOB');
});
test('A source 403 records an append-only incident and opens its own circuit',async()=>{
  const seen=[];
  const repo=privateProcedureStore(async action=>action({query:async(sql,params)=>{
    seen.push([sql,params]);
    if(sql.includes('UPDATE public.master_procedure_jobs'))return {rows:[{job_id:uuid}]};
    return {rows:[]};
  }}));
  const workload={id:uuid,state:'VERIFIED',subjectAttested:true,expiresAtMs:Date.now()+60_000};
  const incident=await repo.recordOutcome(workload,{job:{job_id:other,shell_id:'icamp',
    job_type:'SIGNED_READONLY_TEST',attempts:0,path:'/api/integration/v1/health',source_app_id:'icamp'},
  leaseToken:'local-fixture-lease',proof:{},outcome:{httpStatus:403}});
  assert.equal(incident.decision,'HOLD_PEER_DENIED');
  assert.equal(incident.recorded,true);
  assert.ok(seen.some(([sql])=>sql.includes('UPDATE public.master_procedure_breakers')));
  assert.ok(seen.some(([sql])=>sql.includes('INSERT INTO public.master_procedure_job_events')));
  assert.ok(seen.every(([sql])=>!sql.includes('local-fixture-lease')));
});
