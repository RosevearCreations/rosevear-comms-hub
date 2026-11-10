import {describe,expect,it} from 'vitest';
import {QL375_SHELLS} from '../ql375OwnerStatus';
import {QL409_DEMO_EVENTS} from '../ql409AuditDecisionReview';
import {buildQl410DecisionExport,reviewQl410HostObservation}
  from '../ql410MasterContinuity';

const now=Date.parse('2026-11-10T16:00:00.000Z');
const heartbeat={sourceId:'rosevear-ai-hub',hostId:'DESKTOP-AE894KC',
  observedAt:'2026-11-10T15:59:30.000Z',service:'hub_api_8765',
  reachable:true,latencyMs:18,observationId:'observation_001'};

describe('QL-410 owner exports and host monitoring are non-authorizing',()=>{
  it('keeps every source UNKNOWN with no original host observations',()=>{
    for(const source of QL375_SHELLS){
      expect(reviewQl410HostObservation(source.id,null,now)).toMatchObject({
        status:'UNKNOWN',uptimePercent:null,receiverEnabled:false,
        oneTestAuthorized:false,connection:'HOLD'});
    }
  });
  it('flags source mismatch, host substitution, extra secrets and malformed clocks',()=>{
    for(const payload of [
      {...heartbeat,sourceId:'yw'},
      {...heartbeat,hostId:'TEMPLAR'},
      {...heartbeat,secret:'do-not-export'},
      {...heartbeat,observedAt:'2026-11-10T17:00:00.000Z'},
      {...heartbeat,latencyMs:-1}
    ]){
      const result=reviewQl410HostObservation('rosevear-ai-hub',payload,now);
      expect(result.status).toBe('UNKNOWN');
      expect(result.oneTestAuthorized).toBe(false);
    }
  });
  it('distinguishes observed reachability, downtime and staleness without inventing uptime',()=>{
    expect(reviewQl410HostObservation('rosevear-ai-hub',heartbeat,now)).toMatchObject({
      status:'UP',reason:'UNATTESTED_LOCAL_OBSERVATION',uptimePercent:null});
    expect(reviewQl410HostObservation('rosevear-ai-hub',
      {...heartbeat,reachable:false},now).status).toBe('DOWN');
    expect(reviewQl410HostObservation('rosevear-ai-hub',heartbeat,now+600000).status)
      .toBe('STALE');
  });
  it('exports only source-scoped, minimal demo data without role, reference or credentials',()=>{
    const exportData=buildQl410DecisionExport('yw',QL409_DEMO_EVENTS,now,
      '2026-11-10T15:00:00.000Z');
    expect(exportData).toMatchObject({sourceId:'yw',connection:'HOLD',receiver:'OFF',
      oneTestAuthorized:false,hostMonitoring:'UNKNOWN'});
    expect(exportData.timeline.every(item=>item.sourceId==='yw')).toBe(true);
    const serialized=JSON.stringify(exportData);
    expect(serialized).not.toContain('demo_ref_');
    expect(serialized).not.toContain('actorRole');
    expect(serialized).not.toContain('INDEPENDENT_REVIEWER');
    expect(serialized).not.toContain('demo_ql409_icamp');
  });
  it('never promotes tainted audit input into a trusted export',()=>{
    const exportData=buildQl410DecisionExport('icamp',[
      {...QL409_DEMO_EVENTS[0],secret:'injected'}],now,
      '2026-11-10T15:00:00.000Z');
    expect(exportData.timeline).toHaveLength(0);
    expect(exportData.status).toBe('UNVERIFIED');
    expect(exportData.exceptions).toContain('INVALID_OR_CROSS_SOURCE_AUDIT');
  });
});
