import {QL375_SHELLS} from './ql375OwnerStatus';
import type {QL405SourceId} from './ql405AcknowledgementLedger';

/** Public UI consumes only redacted, independently verified projections from a
 * future authenticated server adapter. Never put original receipts or keys here. */
export type QL407OutcomeProjection={
  sourceId:string;
  caseId:string;
  reviewedAt:string;
  expiresAt:string;
  disposition:'ACCEPTED_FOR_REVIEW'|'REJECTED'|'INCOMPLETE';
  verifiedByProtectedServer:boolean;
  projectionVersion:1;
};
export type QL407Exception='MISSING_PROTECTED_IMPORT'|'INVALID_PROJECTION'|
  'UNVERIFIED_PROJECTION'|'SOURCE_MISMATCH'|'FUTURE_REVIEW'|'EVIDENCE_EXPIRED'|
  'REVIEW_DUE_SOON'|'REVIEW_REJECTED'|'ADDITIONAL_GATES_REQUIRED';
const CASE=/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/;
const MAX_WINDOW_MS=30*24*60*60*1000;
const SOON_MS=48*60*60*1000;

export function reviewQl407OutcomeImport(
  sourceId:QL405SourceId, records:readonly unknown[], nowMs:number
){
  const exceptions:QL407Exception[]=[];
  const add=(value:QL407Exception)=>{if(!exceptions.includes(value))exceptions.push(value);};
  if(!QL375_SHELLS.some(source=>source.id===sourceId)||!Number.isFinite(nowMs))
    add('INVALID_PROJECTION');
  if(records.length===0)add('MISSING_PROTECTED_IMPORT');
  // Fail closed on duplicates, including a valid record paired with an invalid one.
  if(records.length>1)add('INVALID_PROJECTION');
  for(const item of records){
    if(!item||typeof item!=='object'||Array.isArray(item)){
      add('INVALID_PROJECTION');continue;
    }
    const row=item as Record<string,unknown>;
    const keys=['sourceId','caseId','reviewedAt','expiresAt','disposition',
      'verifiedByProtectedServer','projectionVersion'];
    if(Object.keys(row).some(key=>!keys.includes(key))||
      row.projectionVersion!==1||typeof row.sourceId!=='string'||
      typeof row.caseId!=='string'||!CASE.test(row.caseId)||
      typeof row.reviewedAt!=='string'||typeof row.expiresAt!=='string'||
      !['ACCEPTED_FOR_REVIEW','REJECTED','INCOMPLETE'].includes(String(row.disposition))){
      add('INVALID_PROJECTION');continue;
    }
    if(row.sourceId!==sourceId)add('SOURCE_MISMATCH');
    if(row.verifiedByProtectedServer!==true)add('UNVERIFIED_PROJECTION');
    const reviewed=Date.parse(row.reviewedAt);
    const expires=Date.parse(row.expiresAt);
    if(!Number.isFinite(reviewed)||!Number.isFinite(expires)||
      new Date(reviewed).toISOString()!==row.reviewedAt||
      new Date(expires).toISOString()!==row.expiresAt||
      expires<=reviewed||expires-reviewed>MAX_WINDOW_MS){
      add('INVALID_PROJECTION');continue;
    }
    if(reviewed>nowMs)add('FUTURE_REVIEW');
    if(expires<=nowMs)add('EVIDENCE_EXPIRED');
    else if(expires-nowMs<=SOON_MS)add('REVIEW_DUE_SOON');
    if(row.disposition!=='ACCEPTED_FOR_REVIEW')add('REVIEW_REJECTED');
    // Even a server-verified review is NOT a signed TEST receipt, consent or
    // receiver enrolment. No browser projection can authorize a connection.
    add('ADDITIONAL_GATES_REQUIRED');
  }
  return {
    sourceId, state:'HOLD_ORIGINAL_RECEIPT_AND_RECEIVER_GATES' as const,
    connection:'HOLD' as const, authorizedTest:false,receiverActivated:false,
    persisted:false,networkRequests:0,credentialsDisclosed:false,
    exceptions,priority:exceptions.some(value=>
      ['INVALID_PROJECTION','UNVERIFIED_PROJECTION','SOURCE_MISMATCH',
        'FUTURE_REVIEW','EVIDENCE_EXPIRED','REVIEW_REJECTED'].includes(value))?
      'REVIEW_NOW' as const:'OWNER_FOLLOW_UP' as const,
    route:'SOURCE_OWNER_THEN_INDEPENDENT_REVIEWER_THEN_MASTER_OWNER' as const
  };
}
