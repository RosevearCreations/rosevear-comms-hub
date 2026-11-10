import {describe,expect,it} from 'vitest';
import {QL375_SHELLS} from '../ql375OwnerStatus';
import {QL409_DEMO_CAPTURED,QL409_DEMO_EVENTS,reviewQl409AuditDecisions}
  from '../ql409AuditDecisionReview';

const now=Date.parse('2026-11-10T16:00:00.000Z');
const forSource=(id:typeof QL375_SHELLS[number]['id'])=>
  QL409_DEMO_EVENTS.filter(item=>item.sourceId===id);

describe('QL-409 source-scoped protected audit history',()=>{
  it('keeps six sources isolated and all protected gates on HOLD',()=>{
    for(const source of QL375_SHELLS){
      const review=reviewQl409AuditDecisions(source.id,forSource(source.id),now);
      expect(review).toMatchObject({sourceId:source.id,connection:'HOLD',
        state:'RECEIVER_OFF_RECOVERY_REVIEW',receiverEnabled:false,
        oneTestAuthorized:false,persisted:false,networkRequests:0,
        credentialsDisclosed:false});
      expect(review.timeline.every(item=>item.sourceId===source.id)).toBe(true);
      expect(review.worklist.every(item=>item.sourceId===source.id)).toBe(true);
      if(!forSource(source.id).length)expect(review.errors).toContain('NO_SOURCE_AUDIT_EVENTS');
    }
  });
  it('sorts source events chronologically and routes independent review',()=>{
    const review=reviewQl409AuditDecisions('yw',forSource('yw').slice().reverse(),now);
    expect(review.timeline.map(item=>item.eventId)).toEqual(['demo_event_001','demo_event_002']);
    expect(review.worklist.map(item=>item.route)).toEqual([
      'INDEPENDENT_REVIEW_REQUIRED','MASTER_OWNER_REVIEW']);
    expect(review.stale).toBe(false);
  });
  it('rejects foreign source, duplicate ID, malformed and extra secret fields',()=>{
    const first=forSource('yw')[0];
    const review=reviewQl409AuditDecisions('yw',[first,first,
      {...first,sourceId:'icamp',eventId:'foreign_0001'},
      {...first,eventId:'invalid_extra',privateKey:'must-not-enter'},null],now);
    expect(review.timeline).toHaveLength(1);
    expect(review.errors).toContain('DUPLICATE_OR_INVALID_TIME');
    expect(review.errors).toContain('INVALID_OR_CROSS_SOURCE_AUDIT');
    expect(review.errors).toContain('INVALID_AUDIT_RECORD');
  });
  it('flags future, snapshot-newer-than-now and stale evidence',()=>{
    const first=forSource('yw')[0];
    const future=reviewQl409AuditDecisions('yw',[{...first,
      observedAt:'2026-11-10T19:00:00.000Z'}],now);
    expect(future.errors).toContain('DUPLICATE_OR_INVALID_TIME');
    const stale=reviewQl409AuditDecisions('yw',[first],now+2*86400000,QL409_DEMO_CAPTURED);
    expect(stale.errors).toContain('STALE_REVIEW_SNAPSHOT');
    expect(stale.worklist[0].priority).toBe('REFRESH_STALE_EVIDENCE');
    expect(reviewQl409AuditDecisions('yw',[first],now-86400000).stale).toBe(true);
  });
  it('prioritizes rejected review and never enables receiver',()=>{
    const review=reviewQl409AuditDecisions('icamp',forSource('icamp'),now);
    expect(review.worklist[0].priority).toBe('REVIEW_NOW');
    expect(review.receiverEnabled).toBe(false);
    expect(review.oneTestAuthorized).toBe(false);
  });
});
