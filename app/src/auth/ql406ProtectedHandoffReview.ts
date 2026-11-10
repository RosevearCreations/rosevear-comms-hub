import {QL375_SHELLS} from './ql375OwnerStatus';
import {QL405_PUBLIC_EVIDENCE,type QL405SourceId} from './ql405AcknowledgementLedger';

/** QL-406. A separately captured, public GitHub/manifest observation. This is
 * not a live API poll, original evidence receipt, or authenticated review. */
export const QL406_CAPTURED_AT='2026-11-10T05:39:46Z';
export const QL406_MAX_SNAPSHOT_AGE_MS=60*60*1000;
export type QL406PublicObservation={
  sourceId:QL405SourceId;
  observedMainRevision:string;
  manifestRevision:string;
  manifestConnection:'DISCONNECTED / HOLD';
  manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER';
  transportOrigin:null;
};

export const QL406_PUBLIC_OBSERVATIONS:readonly QL406PublicObservation[]=Object.freeze([
  {sourceId:'yw',observedMainRevision:'e51cf098aec6d49699645bc2d8ccbd2d756d579d',
    manifestRevision:'028aee250857415b9b9035aaec50060757e377a5',
    manifestConnection:'DISCONNECTED / HOLD',manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER',transportOrigin:null},
  {sourceId:'icamp',observedMainRevision:'b59fa045cb26f441aa32b890ba6c979c34045ce5',
    manifestRevision:'dc1369338a4b191fc72031b7e62f7e48fd805bcd',
    manifestConnection:'DISCONNECTED / HOLD',manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER',transportOrigin:null},
  {sourceId:'rosiedazzlers',observedMainRevision:'d079b7fac034885142a556b5df155d85af6bf495',
    manifestRevision:'83b03717b828ac70984a5f9279cd05d9f163faae',
    manifestConnection:'DISCONNECTED / HOLD',manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER',transportOrigin:null},
  {sourceId:'devilndove',observedMainRevision:'ee9cacd4e98aea54638f001ce15ba16bba46bf5e',
    manifestRevision:'1f0e220b0cf7aff2dfeb650c96304d96502ede54',
    manifestConnection:'DISCONNECTED / HOLD',manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER',transportOrigin:null},
  {sourceId:'ai-data-platform',observedMainRevision:'ec451e1a2d1c33ef832a00e16736593bf17183a4',
    manifestRevision:'cb573c1ac4610fb6e438da6534db2be6cea93499',
    manifestConnection:'DISCONNECTED / HOLD',manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER',transportOrigin:null},
  {sourceId:'rosevear-ai-hub',observedMainRevision:'125b7371d73bbaa6ef418edb75a53934e34ad0cd',
    manifestRevision:'be99d882d6b75310b948911a81b2dcb5f3a3629e',
    manifestConnection:'DISCONNECTED / HOLD',manifestSigner:'AWAITING_INDEPENDENT_SOURCE_SIGNER',transportOrigin:null}
]);

export const QL406_PROTECTED_GATES=Object.freeze([
  {id:'ORIGINAL_SOURCE',label:'Original source device and issuer custody',owner:'Source owner'},
  {id:'INDEPENDENT_REVIEW',label:'Independent reviewer and witness disposition',owner:'Independent reviewer'},
  {id:'SOURCE_SIGNATURE',label:'Current source key pin and signed original packet',owner:'Source owner'},
  {id:'MASTER_APPROVAL',label:'Separate signed Master Shell owner decision',owner:'Master owner'},
  {id:'RECEIVER_AND_CONSENT',label:'Receiver enrollment, consent and durable replay protection',owner:'Receiver operator'},
  {id:'ONE_TEST_RECEIPT',label:'One scoped TEST receipt and separate receiver acknowledgement',owner:'Protected TEST operator'}
]);

const SHA=/^[a-f0-9]{40}$/;
export type QL406ManualComparison='NOT_SUPPLIED'|'INVALID_PUBLIC_REVISION'|
  'MATCHES_CAPTURED_MAIN'|'DIFFERS_FROM_CAPTURED_MAIN';

/** Public SHA comparison is advisory. Neither a matching SHA nor a handoff
 * prompt can become a protected decision or authorize a receiver. */
export function reviewQl406OneSource(
  sourceId:QL405SourceId,manualRevision:string,nowMs:number,
  evidence:readonly QL406PublicObservation[]=QL406_PUBLIC_OBSERVATIONS,
  capturedAt=QL406_CAPTURED_AT
){
  const capturedMs=Date.parse(capturedAt);
  const freshness=Number.isFinite(capturedMs)&&Number.isFinite(nowMs)&&
    nowMs>=capturedMs&&nowMs-capturedMs<=QL406_MAX_SNAPSHOT_AGE_MS?
    'RECENT_PUBLIC_SNAPSHOT':'STALE_PUBLIC_SNAPSHOT';
  const valid=evidence.length===QL375_SHELLS.length&&
    new Set(evidence.map(item=>item.sourceId)).size===QL375_SHELLS.length&&
    evidence.every(item=>QL375_SHELLS.some(shell=>shell.id===item.sourceId)&&
      SHA.test(item.observedMainRevision)&&SHA.test(item.manifestRevision)&&
      item.manifestConnection==='DISCONNECTED / HOLD'&&
      item.manifestSigner==='AWAITING_INDEPENDENT_SOURCE_SIGNER'&&
      item.transportOrigin===null);
  const selected=valid?evidence.find(item=>item.sourceId===sourceId):undefined;
  const previous=valid?QL405_PUBLIC_EVIDENCE.find(item=>item.sourceId===sourceId):undefined;
  const shell=QL375_SHELLS.find(item=>item.id===sourceId);
  const held={connection:'HOLD' as const,ownerProof:'HOLD' as const,
    reviewerDisposition:'NOT_AUTHENTICATED' as const,signedReceipt:'NOT_VERIFIED' as const,
    protectedDecision:'HOLD_ORIGINAL_REVIEW_REQUIRED' as const,
    authorizedTest:false,receiverActivated:false,persisted:false,networkRequests:0,
    credentialsDisclosed:false};
  if(!selected||!previous||!shell)return {...held,state:'INVALID_PUBLIC_RECHECK_HOLD' as const,
    freshness,source:null,manualComparison:'INVALID_PUBLIC_REVISION' as QL406ManualComparison,
    protectedGates:QL406_PROTECTED_GATES.map(gate=>({...gate,state:'HOLD' as const}))};
  const value=manualRevision.trim();
  const manualComparison:QL406ManualComparison=!value?'NOT_SUPPLIED':!SHA.test(value)?
    'INVALID_PUBLIC_REVISION':value===selected.observedMainRevision?
      'MATCHES_CAPTURED_MAIN':'DIFFERS_FROM_CAPTURED_MAIN';
  return {...held,state:'ONE_SOURCE_PROTECTED_REVIEW_HOLD' as const,freshness,
    source:{...selected,name:shell.name,repository:shell.repository,
      manifestPath:previous.manifestPath,handlerPath:previous.handlerPath,
      priorAcknowledgement:previous.acknowledgedRevision,
      priorObservedMain:previous.observedMainRevision,
      ackNeedsRefresh:previous.acknowledgedRevision!==selected.observedMainRevision,
      mainAdvanced:previous.observedMainRevision!==selected.observedMainRevision,
      manifestPinNeedsReview:selected.manifestRevision!==selected.observedMainRevision,
      prompt:`QL406-COMMS-REVIEW ${sourceId} READ_ONLY main=${selected.observedMainRevision}`},
    manualComparison,
    protectedGates:QL406_PROTECTED_GATES.map(gate=>({...gate,state:'HOLD' as const}))};
}
