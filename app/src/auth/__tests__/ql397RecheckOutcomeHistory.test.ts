import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL397_DEMO_NOW,QL397_DEMO_OBSERVATIONS,QL397_DEMO_REQUESTS,QL397_DEFAULT_FILTERS,
  filterOperatorRecheckOutcomes,reviewOperatorRecheckOutcomes,type QL397Observation}
  from '../ql397RecheckOutcomeHistory';

const review=(observations:readonly QL397Observation[]=QL397_DEMO_OBSERVATIONS,now=QL397_DEMO_NOW)=>
  reviewOperatorRecheckOutcomes(QL392_ILLUSTRATIVE_PREVIEW,QL397_DEMO_REQUESTS,observations,now);

describe('QL-397 synthetic recheck outcome history and closure safeguards',()=>{
  it('assembles chronological, source-scoped outcomes for a 15-gate inert queue',()=>{
    const result=review();
    expect(result).toMatchObject({state:'INERT_PREVIEW',observationCount:5,
      reviewedScenarios:4,conflicts:2,closureEligible:0,sendEnabled:false,persisted:false});
    expect(result.gates).toHaveLength(15);
    const source=result.gates.find(item=>item.sourceId==='devilndove'&&item.gate==='SOURCE_OWNER')!;
    expect(source.outcomes.map(item=>item.observationId)).toEqual(['outcome-ql397-0001','outcome-ql397-0002']);
    expect(source.latestOutcome).toBe('SIMULATED_CONFLICT_IDENTIFIED');
    expect(source.reviewState).toBe('CONFLICT_REQUIRES_INDEPENDENT_REVIEW');
    expect(source.reviewerScope).toBe('SOURCE_OWNER');
    expect(source.closureGuidance).toContain('independent');
    expect(source.requiredIndependentChecks).toHaveLength(5);
    expect(result.gates.every(item=>item.closureState==='HOLD'&&
      item.sourceOwnerReview==='NOT_VERIFIED'&&item.masterOwnerReview==='NOT_VERIFIED'&&
      item.originalEvidence==='NOT_VERIFIED'&&!item.sendEnabled&&!item.persisted)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('Camp Rosevear');
  });

  it('does not treat simulated reference rechecks or owner notes as approval or closure',()=>{
    const result=review();
    const signing=result.gates.find(item=>item.sourceId==='devilndove'&&item.gate==='SOURCE_PIN')!;
    expect(signing.reviewState).toBe('SCENARIO_REVIEW_NOTE_ONLY');
    expect(signing.latestOutcome).toBe('SIMULATED_REFERENCE_RECHECKED');
    expect(signing.closureState).toBe('HOLD');
    expect(signing.closureGuidance).toContain('not an original receipt');
    const master=result.gates.find(item=>item.sourceId==='icamp'&&item.gate==='MASTER_OWNER')!;
    expect(master.reviewState).toBe('CONFLICT_REQUIRES_INDEPENDENT_REVIEW');
    const untouched=result.gates.find(item=>item.sourceId==='icamp'&&item.gate==='CONSENT')!;
    expect(untouched).toMatchObject({latestOutcome:null,reviewState:'AWAITING_ORIGINAL_REVIEW',
      closureState:'HOLD'});
  });

  it('filters synthetic review states without affecting original outcomes',()=>{
    const history=review();
    expect(filterOperatorRecheckOutcomes(history,QL397_DEFAULT_FILTERS)).toHaveLength(15);
    expect(filterOperatorRecheckOutcomes(history,{sourceId:'devilndove',
      reviewState:'CONFLICT_REQUIRES_INDEPENDENT_REVIEW'})).toHaveLength(1);
    expect(filterOperatorRecheckOutcomes(history,{sourceId:'icamp',
      reviewState:'SCENARIO_REVIEW_NOTE_ONLY'})).toHaveLength(0);
    expect(filterOperatorRecheckOutcomes(history,{sourceId:'camp-rosevear',reviewState:'ALL'})).toEqual([]);
    expect(filterOperatorRecheckOutcomes(history,{sourceId:'ALL',reviewState:'FAKE' as 'ALL'})).toEqual([]);
    expect(history.gates).toHaveLength(15);
  });

  it('fails closed for duplicate IDs, foreign source, forged scope and unknown gate',()=>{
    const base=QL397_DEMO_OBSERVATIONS[0];
    expect(review([base,base])).toMatchObject({state:'HOLD',gates:[],observationCount:0});
    expect(review([{...base,sourceId:'icamp'}])).toMatchObject({state:'HOLD',gates:[]});
    expect(review([{...base,reviewerScope:'MASTER_OWNER'}])).toMatchObject({state:'HOLD',gates:[]});
    expect(review([{...base,gate:'CONSENT'}])).toMatchObject({state:'HOLD',gates:[]});
    expect(review([{...base,queueId:'other-group/icamp/SOURCE_OWNER'}])).toMatchObject({state:'HOLD',gates:[]});
  });

  it('blocks future, invalid, pre-case and malformed observations without partial results',()=>{
    const base=QL397_DEMO_OBSERVATIONS[0];
    for(const entry of [
      {...base,observedAt:'2026-11-09T09:46:00Z'},
      {...base,observedAt:'2026-11-09T08:59:59Z'},
      {...base,observedAt:'2026-11-09T09:99:00Z'},
      {...base,observationId:'bad'},
      {...base,outcome:'APPROVED' as QL397Observation['outcome']}
    ])expect(review([entry])).toMatchObject({state:'HOLD',gates:[]});
    expect(review(Array(61).fill(base))).toMatchObject({state:'HOLD',gates:[]});
    expect(review([],Number.NaN)).toMatchObject({state:'HOLD',gates:[]});
  });

  it('handles out-of-order observations deterministically and permits empty inert review history',()=>{
    const reversed=review([...QL397_DEMO_OBSERVATIONS].reverse());
    expect(reversed.gates).toEqual(review().gates);
    const empty=review([]);
    expect(empty).toMatchObject({state:'INERT_PREVIEW',observationCount:0,reviewedScenarios:0,
      conflicts:0,closureEligible:0});
    expect(empty.gates.every(item=>item.reviewState==='AWAITING_ORIGINAL_REVIEW')).toBe(true);
  });
});
