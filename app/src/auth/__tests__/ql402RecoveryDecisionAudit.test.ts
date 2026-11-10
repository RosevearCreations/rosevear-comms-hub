import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {filterOperatorRecoveryDecisions,reviewOperatorRecoveryDecisions,
  QL402_DEFAULT_FILTERS,QL402_DEMO_ACKS,QL402_DEMO_AUDIT,QL402_DEMO_DRAFTS,
  QL402_DEMO_EXCEPTIONS,QL402_DEMO_NOTES,QL402_DEMO_NOW,QL402_DEMO_OUTCOMES,
  QL402_DEMO_REQUESTS,QL402_MAX_NOTES,type QL402RecoveryNote}
  from '../ql402RecoveryDecisionAudit';

const review=(notes:readonly QL402RecoveryNote[]=QL402_DEMO_NOTES,now=QL402_DEMO_NOW)=>
  reviewOperatorRecoveryDecisions(QL392_ILLUSTRATIVE_PREVIEW,QL402_DEMO_REQUESTS,
    QL402_DEMO_OUTCOMES,QL402_DEMO_AUDIT,QL402_DEMO_EXCEPTIONS,QL402_DEMO_DRAFTS,
    QL402_DEMO_ACKS,notes,now);

describe('QL-402 recovery decisions, scenario drift and independent signoff HOLD checklist',()=>{
  it('detects scenario reference drops/restorations without verifying any original signoff',()=>{
    const value=review();
    expect(value).toMatchObject({state:'INERT_PREVIEW',total:3,reviewed:3,driftEvents:3,
      awaitingOriginalSignoffs:15,originalOwnerDecisionsVerified:0,authorizedClosures:0,
      sendEnabled:false,persisted:false});
    expect(value.rows.map(row=>row.recoveryState)).toEqual([
      'HOLD_OWNER_ESCALATION','HOLD_RECHECK','HOLD_RECHECK']);
    expect(value.rows[0].decisionTrace.map(note=>note.drift)).toEqual([
      'SCENARIO_UNCHANGED','SCENARIO_REFERENCE_DROPPED']);
    expect(value.rows[1].decisionTrace.map(note=>note.drift)).toEqual([
      'SCENARIO_REFERENCE_DROPPED','SCENARIO_REFERENCE_RESTORED']);
    expect(value.rows[2].decisionTrace.map(note=>note.drift)).toEqual(['NO_SCENARIO_REFERENCE']);
    expect(value.rows.every(row=>row.signoffChecklist.length===5&&row.signoffsVerified===0&&
      row.signoffChecklist.every(check=>check.originalReceipt==='NOT_PRESENT'&&
        check.independentWitness==='NOT_ATTESTED'&&!check.eligibleForSignoff)&&
      !row.sourceOwnerSigned&&!row.masterOwnerSigned&&!row.independentWitnessVerified&&
      !row.originalEvidenceVerified&&!row.handoffAuthorized&&row.closureState==='HOLD'&&
      !row.sendEnabled&&!row.persisted)).toBe(true);
    expect(value.rows[0].signoffChecklist.map(check=>check.gate)).toEqual([
      'SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT']);
    expect(value.rows[0].decisionTrace.every(note=>!note.decisionAuthorized&&
      note.disposition==='HOLD_PRESERVED')).toBe(true);
    expect(JSON.stringify(value)).not.toContain('Camp Rosevear');
  });

  it('offers local source and drift filters without authorizing an operator decision',()=>{
    const value=review();
    expect(filterOperatorRecoveryDecisions(value,QL402_DEFAULT_FILTERS)).toHaveLength(3);
    expect(filterOperatorRecoveryDecisions(value,{sourceId:'ALL',drift:'DRIFT_ONLY'})).toHaveLength(2);
    expect(filterOperatorRecoveryDecisions(value,{sourceId:'icamp',drift:'UNCHANGED'})).toHaveLength(1);
    expect(filterOperatorRecoveryDecisions(value,{sourceId:'icamp',drift:'DRIFT_ONLY'})).toEqual([]);
    expect(filterOperatorRecoveryDecisions(value,{sourceId:'camp-rosevear',drift:'ALL'})).toEqual([]);
    expect(filterOperatorRecoveryDecisions(value,{sourceId:'ALL',drift:'APPROVED' as 'ALL'})).toEqual([]);
  });

  it('rejects duplicate, forged, cross-source, invalid-role, future and invented acknowledgement references',()=>{
    const base=QL402_DEMO_NOTES[0];
    for(const bad of [
      {...base,reviewId:'bad'},
      {...base,sourceId:'icamp'},
      {...base,correlationId:'correlation-ql392-integration'},
      {...base,assignmentId:'assignment-ql400-0002'},
      {...base,reviewerRole:'MASTER_OWNER' as typeof base.reviewerRole},
      {...base,intent:'APPROVE_CLOSE' as typeof base.intent},
      {...base,referencedScenarioAcknowledgementId:'ack-ql401-local'},
      {...base,referencedScenarioAcknowledgementId:'invented'},
      {...base,observedAt:'2026-11-09T09:39:00Z'},
      {...base,observedAt:'2026-11-09T09:46:00Z'},
      {...base,observedAt:'not-a-time'},
      {...base,reviewId:'ack-ql401-workshop'},
      {...base,reviewId:'ql399/exception-ql399-0002'}
    ])expect(review([bad])).toMatchObject({state:'HOLD',rows:[],authorizedClosures:0});
    expect(review([base,base])).toMatchObject({state:'HOLD',rows:[]});
    expect(review(Array(QL402_MAX_NOTES+1).fill(base))).toMatchObject({state:'HOLD',rows:[]});
    expect(review(QL402_DEMO_NOTES,Number.NaN)).toMatchObject({state:'HOLD',rows:[]});
  });

  it('refuses invalid upstream evidence and sorts unordered independent notes deterministically',()=>{
    expect(review([...QL402_DEMO_NOTES].reverse()).rows).toEqual(review().rows);
    expect(review([])).toMatchObject({state:'INERT_PREVIEW',total:3,reviewed:0,
      driftEvents:0,authorizedClosures:0});
    const corrupted=reviewOperatorRecoveryDecisions(QL392_ILLUSTRATIVE_PREVIEW,
      QL402_DEMO_REQUESTS,QL402_DEMO_OUTCOMES,QL402_DEMO_AUDIT,QL402_DEMO_EXCEPTIONS,
      [{...QL402_DEMO_DRAFTS[0],sourceId:'icamp'}],QL402_DEMO_ACKS,[],QL402_DEMO_NOW);
    expect(corrupted).toMatchObject({state:'HOLD',rows:[]});
  });
});
