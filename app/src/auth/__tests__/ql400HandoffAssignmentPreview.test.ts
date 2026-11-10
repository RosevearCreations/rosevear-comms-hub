import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL400_DEFAULT_FILTERS,QL400_DEMO_AUDIT,QL400_DEMO_DRAFTS,
  QL400_DEMO_EXCEPTIONS,QL400_DEMO_NOW,QL400_DEMO_OUTCOMES,QL400_DEMO_REQUESTS,
  QL400_MAX_ASSIGNMENTS,filterOperatorHandoffAssignments,reviewOperatorHandoffAssignments,
  type QL400AssignmentDraft} from '../ql400HandoffAssignmentPreview';

const review=(drafts:readonly QL400AssignmentDraft[]=QL400_DEMO_DRAFTS,now=QL400_DEMO_NOW)=>
  reviewOperatorHandoffAssignments(QL392_ILLUSTRATIVE_PREVIEW,QL400_DEMO_REQUESTS,
    QL400_DEMO_OUTCOMES,QL400_DEMO_AUDIT,QL400_DEMO_EXCEPTIONS,drafts,now);

describe('QL-400 non-authorizing operator assignment preview and freshness escalation',()=>{
  it('builds three source-bound role-only drafts with original evidence age unknown',()=>{
    const value=review();
    expect(value).toMatchObject({state:'INERT_PREVIEW',count:3,overdueCount:1,
      conflictCount:1,originalDecisionsVerified:0,authorizedClosures:0,
      sendEnabled:false,persisted:false});
    expect(value.assignments.map(item=>item.sourceId)).toEqual(['devilndove','rosevear-ai-hub','icamp']);
    expect(value.assignments.map(item=>item.attention)).toEqual(['OVERDUE','COLLECT_ORIGINAL','COLLECT_ORIGINAL']);
    expect(value.assignments.every(item=>item.handoffStatus==='PREVIEW_ONLY_NOT_ASSIGNED'&&
      item.originalEvidenceFreshness==='UNKNOWN_ORIGINAL'&&item.ownerDecision==='NOT_VERIFIED'&&
      item.sourceOwnerDecision==='NOT_VERIFIED'&&item.masterOwnerDecision==='NOT_VERIFIED'&&
      item.independentReviewer==='NOT_VERIFIED'&&item.closureState==='HOLD'&&
      !item.sendEnabled&&!item.persisted&&!item.assignmentActive)).toBe(true);
    const overdue=value.assignments[0];
    expect(overdue.linkedExceptionIds).toEqual(['exception-ql399-0001','exception-ql399-0002']);
    expect(overdue.linkedTraceIds).toContain('ql398/audit-ql398-0002');
    expect(overdue.linkedTraceIds).toContain('ql399/exception-ql399-0002');
    expect(overdue.guidance).toContain('do not auto-assign');
    expect(JSON.stringify(value)).not.toContain('Camp Rosevear');
  });

  it('treats scenario freshness as non-authoritative even when a note is recent',()=>{
    const value=review();
    expect(value.assignments.every(item=>item.scenarioAgeMinutes>=0)).toBe(true);
    expect(value.assignments.some(item=>item.scenarioFreshness==='SCENARIO_RECENT_ONLY')).toBe(true);
    expect(value.assignments.every(item=>item.originalEvidenceFreshness==='UNKNOWN_ORIGINAL')).toBe(true);
    expect(value.authorizedClosures).toBe(0);
  });

  it('filters by source and escalation kind without approving a real assignment',()=>{
    const value=review();
    expect(filterOperatorHandoffAssignments(value,QL400_DEFAULT_FILTERS)).toHaveLength(3);
    expect(filterOperatorHandoffAssignments(value,{sourceId:'ALL',attention:'OVERDUE'})).toHaveLength(1);
    expect(filterOperatorHandoffAssignments(value,{sourceId:'icamp',attention:'OVERDUE'})).toEqual([]);
    expect(filterOperatorHandoffAssignments(value,{sourceId:'camp-rosevear',attention:'ALL'})).toEqual([]);
    expect(filterOperatorHandoffAssignments(value,{sourceId:'ALL',attention:'APPROVED' as 'ALL'})).toEqual([]);
    expect(value.assignments).toHaveLength(3);
  });

  it('fails closed on duplicates, cross-source, forged role and invalid time windows',()=>{
    const base=QL400_DEMO_DRAFTS[0];
    for(const bad of [
      {...base,assignmentId:'bad'},
      {...base,sourceId:'icamp'},
      {...base,correlationId:'correlation-ql392-integration'},
      {...base,queueId:'not-registered'},
      {...base,gate:'MASTER_OWNER' as typeof base.gate},
      {...base,intendedRole:'MASTER_OWNER' as typeof base.intendedRole},
      {...base,draftedAt:'2026-11-09T09:46:00Z'},
      {...base,draftedAt:'2026-11-09T08:00:00Z'},
      {...base,reviewDueAt:'2026-11-09T09:39:00Z'},
      {...base,reviewDueAt:'2026-11-09T11:46:00Z'},
      {...base,reviewDueAt:'invalid-date'}
    ])expect(review([bad])).toMatchObject({state:'HOLD',assignments:[],authorizedClosures:0});
    expect(review([base,base])).toMatchObject({state:'HOLD',assignments:[]});
    expect(review([{...base,assignmentId:'assignment-ql400-unique'},base])).toMatchObject({state:'HOLD',assignments:[]});
    expect(review(Array(QL400_MAX_ASSIGNMENTS+1).fill(base))).toMatchObject({state:'HOLD',assignments:[]});
    expect(review(QL400_DEMO_DRAFTS,Number.NaN)).toMatchObject({state:'HOLD',assignments:[]});
  });

  it('never trusts invalid upstream evidence and sorts planning drafts deterministically',()=>{
    const result=reviewOperatorHandoffAssignments(QL392_ILLUSTRATIVE_PREVIEW,
      QL400_DEMO_REQUESTS,[{...QL400_DEMO_OUTCOMES[0],sourceId:'icamp'}],
      QL400_DEMO_AUDIT,QL400_DEMO_EXCEPTIONS,QL400_DEMO_DRAFTS,QL400_DEMO_NOW);
    expect(result).toMatchObject({state:'HOLD',assignments:[]});
    expect(review([...QL400_DEMO_DRAFTS].reverse()).assignments).toEqual(review().assignments);
    expect(review([])).toMatchObject({state:'INERT_PREVIEW',count:0,authorizedClosures:0});
  });
});
