import {reviewCrossAppIntake,type CrossAppIntake} from './ql388CrossAppIntake';
import {ql389CanonicalIntakeBytes,reviewSignedIntakePreview,type QL389Scenario} from './ql389SignedIntakePreview';

export const QL390_MAX_SIMULATION_EVENTS=50;
export type QL390Candidate={event:unknown;proof:unknown};
export type QL390RowState='PREVIEW_NEW'|'PREVIEW_DUPLICATE'|'PREVIEW_CONFLICT'|'HELD';
export type QL390OperatorRow={
  sequence:number;state:QL390RowState;sourceId:string;kind:string;eventCode:string;
  correlationId:string;evidenceRefCount:number;stage:string;explanation:string;
};
export type QL390Simulation={
  state:'INERT_PREVIEW'|'REJECTED_BATCH';
  rows:QL390OperatorRow[];
  counts:{newEvents:number;duplicates:number;conflicts:number;held:number};
  reason:string;
};

const held=(sequence:number,stage:string,explanation:string):QL390OperatorRow=>({
  sequence,state:'HELD',sourceId:'UNVERIFIED',kind:'REDACTED',eventCode:'REDACTED',
  correlationId:'REDACTED',evidenceRefCount:0,stage,explanation
});

const safeRow=(sequence:number,event:CrossAppIntake,state:QL390RowState,explanation:string):QL390OperatorRow=>({
  sequence,state,sourceId:event.sourceId,kind:event.kind,eventCode:event.eventCode,
  correlationId:event.correlationId,evidenceRefCount:event.evidenceRefs.length,
  stage:state==='PREVIEW_NEW'?'INERT':'DEDUPLICATION',explanation
});

/** Ephemeral operator simulation only. It verifies QL-389 synthetic security
 * scenarios per candidate, then compares source-scoped keys within this batch.
 * It never accepts a message, grants authority, sends, stores or reserves keys. */
export async function simulateIncidentIntakeLedger(
  candidates:readonly QL390Candidate[],scenario:QL389Scenario
):Promise<QL390Simulation>{
  const empty={newEvents:0,duplicates:0,conflicts:0,held:0};
  if(!Array.isArray(candidates)||candidates.length>QL390_MAX_SIMULATION_EVENTS)
    return {state:'REJECTED_BATCH',rows:[],counts:empty,
      reason:'Simulation requires an array of at most 50 synthetic events; no records were processed'};

  const byMessage=new Map<string,string>();
  const byIdempotency=new Map<string,string>();
  const rows:QL390OperatorRow[]=[];
  for(const [index,candidate] of candidates.entries()){
    const sequence=index+1;
    const reviewed=await reviewSignedIntakePreview(candidate?.event,candidate?.proof,scenario);
    if(reviewed.state!=='PREVIEW_ONLY'){
      rows.push(held(sequence,reviewed.stage,reviewed.reason));
      continue;
    }
    // The preceding signed review returns PREVIEW_ONLY only for valid QL-388 envelopes.
    // No caller-supplied field is rendered from a rejected or unverified event.
    if(reviewCrossAppIntake(candidate.event).state!=='DESIGN_ONLY'){
      rows.push(held(sequence,'ENVELOPE','Contract validation did not reconcile'));
      continue;
    }
    const event=candidate.event as CrossAppIntake;
    const messageKey=`${event.sourceId}:${event.messageId}`;
    const idempotencyKey=`${event.sourceId}:${event.idempotencyKey}`;
    const canonical=new TextDecoder().decode(ql389CanonicalIntakeBytes(event));
    const priorMessage=byMessage.get(messageKey);
    const priorIdempotency=byIdempotency.get(idempotencyKey);
    if(priorMessage!==undefined||priorIdempotency!==undefined){
      const identical=(priorMessage===undefined||priorMessage===canonical)&&
        (priorIdempotency===undefined||priorIdempotency===canonical);
      rows.push(safeRow(sequence,event,identical?'PREVIEW_DUPLICATE':'PREVIEW_CONFLICT',
        identical?'Same source and canonical event already appeared in this simulation batch':
          'A source-scoped message or idempotency key was reused with different signed content'));
      continue;
    }
    byMessage.set(messageKey,canonical);
    byIdempotency.set(idempotencyKey,canonical);
    rows.push(safeRow(sequence,event,'PREVIEW_NEW',
      'First occurrence in this simulated batch; no incident accepted, delivered or stored'));
  }
  const counts={
    newEvents:rows.filter(row=>row.state==='PREVIEW_NEW').length,
    duplicates:rows.filter(row=>row.state==='PREVIEW_DUPLICATE').length,
    conflicts:rows.filter(row=>row.state==='PREVIEW_CONFLICT').length,
    held:rows.filter(row=>row.state==='HELD').length
  };
  return {state:'INERT_PREVIEW',rows,counts,
    reason:'Session-only synthetic review. No trusted replay ledger, original-owner evidence, message acceptance or persistence exists'};
}

/** Pure sample for the owner UI: these are explicitly illustrative labels,
 * never historical records, live source observations or signed receipts. */
export const QL390_ILLUSTRATIVE_ROWS=[
  {source:'Yard Workers',state:'PREVIEW_NEW',explanation:'First synthetic incident'},
  {source:'Yard Workers',state:'PREVIEW_DUPLICATE',explanation:'Identical synthetic retry'},
  {source:'Yard Workers',state:'PREVIEW_CONFLICT',explanation:'Same synthetic key, changed event'},
  {source:'Unverified',state:'HELD',explanation:'No independently verified signing authority'}
] as const;
