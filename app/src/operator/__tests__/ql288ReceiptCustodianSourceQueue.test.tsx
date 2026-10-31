// @vitest-environment jsdom
import {act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {Ql288ReceiptCustodianSourceQueue} from '../Ql288ReceiptCustodianSourceQueue';
import {QL270_SOURCES} from '../ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from '../ql282IssuerPublicationReview';
import {QL286_PUBLIC_SOURCE_RECHECK} from '../ql286AuthorityOutcomeConflictAging';
import {QL287_OBSERVED_AT,QL287_PUBLIC_SOURCE_RECHECK,
  type Ql287DecisionReadback,type Ql287CustodianQueue,type Ql287DriftFollowup} from '../ql287DecisionCustodianDrift';
import {QL288_OBSERVED_AT,QL288_PUBLIC_SOURCE_RECHECK,QL288_REVIEWER_GAPS,
  QL288_CUSTODIAN_PREFLIGHT_GAPS,ql288PinnedProofUrl,ql288ImmutableExceptions,
  ql288PrepareReviewerIndependence,ql288PrepareCustodianResolution,
  ql288PrepareImmutableQueue,ql288AuditPacket,
  type Ql288ReviewerIndependenceAudit,type Ql288CustodianResolutionPreflight,
  type Ql288ImmutableExceptionQueue} from '../ql288ReceiptCustodianSourceQueue';

const at=(value:string)=>new Date(value);
function decisionFixture():Ql287DecisionReadback{return {checkId:'keyboard',previousCase:'OUTCOME-286-CASE',
  reference:'DECISION-287-CASE',priorOutcome:'AUTHORITY_CHAIN_UNCORROBORATED',
  claimedEvidence:'CLAIMED_ISSUER_DECISION_REFERENCE',preparedAt:'2026-10-31T15:20:00Z',
  independentDecision:'NOT_RECEIVED',originalSignature:'NOT_VERIFIED',issuer:'NOT_AUTHENTICATED',
  reviewer:'NOT_AUTHENTICATED',ownerApproval:'NOT_GIVEN',corroborated:false,accepted:false,
  disposition:'REFERENCE_READBACK_ONLY',state:'LOCAL_UNATTESTED_DECISION_REVIEW'};}
function custodyFixture(source:'rosiedazzlers'|'yw'='rosiedazzlers'):Ql287CustodianQueue{
  const prior=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  const latest=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'CONFLICT-286-CASE',reference:'CUSTODY-287-CASE',
    priorConflict:'ORIGINAL_CUSTODY_RECEIPT_MISSING',queueReason:'ORIGINAL_ARTIFACT_STILL_MISSING',
    previousSha:prior.sha,latestSha:latest.sha,preparedAt:'2026-10-31T15:20:00Z',
    original:'HTTP_404_AT_IMMUTABLE_PIN',custodian:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',
    queuedExternally:false,delivered:false,resolved:false,disposition:'CUSTODIAN_CONFLICT_OPEN',
    state:'LOCAL_UNSENT_DISPOSITION_QUEUE'};
}
function refreshFixture(source:'rosiedazzlers'|'yw'='rosiedazzlers'):Ql287DriftFollowup{
  const prior=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  const current=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'AGING-286-CASE',reference:'REFRESH-287-CASE',priorSha:prior.sha,
    currentSha:current.sha,sourceMoved:String(prior.sha)!==String(current.sha),preparedAt:'2026-10-31T15:20:00Z',
    original:'HTTP_404_AT_IMMUTABLE_PIN',scheduled:false,executed:false,originalAccepted:false,
    state:'LOCAL_SOURCE_REFRESH_FOLLOWUP_PENDING'};
}

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const found=[...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(element=>element.getAttribute('aria-label')===label||element.textContent?.includes(label));
  if(!found)throw Error(`Missing button ${label}`);return found;}
function input(selector:string,value:string){const target=host.querySelector<HTMLInputElement>(selector)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(target,value);
  target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}
async function renderSeeded(){await act(async()=>root.unmount());root=createRoot(host);
  function Seeded(){const [reviewerAudits,setReviewerAudits]=useState<Ql288ReviewerIndependenceAudit[]>([]);
    const [custodianPreflights,setCustodianPreflights]=useState<Ql288CustodianResolutionPreflight[]>([]);
    const [immutableQueue,setImmutableQueue]=useState<Ql288ImmutableExceptionQueue[]>([]);
    return <Ql288ReceiptCustodianSourceQueue decisionReadbacks={[decisionFixture()]}
      custodianDispositions={[custodyFixture('yw')]} sourceRefreshes={[refreshFixture('yw')]}
      reviewerAudits={reviewerAudits} setReviewerAudits={setReviewerAudits}
      custodianPreflights={custodianPreflights} setCustodianPreflights={setCustodianPreflights}
      immutableQueue={immutableQueue} setImmutableQueue={setImmutableQueue}
      onOpenQl287={()=>{}} onOpenEvidence={()=>{}}/>;}
  await act(async()=>root.render(<Seeded/>));}

describe('QL-288 independent receipt, original custody and public source exceptions',()=>{
  it('pins six actual fresh public main SHAs with 5 changed, 1 stable and 6 original HTTP 404s',()=>{
    expect(QL288_OBSERVED_AT).toBe('2026-10-31T16:10:03Z');
    expect(at(QL288_OBSERVED_AT).getTime()).toBeGreaterThan(at(QL287_OBSERVED_AT).getTime());
    expect(QL288_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL288_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL288_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[a-f0-9]{40}$/);
      expect(row.http).toBe(404);expect(ql288PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);}
    expect(()=>ql288PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL288_SOURCE');
    expect(ql288ImmutableExceptions(QL288_OBSERVED_AT)).toMatchObject({moved:5,unchanged:1,
      missing:6,sources:6,acceptedOriginals:0,authenticatedGatewayGETs:0,
      automaticPolling:false,integrationState:'DISCONNECTED / HOLD'});
  });
  it('preserves unchanged Yard Workers exception and labels every still-missing original',()=>{
    const {rows}=ql288ImmutableExceptions('2026-10-31T16:11:00Z',[refreshFixture('yw')]);
    expect(rows.filter(row=>row.moved)).toHaveLength(5);
    expect(rows.find(row=>row.source==='yw')).toMatchObject({moved:false,reason:'PIN_STABLE_ORIGINAL_MISSING',
      linkedDrafts:1,exception:'PUBLICATION_EXCEPTION_OPEN',http:404,originalAccepted:false,
      independentOriginVerified:false,authenticatedGatewayGET:false});
    expect(rows.filter(row=>!row.moved).map(row=>row.source)).toEqual(['yw']);
  });
  it('requires a new recheck when snapshot age reaches 24 hours',()=>{
    expect(ql288ImmutableExceptions('2026-10-31T16:12:00Z')).toMatchObject({ageHours:0,
      freshness:'FRESH_PUBLIC_RECHECK',nextRecheckAt:'2026-11-01T16:10:03.000Z'});
    expect(ql288ImmutableExceptions('2026-11-01T16:10:03Z').freshness).toBe('RECHECK_DUE');
    expect(ql288ImmutableExceptions('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql288ImmutableExceptions('2026-10-31T16:09:00Z').ageHours).toBeNull();
  });
  it('prepares a reviewer receipt independence gap audit with two distinct unverified references',()=>{
    expect(QL288_REVIEWER_GAPS).toHaveLength(3);
    const result=ql288PrepareReviewerIndependence(decisionFixture(),'REVIEWER-288-CASE',
      'ISSUER-288-CASE','INDEPENDENT_REVIEWER_RECEIPT_ABSENT',at('2026-10-31T16:12:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',reviewerReceipt:'NOT_RECEIVED',
      issuerAuthority:'NOT_AUTHENTICATED',independentIdentity:'NOT_ESTABLISHED',
      originalAccepted:false,decisionAccepted:false,externalReviewExecuted:false,
      ownerApproval:'NOT_GIVEN',state:'LOCAL_INDEPENDENCE_GAP_AUDIT_ONLY'});
  });
  it('rejects claimed authentic signature, forged decision, duplicate references, secrets and stale times',()=>{
    const prev=decisionFixture();const run=(row:typeof prev,r='REVIEWER-288-CASE',
      i='ISSUER-288-CASE',g='INDEPENDENT_REVIEWER_RECEIPT_ABSENT',when='2026-10-31T16:12:00Z')=>
      ql288PrepareReviewerIndependence(row,r,i,g as never,at(when));
    expect(run({...prev,accepted:true as never}).ok).toBe(false);
    expect(run({...prev,independentDecision:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prev,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...prev,originalSignature:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prev,claimedEvidence:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prev,ownerApproval:'GIVEN' as never}).ok).toBe(false);
    expect(run(prev,'REVIEWER-288-CASE','reviewer-288-case').ok).toBe(false);
    expect(run(prev,'DECISION-287-CASE').ok).toBe(false);
    expect(run(prev,'REVIEWER-288-CASE','OUTCOME-286-CASE').ok).toBe(false);
    expect(run(prev,'token-private').ok).toBe(false);
    expect(run(prev,'bad').ok).toBe(false);
    expect(run(prev,'REVIEWER-288-CASE','ISSUER-288-CASE','APPROVED').ok).toBe(false);
    expect(run(prev,'REVIEWER-288-CASE','ISSUER-288-CASE','INDEPENDENT_REVIEWER_RECEIPT_ABSENT','2026-10-31T16:09:00Z').ok).toBe(false);
    expect(run(prev,'REVIEWER-288-CASE','ISSUER-288-CASE','INDEPENDENT_REVIEWER_RECEIPT_ABSENT','invalid').ok).toBe(false);
  });
  it('preflights an original custody resolution with missing-signature and witness gates still open',()=>{
    expect(QL288_CUSTODIAN_PREFLIGHT_GAPS).toHaveLength(3);
    const result=ql288PrepareCustodianResolution(custodyFixture('yw'),'PREFLIGHT-288-CASE',
      'ORIGINAL_SIGNED_ARTIFACT_ABSENT',at('2026-10-31T16:12:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',original:'HTTP_404_AT_IMMUTABLE_PIN',
      custodian:'NOT_AUTHENTICATED',witness:'NOT_AUTHENTICATED',originalSignature:'NOT_VERIFIED',
      resolutionReceipt:'NOT_RECEIVED',originalAccepted:false,resolved:false,deliveryExecuted:false,
      state:'LOCAL_ORIGINAL_RESOLUTION_PREFLIGHT_OPEN'});
    expect(result.draft.currentSha).toBe(QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='yw')?.sha);
  });
  it('blocks accepted custody, delivery, altered source pins, repeated references and false resolutions',()=>{
    const prev=custodyFixture();const run=(row:typeof prev,ref='PREFLIGHT-288-CASE',
      gap='ORIGINAL_SIGNED_ARTIFACT_ABSENT',when='2026-10-31T16:12:00Z')=>
      ql288PrepareCustodianResolution(row,ref,gap as never,at(when));
    expect(run({...prev,originalReceipt:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prev,custodian:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...prev,delivered:true as never}).ok).toBe(false);
    expect(run({...prev,queuedExternally:true as never}).ok).toBe(false);
    expect(run({...prev,resolved:true as never}).ok).toBe(false);
    expect(run({...prev,previousSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prev,latestSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prev,source:'fake' as never}).ok).toBe(false);
    expect(run(prev,'CUSTODY-287-CASE').ok).toBe(false);
    expect(run(prev,'secret-case').ok).toBe(false);
    expect(run(prev,'PREFLIGHT-288-CASE','RESOLVED').ok).toBe(false);
    expect(run(prev,'PREFLIGHT-288-CASE','ORIGINAL_SIGNED_ARTIFACT_ABSENT','2026-10-31T16:09:00Z').ok).toBe(false);
  });
  it('queues an unchanged source exception as a local unsent recheck, not a success',()=>{
    const result=ql288PrepareImmutableQueue(refreshFixture('yw'),'RECHECK-288-CASE',at('2026-10-31T16:12:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',pinMoved:false,original:'HTTP_404_AT_IMMUTABLE_PIN',
      independentGET:'NOT_EXECUTED',ownerSignoff:'NOT_GIVEN',scheduled:false,sent:false,executed:false,
      originalAccepted:false,state:'LOCAL_UNSENT_IMMUTABLE_RECHECK_QUEUE'});
  });
  it('refuses invalid precursor source drift and unauthorized scheduling or execution',()=>{
    const prev=refreshFixture();const run=(row:typeof prev,ref='RECHECK-288-CASE',when='2026-10-31T16:12:00Z')=>
      ql288PrepareImmutableQueue(row,ref,at(when));
    expect(run({...prev,scheduled:true as never}).ok).toBe(false);
    expect(run({...prev,executed:true as never}).ok).toBe(false);
    expect(run({...prev,originalAccepted:true as never}).ok).toBe(false);
    expect(run({...prev,priorSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prev,currentSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prev,sourceMoved:false}).ok).toBe(false);
    expect(run({...prev,source:'fake' as never}).ok).toBe(false);
    expect(run(prev,'REFRESH-287-CASE').ok).toBe(false);
    expect(run(prev,'password-case').ok).toBe(false);
    expect(run(prev,'RECHECK-288-CASE','2026-10-31T16:09:00Z').ok).toBe(false);
  });
  it('preserves ACK under review, no live integrations and zero accepted decision/custody evidence',()=>{
    const packet=JSON.parse(ql288AuditPacket([],[],[],'2026-10-31T16:12:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.ackDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',originalsAccepted:0,
      authenticatedGETs:0,realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false});
    expect(packet.reviewerIndependence).toMatchObject({authenticatedReceipts:0,independentDecisions:0});
    expect(packet.originalCustodian).toMatchObject({verifiedResolutions:0,deliveredReceipts:0});
    expect(packet.publicImmutableException).toMatchObject({moved:5,unchanged:1,missing:6,automaticPolling:false});
  });
  it('shows accessible QL-288 command entry and all six immutable public source links',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer receipt independence, custody preflight & immutable source recheck').click());
    expect(host.querySelector('[data-ql288-desk]')).not.toBeNull();
    expect(button('Prepare independence gap audit').disabled).toBe(true);
    expect(host.textContent).toContain('No QL-287 decision readbacks');
    await act(async()=>button('03 Immutable source exceptions').click());
    expect(host.querySelectorAll('[aria-label="QL-288 immutable source exception ledger"] [role="row"]')).toHaveLength(7);
    expect(host.querySelectorAll('[aria-label="QL-288 immutable source exception ledger"] a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    expect(button('Prepare unsent immutable recheck item').disabled).toBe(true);
  });
  it('filters five moved and one stable pinned exceptions, still missing originals',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer receipt independence, custody preflight & immutable source recheck').click());
    await act(async()=>button('03 Immutable source exceptions').click());
    await act(async()=>button('Changed pins (5)').click());
    expect(host.querySelectorAll('[aria-label="QL-288 immutable source exception ledger"] [role="row"]')).toHaveLength(6);
    await act(async()=>button('Stable pins (1)').click());
    expect(host.querySelectorAll('[aria-label="QL-288 immutable source exception ledger"] [role="row"]')).toHaveLength(2);
    expect(host.textContent).toContain('Yard Workers');
    await act(async()=>button('Recalculate snapshot age').click());
    expect(host.textContent).toContain('no new GET performed');
    expect(host.textContent).toContain('Under Review');
  });
  it('navigates to predecessor while keeping missing reviewer/custodian proofs unresolved',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer receipt independence, custody preflight & immutable source recheck').click());
    await act(async()=>button('02 Original custody preflight').click());
    expect(button('Prepare unresolved custody preflight').disabled).toBe(true);
    await act(async()=>button('Open QL-287 custodian queue').click());
    expect(host.querySelector('[data-ql287-desk]')).not.toBeNull();
  });
  it('prepares seeded three local review items, copies the unverified packet and clears only drafts',async()=>{
    await renderSeeded();
    await act(async()=>input('#ql288-reviewer-ref','REVIEWER-288-UI'));
    await act(async()=>input('#ql288-issuer-ref','ISSUER-288-UI'));
    await act(async()=>button('Prepare independence gap audit').click());
    expect(host.textContent).toContain('LOCAL INDEPENDENCE GAP AUDIT ONLY');
    await act(async()=>button('02 Original custody preflight').click());
    await act(async()=>input('#ql288-custody-ref','PREFLIGHT-288-UI'));
    await act(async()=>button('Prepare unresolved custody preflight').click());
    expect(host.textContent).toContain('LOCAL ORIGINAL RESOLUTION PREFLIGHT OPEN');
    await act(async()=>button('03 Immutable source exceptions').click());
    await act(async()=>input('#ql288-recheck-ref','RECHECK-288-UI'));
    await act(async()=>button('Prepare unsent immutable recheck item').click());
    expect(host.textContent).toContain('LOCAL UNSENT IMMUTABLE RECHECK QUEUE');
    const copy=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
    await act(async()=>button('Copy QL-288 local packet').click());
    expect(copy).toHaveBeenCalledOnce();
    const packet=JSON.parse(copy.mock.calls[0][0] as string);
    expect(packet.reviewerIndependence.review).toHaveLength(1);
    expect(packet.originalCustodian.preflight).toHaveLength(1);
    expect(packet.unsentRecheckQueue).toHaveLength(1);
    expect(packet.ackDeliveryEvidence.status).toBe('UNDER_REVIEW');
    await act(async()=>button('Clear QL-288 local drafts').click());
    expect(JSON.parse((host.querySelector('#ql288-packet') as HTMLTextAreaElement).value).unsentRecheckQueue).toHaveLength(0);
    expect(host.textContent).toContain('Public source observations and parked ACK status are unchanged');
  });
  it('never transmits a packet when the clipboard is unavailable',async()=>{
    await renderSeeded();
    await act(async()=>button('Copy QL-288 local packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });
});
