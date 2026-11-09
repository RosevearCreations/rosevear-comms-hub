import {describe,expect,it} from 'vitest';
import {QL392_DEFAULT_FILTERS,QL392_ILLUSTRATIVE_PREVIEW,reviewOperatorIncidents,
  type QL392Filters} from '../ql392OperatorIncidentReview';

const review=(filters:Partial<QL392Filters>={})=>
  reviewOperatorIncidents(QL392_ILLUSTRATIVE_PREVIEW,{...QL392_DEFAULT_FILTERS,...filters});

describe('QL-392 read-only synthetic operator filters, source impact and review priority',()=>{
  it('orders conflicts first, then evidence verification, and counts each correlation once',()=>{
    const result=review();
    expect(result).toMatchObject({state:'INERT_PREVIEW',totalGroups:4,attentionGroups:3,heldUnverified:1});
    expect(result.groups.map(group=>group.priority)).toEqual([
      'REVIEW_NOW','VERIFY_EVIDENCE','VERIFY_EVIDENCE','MONITOR_ONLY']);
    expect(result.groups[0].correlationId).toBe('correlation-ql392-workshop');
    const yardWorkers=result.impact.find(row=>row.sourceId==='yw');
    const iCamp=result.impact.find(row=>row.sourceId==='icamp');
    const aiPlatform=result.impact.find(row=>row.sourceId==='ai-data-platform');
    expect(yardWorkers).toMatchObject({correlatedGroups:1,timelineEntries:1,attentionGroups:1,highestPriority:'VERIFY_EVIDENCE'});
    expect(iCamp).toMatchObject({correlatedGroups:1,timelineEntries:1,attentionGroups:1,highestPriority:'VERIFY_EVIDENCE'});
    expect(aiPlatform).toMatchObject({correlatedGroups:0,timelineEntries:0,attentionGroups:0,highestPriority:'NONE'});
    expect(result.impact).toHaveLength(6);
    expect(result.reason).toContain('no operator work');
  });

  it('filters by registered shell, evidence attention and suggested priority without changing source totals',()=>{
    const source=review({sourceId:'icamp'});
    expect(source.groups.map(group=>group.correlationId)).toEqual(['correlation-ql392-integration']);
    expect(source.groups[0].sourceIds).toEqual(['icamp','yw']);
    expect(source.impact).toEqual(review().impact);
    const attention=review({freshness:'ATTENTION'});
    expect(attention.groups).toHaveLength(3);
    expect(attention.groups.every(group=>group.priority!=='MONITOR_ONLY')).toBe(true);
    const current=review({freshness:'CURRENT'});
    expect(current.groups.map(group=>group.correlationId)).toEqual(['correlation-ql392-service']);
    expect(review({priority:'REVIEW_NOW'}).groups.map(group=>group.correlationId)).toEqual(['correlation-ql392-workshop']);
    expect(review({sourceId:'icamp',priority:'REVIEW_NOW'}).groups).toEqual([]);
  });

  it('derives evidence urgency from timeline entries even if an overall summary is inconsistent',()=>{
    const altered={...QL392_ILLUSTRATIVE_PREVIEW,groups:QL392_ILLUSTRATIVE_PREVIEW.groups.map(group=>
      group.correlationId==='correlation-ql392-integration'?{...group,overallFreshness:'CURRENT_SIMULATED' as const}:group)};
    const result=reviewOperatorIncidents(altered,QL392_DEFAULT_FILTERS);
    const row=result.groups.find(group=>group.correlationId==='correlation-ql392-integration');
    expect(row?.freshness).toBe('STALE');
    expect(row?.priority).toBe('VERIFY_EVIDENCE');
    expect(reviewOperatorIncidents(altered,{...QL392_DEFAULT_FILTERS,freshness:'CURRENT'}).groups)
      .not.toContainEqual(expect.objectContaining({correlationId:'correlation-ql392-integration'}));
  });

  it('returns HOLD for unknown source, unsupported priority or synthetic rejected ledger',()=>{
    expect(review({sourceId:'CampRosevear'})).toMatchObject({state:'HOLD',groups:[],totalGroups:0});
    expect(review({priority:'SEND_ALERT' as QL392Filters['priority']}))
      .toMatchObject({state:'HOLD',groups:[]});
    expect(reviewOperatorIncidents({...QL392_ILLUSTRATIVE_PREVIEW,state:'HOLD'},QL392_DEFAULT_FILTERS))
      .toMatchObject({state:'HOLD',groups:[]});
  });

  it('rejects held rows, unregistered sources and duplicate correlation IDs instead of leaking claims',()=>{
    const [first]=QL392_ILLUSTRATIVE_PREVIEW.groups;
    const invalidHeld={...first,timeline:[{...first.timeline[0],eventState:'HELD' as const}]};
    const withHeld={...QL392_ILLUSTRATIVE_PREVIEW,groups:[invalidHeld]};
    expect(reviewOperatorIncidents(withHeld,QL392_DEFAULT_FILTERS)).toMatchObject({state:'HOLD',groups:[]});
    const withUnknown={...QL392_ILLUSTRATIVE_PREVIEW,groups:[{...first,sourceIds:['camp-rosevear']}]};
    expect(reviewOperatorIncidents(withUnknown,QL392_DEFAULT_FILTERS)).toMatchObject({state:'HOLD',groups:[]});
    const withDuplicate={...QL392_ILLUSTRATIVE_PREVIEW,groups:[first,first]};
    expect(reviewOperatorIncidents(withDuplicate,QL392_DEFAULT_FILTERS)).toMatchObject({state:'HOLD',groups:[]});
    expect(QL392_ILLUSTRATIVE_PREVIEW.groups[0].sourceIds).toEqual(['icamp','yw']);
  });
});
