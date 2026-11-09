import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL393_DEFAULT_SCENARIO,previewOperatorFollowUps,type QL393Scenario} from '../ql393OperatorFollowUpDrafts';

const INTEGRATION='correlation-ql392-integration';
const WORKSHOP='correlation-ql392-workshop';
const SERVICE='correlation-ql392-service';
const LOCAL='correlation-ql392-local';
const review=(id:string,scenario:QL393Scenario=QL393_DEFAULT_SCENARIO)=>
  previewOperatorFollowUps(QL392_ILLUSTRATIVE_PREVIEW,id,scenario);
const ready=(sourceId:string,correlationId:string):QL393Scenario=>({
  sourceDecisions:[{sourceId,correlationId,decision:'SIMULATED_APPROVED'}],
  masterOwnerDecisions:[{correlationId,decision:'SIMULATED_APPROVED'}],
  sourcePins:[{sourceId,correlationId,state:'SIMULATED_MATCH'}],
  receiverEnrollment:'SIMULATED_READY',
  consents:[{sourceId,correlationId,state:'SIMULATED_GRANTED'}]
});

describe('QL-393 non-sending source-scoped operator drafts and owner approval gates',()=>{
  it('drafts a recheck only for stale iCamp evidence in a shared YW/iCamp group',()=>{
    const result=review(INTEGRATION);
    expect(result).toMatchObject({state:'INERT_PREVIEW',correlationId:INTEGRATION});
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]).toMatchObject({sourceId:'icamp',correlationId:INTEGRATION,
      kind:'EVIDENCE_RECHECK',requestedEvidence:'SOURCE_SCOPED_READBACK',
      recipientScope:'SOURCE_SHELL',reason:'STALE',gateState:'HOLD',sendEnabled:false,persisted:false});
    expect(result.drafts[0].gates.map(gate=>gate.name))
      .toEqual(['SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT']);
    expect(result.drafts[0].gates.every(gate=>gate.state==='HOLD')).toBe(true);
    expect(JSON.stringify(result)).not.toContain('Camp Rosevear');
    expect(result.disclaimer).toContain('cannot authorize');
  });

  it('proposes fixed conflict-review and missing-evidence drafts without transport',()=>{
    const conflict=review(WORKSHOP);
    expect(conflict.drafts[0]).toMatchObject({sourceId:'devilndove',kind:'CONFLICT_REVIEW',
      requestedEvidence:'SOURCE_CONFLICT_PROOF',reason:'CONFLICT',sendEnabled:false});
    const missing=review(LOCAL);
    expect(missing.drafts[0]).toMatchObject({sourceId:'rosevear-ai-hub',
      kind:'EVIDENCE_RECHECK',requestedEvidence:'SOURCE_SCOPED_READBACK',reason:'MISSING'});
    const monitor=review(SERVICE);
    expect(monitor).toMatchObject({state:'INERT_PREVIEW',drafts:[]});
    expect(monitor.reason).toContain('No synthetic evidence concern');
  });

  it('never grants send or persistence authority even when all five synthetic gates pass',()=>{
    const result=review(INTEGRATION,ready('icamp',INTEGRATION));
    expect(result.drafts[0].gates.every(gate=>gate.state==='SIMULATED_PASS')).toBe(true);
    expect(result.drafts[0]).toMatchObject({gateState:'SCENARIO_READY_ONLY',sendEnabled:false,persisted:false});
    expect(result.disclaimer).toContain('Even all simulated owner gates passing');
  });

  it('holds a mismatched, missing or duplicate source/master/pin/consent approval',()=>{
    const base=ready('icamp',INTEGRATION);
    const wrongSource=review(INTEGRATION,{...base,
      sourceDecisions:[{sourceId:'yw',correlationId:INTEGRATION,decision:'SIMULATED_APPROVED'}]});
    expect(wrongSource.drafts[0].gates[0].state).toBe('HOLD');
    expect(wrongSource.drafts[0].gateState).toBe('HOLD');
    const wrongGroup=review(INTEGRATION,{...base,
      masterOwnerDecisions:[{correlationId:WORKSHOP,decision:'SIMULATED_APPROVED'}]});
    expect(wrongGroup.drafts[0].gates[1].state).toBe('HOLD');
    const wrongPin=review(INTEGRATION,{...base,
      sourcePins:[{sourceId:'yw',correlationId:INTEGRATION,state:'SIMULATED_MATCH'}]});
    expect(wrongPin.drafts[0].gates[2].state).toBe('HOLD');
    const wrongConsent=review(INTEGRATION,{...base,
      consents:[{sourceId:'icamp',correlationId:WORKSHOP,state:'SIMULATED_GRANTED'}]});
    expect(wrongConsent.drafts[0].gates[4].state).toBe('HOLD');
    const duplicate=review(INTEGRATION,{...base,sourceDecisions:[...base.sourceDecisions,...base.sourceDecisions],
      masterOwnerDecisions:[...base.masterOwnerDecisions,...base.masterOwnerDecisions]});
    expect(duplicate.drafts[0].gates[0].state).toBe('HOLD');
    expect(duplicate.drafts[0].gates[1].state).toBe('HOLD');
  });

  it('rejects unknown or malformed input before producing a follow-up draft',()=>{
    expect(review('correlation-not-registered')).toMatchObject({state:'HOLD',drafts:[],correlationId:null});
    expect(review('<script>')).toMatchObject({state:'HOLD',drafts:[]});
    expect(previewOperatorFollowUps({...QL392_ILLUSTRATIVE_PREVIEW,state:'HOLD'},INTEGRATION,ready('icamp',INTEGRATION)))
      .toMatchObject({state:'HOLD',drafts:[]});
    expect(review(INTEGRATION,{...QL393_DEFAULT_SCENARIO,
      sourceDecisions:[{sourceId:'camp-rosevear',correlationId:INTEGRATION,decision:'SIMULATED_APPROVED'}]}))
      .toMatchObject({state:'HOLD',drafts:[]});
    expect(review(INTEGRATION,{...QL393_DEFAULT_SCENARIO,sourcePins:Array(51).fill({sourceId:'icamp',correlationId:INTEGRATION,state:'SIMULATED_MATCH'})}))
      .toMatchObject({state:'HOLD',drafts:[]});
  });
});
