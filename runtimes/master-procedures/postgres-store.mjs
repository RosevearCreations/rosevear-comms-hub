/** QL-334 PostgreSQL adapter. Uses a caller-provided PRIVATE transaction provider.
 * No HTTP route, browser SDK, global credentials or default connection is created.
 */
import {randomUUID} from 'node:crypto';
import {SOURCES} from '../master-discovery/manifest.mjs';
import {evaluateJob,proposeVersion,receiptDigest,reviewApproval,schedulerGate,validateVersion,isDigest} from './engine.mjs';

const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ALLOWED_ROLE=new Set(['owner','admin']);
const trustedEditor=(actor)=>actor?.authVerified===true&&ID.test(actor.userId??'')&&ALLOWED_ROLE.has(actor.role);
const trustedBroker=(workload)=>workload?.state==='VERIFIED'&&workload?.subjectAttested===true&&ID.test(workload.id??'')&&
  Number.isSafeInteger(workload.expiresAtMs)&&workload.expiresAtMs>Date.now();

export function privateProcedureStore(transaction){
  if(typeof transaction!=='function')throw new Error('PRIVATE_DATABASE_TRANSACTION_REQUIRED');
  return {
    /** Drafts are append-new-revision, using a locked DB read and unique revision. */
    async propose({shellId,code,extra,reason,expectedOptimisticVersion},actor){
      if(!trustedEditor(actor)||!Object.hasOwn(SOURCES,shellId))return {decision:'DENY_AUTHORIZED_MASTER_REQUIRED'};
      return transaction(async tx=>{
        const p=await tx.query(`SELECT procedure_version_id,revision,optimistic_version,status,core_steps
          FROM public.master_procedure_versions WHERE shell_id=$1 AND procedure_code=$2
          ORDER BY revision DESC LIMIT 1 FOR UPDATE`,[shellId,code]);
        if(p.rows.length!==1)return {decision:'NO_DATABASE_PROCEDURE_HELD'};
        const row=p.rows[0];
        const draft={shellId,code,revision:row.revision,optimisticVersion:row.optimistic_version,
          steps:row.core_steps,status:row.status};
        if(validateVersion(draft)!=='VALID_DRAFT')return {decision:'UNSAFE_STORED_PROCEDURE_HELD'};
        const result=proposeVersion(draft,extra,{actorId:actor.userId,expectedOptimisticVersion,reason});
        if(result.decision!=='DRAFT_PROPOSED')return result;
        const next=result.next;
        const digest=receiptDigest(JSON.stringify({shellId,code,revision:next.revision,steps:next.steps,reason}));
        const created=await tx.query(`INSERT INTO public.master_procedure_versions
          (shell_id,procedure_code,revision,parent_revision,core_steps,config_sha256,author_user_id,system_seed)
          SELECT $1,$2,$3,$4,$5::jsonb,$6,$7,false
          WHERE EXISTS(SELECT 1 FROM public.master_principals WHERE user_id=$7 AND active=true AND master_role IN ('owner','admin'))
          ON CONFLICT (shell_id,procedure_code,revision) DO NOTHING RETURNING procedure_version_id`,
          [shellId,code,next.revision,row.revision,JSON.stringify(next.steps),digest,actor.userId]);
        if(created.rows.length!==1)return {decision:'DENY_STALE_OR_UNENROLLED_AUTHOR'};
        await tx.query(`INSERT INTO public.master_procedure_decisions
          (shell_id,procedure_version_id,actor_user_id,decision,source,receipt_sha256)
          VALUES($1,$2,$3,'DRAFT_CREATED','HUMAN_MASTER',$4)`,
          [shellId,created.rows[0].procedure_version_id,actor.userId,
            receiptDigest(`${digest}:${actor.userId}:DRAFT_CREATED`)]);
        return {decision:'DRAFT_PERSISTED',revision:next.revision,receiptSha256:digest};
      });
    },
    /** Separate authentic reviewer; REVIEWED is not private source activation. */
    async review({shellId,procedureVersionId,expectedOptimisticVersion,ownerReceipt,reviewerReceipt,
      ownerProofIndependentlyVerified,reviewerProofIndependentlyVerified},actor){
      if(!trustedEditor(actor)||!Object.hasOwn(SOURCES,shellId)||!ID.test(procedureVersionId??'')||
        ownerProofIndependentlyVerified!==true||reviewerProofIndependentlyVerified!==true||
        !isDigest(ownerReceipt)||!isDigest(reviewerReceipt))return {decision:'DENY_UNVERIFIED_REVIEW'};
      return transaction(async tx=>{
        const check=await tx.query(`SELECT v.procedure_version_id,v.author_user_id,v.status,v.optimistic_version,
          p.active AS author_active
          FROM public.master_procedure_versions v
          LEFT JOIN public.master_principals p ON p.user_id=v.author_user_id
          WHERE v.shell_id=$1 AND v.procedure_version_id=$2 FOR UPDATE OF v`,
        [shellId,procedureVersionId]);
        const row=check.rows[0];
        if(!row||!row.author_active||row.status!=='DRAFT'||row.author_user_id===actor.userId||
          row.optimistic_version!==expectedOptimisticVersion)return {decision:'DENY_STALE_OR_SELF_REVIEW'};
        const authorized=await tx.query(`SELECT 1 FROM public.master_principals
          WHERE user_id=$1 AND active=true AND master_role IN ('owner','admin')`,[actor.userId]);
        if(!authorized.rows.length)return {decision:'DENY_UNENROLLED_REVIEWER'};
        const verdict=reviewApproval({authorId:row.author_user_id,reviewerId:actor.userId,
          ownerReceipt,reviewerReceipt,masterVerified:true});
        if(verdict.decision!=='REVIEWED_FOR_PRIVATE_COMMIT')return verdict;
        const applied=await tx.query(`UPDATE public.master_procedure_versions
          SET status='REVIEWED',reviewer_user_id=$3,reviewer_receipt_sha256=$4,
          owner_authorization_sha256=$5,optimistic_version=optimistic_version+1,updated_at=now()
          WHERE shell_id=$1 AND procedure_version_id=$2 AND status='DRAFT'
            AND optimistic_version=$6 RETURNING procedure_version_id`,
          [shellId,procedureVersionId,actor.userId,reviewerReceipt,ownerReceipt,expectedOptimisticVersion]);
        if(!applied.rows.length)throw new Error('REVIEW_CONFLICT');
        const digest=receiptDigest(`${shellId}:${procedureVersionId}:${actor.userId}:${reviewerReceipt}`);
        await tx.query(`INSERT INTO public.master_procedure_decisions
          (shell_id,procedure_version_id,actor_user_id,decision,source,receipt_sha256)
          VALUES($1,$2,$3,'REVIEW_ACCEPTED','HUMAN_MASTER',$4)`,
          [shellId,procedureVersionId,actor.userId,digest]);
        return {decision:'REVIEW_RECORDED_NO_SOURCE_ACTIVATION',receiptSha256:digest};
      });
    },
    /** Promotion is held until independent source manifest and issuer trust exist. */
    async approve({shellId,procedureVersionId,expectedOptimisticVersion,sourceReceipt,
      ownerTestReceiptVerified,sourceOwnerReceiptVerified,independentSignatureVerified},actor){
      if(!trustedEditor(actor)||!Object.hasOwn(SOURCES,shellId)||!ID.test(procedureVersionId??'')||
        !isDigest(sourceReceipt)||ownerTestReceiptVerified!==true||
        sourceOwnerReceiptVerified!==true||independentSignatureVerified!==true)
        return {decision:'DENY_UNVERIFIED_SOURCE_APPROVAL'};
      return transaction(async tx=>{
        const check=await tx.query(`SELECT v.procedure_version_id,v.author_user_id,v.reviewer_user_id,
          v.status,v.optimistic_version,v.owner_authorization_sha256
          FROM public.master_procedure_versions v
          WHERE v.shell_id=$1 AND v.procedure_version_id=$2 FOR UPDATE`,[shellId,procedureVersionId]);
        const p=check.rows[0];
        if(!p||p.status!=='REVIEWED'||p.optimistic_version!==expectedOptimisticVersion||
          !p.owner_authorization_sha256||p.author_user_id===actor.userId||p.reviewer_user_id!==actor.userId)
          return {decision:'DENY_NOT_INDEPENDENTLY_REVIEWED'};
        const trust=await tx.query(`SELECT p.pin_id FROM public.master_source_manifest_pins p
          JOIN public.master_peer_issuers i ON i.shell_id=p.shell_id
            AND i.issuer_record_id=p.peer_issuer_record_id
          WHERE p.shell_id=$1 AND p.state='VERIFIED' AND i.state='VERIFIED'
            AND i.revoked_at IS NULL AND p.owner_test_authorization_sha256 IS NOT NULL
            AND i.source_owner_approval_sha256=$2 LIMIT 1`,[shellId,sourceReceipt]);
        if(!trust.rows.length)return {decision:'HOLD_NO_ORIGINAL_VERIFIED_SOURCE_PROOF'};
        const authorized=await tx.query(`SELECT 1 FROM public.master_principals
          WHERE user_id=$1 AND active=true AND master_role='owner'`,[actor.userId]);
        if(!authorized.rows.length)return {decision:'DENY_OWNER_REQUIRED'};
        const accepted=await tx.query(`UPDATE public.master_procedure_versions
          SET status='APPROVED',source_authorization_sha256=$3,
          optimistic_version=optimistic_version+1,updated_at=now()
          WHERE shell_id=$1 AND procedure_version_id=$2 AND status='REVIEWED'
            AND optimistic_version=$4 RETURNING procedure_version_id`,
        [shellId,procedureVersionId,sourceReceipt,expectedOptimisticVersion]);
        if(!accepted.rows.length)throw new Error('APPROVAL_CONFLICT');
        const digest=receiptDigest(`${shellId}:${procedureVersionId}:${sourceReceipt}:APPROVED`);
        await tx.query(`INSERT INTO public.master_procedure_decisions
          (shell_id,procedure_version_id,actor_user_id,decision,source,receipt_sha256)
          VALUES($1,$2,$3,'APPROVED','HUMAN_MASTER',$4)`,
          [shellId,procedureVersionId,actor.userId,digest]);
        return {decision:'APPROVED_NOT_ACTIVATED',receiptSha256:digest};
      });
    },
    /** Acquires at most one due job with PostgreSQL row locking; no external call. */
    async claimDue(workload){
      if(!trustedBroker(workload))return {decision:'SCHEDULER_HOLD'};
      return transaction(async tx=>{
        const verified=await tx.query(`SELECT workload_id,state,expires_at,attestation_sha256
          FROM public.master_workload_identities WHERE workload_id=$1 FOR UPDATE`,[workload.id]);
        const w=verified.rows[0];
        if(!w||schedulerGate({state:w.state,attestationSha256:w.attestation_sha256,
          expiresAtMs:Date.parse(w.expires_at)}, {shellId:'ai-data-platform'}).decision!=='SCHEDULER_LEASE_ELIGIBLE')
          return {decision:'SCHEDULER_HOLD'};
        const selection=await tx.query(`SELECT j.job_id,j.shell_id,j.job_type,j.stage,j.attempts,j.idempotency_key
          FROM public.master_procedure_jobs j JOIN public.master_procedure_schedules s USING(shell_id)
          JOIN public.master_procedure_breakers b USING(shell_id)
          WHERE s.enabled=true AND s.verified_workload_id=$1 AND b.state<>'OPEN'
            AND j.state IN ('QUEUED','RETRY') AND j.next_attempt_at<=now()
          ORDER BY j.next_attempt_at,j.job_id LIMIT 1 FOR UPDATE OF j SKIP LOCKED`,[workload.id]);
        if(selection.rows.length!==1)return {decision:'NO_DUE_AUTHORIZED_JOBS'};
        const j=selection.rows[0];
        if(!Object.hasOwn(SOURCES,j.shell_id))return {decision:'UNKNOWN_SHELL_HOLD'};
        const lease=randomUUID(),leaseHash=receiptDigest(lease);
        const changed=await tx.query(`UPDATE public.master_procedure_jobs
          SET state='CLAIMED',lease_sha256=$2,lease_until=now()+interval '2 minutes',
            workload_id=$3,updated_at=now() WHERE job_id=$1 AND state IN ('QUEUED','RETRY')
          RETURNING job_id`,[j.job_id,leaseHash,workload.id]);
        if(changed.rows.length!==1)throw new Error('JOB_ALREADY_CLAIMED');
        return {decision:'LEASED_PRIVATE_JOB',job:j,leaseToken:lease};
      });
    },
    /** Updates are CAS-bound to the exact lease; evidence is insert-only. */
    async recordOutcome(workload,{job,leaseToken,proof,outcome}){
      if(!trustedBroker(workload)||!ID.test(job?.job_id??'')||typeof leaseToken!=='string')
        return {decision:'DENY_UNTRUSTED_JOB'};
      const result=evaluateJob({shellId:job.shell_id,jobType:job.job_type,attempts:job.attempts,
        workloadVerified:true,path:job.path,sourceAppId:job.source_app_id},proof,outcome);
      // Every unexpected outcome moves to HOLD instead of leaving a claimed
      // lease stranded or silently allowing a new source attempt.
      const nextState=result.nextState??'HOLD';
      return transaction(async tx=>{
        const changed=await tx.query(`UPDATE public.master_procedure_jobs SET state=$4,
          attempts=$5,next_attempt_at=now()+($6::integer * interval '1 millisecond'),
          failure_code=$7,lease_sha256=NULL,lease_until=NULL,workload_id=NULL,updated_at=now()
          WHERE job_id=$1 AND shell_id=$2 AND lease_sha256=$3 AND state='CLAIMED'
            AND job_type=$8 AND lease_until>now()
          RETURNING job_id`,[job.job_id,job.shell_id,receiptDigest(leaseToken),nextState,
            result.attempts??job.attempts,result.retryAfterMs??0,
            result.decision.replace(/[^A-Z0-9_]/g,'').slice(0,70),job.job_type]);
        if(changed.rows.length!==1)throw new Error('REPLAY_OR_STALE_LEASE');
        const digest=receiptDigest(JSON.stringify({jobId:job.job_id,decision:result.decision,
          status:outcome.httpStatus??null,attempts:result.attempts??job.attempts}));
        await tx.query(`INSERT INTO public.master_procedure_job_events
          (shell_id,job_id,event_code,receipt_sha256) VALUES($1,$2,$3,$4)`,
          [job.shell_id,job.job_id,result.decision,digest]);
        if(result.circuit==='OPEN'||nextState==='HOLD'||nextState==='DEAD_LETTER'){
          await tx.query(`UPDATE public.master_procedure_breakers
            SET state='OPEN',consecutive_failures=LEAST(consecutive_failures+1,1000),
              opened_at=now(),retry_after=now()+interval '24 hours'
            WHERE shell_id=$1`,[job.shell_id]);
        }else if(nextState==='COMPLETED'){
          await tx.query(`UPDATE public.master_procedure_breakers
            SET state='CLOSED',consecutive_failures=0,opened_at=NULL,retry_after=NULL
            WHERE shell_id=$1 AND state='CLOSED'`,[job.shell_id]);
        }else if(nextState==='RETRY'){
          await tx.query(`UPDATE public.master_procedure_breakers
            SET consecutive_failures=LEAST(consecutive_failures+1,1000)
            WHERE shell_id=$1 AND state='CLOSED'`,[job.shell_id]);
        }
        return {decision:result.decision,recorded:true,receiptSha256:digest};
      });
    },
    /** Expired claims are stopped and audited; never blindly replayed. */
    async quarantineExpired(workload){
      if(!trustedBroker(workload))return {decision:'SCHEDULER_HOLD'};
      return transaction(async tx=>{
        const verified=await tx.query(`SELECT state,attestation_sha256,expires_at
          FROM public.master_workload_identities WHERE workload_id=$1 FOR UPDATE`,[workload.id]);
        const w=verified.rows[0];
        if(!w||schedulerGate({state:w.state,attestationSha256:w.attestation_sha256,
          expiresAtMs:Date.parse(w.expires_at)},{shellId:'ai-data-platform'}).decision!=='SCHEDULER_LEASE_ELIGIBLE')
          return {decision:'SCHEDULER_HOLD'};
        const stale=await tx.query(`SELECT job_id,shell_id FROM public.master_procedure_jobs
          WHERE state='CLAIMED' AND lease_until<=now()
          ORDER BY lease_until LIMIT 50 FOR UPDATE SKIP LOCKED`);
        for(const row of stale.rows){
          await tx.query(`UPDATE public.master_procedure_jobs SET state='HOLD',
            lease_sha256=NULL,lease_until=NULL,workload_id=NULL,
            failure_code='STALE_LEASE_QUARANTINED',updated_at=now()
            WHERE job_id=$1 AND shell_id=$2 AND state='CLAIMED'`,[row.job_id,row.shell_id]);
          await tx.query(`INSERT INTO public.master_procedure_job_events
            (shell_id,job_id,event_code,receipt_sha256) VALUES ($1,$2,'STALE_LEASE_QUARANTINED',$3)`,
            [row.shell_id,row.job_id,receiptDigest(`${row.job_id}:STALE_LEASE_QUARANTINED`)]);
          await tx.query(`UPDATE public.master_procedure_breakers SET state='OPEN',
            consecutive_failures=LEAST(consecutive_failures+1,1000),opened_at=now(),
            retry_after=now()+interval '24 hours' WHERE shell_id=$1`,[row.shell_id]);
        }
        return {decision:'EXPIRED_LEASES_QUARANTINED',count:stale.rows.length};
      });
    }
  };
}
