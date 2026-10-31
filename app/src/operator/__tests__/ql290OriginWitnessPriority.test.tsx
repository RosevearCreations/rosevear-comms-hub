// @vitest-environment jsdom
import {act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {Ql290OriginWitnessPriority} from '../Ql290OriginWitnessPriority';
import {QL270_SOURCES} from '../ql270ConnectionCentre';
import {QL289_OBSERVED_AT,QL289_PUBLIC_SOURCE_RECHECK,
  type Ql289ReviewerChallenge,type Ql289WitnessClosureReadiness,
  type Ql289ReceiptAgingFollowup} from '../ql289ProvenanceWitnessReceiptAging';
import {QL290_OBSERVED_AT,QL290_PUBLIC_SOURCE_RECHECK,QL290_ORIGIN_GATES,
  QL290_ATTESTATION_GATES,ql290PinnedProofUrl,ql290PriorityReport,
  ql290PrepareOrigin,ql290PrepareAttestation,ql290PreparePriority,ql290AuditPacket,
  type Ql290OriginReconciliation,type Ql290WitnessAttestation,type Ql290PriorityItem
} from '../ql290OriginWitnessPriority';

const at=(time:string)=>new Date(time);
const after=()=>at('2026-10-31T17:42:00Z');
function reviewerFixture():Ql289ReviewerChallenge{return {checkId:'keyboard',
  previousCase:'DECISION-287-CASE',reviewerCase:'REVIEWER-288-CASE',issuerCase:'ISSUER-288-CASE',
  challengeReference:'CHALLENGE-289-CASE',focus:'REVIEWER_RECEIPT_SOURCE_UNCORROBORATED',
  preparedAt:'2026-10-31T17:00:00Z',gatesOpen:7,authenticatedGates:0,
  issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',originalSignedReceipt:'NOT_RECEIVED',
  challengeIssued:false,originCorroborated:false,witnessVerified:false,ownerApproval:'NOT_GIVEN',
  accepted:false,state:'LOCAL_UNISSUED_PROVENANCE_CHALLENGE_MATRIX'};}
function witnessFixture(source:'yw'|'rosiedazzlers'='yw'):Ql289WitnessClosureReadiness{
  const p=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'PREFLIGHT-288-CASE',reference:'WITNESS-289-CASE',
    gap:'ORIGINAL_PROOF_STILL_ABSENT',priorSha:'0'.repeat(40),currentSha:p.sha,
    preparedAt:'2026-10-31T17:00:00Z',gatesOpen:6,authenticatedGates:0,
    original:'HTTP_404_AT_IMMUTABLE_PIN',custodian:'NOT_AUTHENTICATED',witness:'NOT_AUTHENTICATED',
    signature:'NOT_VERIFIED',chainCorroborated:false,ownerApproval:'NOT_GIVEN',
    closureApproved:false,originalAccepted:false,externalDelivery:false,
    state:'LOCAL_WITNESS_CLOSURE_READINESS_OPEN'};
}
function agingFixture(source:'yw'|'rosiedazzlers'='rosiedazzlers'):Ql289ReceiptAgingFollowup{
  const p=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'RECHECK-288-CASE',reference:'AGING-289-CASE',
    priorSha:'0'.repeat(40),currentSha:p.sha,moved:true,
    reason:'PIN_CHANGED_RECEIPT_NOT_RECEIVED',preparedAt:'2026-10-31T17:00:00Z',
    sourceOriginal:'HTTP_404_AT_IMMUTABLE_PIN',receipt:'NOT_RECEIVED',
    scheduled:false,sent:false,executed:false,originalAccepted:false,ownerApproval:'NOT_GIVEN',
    state:'LOCAL_UNSENT_EXCEPTION_RECEIPT_AGING_FOLLOWUP'};
}

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  localStorage.clear();host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const found=[...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(row=>row.textContent?.includes(label));if(!found)throw Error(`Missing button ${label}`);return found;}
function input(selector:string,value:string){const element=host.querySelector<HTMLInputElement>(selector)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));
  element.dispatchEvent(new Event('change',{bubbles:true}));}
async function seeded(){await act(async()=>root.unmount());root=createRoot(host);
  function Seeded(){const [origins,setOrigins]=useState<Ql290OriginReconciliation[]>([]);
    const [attestations,setAttestations]=useState<Ql290WitnessAttestation[]>([]);
    const [priorities,setPriorities]=useState<Ql290PriorityItem[]>([]);
    return <Ql290OriginWitnessPriority reviewerPredecessors={[reviewerFixture()]}
      witnessPredecessors={[witnessFixture()]} sourcePredecessors={[agingFixture()]}
      origins={origins} setOrigins={setOrigins} attestations={attestations}
      setAttestations={setAttestations} priorities={priorities} setPriorities={setPriorities}
      onOpenQl289={()=>{}} onOpenEvidence={()=>{}}/>;}
  await act(async()=>root.render(<Seeded/>));}

describe('QL-290 reviewer origin, original witness attestation and immutable exception priorities',()=>{
  it('uses six actually observed immutable main pins and six HTTP 404 public Proof-B paths',()=>{
    expect(at(QL290_OBSERVED_AT).getTime()).toBeGreaterThan(at(QL289_OBSERVED_AT).getTime());
    expect(QL290_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL290_PUBLIC_SOURCE_RECHECK.map(x=>x.source))).toEqual(new Set(QL270_SOURCES.map(x=>x.id)));
    for(const row of QL290_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);
      expect(row.http).toBe(404);expect(ql290PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);}
    expect(()=>ql290PinnedProofUrl('missing' as never)).toThrow('UNKNOWN_QL290_SOURCE');
    expect(ql290PriorityReport(QL290_OBSERVED_AT)).toMatchObject({changed:5,stable:1,missing:6,
      priorityP0:5,priorityP1:1,acceptedOriginals:0,authenticatedGatewayGETs:0,
      automaticPolling:false,integrationState:'DISCONNECTED / HOLD'});
  });
  it('ranks five drift exceptions as P0 and stable Yard Workers as P1, without treating pin changes as signatures',()=>{
    const report=ql290PriorityReport(after(),[agingFixture('rosiedazzlers')]);
    expect(report.rows.slice(0,5).every(row=>row.priority==='P0'&&row.moved&&row.http===404)).toBe(true);
    expect(report.rows[5]).toMatchObject({source:'yw',priority:'P1',moved:false,http:404,
      originalReceived:false,originalAccepted:false,authenticatedGatewayGET:false});
    expect(report.rows.find(row=>row.source==='rosiedazzlers')?.linkedPredecessors).toBe(1);
  });
  it('gives a 24-hour recheck time and distinguishes clock review without background GETs',()=>{
    expect(ql290PriorityReport(QL290_OBSERVED_AT)).toMatchObject({ageHours:0,
      freshness:'FRESH_IMMUTABLE_SNAPSHOT',nextRecheckAt:'2026-11-01T17:40:31.000Z'});
    expect(ql290PriorityReport('2026-11-01T17:40:31Z').freshness).toBe('RECHECK_DUE');
    expect(ql290PriorityReport('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql290PriorityReport('2026-10-31T17:39:00Z').ageHours).toBeNull();
  });
  it('retains all reviewer and witness attestation gates open',()=>{
    expect(QL290_ORIGIN_GATES).toHaveLength(7);expect(QL290_ATTESTATION_GATES).toHaveLength(6);
    expect(new Set(QL290_ORIGIN_GATES.map(x=>x.id)).size).toBe(7);
    expect(new Set(QL290_ATTESTATION_GATES.map(x=>x.id)).size).toBe(6);
  });
  it('reconciles only unissued QL-289 reviewer challenges and rejects forged authority',()=>{
    const old=reviewerFixture();const run=(row=old,ref='ORIGIN-290-CASE',reason='RECEIPT_ORIGIN_NOT_CORROBORATED',when=after())=>
      ql290PrepareOrigin(row,ref,reason as never,when);
    const result=run();expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({gatesOpen:7,authenticatedGates:0,challengeIssued:false,
      corroborated:false,independentDecisionAccepted:false,ownerApproval:'NOT_GIVEN',
      state:'LOCAL_UNVERIFIED_ORIGIN_RECONCILIATION'});
    expect(run({...old,challengeIssued:true as never}).ok).toBe(false);
    expect(run({...old,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...old,originCorroborated:true as never}).ok).toBe(false);
    expect(run({...old,accepted:true as never}).ok).toBe(false);
    expect(run(old,'ISSUER-288-CASE').ok).toBe(false);
    expect(run(old,'CHALLENGE-289-CASE').ok).toBe(false);
    expect(run(old,'token-private').ok).toBe(false);
    expect(run(old,'ORIGIN-290-CASE','ACCEPTED').ok).toBe(false);
    expect(run(old,'ORIGIN-290-CASE','RECEIPT_ORIGIN_NOT_CORROBORATED',at('2026-10-31T17:20:00Z')).ok).toBe(false);
  });
  it('keeps original Proof-B attestation local, missing and unapproved',()=>{
    const old=witnessFixture();const run=(row=old,ref='ATTEST-290-CASE',when=after())=>
      ql290PrepareAttestation(row,ref,'SIGNED_ORIGINAL_ABSENT',when);
    const result=run();expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',gatesOpen:6,authenticatedGates:0,
      attestation:'NOT_RECEIVED',original:'HTTP_404_AT_IMMUTABLE_PIN',closureApproved:false,
      externalDelivery:false,originalAccepted:false,state:'LOCAL_UNATTESTED_ORIGINAL_WITNESS_PREFLIGHT'});
    expect(run({...old,custodian:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...old,chainCorroborated:true as never}).ok).toBe(false);
    expect(run({...old,closureApproved:true as never}).ok).toBe(false);
    expect(run({...old,currentSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run(old,'WITNESS-289-CASE').ok).toBe(false);
    expect(run(old,'secret-private').ok).toBe(false);
    expect(run(old,'ATTEST-290-CASE',at('2026-10-31T17:00:00Z')).ok).toBe(false);
  });
  it('prepares only unsent QL-290 exception items and validates actual SHA drift priority',()=>{
    const old=agingFixture();const run=(row=old,ref='PRIORITY-290-CASE',reason='PIN_DRIFT_AND_ORIGINAL_ABSENT')=>
      ql290PreparePriority(row,ref,reason as never,after());
    const result=run();expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'rosiedazzlers',priority:'P0',scheduled:false,
      sent:false,executed:false,originalAccepted:false,ownerApproval:'NOT_GIVEN',
      state:'LOCAL_UNSENT_SOURCE_EXCEPTION_PRIORITY_ITEM'});
    expect(run(agingFixture('yw'),'PRIORITY-290-YW','PIN_DRIFT_AND_ORIGINAL_ABSENT').ok).toBe(false);
    const stable=run(agingFixture('yw'),'PRIORITY-290-YW','ORIGINAL_ABSENT_FOLLOWUP');
    expect(stable.ok).toBe(true);if(stable.ok)expect(stable.draft.priority).toBe('P1');
    expect(run(old,'PRIORITY-290-CASE','ORIGINAL_ABSENT_FOLLOWUP').ok).toBe(false);
    expect(run({...old,sent:true as never}).ok).toBe(false);
    expect(run({...old,ownerApproval:'GIVEN' as never}).ok).toBe(false);
    expect(run({...old,currentSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run(old,'AGING-289-CASE').ok).toBe(false);
    expect(run(old,'password-secret').ok).toBe(false);
  });
  it('holds ACK delivery Under Review with no authenticated GET, real calls or SMS',()=>{
    const packet=JSON.parse(ql290AuditPacket([],[],[],after()));
    expect(packet.ackDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',
      disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',
      originalsAccepted:0,authenticatedGETs:0,realCalls:0,sms:0,ownerTestApproval:false});
    expect(packet.reviewerOrigins).toMatchObject({authenticated:0,acceptedDecisions:0});
    expect(packet.witnessAttestation).toMatchObject({receivedOriginals:0,verifiedAttestations:0});
  });
  it('mounts from the IT command and shows priority-filtered public immutable sources',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer origins, witness attestation & six-app priority queue').click());
    expect(host.querySelector('[data-ql290-desk]')).not.toBeNull();
    expect(host.querySelectorAll('[aria-label="QL-290 immutable source priority ledger"] article')).toHaveLength(6);
    expect(host.querySelectorAll('[aria-label="QL-290 immutable source priority ledger"] a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    await act(async()=>button('P0 changed (5)').click());
    expect(host.querySelectorAll('[aria-label="QL-290 immutable source priority ledger"] article')).toHaveLength(5);
    await act(async()=>button('P1 stable (1)').click());
    expect(host.querySelectorAll('[aria-label="QL-290 immutable source priority ledger"] article')).toHaveLength(1);
    expect(host.textContent).toContain('Yard Workers');
    expect(button('Prepare unsent priority item').disabled).toBe(true);
    await act(async()=>button('02 Reviewer origin').click());
    expect(host.querySelectorAll('[aria-label="Seven unresolved reviewer origin reconciliation gates"]>div')).toHaveLength(7);
    expect(button('Prepare unverified origin comparison').disabled).toBe(true);
    await act(async()=>button('03 Witness attestation').click());
    expect(host.querySelectorAll('[aria-label="Six unmet original Proof-B witness attestation gates"]>div')).toHaveLength(6);
    expect(host.textContent).toContain('UNDER REVIEW');
  });
  it('records three seeded local items without sending, and clearing leaves source snapshot intact',async()=>{
    await seeded();
    await act(async()=>input('#ql290-priority-ref','PRIORITY-290-UI'));
    await act(async()=>button('Prepare unsent priority item').click());
    expect(host.textContent).toContain('Local exception priority recorded');
    await act(async()=>button('02 Reviewer origin').click());
    await act(async()=>input('#ql290-origin-ref','ORIGIN-290-UI'));
    await act(async()=>button('Prepare unverified origin comparison').click());
    expect(host.textContent).toContain('Unverified origin comparison prepared');
    await act(async()=>button('03 Witness attestation').click());
    await act(async()=>input('#ql290-witness-ref','ATTEST-290-UI'));
    await act(async()=>button('Prepare unresolved attestation preflight').click());
    expect(host.textContent).toContain('Original witness attestation preflight recorded');
    const packet=JSON.parse(host.querySelector<HTMLTextAreaElement>('#ql290-packet')!.value);
    expect(packet.localUnsentPriorityItems).toHaveLength(1);
    expect(packet.reviewerOrigins.origins).toHaveLength(1);
    expect(packet.witnessAttestation.witnesses).toHaveLength(1);
    await act(async()=>button('Clear QL-290 local drafts').click());
    expect(JSON.parse(host.querySelector<HTMLTextAreaElement>('#ql290-packet')!.value).localUnsentPriorityItems).toHaveLength(0);
    expect(host.textContent).toContain('public observations, QL-289 cases and parked ACK are unchanged');
  });
});
