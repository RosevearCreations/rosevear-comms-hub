import {createHash,timingSafeEqual} from 'node:crypto';
import {buildQl421ClosureHandoffHistory} from './ql421-closure-handoff-history.mjs';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const ACTOR=/^[A-Za-z0-9_-]{3,80}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HOST='DESKTOP-AE894KC', SOURCE='rosevear-ai-hub';
const MAX_RECORDS=200, FRESH_MS=300000;
const hash=o=>createHash('sha256').update(JSON.stringify(o),'utf8').digest('hex');
const equal=(a,b)=>HEX.test(a??'')&&HEX.test(b??'')&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const safeTime=(n,now)=>Number.isSafeInteger(n)&&n>=0&&n<=now;
const caseKey=x=>x.sourceId+':'+x.episodeId;
const hold=reason=>({state:'HOLD',reason,cases:[],receiver:'OFF',connection:'HOLD',
  originalHostUptime:'UNKNOWN',ownerAcceptance:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

export function ql422WitnessDigest({sourceId,episodeId,sourceRevision,controllerRevision,
  hostId,closureDigest,sourceReceiptId,sourceReceiptDigest,receiverAckDigest,witnessedAtMs}){
  return hash({schema:'rosevear.ql422.original-host-witness.v1',
    sourceId,episodeId,sourceRevision,controllerRevision,hostId,
    closureDigest,sourceReceiptId,sourceReceiptDigest,receiverAckDigest,witnessedAtMs});
}

export function ql422LedgerDigest({sourceId,episodeId,sourceRevision,controllerRevision,
  masterId,handoffReceiptId,closureDigest,witnessDigest,sequence,committedAtMs,
  previousDigest}){
  return hash({schema:'rosevear.ql422.durable-master-handoff.v1',
    sourceId,episodeId,sourceRevision,controllerRevision,masterId,
    handoffReceiptId,closureDigest,witnessDigest,sequence,committedAtMs,previousDigest});
}

export function ql422OperatorRecheckDigest({sourceId,episodeId,sourceRevision,controllerRevision,
  decisionId,action,ownerId,reviewerId,decidedAtMs,priorOwnerAuditDigest,
  witnessDigest,terminalLedgerDigest}){
  return hash({schema:'rosevear.ql422.operator-decision-recheck.v1',
    sourceId,episodeId,sourceRevision,controllerRevision,decisionId,action,
    ownerId,reviewerId,decidedAtMs,priorOwnerAuditDigest,
    witnessDigest,terminalLedgerDigest});
}

/** Only protected, independently verified metadata is admissible.
 * This function performs deterministic reconciliation, NOT signature
 * verification or durable writes. Trusted caller MUST separately authenticate
 * source signer, original machine identity, receiver ACK, ledger reader and
 * owner/reviewer identities. It never changes receiver or connection state. */
export function buildQl422WitnessLedgerRecheck({
 episodes=[],decisions=[],assignments=[],escalations=[],exportReceipts=[],
 slaEvidence=[],closureReviews=[],closureEvidence=[],masterHandoffs=[],
 ownerAuditHistory=[],originalHostWitnesses=[],durableMasterLedger=[],
 operatorRechecks=[],controllerRevision,nowMs,
 protectedReadAuthorized=false,protectedExportAuthorized=false,
 independentAuditReviewerVerified=false
}={}){
 if(!protectedReadAuthorized||!SHA.test(controllerRevision??'')||
    !safeTime(nowMs,nowMs)||!Array.isArray(originalHostWitnesses)||
    !Array.isArray(durableMasterLedger)||!Array.isArray(operatorRechecks)||
    [originalHostWitnesses,durableMasterLedger,operatorRechecks]
      .some(a=>a.length>MAX_RECORDS))
   return hold('PROTECTED_QL422_ACCESS_OR_BOUNDS_UNVERIFIED');
 const prior=buildQl421ClosureHandoffHistory({
   episodes,decisions,assignments,escalations,exportReceipts,slaEvidence,
   closureReviews,closureEvidence,masterHandoffs,ownerAuditHistory,
   controllerRevision,nowMs,protectedReadAuthorized,
   protectedExportAuthorized,independentAuditReviewerVerified
 });
 if(prior.state!=='PROTECTED_THREE_MASTER_HANDOFF_REVIEW')return hold(prior.reason);
 const cases=new Map(prior.cases.map(c=>[caseKey(c),c]));
 const witnesses=new Map(),ledger=new Map(),rechecks=new Map(),ids=new Set();
 for(const w of originalHostWitnesses){
   if(!w||w.sourceId!==SOURCE||w.hostId!==HOST||
     !ID.test(w.episodeId??'')||!ID.test(w.witnessId??'')||
     !ID.test(w.sourceReceiptId??'')||!SHA.test(w.sourceRevision??'')||
     w.controllerRevision!==controllerRevision||
     !HEX.test(w.sourceReceiptDigest??'')||!HEX.test(w.receiverAckDigest??'')||
     !HEX.test(w.closureDigest??'')||!HEX.test(w.witnessDigest??'')||
     !safeTime(w.witnessedAtMs,nowMs)||nowMs-w.witnessedAtMs>FRESH_MS||
     w.independentHostIdentityVerified!==true||
     w.independentSourceSignerVerified!==true||
     w.receiverAckSignatureVerified!==true||
     w.durableSourceReplayCommitted!==true||
     w.independentWitnessCustodyVerified!==true)
     return hold('ORIGINAL_HOST_WITNESS_PROOF_UNVERIFIED');
   const key=caseKey(w),c=cases.get(key);
   if(!c||c.sourceRevision!==w.sourceRevision||
     !equal(c.closureDigest,w.closureDigest)||
     !c.closureEvidenceId||ids.has(w.witnessId)||witnesses.has(key))
     return hold('WITNESS_SOURCE_CLOSURE_OR_REPLAY_MISMATCH');
   const expected=ql422WitnessDigest(w);
   if(!equal(expected,w.witnessDigest))return hold('WITNESS_EXACT_DIGEST_MISMATCH');
   ids.add(w.witnessId);witnesses.set(key,w);
 }
 for(const r of durableMasterLedger){
   if(!r||!MASTERS.includes(r.masterId)||r.sourceId!==SOURCE||
     !ID.test(r.episodeId??'')||!ID.test(r.ledgerEntryId??'')||
     !ID.test(r.handoffReceiptId??'')||!SHA.test(r.sourceRevision??'')||
     r.controllerRevision!==controllerRevision||
     !HEX.test(r.closureDigest??'')||!HEX.test(r.witnessDigest??'')||
     !HEX.test(r.previousDigest??'')||!HEX.test(r.ledgerDigest??'')||
     !Number.isSafeInteger(r.sequence)||r.sequence<1||
     !safeTime(r.committedAtMs,nowMs)||
     r.trustedMasterSignerVerified!==true||
     r.durableStoreCommitVerified!==true||
     r.independentLedgerReaderVerified!==true)
     return hold('MASTER_LEDGER_SIGNER_STORE_OR_READER_UNVERIFIED');
   const key=caseKey(r),c=cases.get(key),w=witnesses.get(key);
   if(!c||!w||c.sourceRevision!==r.sourceRevision||
     !equal(c.closureDigest,r.closureDigest)||
     !equal(w.witnessDigest,r.witnessDigest)||
     ids.has(r.ledgerEntryId))
     return hold('MASTER_LEDGER_WITNESS_OR_REVISION_MISMATCH');
   const priorReceipt=c.receipts.find(x=>x.masterId===r.masterId);
   if(!priorReceipt||priorReceipt.receiptId!==r.handoffReceiptId||
     r.committedAtMs<priorReceipt.receivedAtMs)
     return hold('MASTER_LEDGER_HANDOFF_NOT_CORRELATED');
   const entries=ledger.get(key)??[];
   const prev=entries.at(-1);
   const expectedMaster=MASTERS[entries.length];
   if(r.masterId!==expectedMaster||
     r.sequence!==(prev?.sequence??0)+1||
     !equal(r.previousDigest,prev?.ledgerDigest??'0'.repeat(64))||
     (prev&&r.committedAtMs<=prev.committedAtMs))
     return hold('MASTER_LEDGER_CHAIN_ORDER_OR_DUPLICATE');
   if(!equal(ql422LedgerDigest(r),r.ledgerDigest))
     return hold('MASTER_LEDGER_DIGEST_MISMATCH');
   entries.push(r);ledger.set(key,entries);ids.add(r.ledgerEntryId);
 }
 for(const a of operatorRechecks){
   if(!a||a.sourceId!==SOURCE||!ID.test(a.episodeId??'')||
     !ID.test(a.decisionId??'')||!SHA.test(a.sourceRevision??'')||
     a.controllerRevision!==controllerRevision||
     !ACTOR.test(a.ownerId??'')||!ACTOR.test(a.reviewerId??'')||
     a.ownerId===a.reviewerId||
     !['REQUEST_SUPERVISED_ACCEPTANCE','REOPEN','CONTINUE_HOLD'].includes(a.action)||
     !HEX.test(a.priorOwnerAuditDigest??'')||
     !HEX.test(a.witnessDigest??'')||!HEX.test(a.terminalLedgerDigest??'')||
     !HEX.test(a.decisionDigest??'')||!safeTime(a.decidedAtMs,nowMs)||
     a.protectedOwnerAuthorityVerified!==true||
     a.independentReviewerVerified!==true||
     a.durableDecisionCommitted!==true)
     return hold('OPERATOR_DECISION_AUTHORITY_OR_CUSTODY_UNVERIFIED');
   const key=caseKey(a),c=cases.get(key),w=witnesses.get(key);
   const entries=ledger.get(key)??[];
   const ownerLast=c?.auditHistory.at(-1);
   if(!c||!w||!ownerLast||c.sourceRevision!==a.sourceRevision||
     ids.has(a.decisionId)||rechecks.has(key)||
     a.ownerId!==ownerLast.ownerId||
     !equal(ownerLast.entryDigest,a.priorOwnerAuditDigest)||
     !equal(w.witnessDigest,a.witnessDigest)||
     !equal(entries.at(-1)?.ledgerDigest,a.terminalLedgerDigest)||
     a.decidedAtMs<(entries.at(-1)?.committedAtMs??0))
     return hold('OPERATOR_DECISION_CHAIN_OR_SOURCE_MISMATCH');
   if(a.action==='REQUEST_SUPERVISED_ACCEPTANCE'&&
     (entries.length!==MASTERS.length||
      c.handoffState!=='READY_FOR_SUPERVISED_OWNER_DECISION'))
     return hold('OPERATOR_REQUEST_MISSING_SUPERVISED_PROOF');
   if(!equal(ql422OperatorRecheckDigest(a),a.decisionDigest))
     return hold('OPERATOR_DECISION_DIGEST_MISMATCH');
   rechecks.set(key,a);ids.add(a.decisionId);
 }
 const rows=prior.cases.map(c=>{
   const key=caseKey(c),w=witnesses.get(key),entries=ledger.get(key)??[],d=rechecks.get(key);
   const missingMasters=MASTERS.filter(m=>!entries.some(x=>x.masterId===m));
   const stale=w&&nowMs-w.witnessedAtMs>FRESH_MS||
     entries.some(e=>nowMs-e.committedAtMs>FRESH_MS);
   const status=!w?'HOLD_ORIGINAL_HOST_WITNESS_MISSING':
     missingMasters.length?'HOLD_DURABLE_MASTER_LEDGER_INCOMPLETE':
     stale?'HOLD_STALE_WITNESS_OR_LEDGER':
     !d?'HOLD_OPERATOR_RECHECK_MISSING':
     d.action==='REOPEN'?'HOLD_OPERATOR_REOPENED':
     d.action==='CONTINUE_HOLD'?'HOLD_OPERATOR_CONTINUITY':
     c.handoffState!=='READY_FOR_SUPERVISED_OWNER_DECISION'?
       'HOLD_QL421_OWNER_REVIEW_INCOMPLETE':
       'READY_FOR_SUPERVISED_OWNER_RECHECK_NOT_ACCEPTED';
   return {sourceId:c.sourceId,episodeId:c.episodeId,
     sourceRevision:c.sourceRevision,witnessId:w?.witnessId??null,
     handoffReceiptCount:entries.length,missingMasters,
     lastLedgerDigest:entries.at(-1)?.ledgerDigest??null,
     latestDecisionId:d?.decisionId??null,
     latestDecisionAction:d?.action??'NONE',
     recheckState:status,ownerAcceptance:'HOLD',receiver:'OFF',connection:'HOLD'};
 });
 return {state:'PROTECTED_QL422_RECONCILIATION',reason:'REVIEW_ONLY_NO_RUNTIME_ACTIVATION',
   controllerRevision,evaluatedAtMs:nowMs,cases:rows,
   totals:{cases:rows.length,readyForSupervisedRecheck:rows.filter(x=>
     x.recheckState==='READY_FOR_SUPERVISED_OWNER_RECHECK_NOT_ACCEPTED').length},
   receiver:'OFF',connection:'HOLD',originalHostUptime:'UNKNOWN',
   ownerAcceptance:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
