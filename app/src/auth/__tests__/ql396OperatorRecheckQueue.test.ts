import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL394_DEMO_HISTORY} from '../ql394DraftDecisionHistory';
import {QL396_DEMO_NOW,QL396_DEMO_REQUESTS,QL396_DEFAULT_FILTERS,
  filterOperatorRecheckQueue,reviewOperatorRecheckQueue,type QL396RecheckRequest}
  from '../ql396OperatorRecheckQueue';

const preview=(requests:readonly QL396RecheckRequest[]=QL396_DEMO_REQUESTS,
  now=QL396_DEMO_NOW)=>reviewOperatorRecheckQueue(QL392_ILLUSTRATIVE_PREVIEW,requests,now);

describe('QL-396 synthetic owner recheck queue, aging and escalation guidance',()=>{
  it('builds a three-source queue with bounded, distinct gate-specific HOLD items',()=>{
    const result=preview();
    expect(result).toMatchObject({state:'INERT_PREVIEW',sourceCount:3,totalGroups:3,
      overdue:5,aging:5,newCount:5,sendEnabled:false,persisted:false});
    expect(result.items).toHaveLength(15);
    expect(new Set(result.items.map(item=>item.queueId)).size).toBe(15);
    expect(result.items.slice(0,5).every(item=>item.sourceId==='devilndove'&&
      item.ageBand==='OVERDUE'&&item.syntheticAgeMinutes===45&&
      item.priority==='REVIEW_NOW')).toBe(true);
    expect(result.items.slice(5,10).every(item=>item.sourceId==='icamp'&&
      item.ageBand==='AGING'&&item.syntheticAgeMinutes===25)).toBe(true);
    expect(result.items.slice(10).every(item=>item.sourceId==='rosevear-ai-hub'&&
      item.ageBand==='NEW'&&item.syntheticAgeMinutes===6)).toBe(true);
    expect(result.items.every(item=>item.status==='HOLD'&&item.originalOwnerEvidence==='NOT_VERIFIED'&&
      item.sendEnabled===false&&item.persisted===false)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('Camp Rosevear');
    expect(result.reason).toContain('only to synthetic observations');
  });

  it('maintains separate source and master owner routing and detects prior drift',()=>{
    const result=preview();
    const source=result.items.find(item=>item.sourceId==='devilndove'&&item.gate==='SOURCE_OWNER')!;
    const master=result.items.find(item=>item.sourceId==='devilndove'&&item.gate==='MASTER_OWNER')!;
    const pin=result.items.find(item=>item.sourceId==='devilndove'&&item.gate==='SOURCE_PIN')!;
    expect(source.ownerScope).toBe('SOURCE_OWNER');
    expect(master.ownerScope).toBe('MASTER_OWNER');
    expect(pin.ownerScope).toBe('SOURCE_SIGNING_CUSTODIAN');
    expect(source.driftCodes).toContain('UNVERIFIED_GRANT_CHANGE');
    expect(source.driftCodes).toContain('GATE_REVERSAL');
    expect(pin.driftCodes).toContain('PIN_REFERENCE_DRIFT');
    expect(pin.guidance).toContain('witness');
    expect(master.guidance).toContain('separate original master-owner decision');
  });

  it('filters source and simulated age without changing the original queue',()=>{
    const queue=preview();
    expect(filterOperatorRecheckQueue(queue,QL396_DEFAULT_FILTERS)).toHaveLength(15);
    expect(filterOperatorRecheckQueue(queue,{sourceId:'icamp',ageBand:'AGING'})).toHaveLength(5);
    expect(filterOperatorRecheckQueue(queue,{sourceId:'icamp',ageBand:'OVERDUE'})).toHaveLength(0);
    expect(filterOperatorRecheckQueue(queue,{sourceId:'ALL',ageBand:'NEW'})).toHaveLength(5);
    expect(filterOperatorRecheckQueue(queue,{sourceId:'camp-rosevear',ageBand:'ALL'})).toHaveLength(0);
    expect(filterOperatorRecheckQueue(queue,{sourceId:'ALL',ageBand:'INVALID' as 'NEW'})).toHaveLength(0);
    expect(queue.items).toHaveLength(15);
  });

  it('uses fixed synthetic observation thresholds, not real approval dates',()=>{
    const workshop=[QL396_DEMO_REQUESTS[0]],integration=[QL396_DEMO_REQUESTS[1]];
    expect(preview(workshop,Date.parse('2026-11-09T09:29:00Z')).items[0].ageBand).toBe('AGING');
    expect(preview(workshop,Date.parse('2026-11-09T09:30:00Z')).items[0].ageBand).toBe('OVERDUE');
    expect(preview(integration,Date.parse('2026-11-09T09:29:00Z')).items[0].ageBand).toBe('NEW');
    expect(preview(integration,Date.parse('2026-11-09T09:30:00Z')).items[0].ageBand).toBe('AGING');
  });

  it('fails closed on duplicate groups, unknown sources and invalid evidence, without partial entries',()=>{
    const badGroup={correlationId:'unknown-correlation-ql396',snapshots:QL394_DEMO_HISTORY};
    expect(preview([...QL396_DEMO_REQUESTS,badGroup])).toMatchObject({state:'HOLD',items:[]});
    expect(preview([QL396_DEMO_REQUESTS[0],QL396_DEMO_REQUESTS[0]]))
      .toMatchObject({state:'HOLD',items:[]});
    expect(preview([{correlationId:'correlation-ql392-workshop',snapshots:[{
      ...QL394_DEMO_HISTORY[0],evidenceClaims:[{...QL394_DEMO_HISTORY[0].evidenceClaims[0],
        sourceId:'camp-rosevear'}]}]}]))
      .toMatchObject({state:'HOLD',items:[]});
    expect(preview([{correlationId:'correlation-ql392-service',snapshots:QL394_DEMO_HISTORY}]))
      .toMatchObject({state:'HOLD',items:[]});
    expect(preview(Array(7).fill(QL396_DEMO_REQUESTS[0]))).toMatchObject({state:'HOLD',items:[]});
    expect(preview(QL396_DEMO_REQUESTS,Number.NaN)).toMatchObject({state:'HOLD',items:[]});
  });
});
