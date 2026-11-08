import {describe,expect,it} from 'vitest';
import {OWNER_EVIDENCE_LABELS,ownerIncidentTriage,ownerTriageEvidence,ownerTriagePriority}
  from '../ql378OwnerIncidentTriage';
import type {OwnerIncidentObservation} from '../ql377OwnerIncidentHistory';

const NOW=Date.parse('2026-11-08T22:00:00Z');
const entry=(sequence:number,overrides:Partial<OwnerIncidentObservation>={}):OwnerIncidentObservation=>({
  sequence,key:'connections-held:information:Six shells held',category:'connection',severity:'information',
  title:'Six shells held',detail:'Protected aggregate, no independent source probes',
  nextStep:'Open protected refresh',firstSeenMs:NOW-sequence*30000,
  lastSeenMs:NOW-sequence*10000,noLongerShownMs:null,
  snapshotAt:new Date(NOW-30000).toISOString(),...overrides
});
const select=(entries:OwnerIncidentObservation[],overrides:Partial<Parameters<typeof ownerIncidentTriage>[1]>={})=>
  ownerIncidentTriage(entries,{nowMs:NOW,search:'',status:'all',severity:'all',groupRepeats:true,...overrides});

describe('QL-378 read-only search, grouping and evidence triage',()=>{
  it('groups repeated episodes while retaining every source observation',()=>{
    const history=[entry(1,{noLongerShownMs:NOW-20000}),entry(2),
      entry(3,{key:'security-stop:action:STOP',category:'security',severity:'action',title:'STOP'})];
    const original=structuredClone(history);
    const groups=select(history);
    expect(groups).toHaveLength(2);
    const repeated=groups.find(group=>group.latest.title==='Six shells held')!;
    expect(repeated.occurrences.map(x=>x.sequence)).toEqual([1,2]);
    expect(repeated.stillDisplayed).toBe(true);
    expect(repeated.priority).toBe('monitor');
    expect(select(history,{groupRepeats:false})).toHaveLength(3);
    expect(history).toEqual(original);
  });
  it('searches safe text case-insensitively and applies status and severity',()=>{
    const history=[entry(1,{noLongerShownMs:NOW-20000}),
      entry(2,{key:'security-stop',category:'security',severity:'action',title:'Owner STOP',detail:'Audit mismatch',nextStep:'Review signing evidence'})];
    expect(select(history,{search:'SIGNING'}).map(x=>x.latest.title)).toEqual(['Owner STOP']);
    expect(select(history,{search:'no independent'})).toHaveLength(1);
    expect(select(history,{status:'ended'}).map(x=>x.latest.sequence)).toEqual([1]);
    expect(select(history,{severity:'action'}).map(x=>x.latest.sequence)).toEqual([2]);
    expect(select(history,{search:'not present'})).toEqual([]);
  });
  it('distinguishes aggregate recency, expiry and clock discrepancy without source verification',()=>{
    expect(ownerTriageEvidence(new Date(NOW-20000).toISOString(),NOW)).toBe('recent');
    expect(ownerTriageEvidence(new Date(NOW-90000).toISOString(),NOW)).toBe('expiring');
    expect(ownerTriageEvidence(new Date(NOW-120001).toISOString(),NOW)).toBe('expired');
    expect(ownerTriageEvidence(new Date(NOW+11000).toISOString(),NOW)).toBe('clock-review');
    expect(ownerTriageEvidence('invalid',NOW)).toBe('unavailable');
    expect(OWNER_EVIDENCE_LABELS.recent).toContain('not independently source-verified');
    expect(OWNER_EVIDENCE_LABELS.expired).toContain('Historical');
  });
  it('puts unverified active evidence first but never calls ended alerts resolved',()=>{
    const stale=entry(1,{snapshotAt:new Date(NOW-180000).toISOString()});
    const actionable=entry(2,{key:'security-stop',category:'security',severity:'action',title:'STOP'});
    const ended=entry(3,{key:'security-ended',category:'security',severity:'action',title:'Past STOP',noLongerShownMs:NOW-10000});
    const groups=select([ended,actionable,stale]);
    expect(groups.map(x=>x.priority)).toEqual(['verify-evidence','action','historical']);
    expect(ownerTriagePriority(ended,'recent')).toBe('historical');
    expect(ownerTriagePriority(stale,'clock-review')).toBe('verify-evidence');
    expect(groups.every(x=>x.occurrences.length>0)).toBe(true);
  });
});
