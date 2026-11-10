import {QL375_SHELLS} from './ql375OwnerStatus';
import type {QL405SourceId} from './ql405AcknowledgementLedger';

/** A review-only contract. Caller-supplied values have NO authority; a future
 * protected server must authenticate and verify originals before projection. */
export const QL408_AUDIT_GATES=Object.freeze([
  {code:'SOURCE_CUSTODY',owner:'Source owner',audit:'Original device/issuer custody'},
  {code:'INDEPENDENT_REVIEW',owner:'Independent reviewer',audit:'Original bytes and witness chain'},
  {code:'SOURCE_SIGNATURE',owner:'Source owner',audit:'Pinned source identity and signature'},
  {code:'MASTER_APPROVAL',owner:'Master Shell owner',audit:'Separate source/case/purpose approval'},
  {code:'CONSENT',owner:'Receiver operator',audit:'Scoped consent and tenant boundary'},
  {code:'RECEIVER_ENROLLMENT',owner:'Receiver operator',audit:'Private enrollment and replay store'},
  {code:'SCOPED_TEST_RECEIPT',owner:'TEST operator',audit:'One signed TEST and independent receiver ACK'}
] as const);
export type QL408GateCode=(typeof QL408_AUDIT_GATES)[number]['code'];
export type QL408AuditProjection={
  contractVersion:1;
  sourceId:string;
  caseId:string;
  purpose:'ONE_TEST_READINESS_REVIEW';
  generatedAt:string;
  expiresAt:string;
  audit:readonly {code:QL408GateCode;state:'VERIFIED'|'HOLD'|'REJECTED';reference:string|null}[];
};
export type QL408Exception='NO_AUTHENTICATED_ADAPTER'|'INVALID_ADAPTER_CONTRACT'|
  'CROSS_SOURCE_PROJECTION'|'STALE_PROJECTION'|'INCOMPLETE_AUDIT'|
  'AUDIT_HOLD'|'ONE_TEST_AUTHORIZATION_UNAVAILABLE';
const CASE=/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/;
const REFERENCE=/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,95}$/;
const MAX_AGE=24*60*60*1000;

/** Never accepts public metadata or a client Boolean as authentication. The
 * result is suitable for display only; it cannot create an authorization. */
export function reviewQl408AdapterContract(sourceId:QL405SourceId,
  candidate:unknown,nowMs:number){
  const exceptions:QL408Exception[]=[];
  const add=(value:QL408Exception)=>{if(!exceptions.includes(value))exceptions.push(value);};
  const known=QL375_SHELLS.some(item=>item.id===sourceId);
  if(!known||!Number.isFinite(nowMs))add('INVALID_ADAPTER_CONTRACT');
  if(candidate===null||candidate===undefined)add('NO_AUTHENTICATED_ADAPTER');
  else if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))add('INVALID_ADAPTER_CONTRACT');
  else{
    const row=candidate as Record<string,unknown>;
    const keys=['contractVersion','sourceId','caseId','purpose','generatedAt','expiresAt','audit'];
    if(Object.keys(row).some(key=>!keys.includes(key))||row.contractVersion!==1||
      typeof row.sourceId!=='string'||typeof row.caseId!=='string'||!CASE.test(row.caseId)||
      row.purpose!=='ONE_TEST_READINESS_REVIEW'||typeof row.generatedAt!=='string'||
      typeof row.expiresAt!=='string'||!Array.isArray(row.audit))add('INVALID_ADAPTER_CONTRACT');
    if(row.sourceId!==sourceId)add('CROSS_SOURCE_PROJECTION');
    if(typeof row.generatedAt==='string'&&typeof row.expiresAt==='string'){
      const generated=Date.parse(row.generatedAt),expires=Date.parse(row.expiresAt);
      if(!Number.isFinite(generated)||!Number.isFinite(expires)||
        new Date(generated).toISOString()!==row.generatedAt||
        new Date(expires).toISOString()!==row.expiresAt||expires<=generated||
        expires-generated>MAX_AGE)add('INVALID_ADAPTER_CONTRACT');
      else if(generated>nowMs||expires<=nowMs)add('STALE_PROJECTION');
    }
    if(Array.isArray(row.audit)){
      const audit=row.audit as unknown[];
      const codes=new Set<string>();
      if(audit.length!==QL408_AUDIT_GATES.length)add('INCOMPLETE_AUDIT');
      for(const item of audit){
        if(!item||typeof item!=='object'||Array.isArray(item)){
          add('INVALID_ADAPTER_CONTRACT');continue;
        }
        const entry=item as Record<string,unknown>;
        if(Object.keys(entry).some(key=>!['code','state','reference'].includes(key))||
          typeof entry.code!=='string'||codes.has(entry.code)||
          !QL408_AUDIT_GATES.some(gate=>gate.code===entry.code)||
          !['VERIFIED','HOLD','REJECTED'].includes(String(entry.state))||
          (entry.state==='VERIFIED'&&entry.reference===null)||
          (entry.reference!==null&&
            (typeof entry.reference!=='string'||!REFERENCE.test(entry.reference))))
          add('INVALID_ADAPTER_CONTRACT');
        if(typeof entry.code==='string')codes.add(entry.code);
        if(entry.state!=='VERIFIED')add('AUDIT_HOLD');
      }
      if(QL408_AUDIT_GATES.some(gate=>!codes.has(gate.code)))add('INCOMPLETE_AUDIT');
    }
  }
  // Even a structurally perfect claim with seven VERIFIED gates is not a
  // server authenticated decision or permission to issue a TEST.
  add('ONE_TEST_AUTHORIZATION_UNAVAILABLE');
  return {sourceId,contractState:exceptions.length===1?
    'STRUCTURE_REVIEW_ONLY':'REQUIRES_PROTECTED_REVIEW',
    connection:'HOLD' as const,oneTestAuthorized:false,receiverEnabled:false,
    networkRequests:0,persisted:false,credentialsDisclosed:false,
    exceptions,gateMap:QL408_AUDIT_GATES.map(gate=>({...gate,state:'HOLD' as const})),
    requiredBoundary:'SERVER_SESSION_ORIGINAL_SIGNATURE_REPLAY_AND_CONSENT' as const};
}
