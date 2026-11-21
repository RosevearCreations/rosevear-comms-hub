/**
 * QL481 browser-side *structural* inspection of a local, redacted handover.
 * It is NOT a signature verifier, live API, source connector or authority grant.
 * Never process customer records or persist imported bytes.
 */
export type Ql481CaseSource='yard-workers'|'icamp';
export type Ql481LocalCaseReview={
 sourceApp:Ql481CaseSource;
 environment:'SIMULATION'|'PRIVATE_STAGING';
 tenantId:string;episodeId:string;handoverId:string;caseId:string;
 caseStatus:'OPEN'|'RECOVERY_PENDING_OPERATOR_REVIEW'|'CLOSED';
 lastSequence:number;intentCount:number;pendingCount:number;
 lastJournalDigest:string;lastReceiptDigest:string;
 sourceRevision:string;committedAtMs:number;
 state:'LOCAL_FILE_STRUCTURAL_REVIEW_NOT_AUTHENTICATED';
};
export type Ql481Inspection={ok:true;review:Ql481LocalCaseReview}|
 {ok:false;reason:string};
const hex=/^[a-f0-9]{64}$/,sha=/^[a-f0-9]{40}$/,
 id=/^[a-zA-Z0-9_-]{8,96}$/,tenant=/^[a-z][a-z0-9_-]{2,63}$/;
const exact=(obj:unknown,keys:readonly string[])=>{
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return false;
 const k=Object.keys(obj);
 return k.length===keys.length&&keys.every(key=>Object.prototype.hasOwnProperty.call(obj,key));
};
const object=(v:unknown)=>v as Record<string,unknown>;
const HAND_FIELDS=['schema','handoverId','sourceApp','environment','tenantId',
 'episodeId','caseId','caseStatus','lastSequence','lastJournalDigest',
 'lastReceiptDigest','sourceRevision','operatorId','intentCount','pendingCount',
 'preparedAtMs','expiresAtMs','scopeClass','customerDeliveryVerified',
 'productionAcceptance','sourceRuntimeVerified','authorityTransfer'];
const ACK_FIELDS=['schema','handoverId','caseId','handoverDigest','sourceApp',
 'environment','tenantId','episodeId','ownerSignerPin','reviewerSignerPin',
 'committedAtMs','durableReadBack','disposition','authorityTransfer'];
const failed=(reason:string):Ql481Inspection=>({ok:false,reason});
export function inspectQl481LocalHandover(raw:string,selectedSource:Ql481CaseSource):Ql481Inspection{
 if(typeof raw!=='string'||raw.length>16000)
  return failed('This file is too large for a redacted case handover.');
 let obj:unknown;
 try{obj=JSON.parse(raw)}catch{return failed('This file is not valid JSON.')}
 if(!exact(obj,['requestDigest','ownerPacket','reviewerPacket','ack']))
  return failed('File is not an exact QL-481 durable handover record.');
 const record=object(obj);
 if(typeof record.requestDigest!=='string'||!hex.test(record.requestDigest))
  return failed('Handover digest is missing.');
 const owner=record.ownerPacket,reviewer=record.reviewerPacket;
 if(!exact(owner,['payload','signature'])||!exact(reviewer,['payload','signature']))
  return failed('Owner/reviewer evidence is incomplete.');
 const o=object(owner),r=object(reviewer);
 if(!exact(o.payload,HAND_FIELDS)||!exact(r.payload,HAND_FIELDS)||
 typeof o.signature!=='string'||typeof r.signature!=='string'||
 !/^[A-Za-z0-9+/]{86}==$/.test(o.signature)||
 !/^[A-Za-z0-9+/]{86}==$/.test(r.signature))
  return failed('Handover signatures or data shape are invalid.');
 const p=object(o.payload),q=object(r.payload);
 if(JSON.stringify(p)!==JSON.stringify(q))
  return failed('Owner and reviewer do not agree on the same handover.');
 if(!exact(record.ack,ACK_FIELDS))
  return failed('Durable readback record is incomplete.');
 const ack=object(record.ack);
 if(p.schema!=='rosevear.comms.ql481.private-operator-handover.v1'||
 ack.schema!=='rosevear.comms.ql481.durable-handover-ack.v1'||
 p.sourceApp!==selectedSource||ack.sourceApp!==selectedSource||
 !['SIMULATION','PRIVATE_STAGING'].includes(String(p.environment))||
 !['OPEN','RECOVERY_PENDING_OPERATOR_REVIEW','CLOSED'].includes(String(p.caseStatus))||
 !tenant.test(String(p.tenantId))||!id.test(String(p.episodeId))||
 !id.test(String(p.handoverId))||!id.test(String(p.caseId))||
 !hex.test(String(p.lastJournalDigest))||!hex.test(String(p.lastReceiptDigest))||
 !sha.test(String(p.sourceRevision))||
 (typeof p.lastSequence!=='number'||!Number.isSafeInteger(p.lastSequence))||p.lastSequence<1||
 (typeof p.intentCount!=='number'||!Number.isSafeInteger(p.intentCount))||p.intentCount<1||
 (typeof p.pendingCount!=='number'||!Number.isSafeInteger(p.pendingCount))||p.pendingCount<0||
 Number(p.pendingCount)>Number(p.intentCount)||
 p.scopeClass!=='NON_SENSITIVE_SCOPED_EXCEPTION'||
 p.customerDeliveryVerified!==false||p.productionAcceptance!==false||
 p.sourceRuntimeVerified!==false||p.authorityTransfer!==false||
 ack.handoverId!==p.handoverId||ack.caseId!==p.caseId||
 ack.tenantId!==p.tenantId||ack.episodeId!==p.episodeId||
 ack.environment!==p.environment||
 !hex.test(String(ack.handoverDigest))||
 ack.durableReadBack!==true||ack.authorityTransfer!==false||
 ack.disposition!=='SIGNED_READ_ONLY_HANDOVER_HELD'||
 (typeof ack.committedAtMs!=='number'||!Number.isSafeInteger(ack.committedAtMs)))
   return failed('Handover scope or no-authorization boundary does not match.');
 // Deliberately do not label this cryptographically verified: trusted public
 // keys and authenticated private journal readback are absent in the browser.
 return {ok:true,review:{
   sourceApp:selectedSource,environment:p.environment as Ql481LocalCaseReview['environment'],
   tenantId:p.tenantId as string,episodeId:p.episodeId as string,
   handoverId:p.handoverId as string,caseId:p.caseId as string,
   caseStatus:p.caseStatus as Ql481LocalCaseReview['caseStatus'],
   lastSequence:p.lastSequence as number,intentCount:p.intentCount as number,
   pendingCount:p.pendingCount as number,
   lastJournalDigest:p.lastJournalDigest as string,
   lastReceiptDigest:p.lastReceiptDigest as string,
   sourceRevision:p.sourceRevision as string,
   committedAtMs:ack.committedAtMs as number,
   state:'LOCAL_FILE_STRUCTURAL_REVIEW_NOT_AUTHENTICATED'}};
}
