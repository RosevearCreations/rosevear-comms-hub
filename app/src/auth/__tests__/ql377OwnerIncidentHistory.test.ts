import {describe,expect,it} from 'vitest';
import {EMPTY_OWNER_HISTORY,MAX_OWNER_INCIDENT_HISTORY,incidentAgeLabel,
  observeOwnerIncidents,ownerIncidentResolutionGuidance} from '../ql377OwnerIncidentHistory';
import type {OwnerIncident,OwnerFreshness} from '../ql376OwnerIncidents';

const NOW=Date.parse('2026-11-08T20:00:00Z');
const freshness:OwnerFreshness={kind:'current',label:'Recent protected readback',
  ageSeconds:10,observedAt:new Date(NOW-10000).toISOString()};
const incident:OwnerIncident={id:'connections-held',category:'connection',severity:'information',
  title:'Six application shells held',detail:'Protected aggregate, not six pings',
  nextStep:'Review the read-only catalogue'};
const capture=(previous=EMPTY_OWNER_HISTORY,nowMs=NOW,incidents:OwnerIncident[]=[incident],
  override:Partial<Parameters<typeof observeOwnerIncidents>[1]>={})=>observeOwnerIncidents(previous,{
  role:'source',aal2:true,freshness,incidents,nowMs,...override
});

describe('QL-377 memory-only owner observation timeline',()=>{
  it('retains one continuous observation with real elapsed age across clock ticks',()=>{
    const first=capture();
    const later=capture(first,NOW+75000);
    expect(later.observations).toHaveLength(1);
    expect(later.observations[0]).toMatchObject({firstSeenMs:NOW,lastSeenMs:NOW+75000,
      noLongerShownMs:null,sequence:1});
    expect(incidentAgeLabel(NOW,NOW+75000)).toBe('1 minute');
  });
  it('records display transitions without declaring resolution',()=>{
    const first=capture();
    const expired={...incident,id:'freshness-expired',category:'freshness' as const,
      severity:'action' as const,title:'Expired — refresh required'};
    const later=capture(first,NOW+130000,[expired]);
    expect(later.observations).toHaveLength(2);
    expect(later.observations[0].noLongerShownMs).toBe(NOW+130000);
    expect(later.observations[1].noLongerShownMs).toBeNull();
    expect(ownerIncidentResolutionGuidance(later.observations[1])).toContain('Refresh');
    const returning=capture(later,NOW+145000,[incident]);
    expect(returning.observations).toHaveLength(3);
    expect(returning.observations[2].sequence).toBe(3);
  });
  it('clears on lost MFA or another owner role and rejects unverified snapshots',()=>{
    const first=capture();
    expect(capture(first,NOW+1000,[incident],{aal2:false})).toEqual(EMPTY_OWNER_HISTORY);
    const other=capture(first,NOW+1000,[incident],{role:'master'});
    expect(other.role).toBe('master');
    expect(other.observations[0].sequence).toBe(1);
    expect(capture(first,NOW+1000,[incident],{role:'master',freshness:{...freshness,kind:'unknown',observedAt:null}}).observations).toEqual([]);
    expect(capture(first,NOW+1000,[incident],{freshness:{...freshness,kind:'unknown',observedAt:null}})).toBe(first);
  });
  it('retains at most forty observations without silently recycling sequence identities',()=>{
    let state=EMPTY_OWNER_HISTORY;
    for(let i=0;i<MAX_OWNER_INCIDENT_HISTORY+7;i++){
      state=capture(state,NOW+i*1000,[{...incident,id:`warning-${i}`,title:`Observation ${i}`}]);
    }
    expect(state.observations).toHaveLength(MAX_OWNER_INCIDENT_HISTORY);
    expect(state.observations.at(-1)?.sequence).toBe(MAX_OWNER_INCIDENT_HISTORY+7);
    expect(state.observations[0].sequence).toBe(8);
  });
  it('offers only category-specific non-authorizing next steps',()=>{
    const x=capture().observations[0];
    expect(ownerIncidentResolutionGuidance(x)).toContain('independent source authorization');
    expect(ownerIncidentResolutionGuidance({...x,category:'security'})).toContain('Stop');
    expect(ownerIncidentResolutionGuidance({...x,category:'freshness'})).toContain('Refresh');
    expect(incidentAgeLabel(NOW,NOW-100)).toBe('0 seconds');
  });
});
