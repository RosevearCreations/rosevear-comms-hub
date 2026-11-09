import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL399_DEFAULT_FILTERS,QL399_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,
  QL399_DEMO_NOW,QL399_DEMO_OUTCOMES,QL399_DEMO_REQUESTS,QL399_MAX_EXCEPTIONS,
  filterOriginalEvidenceHandoffs,reviewOriginalEvidenceHandoff,type QL399ReviewerException}
  from '../ql399EvidenceHandoffReadiness';

const review=(exceptions:readonly QL399ReviewerException[]=QL399_DEMO_EXCEPTIONS,now=QL399_DEMO_NOW)=>
  reviewOriginalEvidenceHandoff(QL392_ILLUSTRATIVE_PREVIEW,QL399_DEMO_REQUESTS,
    QL399_DEMO_OUTCOMES,QL399_DEMO_AUDIT,exceptions,now);

describe('QL-399 original evidence handoff, independent exceptions and decision trace',()=>{
  it('requires five original receipts per source and records only rejected synthetic decisions',()=>{
    const value=review();
    expect(value).toMatchObject({state:'INERT_PREVIEW',totalCases:3,openExceptions:4,
      tracedDecisions:8,readyHandoffs:0,eligibleClosures:0,sendEnabled:false,persisted:false});
    expect(value.cases.flatMap(item=>item.handoff)).toHaveLength(15);
    expect(value.cases.every(item=>item.originalRequirementsOutstanding===5&&
      item.handoffState==='BLOCKED_ORIGINAL_PROOF'&&item.sourceOwnerDecision==='NOT_VERIFIED'&&
      item.masterOwnerDecision==='NOT_VERIFIED'&&item.independentReview==='NOT_ATTESTED'&&
      item.closureState==='HOLD'&&!item.closureEligible&&!item.sendEnabled&&!item.persisted)).toBe(true);
    expect(value.cases.flatMap(item=>item.handoff).every(item=>
      item.originalArtifact==='NOT_PRESENT'&&item.independentReviewer==='NOT_VERIFIED'&&
      item.witnessSeparation==='NOT_ATTESTED'&&!item.handoffReady)).toBe(true);
    const workshop=value.cases.find(item=>item.sourceId==='devilndove')!;
    expect(workshop.handoff.find(item=>item.gate==='SOURCE_OWNER')?.custodian).toBe('SOURCE_OWNER');
    expect(workshop.handoff.find(item=>item.gate==='MASTER_OWNER')?.custodian).toBe('MASTER_OWNER');
    expect(workshop.exceptions.map(item=>item.priority)).toEqual(['COLLECT_ORIGINAL','REVIEW_CONFLICT']);
    expect(workshop.decisionTrace.map(item=>item.originId)).toEqual([
      'audit-ql398-0001','exception-ql399-0001','audit-ql398-0002','exception-ql399-0002']);
    expect(workshop.decisionTrace.every(item=>item.disposition==='HOLD_PRESERVED'&&!item.authorized)).toBe(true);
    expect(JSON.stringify(value)).not.toContain('Camp Rosevear');
  });

  it('filters review-required exceptions without changing source or owner permissions',()=>{
    const value=review();
    expect(filterOriginalEvidenceHandoffs(value,QL399_DEFAULT_FILTERS)).toHaveLength(3);
    expect(filterOriginalEvidenceHandoffs(value,{sourceId:'ALL',exceptionPriority:'REVIEW_CONFLICT'})).toHaveLength(1);
    expect(filterOriginalEvidenceHandoffs(value,{sourceId:'rosevear-ai-hub',exceptionPriority:'COLLECT_ORIGINAL'})).toHaveLength(1);
    expect(filterOriginalEvidenceHandoffs(value,{sourceId:'icamp',exceptionPriority:'REVIEW_CONFLICT'})).toEqual([]);
    expect(filterOriginalEvidenceHandoffs(value,{sourceId:'camp-rosevear',exceptionPriority:'ALL'})).toEqual([]);
    expect(filterOriginalEvidenceHandoffs(value,{sourceId:'ALL',exceptionPriority:'APPROVED' as 'ALL'})).toEqual([]);
    expect(value.eligibleClosures).toBe(0);
  });

  it('fails closed for forged, cross-source, future, duplicated or bad-scope exceptions',()=>{
    const base=QL399_DEMO_EXCEPTIONS[0];
    for(const invalid of [
      {...base,sourceId:'icamp'},
      {...base,correlationId:'correlation-ql392-integration'},
      {...base,queueId:'other-source/icamp/SOURCE_OWNER'},
      {...base,gate:'MASTER_OWNER' as typeof base.gate},
      {...base,reviewerScope:'MASTER_OWNER' as typeof base.reviewerScope},
      {...base,exceptionId:'tiny'},
      {...base,observedAt:'2026-11-09T09:46:00Z'},
      {...base,observedAt:'2026-11-09T08:59:59Z'},
      {...base,observedAt:'bad-date'},
      {...base,code:'APPROVED' as typeof base.code}
    ])expect(review([invalid])).toMatchObject({state:'HOLD',cases:[],readyHandoffs:0});
    expect(review([base,base])).toMatchObject({state:'HOLD',cases:[]});
    expect(review(Array(QL399_MAX_EXCEPTIONS+1).fill(base))).toMatchObject({state:'HOLD',cases:[]});
    expect(review(QL399_DEMO_EXCEPTIONS,Number.NaN)).toMatchObject({state:'HOLD',cases:[]});
    expect(review([{...base,exceptionId:'audit-ql398-0001'}])).toMatchObject({state:'HOLD',cases:[]});
  });

  it('blocks upstream tampering without emitting partial authorizing records',()=>{
    const badOutcome={...QL399_DEMO_OUTCOMES[0],sourceId:'icamp'};
    expect(reviewOriginalEvidenceHandoff(QL392_ILLUSTRATIVE_PREVIEW,QL399_DEMO_REQUESTS,
      [badOutcome],QL399_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,QL399_DEMO_NOW)).toMatchObject({state:'HOLD',cases:[]});
    expect(reviewOriginalEvidenceHandoff(QL392_ILLUSTRATIVE_PREVIEW,
      [{...QL399_DEMO_REQUESTS[0],correlationId:'unregistered-correlation'}],
      QL399_DEMO_OUTCOMES,QL399_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,QL399_DEMO_NOW))
      .toMatchObject({state:'HOLD',cases:[]});
  });

  it('deterministically orders source-trace events and remains blocked with no exceptions',()=>{
    expect(review([...QL399_DEMO_EXCEPTIONS].reverse()).cases).toEqual(review().cases);
    const none=review([]);
    expect(none).toMatchObject({state:'INERT_PREVIEW',openExceptions:0,tracedDecisions:4,
      readyHandoffs:0,eligibleClosures:0});
    expect(none.cases.every(item=>item.exceptions.length===0&&item.closureState==='HOLD')).toBe(true);
  });
});
