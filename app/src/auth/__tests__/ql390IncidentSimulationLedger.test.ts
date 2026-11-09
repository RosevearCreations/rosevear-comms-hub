import {beforeAll,describe,expect,it} from 'vitest';
import {QL388_EXAMPLE_EVENT,type CrossAppIntake} from '../ql388CrossAppIntake';
import {ql389CanonicalIntakeBytes,type QL389Scenario} from '../ql389SignedIntakePreview';
import {QL390_MAX_SIMULATION_EVENTS,simulateIncidentIntakeLedger,type QL390Candidate} from '../ql390IncidentSimulationLedger';

const NOW=Date.parse('2026-11-08T00:00:30Z');
const b64=(bytes:ArrayBuffer)=>Buffer.from(bytes).toString('base64url');
let scenario:QL389Scenario;
let keys:Record<string,CryptoKeyPair>;
const evt=(sourceId:string,messageId:string,idempotencyKey:string,eventCode='SOURCE_HEALTH_STALE'):CrossAppIntake=>({
  ...QL388_EXAMPLE_EVENT,sourceId,messageId,idempotencyKey,eventCode,
  correlationId:`correlation-${sourceId}-ql390`,evidenceRefs:['release:QL390DEMO0001']
});
async function signed(event:CrossAppIntake):Promise<QL390Candidate>{
  return {event,proof:{algorithm:'Ed25519',keyId:`synthetic-${event.sourceId}-key`,
    signatureBase64Url:b64(await crypto.subtle.sign('Ed25519',keys[event.sourceId].privateKey,ql389CanonicalIntakeBytes(event)))}};
}
beforeAll(async()=>{
  keys={yw:await crypto.subtle.generateKey('Ed25519',true,['sign','verify']),
    icamp:await crypto.subtle.generateKey('Ed25519',true,['sign','verify'])};
  scenario={nowMs:NOW,pins:await Promise.all(Object.entries(keys).map(async([sourceId,pair])=>({
    sourceId,keyId:`synthetic-${sourceId}-key`,
    publicKeySpkiBase64Url:b64(await crypto.subtle.exportKey('spki',pair.publicKey))
  }))),routes:['yw','icamp'].map(sourceId=>({sourceId,destinationId:'rosevear-comms-hub' as const,
    kinds:['incident' as const],categories:['integration' as const]})),
  sourceOwnerDecision:'SIMULATED_APPROVED',masterOwnerDecision:'SIMULATED_APPROVED',
  receiverEnrollment:'SIMULATED_READY',previouslySeenMessageIds:[],previouslySeenIdempotencyKeys:[]};
});

describe('QL-390 non-persistent cross-application incident simulation ledger',()=>{
  it('distinguishes new, repeated and conflicting signed source-scoped events',async()=>{
    const first=evt('yw','message-ql390-0001','dedupe-ql390-0001');
    const conflicting=evt('yw','message-ql390-0001','dedupe-ql390-0001','SOURCE_ROUTE_DRIFT');
    const result=await simulateIncidentIntakeLedger([await signed(first),await signed(first),await signed(conflicting)],scenario);
    expect(result.rows.map(row=>row.state)).toEqual(['PREVIEW_NEW','PREVIEW_DUPLICATE','PREVIEW_CONFLICT']);
    expect(result.counts).toEqual({newEvents:1,duplicates:1,conflicts:1,held:0});
    expect(result.reason).toContain('No trusted replay ledger');
  });
  it('never cross-deduplicates identical IDs for distinct registered sources',async()=>{
    const sameId='message-ql390-0001',sameKey='dedupe-ql390-0001';
    const result=await simulateIncidentIntakeLedger([
      await signed(evt('yw',sameId,sameKey)),await signed(evt('icamp',sameId,sameKey))
    ],scenario);
    expect(result.rows.map(row=>row.state)).toEqual(['PREVIEW_NEW','PREVIEW_NEW']);
    expect(result.rows.map(row=>row.sourceId)).toEqual(['yw','icamp']);
  });
  it('holds malformed, unsigned, prior-replay and unauthorized cases without leaking claims',async()=>{
    const good=evt('yw','message-ql390-0002','dedupe-ql390-0002');
    const result=await simulateIncidentIntakeLedger([
      {event:{...good,customerEmail:'private@example.com'},proof:null},
      {event:good,proof:null},
      await signed(good)
    ],{...scenario,previouslySeenIdempotencyKeys:['yw:dedupe-ql390-0002']});
    expect(result.rows.map(row=>row.state)).toEqual(['HELD','HELD','HELD']);
    expect(result.rows.map(row=>row.stage)).toEqual(['ENVELOPE','SIGNATURE','REPLAY']);
    for(const row of result.rows){
      expect(row.sourceId).toBe('UNVERIFIED');
      expect(row.correlationId).toBe('REDACTED');
      expect(row.explanation).not.toContain('private@example.com');
    }
    const held=await simulateIncidentIntakeLedger([await signed(good)],{...scenario,masterOwnerDecision:'HOLD'});
    expect(held.rows[0]).toMatchObject({state:'HELD',stage:'POLICY'});
  });
  it('processes only bounded batches and never retains state across separate calls',async()=>{
    const candidate=await signed(evt('yw','message-ql390-0003','dedupe-ql390-0003'));
    const first=await simulateIncidentIntakeLedger([candidate],scenario);
    const next=await simulateIncidentIntakeLedger([candidate],scenario);
    expect(first.rows[0].state).toBe('PREVIEW_NEW');
    expect(next.rows[0].state).toBe('PREVIEW_NEW');
    expect((await simulateIncidentIntakeLedger(Array(QL390_MAX_SIMULATION_EVENTS+1).fill(candidate),scenario)))
      .toMatchObject({state:'REJECTED_BATCH',rows:[]});
    expect(scenario.previouslySeenMessageIds).toHaveLength(0);
  });
});
