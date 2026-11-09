import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL398_DEMO_AUDIT,QL398_DEMO_NOW,QL398_DEMO_OUTCOMES,QL398_DEMO_REQUESTS,
  QL398_DEFAULT_FILTERS,QL398_MAX_AUDIT_NOTES,filterOperatorClosureReadiness,
  reviewOperatorClosureReadiness,type QL398AuditNote} from '../ql398ClosureReadinessAudit';

const review=(notes:readonly QL398AuditNote[]=QL398_DEMO_AUDIT,now=QL398_DEMO_NOW)=>
  reviewOperatorClosureReadiness(QL392_ILLUSTRATIVE_PREVIEW,QL398_DEMO_REQUESTS,
    QL398_DEMO_OUTCOMES,notes,now);

describe('QL-398 independently gated, inert closure readiness and HOLD audit',()=>{
  it('groups three source-scoped cases and all fifteen unsatisfied original evidence checks',()=>{
    const result=review();
    expect(result).toMatchObject({state:'INERT_PREVIEW',totalCases:3,conflictCases:2,
      auditedAttempts:4,eligibleClosures:0,sendEnabled:false,persisted:false});
    expect(result.cases.flatMap(item=>item.checklist)).toHaveLength(15);
    for(const item of result.cases){
      expect(item.checklist.map(check=>check.gate)).toEqual([
        'SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT']);
      expect(item).toMatchObject({missingIndependentChecks:5,sourceOwnerReview:'NOT_VERIFIED',
        masterOwnerReview:'NOT_VERIFIED',reviewerSeparation:'NOT_ATTESTED',closureState:'HOLD',
        closureEligible:false,sendEnabled:false,persisted:false});
      expect(item.checklist.every(check=>check.originalEvidence==='NOT_VERIFIED'&&
        check.independentReviewer==='NOT_ATTESTED'&&!check.satisfied)).toBe(true);
    }
    const owner=result.cases.find(item=>item.sourceId==='devilndove')!;
    expect(owner.checklist.find(item=>item.gate==='SOURCE_OWNER')?.custodian).toBe('SOURCE_OWNER');
    expect(owner.checklist.find(item=>item.gate==='MASTER_OWNER')?.custodian).toBe('MASTER_OWNER');
    expect(owner.scenarioState).toBe('HOLD_CONFLICT_RECHECK');
    expect(owner.audit.map(item=>item.auditId)).toEqual(['audit-ql398-0001','audit-ql398-0002']);
    expect(owner.audit[1]).toMatchObject({intent:'PROPOSE_HOLD_RESOLUTION',
      claimBasis:'CLAIMED_SCENARIO_COMPLETE',disposition:'HOLD_PRESERVED',resolutionAuthorized:false});
    expect(owner.audit[1].reason).toContain('simulated all-clear');
    expect(result.cases.find(item=>item.sourceId==='icamp')?.scenarioState).toBe('HOLD_CONFLICT_RECHECK');
    expect(result.cases.find(item=>item.sourceId==='rosevear-ai-hub')?.scenarioState).toBe('HOLD_ORIGINAL_EVIDENCE');
    expect(JSON.stringify(result)).not.toContain('Camp Rosevear');
  });

  it('filters source and HOLD kind without changing original owner decisions',()=>{
    const result=review();
    expect(filterOperatorClosureReadiness(result,QL398_DEFAULT_FILTERS)).toHaveLength(3);
    expect(filterOperatorClosureReadiness(result,{sourceId:'devilndove',scenarioState:'HOLD_CONFLICT_RECHECK'})).toHaveLength(1);
    expect(filterOperatorClosureReadiness(result,{sourceId:'ALL',scenarioState:'HOLD_CONFLICT_RECHECK'})).toHaveLength(2);
    expect(filterOperatorClosureReadiness(result,{sourceId:'icamp',scenarioState:'HOLD_ORIGINAL_EVIDENCE'})).toEqual([]);
    expect(filterOperatorClosureReadiness(result,{sourceId:'camp-rosevear',scenarioState:'ALL'})).toEqual([]);
    expect(filterOperatorClosureReadiness(result,{sourceId:'ALL',scenarioState:'APPROVED' as 'ALL'})).toEqual([]);
    expect(result.eligibleClosures).toBe(0);
  });

  it('rejects duplicate, cross-source, scope-swapped, forged and out-of-window audit records',()=>{
    const base=QL398_DEMO_AUDIT[0];
    for(const bad of [
      {...base,sourceId:'icamp'},
      {...base,correlationId:'correlation-ql392-integration'},
      {...base,gate:'CONSENT' as typeof base.gate},
      {...base,reviewerScope:'MASTER_OWNER' as typeof base.reviewerScope},
      {...base,queueId:'correlation-ql392-integration/icamp/MASTER_OWNER'},
      {...base,auditId:'short'},
      {...base,observedAt:'2026-11-09T09:46:00Z'},
      {...base,observedAt:'2026-11-09T08:59:59Z'},
      {...base,observedAt:'2026-11-09T09:99:00Z'},
      {...base,intent:'APPROVE' as typeof base.intent},
      {...base,claimBasis:'VERIFIED' as typeof base.claimBasis}
    ])expect(review([bad])).toMatchObject({state:'HOLD',cases:[],totalCases:0,eligibleClosures:0});
    expect(review([base,base])).toMatchObject({state:'HOLD',cases:[]});
    expect(review(Array(QL398_MAX_AUDIT_NOTES+1).fill(base))).toMatchObject({state:'HOLD',cases:[]});
    expect(review(QL398_DEMO_AUDIT,Number.NaN)).toMatchObject({state:'HOLD',cases:[]});
  });

  it('rejects invalid upstream queue and outcomes and never partially returns an audit',()=>{
    const base=QL398_DEMO_OUTCOMES[0];
    const outcome=reviewOperatorClosureReadiness(QL392_ILLUSTRATIVE_PREVIEW,QL398_DEMO_REQUESTS,
      [{...base,sourceId:'icamp'}],QL398_DEMO_AUDIT,QL398_DEMO_NOW);
    expect(outcome).toMatchObject({state:'HOLD',cases:[],auditedAttempts:0});
    const queue=reviewOperatorClosureReadiness(QL392_ILLUSTRATIVE_PREVIEW,
      [{...QL398_DEMO_REQUESTS[0],correlationId:'unregistered-correlation'}],QL398_DEMO_OUTCOMES,QL398_DEMO_AUDIT,QL398_DEMO_NOW);
    expect(queue).toMatchObject({state:'HOLD',cases:[],auditedAttempts:0});
  });

  it('orders audit notes deterministically and retains HOLD with no notes',()=>{
    expect(review([...QL398_DEMO_AUDIT].reverse()).cases).toEqual(review().cases);
    const empty=review([]);
    expect(empty).toMatchObject({state:'INERT_PREVIEW',auditedAttempts:0,eligibleClosures:0});
    expect(empty.cases).toHaveLength(3);
    expect(empty.cases.every(item=>item.audit.length===0&&item.closureState==='HOLD')).toBe(true);
  });
});
