import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL393_DEFAULT_SCENARIO} from '../ql393OperatorFollowUpDrafts';
import {QL394_DEMO_HISTORY,QL394_DEMO_NOW,QL394_MAX_SNAPSHOTS,
  reviewDraftDecisionHistory,type QL394Snapshot} from '../ql394DraftDecisionHistory';

const WORKSHOP='correlation-ql392-workshop';
const INTEGRATION='correlation-ql392-integration';
const review=(snapshots:readonly QL394Snapshot[]=QL394_DEMO_HISTORY,correlation=WORKSHOP)=>
  reviewDraftDecisionHistory(QL392_ILLUSTRATIVE_PREVIEW,correlation,snapshots,QL394_DEMO_NOW);

describe('QL-394 inert decision history, claimed provenance and authorization drift',()=>{
  it('retains chronological simulated gate decisions and flags approval drift without authorizing it',()=>{
    const result=review();
    expect(result).toMatchObject({state:'INERT_PREVIEW',correlationId:WORKSHOP});
    expect(result.history).toHaveLength(15);
    expect(result.history.map(entry=>entry.snapshotId.slice(-4)))
      .toEqual([...Array(5).fill('0001'),...Array(5).fill('0002'),...Array(5).fill('0003')]);
    expect(result.history.filter(entry=>entry.provenance==='SCENARIO_REFERENCE_ONLY')).toHaveLength(2);
    expect(result.history.filter(entry=>entry.provenance==='MISSING')).toHaveLength(13);
    expect(result.alerts.map(alert=>alert.code)).toEqual([
      'UNVERIFIED_GRANT_CHANGE','UNVERIFIED_GRANT_CHANGE','PIN_REFERENCE_DRIFT',
      'GATE_REVERSAL','GATE_REVERSAL']);
    expect(result.reason).toContain('no source authority');
    expect(JSON.stringify(result)).not.toContain('SIMULATED_READY');
  });

  it('sorts snapshots independently of input order',()=>{
    const reversed=review([...QL394_DEMO_HISTORY].reverse());
    expect(reversed.history).toEqual(review().history);
    expect(reversed.alerts).toEqual(review().alerts);
  });

  it('classifies claimed references as missing, invalid, stale and conflicting, never verified',()=>{
    const basis=QL394_DEMO_HISTORY[0];
    const evidence={sourceId:'devilndove',correlationId:WORKSHOP,gate:'SOURCE_OWNER' as const,
      referenceId:'decision:QL394CLAIM001',checkedAt:'2026-11-09T09:00:00Z'};
    const snapshot=(id:string,checkedAt:string,duplicate=false):QL394Snapshot=>({
      ...basis,snapshotId:id,evidenceClaims:[{...evidence,checkedAt},
        ...(duplicate?[{...evidence,checkedAt}]:[])]});
    expect(review([snapshot('snapshot-ql394-1001','invalid')]).history[0].provenance).toBe('INVALID');
    expect(review([snapshot('snapshot-ql394-1002','2026-11-09T08:00:00Z')]).history[0].provenance)
      .toBe('STALE_SIMULATED');
    expect(review([snapshot('snapshot-ql394-1003','2026-11-09T09:00:00Z',true)]).history[0].provenance)
      .toBe('CONFLICT');
    expect(review([{...basis,snapshotId:'snapshot-ql394-1004',evidenceClaims:[]}]).history[0].provenance)
      .toBe('MISSING');
  });

  it('flags reuse of an opaque evidence claim by distinct shell sources',()=>{
    const group=QL392_ILLUSTRATIVE_PREVIEW.groups.find(group=>group.correlationId===INTEGRATION)!;
    const altered={...QL392_ILLUSTRATIVE_PREVIEW,groups:QL392_ILLUSTRATIVE_PREVIEW.groups.map(item=>
      item===group?{...item,timeline:item.timeline.map(event=>event.sourceId==='yw'?{
        ...event,evidenceFreshness:'STALE' as const}:event)}:item)};
    const claims=['icamp','yw'].map(sourceId=>({sourceId,correlationId:INTEGRATION,
      gate:'SOURCE_PIN' as const,referenceId:'pin:QL394SHARED0001',checkedAt:'2026-11-09T09:00:00Z'}));
    const result=reviewDraftDecisionHistory(altered,INTEGRATION,[{
      snapshotId:'snapshot-ql394-cross',observedAt:'2026-11-09T09:00:00Z',
      scenario:QL393_DEFAULT_SCENARIO,evidenceClaims:claims}],QL394_DEMO_NOW);
    expect(result).toMatchObject({state:'INERT_PREVIEW'});
    expect(result.history).toHaveLength(10);
    expect(result.alerts.map(alert=>alert.code)).toContain('CROSS_SOURCE_REFERENCE_REUSE');
  });

  it('fails closed on unregistered scopes, invalid scenarios and oversized or future snapshots',()=>{
    expect(review([], 'unknown-correlation-ql394')).toMatchObject({state:'HOLD',history:[],alerts:[]});
    expect(review(Array(QL394_MAX_SNAPSHOTS+1).fill(QL394_DEMO_HISTORY[0])))
      .toMatchObject({state:'HOLD',history:[],alerts:[]});
    expect(review([{...QL394_DEMO_HISTORY[0],observedAt:'2026-11-09T09:12:00Z'}]))
      .toMatchObject({state:'HOLD',history:[],alerts:[]});
    expect(review([{...QL394_DEMO_HISTORY[0],evidenceClaims:[{
      ...QL394_DEMO_HISTORY[0].evidenceClaims[0],sourceId:'camp-rosevear'}]}]))
      .toMatchObject({state:'HOLD',history:[],alerts:[]});
    expect(review([{...QL394_DEMO_HISTORY[0],scenario:{...QL393_DEFAULT_SCENARIO,
      sourcePins:[{sourceId:'camp-rosevear',correlationId:WORKSHOP,state:'SIMULATED_MATCH'}]}}]))
      .toMatchObject({state:'HOLD',history:[],alerts:[]});
    expect(review([QL394_DEMO_HISTORY[0],QL394_DEMO_HISTORY[0]]))
      .toMatchObject({state:'HOLD',history:[],alerts:[]});
  });
});
