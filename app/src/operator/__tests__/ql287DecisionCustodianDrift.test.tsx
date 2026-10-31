// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {Ql287DecisionCustodianDrift} from '../Ql287DecisionCustodianDrift';
import {QL270_SOURCES} from '../ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from '../ql282IssuerPublicationReview';
import {ql279PrepareArrivalClaim} from '../ql279ReviewerCustodyEscalation';
import {QL285_PUBLIC_SOURCE_RECHECK} from '../ql285IssuerAuthorityProvenanceDelta';
import {QL286_OBSERVED_AT,QL286_PUBLIC_SOURCE_RECHECK,
  type Ql286OutcomeComparison,type Ql286ConflictFollowup,type Ql286AgingFollowup} from '../ql286AuthorityOutcomeConflictAging';
import {QL287_OBSERVED_AT,QL287_PUBLIC_SOURCE_RECHECK,QL287_DECISION_REFERENCE_TYPES,
  QL287_CUSTODIAN_DISPOSITIONS,ql287PinnedProofUrl,ql287SourceDrift,ql287PrepareDecisionReadback,
  ql287PrepareCustodianQueue,ql287PrepareDriftFollowup,ql287AuditPacket} from '../ql287DecisionCustodianDrift';

const t=(s:string)=>new Date(s);
function outcomeFixture():Ql286OutcomeComparison{return {checkId:'keyboard',previousCase:'AUTHORITY-286-CASE',
  reference:'OUTCOME-286-CASE',outcome:'AUTHORITY_CHAIN_UNCORROBORATED',preparedAt:'2026-10-31T14:35:00Z',
  unmetGates:7,newVerifiedGates:0,issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',
  signature:'NOT_VERIFIED',challenge:'NOT_ISSUED',ownerApproval:'NOT_GIVEN',independentlyReviewed:false,
  disposition:'LOCAL_OUTCOME_COMPARISON_ONLY',state:'AUTHORITY_REVIEW_STILL_OPEN'};}
function conflictFixture(source:'rosiedazzlers'|'yw'='rosiedazzlers'):Ql286ConflictFollowup{
  const prior=QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  const current=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'PROVENANCE-286-CASE',reference:'CONFLICT-286-CASE',
    conflict:'ORIGINAL_CUSTODY_RECEIPT_MISSING',priorSha:prior.sha,latestSha:current.sha,
    preparedAt:'2026-10-31T14:35:00Z',original:'HTTP_404_AT_IMMUTABLE_PIN',
    ownerIdentity:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',routed:false,resolved:false,
    sourceVerified:false,disposition:'PROVENANCE_CONFLICT_OPEN',state:'LOCAL_QUARANTINED_FOLLOWUP'};
}
function agingFixture(source:'rosiedazzlers'|'yw'='rosiedazzlers'):Ql286AgingFollowup{
  const prior=QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  const current=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'DELTA-286-CASE',reference:'AGING-286-CASE',priorSha:prior.sha,
    currentSha:current.sha,preparedAt:'2026-10-31T14:35:00Z',sourceChanged:prior.sha!==current.sha,
    original:'HTTP_404_AT_IMMUTABLE_PIN',scheduled:false,executed:false,originalAccepted:false,
    state:'LOCAL_SOURCE_EXCEPTION_AGING_RECHECK_PENDING'};
}
let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const row=[...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(element=>element.getAttribute('aria-label')===label||element.textContent?.includes(label));
  if(!row)throw Error(`Missing button ${label}`);return row;}
function input(selector:string,value:string){const element=host.querySelector<HTMLInputElement>(selector)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));}
async function renderSeeded(){await act(async()=>root.unmount());root=createRoot(host);
  await act(async()=>root.render(<Ql287DecisionCustodianDrift authorityOutcomes={[outcomeFixture()]}
    custodianConflicts={[conflictFixture()]} sourceAging={[agingFixture()]}
    arrivalClaims={[]} onOpenQl286={()=>{}} onOpenEvidence={()=>{}}/>));}

describe('QL-287 independent reviewer decision readback, custodian queue and six-app drift',()=>{
  it('records six actual new immutable main SHA pins and six HTTP 404 original-proof paths',()=>{
    expect(QL287_OBSERVED_AT).toBe('2026-10-31T15:08:06Z');
    expect(new Set(QL287_PUBLIC_SOURCE_RECHECK.map(x=>x.source))).toEqual(new Set(QL270_SOURCES.map(x=>x.id)));
    expect(QL287_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    for(const row of QL287_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);
      expect(row.http).toBe(404);expect(ql287PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);}
    expect(()=>ql287PinnedProofUrl('fake' as never)).toThrow('UNKNOWN_QL287_SOURCE');
    expect(ql287SourceDrift('2026-10-31T15:10:00Z')).toMatchObject({moved:6,unchanged:0,missing:6,sources:6,
      verifiedOriginals:0,authenticatedGatewayGETs:0,automaticPolling:false,release:'DISCONNECTED / HOLD'});
  });
  it('marks all six source pins changed since QL-286 without accepting an original',()=>{
    const report=ql287SourceDrift('2026-10-31T15:10:00Z');
    expect(report.rows.every(row=>row.moved&&row.http===404&&!row.acceptedOriginal&&!row.authenticatedGatewayGET)).toBe(true);
    expect(new Set(report.rows.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
  });
  it('tracks 24-hour recheck due, future clocks and post-snapshot stale notices',()=>{
    expect(t(QL287_OBSERVED_AT).getTime()).toBeGreaterThan(t(QL286_OBSERVED_AT).getTime());
    expect(ql287SourceDrift(QL287_OBSERVED_AT)).toMatchObject({ageHours:0,freshness:'FRESH_PINNED_RECHECK',
      nextRecheckAt:'2026-11-01T15:08:06.000Z'});
    expect(ql287SourceDrift('2026-11-01T15:08:06Z').freshness).toBe('RECHECK_DUE');
    expect(ql287SourceDrift('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql287SourceDrift('2026-10-31T15:08:05Z').ageHours).toBeNull();
    const late=ql279PrepareArrivalClaim('yw','SOURCE_PUBLICATION_NOTICE','NOTICE-287-LATE',t('2026-10-31T15:12:00Z'));
    if(!late.ok)throw Error(late.reason);
    const report=ql287SourceDrift('2026-10-31T15:14:00Z',[late.claim],[agingFixture('yw')]);
    expect(report.rows.find(row=>row.source==='yw')).toMatchObject({claims:1,postSnapshotClaims:1,stalePinClaims:1,localRecheckDrafts:1});
  });
  it('records a claimed decision reference without inventing independent signature or trust',()=>{
    expect(QL287_DECISION_REFERENCE_TYPES).toHaveLength(3);
    const result=ql287PrepareDecisionReadback(outcomeFixture(),'DECISION-287-CASE','CLAIMED_REVIEWER_SIGNATURE_RECEIPT',t('2026-10-31T15:10:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',independentDecision:'NOT_RECEIVED',
      originalSignature:'NOT_VERIFIED',issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',
      ownerApproval:'NOT_GIVEN',corroborated:false,accepted:false,disposition:'REFERENCE_READBACK_ONLY',
      state:'LOCAL_UNATTESTED_DECISION_REVIEW'});
  });
  it('fails closed for forged reviewer approval, signatures, altered gates, token references and chronology',()=>{
    const prev=outcomeFixture();const run=(row:typeof prev,ref='DECISION-287-CASE',kind='CLAIMED_ISSUER_DECISION_REFERENCE',when='2026-10-31T15:10:00Z')=>
      ql287PrepareDecisionReadback(row,ref,kind as never,t(when));
    expect(run({...prev,newVerifiedGates:1 as never}).ok).toBe(false);
    expect(run({...prev,unmetGates:0}).ok).toBe(false);
    expect(run({...prev,independentlyReviewed:true as never}).ok).toBe(false);
    expect(run({...prev,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...prev,signature:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prev,ownerApproval:'GIVEN' as never}).ok).toBe(false);
    expect(run(prev,'token-private').ok).toBe(false);
    expect(run(prev,'bad').ok).toBe(false);
    expect(run(prev,'DECISION-287-CASE','CONFIRMED').ok).toBe(false);
    expect(run(prev,'DECISION-287-CASE','CLAIMED_ISSUER_DECISION_REFERENCE','2026-10-31T15:07:00Z').ok).toBe(false);
    expect(run(prev,'DECISION-287-CASE','CLAIMED_ISSUER_DECISION_REFERENCE','invalid').ok).toBe(false);
  });
  it('queues an original custodian conflict locally with neither routing nor resolution',()=>{
    expect(QL287_CUSTODIAN_DISPOSITIONS).toHaveLength(3);
    const result=ql287PrepareCustodianQueue(conflictFixture(),'CUSTODY-287-CASE','SOURCE_DRIFT_REQUIRES_ORIGINAL_RECHECK',t('2026-10-31T15:10:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'rosiedazzlers',original:'HTTP_404_AT_IMMUTABLE_PIN',
      custodian:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',queuedExternally:false,delivered:false,
      resolved:false,disposition:'CUSTODIAN_CONFLICT_OPEN',state:'LOCAL_UNSENT_DISPOSITION_QUEUE'});
    expect(result.draft.latestSha).toBe(QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='rosiedazzlers')?.sha);
  });
  it('rejects forged original custody, stale precursor pin, unauthorized delivery and secrets',()=>{
    const prev=conflictFixture();const run=(row:typeof prev,ref='CUSTODY-287-CASE',kind='ORIGINAL_ARTIFACT_STILL_MISSING',when='2026-10-31T15:10:00Z')=>
      ql287PrepareCustodianQueue(row,ref,kind as never,t(when));
    expect(run({...prev,originalReceipt:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prev,ownerIdentity:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...prev,routed:true as never}).ok).toBe(false);
    expect(run({...prev,resolved:true as never}).ok).toBe(false);
    expect(run({...prev,latestSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prev,source:'missing' as never}).ok).toBe(false);
    expect(run(prev,'secret-private').ok).toBe(false);
    expect(run(prev,'bad').ok).toBe(false);
    expect(run(prev,'CUSTODY-287-CASE','APPROVED').ok).toBe(false);
    expect(run(prev,'CUSTODY-287-CASE','ORIGINAL_ARTIFACT_STILL_MISSING','2026-10-31T15:07:00Z').ok).toBe(false);
  });
  it('creates a manual unscheduled source drift follow-up after a genuine local aging case',()=>{
    const result=ql287PrepareDriftFollowup(agingFixture('yw'),'REFRESH-287-CASE',t('2026-10-31T15:10:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',sourceMoved:true,scheduled:false,executed:false,
      originalAccepted:false,state:'LOCAL_SOURCE_REFRESH_FOLLOWUP_PENDING'});
  });
  it('blocks already scheduled, executed or falsely accepted source rechecks',()=>{
    const prev=agingFixture();const run=(row:typeof prev,ref='REFRESH-287-CASE',when='2026-10-31T15:10:00Z')=>
      ql287PrepareDriftFollowup(row,ref,t(when));
    expect(run({...prev,scheduled:true as never}).ok).toBe(false);
    expect(run({...prev,executed:true as never}).ok).toBe(false);
    expect(run({...prev,originalAccepted:true as never}).ok).toBe(false);
    expect(run({...prev,currentSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prev,source:'fake' as never}).ok).toBe(false);
    expect(run(prev,'password-private').ok).toBe(false);
    expect(run(prev,'bad').ok).toBe(false);
    expect(run(prev,'REFRESH-287-CASE','2026-10-31T15:07:00Z').ok).toBe(false);
  });
  it('keeps ACK delivery Under Review and integrations Disconnected/Hold',()=>{
    const packet=JSON.parse(ql287AuditPacket([],[],[],'2026-10-31T15:11:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.ackDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false});
    expect(packet.reviewerDecision).toMatchObject({accepted:0,independentlyAuthenticated:0});
    expect(packet.originalCustodian).toMatchObject({verifiedReceipts:0,externalQueueDeliveries:0});
    expect(packet.sourceRefresh).toMatchObject({moved:6,unchanged:0,missing:6,automaticPolling:false});
  });
  it('renders the QL-287 command toolbar and all six immutable source pin links accessibly',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer decision evidence, custodian queue & six-source drift').click());
    expect(host.querySelector('[data-ql287-desk]')).not.toBeNull();
    expect(button('Prepare unverified decision readback').disabled).toBe(true);
    expect(host.textContent).toContain('No QL-286 pending reviewer outcome');
    await act(async()=>button('03 Six-app source drift').click());
    expect(host.querySelectorAll('[aria-label="QL-287 source refresh drift ledger"] [role="row"]')).toHaveLength(7);
    expect(host.querySelectorAll('[aria-label="QL-287 source refresh drift ledger"] a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    expect(button('Prepare unscheduled local drift follow-up').disabled).toBe(true);
  });
  it('filters all six moved public source SHA pins and preserves the parked ACK section',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer decision evidence, custodian queue & six-source drift').click());
    await act(async()=>button('03 Six-app source drift').click());
    await act(async()=>button('Changed pins (6)').click());
    expect(host.querySelectorAll('[aria-label="QL-287 source refresh drift ledger"] [role="row"]')).toHaveLength(7);
    await act(async()=>button('Unchanged pins (0)').click());
    expect(host.querySelectorAll('[aria-label="QL-287 source refresh drift ledger"] [role="row"]')).toHaveLength(1);
    await act(async()=>button('Recalculate age only').click());
    expect(host.textContent).toContain('No GET was re-executed');
    expect(host.textContent).toContain('Under Review');
  });
  it('navigates to QL-286 predecessor while keeping custody references unverified',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer decision evidence, custodian queue & six-source drift').click());
    await act(async()=>button('02 Custodian dispositions').click());
    expect(host.textContent).toContain('No QL-286 quarantined conflict');
    expect(button('Prepare unsent disposition queue item').disabled).toBe(true);
    await act(async()=>button('Open QL-286 conflict').click());
    expect(host.querySelector('[data-ql286-desk]')).not.toBeNull();
  });
  it('prepares three seeded local review cases and copies only an unverified packet',async()=>{
    await renderSeeded();
    await act(async()=>input('#ql287-decision-ref','DECISION-287-UI'));
    await act(async()=>button('Prepare unverified decision readback').click());
    expect(host.textContent).toContain('REFERENCE READBACK ONLY');
    await act(async()=>button('02 Custodian dispositions').click());
    await act(async()=>input('#ql287-custodian-ref','CUSTODY-287-UI'));
    await act(async()=>button('Prepare unsent disposition queue item').click());
    expect(host.textContent).toContain('CUSTODIAN CONFLICT OPEN');
    await act(async()=>button('03 Six-app source drift').click());
    await act(async()=>input('#ql287-refresh-ref','REFRESH-287-UI'));
    await act(async()=>button('Prepare unscheduled local drift follow-up').click());
    expect(host.textContent).toContain('LOCAL SOURCE REFRESH FOLLOWUP PENDING');
    const copy=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
    await act(async()=>button('Copy QL-287 local packet').click());
    expect(copy).toHaveBeenCalledOnce();
    const data=JSON.parse(copy.mock.calls[0][0] as string);
    expect(data.reviewerDecision.readbacks).toHaveLength(1);
    expect(data.originalCustodian.dispositionQueue).toHaveLength(1);
    expect(data.localManualFollowups).toHaveLength(1);
    expect(data.ackDeliveryEvidence.status).toBe('UNDER_REVIEW');
    await act(async()=>button('Clear QL-287 local drafts').click());
    expect(JSON.parse((host.querySelector('#ql287-packet') as HTMLTextAreaElement).value).localManualFollowups).toHaveLength(0);
  });
  it('does not transmit when clipboard is unavailable',async()=>{
    await renderSeeded();
    await act(async()=>button('Copy QL-287 local packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });
});
