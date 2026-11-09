import {beforeAll,describe,expect,it} from 'vitest';
import {QL388_EXAMPLE_EVENT,type CrossAppIntake} from '../ql388CrossAppIntake';
import {ql389CanonicalIntakeBytes,type QL389Scenario} from '../ql389SignedIntakePreview';
import {simulateIncidentIntakeLedger,type QL390Candidate} from '../ql390IncidentSimulationLedger';
import {buildIncidentCorrelationPreview,QL391_EVIDENCE_FRESH_MS,
  QL391_MAX_EVIDENCE_OBSERVATIONS,type QL391EvidenceObservation} from '../ql391IncidentCorrelationPreview';

const SIGNED_AT=Date.parse('2026-11-08T00:00:30Z');
const EVIDENCE_NOW=Date.parse('2026-11-08T00:12:00Z');
const b64=(bytes:ArrayBuffer)=>Buffer.from(bytes).toString('base64url');
let scenario:QL389Scenario;
let keys:Record<string,CryptoKeyPair>;
const event=(sourceId:string,id:string,occurredAt:string,correlationId='correlation-ql391-shared'):CrossAppIntake=>({
  ...QL388_EXAMPLE_EVENT,sourceId,messageId:`message-ql391-${id}`,
  idempotencyKey:`dedupe-ql391-${id}`,correlationId,occurredAt,
  evidenceRefs:['release:QL391DEMO0001']
});
async function signed(value:CrossAppIntake):Promise<QL390Candidate>{
  return {event:value,proof:{algorithm:'Ed25519',keyId:`synthetic-${value.sourceId}-key`,
    signatureBase64Url:b64(await crypto.subtle.sign('Ed25519',keys[value.sourceId].privateKey,ql389CanonicalIntakeBytes(value)))}};
}
const readback=(sourceId:string,checkedAt:string|null,state:'PRESENT'|'MISSING'='PRESENT',
  correlationId='correlation-ql391-shared'):QL391EvidenceObservation=>({sourceId,correlationId,state,checkedAt});

beforeAll(async()=>{
  keys={yw:await crypto.subtle.generateKey('Ed25519',true,['sign','verify']),
    icamp:await crypto.subtle.generateKey('Ed25519',true,['sign','verify'])};
  scenario={nowMs:SIGNED_AT,pins:await Promise.all(Object.entries(keys).map(async([sourceId,pair])=>({
    sourceId,keyId:`synthetic-${sourceId}-key`,
    publicKeySpkiBase64Url:b64(await crypto.subtle.exportKey('spki',pair.publicKey))
  }))),routes:['yw','icamp'].map(sourceId=>({sourceId,destinationId:'rosevear-comms-hub' as const,
    kinds:['incident' as const],categories:['integration' as const]})),
  sourceOwnerDecision:'SIMULATED_APPROVED',masterOwnerDecision:'SIMULATED_APPROVED',
  receiverEnrollment:'SIMULATED_READY',previouslySeenMessageIds:[],previouslySeenIdempotencyKeys:[]};
});

describe('QL-391 read-only synthetic incident correlation and evidence freshness',()=>{
  it('groups two signed sources by opaque correlation and sorts by event time, not submission order',async()=>{
    const later=event('icamp','0002','2026-11-08T00:00:10Z');
    const earlier=event('yw','0001','2026-11-08T00:00:00Z');
    const ledger=await simulateIncidentIntakeLedger([await signed(later),
      {event:{...later,correlationId:'private-malformed'},proof:null},await signed(earlier)],scenario);
    expect(ledger.rows[1]).toMatchObject({state:'HELD',occurredAt:'REDACTED',correlationId:'REDACTED'});
    const preview=buildIncidentCorrelationPreview(ledger,[
      readback('yw','2026-11-08T00:11:00Z'),readback('icamp','2026-11-08T00:00:00Z')],EVIDENCE_NOW);
    expect(preview).toMatchObject({state:'INERT_PREVIEW',heldUnverified:1});
    expect(preview.groups).toHaveLength(1);
    expect(preview.groups[0].sourceIds).toEqual(['icamp','yw']);
    expect(preview.groups[0].timeline.map(item=>item.sourceId)).toEqual(['yw','icamp']);
    expect(preview.groups[0].timeline.map(item=>item.sequence)).toEqual([3,1]);
    expect(preview.groups[0].timeline.map(item=>item.evidenceFreshness)).toEqual(['CURRENT_SIMULATED','STALE']);
    expect(preview.groups[0].overallFreshness).toBe('STALE');
    expect(JSON.stringify(preview)).not.toContain('private-malformed');
    expect(preview.reason).toContain('no incident merged');
  });

  it('does not conflate correlation IDs or different sources, and retains duplicate timeline states',async()=>{
    const first=event('yw','0003','2026-11-08T00:00:00Z','correlation-ql391-first');
    const second=event('icamp','0004','2026-11-08T00:00:15Z','correlation-ql391-second');
    const ledger=await simulateIncidentIntakeLedger([
      await signed(first),await signed(first),await signed(second)],scenario);
    const preview=buildIncidentCorrelationPreview(ledger,[],EVIDENCE_NOW);
    expect(preview.groups).toHaveLength(2);
    expect(preview.groups.map(group=>group.correlationId)).toEqual(['correlation-ql391-second','correlation-ql391-first']);
    expect(preview.groups[1].timeline.map(item=>item.eventState)).toEqual(['PREVIEW_NEW','PREVIEW_DUPLICATE']);
    expect(preview.groups.every(group=>group.overallFreshness==='UNKNOWN')).toBe(true);
    expect(preview.groups.every(group=>group.sourceIds.length===1)).toBe(true);
  });

  it('fails evidence readback closed on duplicates, missing, invalid, stale and future observations',async()=>{
    const ledger=await simulateIncidentIntakeLedger([await signed(event('yw','0005','2026-11-08T00:00:00Z'))],scenario);
    const freshness=(observations:QL391EvidenceObservation[])=>
      buildIncidentCorrelationPreview(ledger,observations,EVIDENCE_NOW).groups[0].overallFreshness;
    expect(freshness([])).toBe('UNKNOWN');
    expect(freshness([readback('yw',null,'MISSING')])).toBe('MISSING');
    expect(freshness([readback('yw','not-a-time')])).toBe('INVALID');
    expect(freshness([readback('yw','2026-11-08T00:13:01Z')])).toBe('INVALID');
    expect(freshness([readback('yw','2026-11-08T00:01:59Z')])).toBe('STALE');
    expect(freshness([readback('yw','2026-11-08T00:02:00Z')])).toBe('CURRENT_SIMULATED');
    expect(freshness([readback('yw','2026-11-08T00:12:00Z'),readback('yw','2026-11-08T00:12:00Z')])).toBe('CONFLICT');
    expect(freshness([readback('icamp','2026-11-08T00:12:00Z'),
      readback('yw','2026-11-08T00:12:00Z','PRESENT','correlation-ql391-unrelated')])).toBe('UNKNOWN');
    expect(QL391_EVIDENCE_FRESH_MS).toBe(600_000);
  });

  it('holds malformed ledgers, unbounded observations and invalid clocks without creating timelines',async()=>{
    const ledger=await simulateIncidentIntakeLedger([await signed(event('yw','0006','2026-11-08T00:00:00Z'))],scenario);
    expect(buildIncidentCorrelationPreview(ledger,[],Number.NaN)).toMatchObject({state:'HOLD',groups:[]});
    expect(buildIncidentCorrelationPreview(ledger,Array(QL391_MAX_EVIDENCE_OBSERVATIONS+1).fill(readback('yw',null)),EVIDENCE_NOW))
      .toMatchObject({state:'HOLD',groups:[]});
    expect(buildIncidentCorrelationPreview({...ledger,state:'REJECTED_BATCH'},[],EVIDENCE_NOW))
      .toMatchObject({state:'HOLD',groups:[]});
    expect(buildIncidentCorrelationPreview({...ledger,rows:[{...ledger.rows[0],occurredAt:'bad'}]},[],EVIDENCE_NOW))
      .toMatchObject({state:'HOLD',groups:[]});
    expect(buildIncidentCorrelationPreview(ledger,[null as unknown as QL391EvidenceObservation],EVIDENCE_NOW))
      .toMatchObject({state:'HOLD',groups:[]});
  });
});
