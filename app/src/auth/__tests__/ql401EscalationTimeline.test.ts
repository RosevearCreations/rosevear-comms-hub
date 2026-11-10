import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {filterOperatorEscalationTimeline,reviewOperatorEscalationTimeline,
  QL401_DEFAULT_FILTERS,QL401_DEMO_ACKNOWLEDGEMENTS,QL401_DEMO_AUDIT,
  QL401_DEMO_DRAFTS,QL401_DEMO_EXCEPTIONS,QL401_DEMO_NOW,QL401_DEMO_OUTCOMES,
  QL401_DEMO_REQUESTS,QL401_MAX_ACKNOWLEDGEMENTS,type QL401AcknowledgementDraft}
  from '../ql401EscalationTimeline';

const review=(acks:readonly QL401AcknowledgementDraft[]=QL401_DEMO_ACKNOWLEDGEMENTS,
  now=QL401_DEMO_NOW)=>reviewOperatorEscalationTimeline(QL392_ILLUSTRATIVE_PREVIEW,
    QL401_DEMO_REQUESTS,QL401_DEMO_OUTCOMES,QL401_DEMO_AUDIT,QL401_DEMO_EXCEPTIONS,
    QL401_DEMO_DRAFTS,acks,now);

describe('QL-401 source-scoped escalation timeline and non-authorizing acknowledgement preview',()=>{
  it('shows a late and timely synthetic mark, a missing mark and zero verified handoffs',()=>{
    const result=review();
    expect(result).toMatchObject({state:'INERT_PREVIEW',total:3,scenarioAcknowledged:2,
      notAcknowledged:1,lateIllustrativeAcks:1,authorizedHandoffs:0,authorizedClosures:0,
      sendEnabled:false,persisted:false});
    expect(result.rows.map(row=>row.acknowledgementState)).toEqual([
      'SCENARIO_ACK_ONLY','SCENARIO_ACK_ONLY','NO_SCENARIO_ACK']);
    expect(result.rows[0].lateIllustrativeAck).toBe(true);
    expect(result.rows.every(row=>row.closureState==='HOLD'&&
      row.sourceOwnerApproval==='NOT_VERIFIED'&&row.masterOwnerApproval==='NOT_VERIFIED'&&
      row.originalEvidence==='NOT_VERIFIED'&&row.independentWitness==='NOT_ATTESTED'&&
      !row.handoffAccepted&&!row.assignmentActive&&!row.sendEnabled&&!row.persisted)).toBe(true);
    expect(result.rows[0].timeline.some(event=>event.eventId==='ql398/audit-ql398-0002')).toBe(true);
    expect(result.rows[0].timeline.some(event=>event.eventId==='ack-ql401-workshop')).toBe(true);
    expect(result.rows.every(row=>row.timeline.every(event=>event.scenarioOnly&&!event.authorized))).toBe(true);
    expect(result.rows.every(row=>row.timeline.every((event,index,events)=>
      index===0||Date.parse(events[index-1].at)<=Date.parse(event.at)))).toBe(true);
    expect(JSON.stringify(result)).not.toContain('Camp Rosevear');
  });

  it('offers safe recovery without sending, retrying, promoting an acknowledgement or lifting HOLD',()=>{
    const result=review();
    expect(result.rows[0].recoverySteps.join(' ')).toContain('missed deadline');
    expect(result.rows[2].recoverySteps.join(' ')).toContain('do not auto-resend');
    expect(result.rows.every(row=>row.recoverySteps.some(step=>step.includes('master-owner')))).toBe(true);
    expect(result.rows.every(row=>row.timeline.some(event=>event.kind==='ESCALATION_REVIEW'))).toBe(true);
    expect(result.rows[2].acknowledgementAt).toBeNull();
  });

  it('supports local source and acknowledgement filters, rejects invented tenants and unknown states',()=>{
    const result=review();
    expect(filterOperatorEscalationTimeline(result,QL401_DEFAULT_FILTERS)).toHaveLength(3);
    expect(filterOperatorEscalationTimeline(result,{sourceId:'ALL',acknowledgement:'NO_SCENARIO_ACK'})).toHaveLength(1);
    expect(filterOperatorEscalationTimeline(result,{sourceId:'icamp',acknowledgement:'NO_SCENARIO_ACK'})).toHaveLength(1);
    expect(filterOperatorEscalationTimeline(result,{sourceId:'devilndove',acknowledgement:'NO_SCENARIO_ACK'})).toEqual([]);
    expect(filterOperatorEscalationTimeline(result,{sourceId:'camp-rosevear',acknowledgement:'ALL'})).toEqual([]);
    expect(filterOperatorEscalationTimeline(result,{sourceId:'ALL',acknowledgement:'APPROVED' as 'ALL'})).toEqual([]);
  });

  it('fails closed on duplicate, forged, cross-source, role-swapped and out-of-sequence acknowledgement claims',()=>{
    const base=QL401_DEMO_ACKNOWLEDGEMENTS[0];
    for(const bad of [
      {...base,acknowledgementId:'bad'},
      {...base,sourceId:'icamp'},
      {...base,correlationId:'correlation-ql392-integration'},
      {...base,queueId:'unrecognized'},
      {...base,assignmentId:'assignment-ql400-0002'},
      {...base,acknowledgerRole:'MASTER_OWNER' as typeof base.acknowledgerRole},
      {...base,outcome:'AUTHORISED' as typeof base.outcome},
      {...base,observedAt:'2026-11-09T09:39:59Z'},
      {...base,observedAt:'2026-11-09T09:46:00Z'},
      {...base,observedAt:'not-a-time'},
      {...base,acknowledgementId:'assignment-ql400-0001'},
      {...base,acknowledgementId:'ql398/audit-ql398-0002'}
    ])expect(review([bad])).toMatchObject({state:'HOLD',rows:[],authorizedClosures:0});
    expect(review([base,base])).toMatchObject({state:'HOLD',rows:[]});
    expect(review([base,{...base,acknowledgementId:'ack-ql401-duplicated-assignment'}])).toMatchObject({state:'HOLD',rows:[]});
    expect(review(Array(QL401_MAX_ACKNOWLEDGEMENTS+1).fill(base))).toMatchObject({state:'HOLD',rows:[]});
    expect(review(QL401_DEMO_ACKNOWLEDGEMENTS,Number.NaN)).toMatchObject({state:'HOLD',rows:[]});
  });

  it('does not trust invalid QL-400 upstream data and orders acknowledgements deterministically',()=>{
    const corrupted=reviewOperatorEscalationTimeline(QL392_ILLUSTRATIVE_PREVIEW,
      QL401_DEMO_REQUESTS,QL401_DEMO_OUTCOMES,QL401_DEMO_AUDIT,QL401_DEMO_EXCEPTIONS,
      [{...QL401_DEMO_DRAFTS[0],sourceId:'icamp'}],[],QL401_DEMO_NOW);
    expect(corrupted).toMatchObject({state:'HOLD',rows:[]});
    expect(review([...QL401_DEMO_ACKNOWLEDGEMENTS].reverse()).rows).toEqual(review().rows);
    expect(review([])).toMatchObject({state:'INERT_PREVIEW',total:3,scenarioAcknowledged:0,
      notAcknowledged:3,authorizedHandoffs:0});
  });
});
