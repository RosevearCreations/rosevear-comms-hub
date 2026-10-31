// @vitest-environment jsdom
import {act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {Ql289ProvenanceWitnessReceiptAging} from '../Ql289ProvenanceWitnessReceiptAging';
import {QL270_SOURCES} from '../ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from '../ql282IssuerPublicationReview';
import {QL287_PUBLIC_SOURCE_RECHECK} from '../ql287DecisionCustodianDrift';
import {QL288_OBSERVED_AT,QL288_PUBLIC_SOURCE_RECHECK,
  type Ql288ReviewerIndependenceAudit,type Ql288CustodianResolutionPreflight,
  type Ql288ImmutableExceptionQueue} from '../ql288ReceiptCustodianSourceQueue';
import {QL289_OBSERVED_AT,QL289_PUBLIC_SOURCE_RECHECK,QL289_REVIEWER_CHALLENGE_GATES,
  QL289_WITNESS_CLOSURE_GATES,QL289_REVIEWER_CHALLENGE_FOCUS,QL289_WITNESS_GAPS,
  QL289_RECEIPT_AGING_REASONS,ql289PinnedProofUrl,ql289ExceptionReceiptAging,
  ql289PrepareReviewerChallenge,ql289PrepareWitnessClosure,ql289PrepareReceiptAging,
  ql289AuditPacket,type Ql289ReviewerChallenge,type Ql289WitnessClosureReadiness,
  type Ql289ReceiptAgingFollowup} from '../ql289ProvenanceWitnessReceiptAging';

const at=(value:string)=>new Date(value);
function reviewerFixture():Ql288ReviewerIndependenceAudit{return {checkId:'keyboard',
  previousCase:'DECISION-287-CASE',reviewerReceiptReference:'REVIEWER-288-CASE',
  issuerAuthorityReference:'ISSUER-288-CASE',gap:'INDEPENDENT_REVIEWER_RECEIPT_ABSENT',
  preparedAt:'2026-10-31T16:20:00Z',reviewerReceipt:'NOT_RECEIVED',
  issuerAuthority:'NOT_AUTHENTICATED',signature:'NOT_VERIFIED',challenge:'NOT_ISSUED',
  independentIdentity:'NOT_ESTABLISHED',originalAccepted:false,decisionAccepted:false,
  ownerApproval:'NOT_GIVEN',externalReviewExecuted:false,state:'LOCAL_INDEPENDENCE_GAP_AUDIT_ONLY'};}
function witnessFixture(source:'yw'|'rosiedazzlers'='yw'):Ql288CustodianResolutionPreflight{
  const prior=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  const current=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'CUSTODY-287-CASE',reference:'PREFLIGHT-288-CASE',
    gap:'ORIGINAL_SIGNED_ARTIFACT_ABSENT',priorSha:prior.sha,currentSha:current.sha,
    preparedAt:'2026-10-31T16:20:00Z',original:'HTTP_404_AT_IMMUTABLE_PIN',
    custodian:'NOT_AUTHENTICATED',witness:'NOT_AUTHENTICATED',originalSignature:'NOT_VERIFIED',
    resolutionReceipt:'NOT_RECEIVED',originalAccepted:false,resolved:false,deliveryExecuted:false,
    state:'LOCAL_ORIGINAL_RESOLUTION_PREFLIGHT_OPEN'};
}
function exceptionFixture(source:'yw'|'rosiedazzlers'='yw'):Ql288ImmutableExceptionQueue{
  const prior=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  const current=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source)!;
  return {source,previousCase:'REFRESH-287-CASE',reference:'RECHECK-288-CASE',
    previousSha:prior.sha,currentSha:current.sha,pinMoved:String(prior.sha)!==String(current.sha),
    preparedAt:'2026-10-31T16:20:00Z',original:'HTTP_404_AT_IMMUTABLE_PIN',
    ownerSignoff:'NOT_GIVEN',independentGET:'NOT_EXECUTED',scheduled:false,sent:false,
    executed:false,originalAccepted:false,state:'LOCAL_UNSENT_IMMUTABLE_RECHECK_QUEUE'};
}

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const found=[...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(row=>row.getAttribute('aria-label')===label||row.textContent?.includes(label));
  if(!found)throw Error(`Missing button ${label}`);return found;}
function input(selector:string,value:string){const element=host.querySelector<HTMLInputElement>(selector)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));}
async function renderSeeded(){await act(async()=>root.unmount());root=createRoot(host);
  function Seeded(){const [challenges,setChallenges]=useState<Ql289ReviewerChallenge[]>([]);
    const [witnesses,setWitnesses]=useState<Ql289WitnessClosureReadiness[]>([]);
    const [agingDrafts,setAgingDrafts]=useState<Ql289ReceiptAgingFollowup[]>([]);
    return <Ql289ProvenanceWitnessReceiptAging reviewerPredecessors={[reviewerFixture()]}
      custodianPredecessors={[witnessFixture()]} sourcePredecessors={[exceptionFixture()]}
      challenges={challenges} setChallenges={setChallenges}
      witnesses={witnesses} setWitnesses={setWitnesses}
      agingDrafts={agingDrafts} setAgingDrafts={setAgingDrafts}
      onOpenQl288={()=>{}} onOpenEvidence={()=>{}}/>;}
  await act(async()=>root.render(<Seeded/>));}

describe('QL-289 independent reviewer provenance, original witness readiness and six-app receipt aging',()=>{
  it('records six actual new main SHA pins and six HTTP 404 original Proof-B paths',()=>{
    expect(QL289_OBSERVED_AT).toBe('2026-10-31T16:48:10Z');
    expect(at(QL289_OBSERVED_AT).getTime()).toBeGreaterThan(at(QL288_OBSERVED_AT).getTime());
    expect(QL289_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL289_PUBLIC_SOURCE_RECHECK.map(x=>x.source))).toEqual(new Set(QL270_SOURCES.map(x=>x.id)));
    for(const row of QL289_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);
      expect(row.http).toBe(404);expect(ql289PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);}
    expect(()=>ql289PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL289_SOURCE');
    expect(ql289ExceptionReceiptAging(QL289_OBSERVED_AT)).toMatchObject({moved:6,unchanged:0,
      missing:6,sources:6,originalReceiptsReceived:0,acceptedOriginals:0,
      authenticatedGatewayGETs:0,automaticPolling:false,release:'DISCONNECTED / HOLD'});
  });
  it('labels all six moved pins as unresolved original-receipt exceptions, including Yard Workers',()=>{
    const report=ql289ExceptionReceiptAging('2026-10-31T16:49:00Z',[exceptionFixture('yw')]);
    expect(report.rows.every(row=>row.moved&&row.http===404&&
      row.receipt==='NOT_RECEIVED'&&!row.originalAccepted&&!row.independentReceiptVerified&&
      !row.authenticatedGatewayGET)).toBe(true);
    expect(report.rows.find(row=>row.source==='yw')).toMatchObject({moved:true,
      linkedLocalQueue:1,exception:'PIN_DRIFT_AND_ORIGINAL_MISSING'});
  });
  it('ages public snapshots for 24 hours without performing another GET',()=>{
    expect(ql289ExceptionReceiptAging('2026-10-31T16:50:00Z')).toMatchObject({ageHours:0,
      freshness:'FRESH_IMMUTABLE_SNAPSHOT',nextRecheckAt:'2026-11-01T16:48:10.000Z'});
    expect(ql289ExceptionReceiptAging('2026-11-01T16:48:10Z').freshness).toBe('RECHECK_DUE');
    expect(ql289ExceptionReceiptAging('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql289ExceptionReceiptAging('2026-10-31T16:47:10Z').ageHours).toBeNull();
  });
  it('defines seven pending reviewer provenance gates and six original custody gates',()=>{
    expect(QL289_REVIEWER_CHALLENGE_GATES).toHaveLength(7);
    expect(QL289_WITNESS_CLOSURE_GATES).toHaveLength(6);
    expect(new Set(QL289_REVIEWER_CHALLENGE_GATES.map(row=>row.id)).size).toBe(7);
    expect(new Set(QL289_WITNESS_CLOSURE_GATES.map(row=>row.id)).size).toBe(6);
    expect(QL289_REVIEWER_CHALLENGE_FOCUS).toHaveLength(3);
    expect(QL289_WITNESS_GAPS).toHaveLength(4);
    expect(QL289_RECEIPT_AGING_REASONS).toHaveLength(3);
  });
  it('prepares a local reviewer provenance challenge without issuing nonce or accepting receipt',()=>{
    const result=ql289PrepareReviewerChallenge(reviewerFixture(),'CHALLENGE-289-CASE',
      'REVIEWER_RECEIPT_SOURCE_UNCORROBORATED',at('2026-10-31T16:50:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',gatesOpen:7,authenticatedGates:0,
      issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',originalSignedReceipt:'NOT_RECEIVED',
      challengeIssued:false,originCorroborated:false,witnessVerified:false,
      ownerApproval:'NOT_GIVEN',accepted:false,state:'LOCAL_UNISSUED_PROVENANCE_CHALLENGE_MATRIX'});
  });
  it('rejects verified, issued, accepted, duplicate or secret reviewer challenge predecessors',()=>{
    const previous=reviewerFixture();const run=(row:typeof previous,ref='CHALLENGE-289-CASE',
      focus='REVIEWER_RECEIPT_SOURCE_UNCORROBORATED',when='2026-10-31T16:50:00Z')=>
      ql289PrepareReviewerChallenge(row,ref,focus as never,at(when));
    expect(run({...previous,reviewerReceipt:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...previous,issuerAuthority:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...previous,challenge:'ISSUED' as never}).ok).toBe(false);
    expect(run({...previous,externalReviewExecuted:true as never}).ok).toBe(false);
    expect(run({...previous,originalAccepted:true as never}).ok).toBe(false);
    expect(run({...previous,decisionAccepted:true as never}).ok).toBe(false);
    expect(run({...previous,ownerApproval:'GIVEN' as never}).ok).toBe(false);
    expect(run(previous,'REVIEWER-288-CASE').ok).toBe(false);
    expect(run(previous,'ISSUER-288-CASE').ok).toBe(false);
    expect(run(previous,'DECISION-287-CASE').ok).toBe(false);
    expect(run(previous,'token-private').ok).toBe(false);
    expect(run(previous,'bad').ok).toBe(false);
    expect(run(previous,'CHALLENGE-289-CASE','APPROVED').ok).toBe(false);
    expect(run(previous,'CHALLENGE-289-CASE','REVIEWER_RECEIPT_SOURCE_UNCORROBORATED','2026-10-31T16:47:00Z').ok).toBe(false);
  });
  it('prepares a witness closure readiness case while retaining six unmet original gates',()=>{
    const result=ql289PrepareWitnessClosure(witnessFixture('yw'),'WITNESS-289-CASE',
      'WITNESS_PROVENANCE_NOT_ESTABLISHED',at('2026-10-31T16:50:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',gatesOpen:6,authenticatedGates:0,
      original:'HTTP_404_AT_IMMUTABLE_PIN',custodian:'NOT_AUTHENTICATED',witness:'NOT_AUTHENTICATED',
      signature:'NOT_VERIFIED',chainCorroborated:false,ownerApproval:'NOT_GIVEN',
      closureApproved:false,originalAccepted:false,externalDelivery:false,
      state:'LOCAL_WITNESS_CLOSURE_READINESS_OPEN'});
    expect(result.draft.currentSha).toBe(QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='yw')?.sha);
  });
  it('blocks forged custodian or witness acceptance, stale source pins and re-used case references',()=>{
    const previous=witnessFixture();const run=(row:typeof previous,ref='WITNESS-289-CASE',
      gap='ORIGINAL_PROOF_STILL_ABSENT',when='2026-10-31T16:50:00Z')=>
      ql289PrepareWitnessClosure(row,ref,gap as never,at(when));
    expect(run({...previous,custodian:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...previous,witness:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...previous,originalSignature:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...previous,resolved:true as never}).ok).toBe(false);
    expect(run({...previous,originalAccepted:true as never}).ok).toBe(false);
    expect(run({...previous,deliveryExecuted:true as never}).ok).toBe(false);
    expect(run({...previous,priorSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...previous,currentSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...previous,source:'fake' as never}).ok).toBe(false);
    expect(run(previous,'PREFLIGHT-288-CASE').ok).toBe(false);
    expect(run(previous,'CUSTODY-287-CASE').ok).toBe(false);
    expect(run(previous,'secret-case').ok).toBe(false);
    expect(run(previous,'WITNESS-289-CASE','CLOSED').ok).toBe(false);
    expect(run(previous,'WITNESS-289-CASE','ORIGINAL_PROOF_STILL_ABSENT','2026-10-31T16:47:00Z').ok).toBe(false);
  });
  it('converts an intact QL-288 unsent exception to an unsent original receipt aging follow-up',()=>{
    const result=ql289PrepareReceiptAging(exceptionFixture('yw'),'AGING-289-CASE',
      'PIN_CHANGED_RECEIPT_NOT_RECEIVED',at('2026-10-31T16:50:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',moved:true,receipt:'NOT_RECEIVED',
      sourceOriginal:'HTTP_404_AT_IMMUTABLE_PIN',scheduled:false,sent:false,executed:false,
      originalAccepted:false,ownerApproval:'NOT_GIVEN',
      state:'LOCAL_UNSENT_EXCEPTION_RECEIPT_AGING_FOLLOWUP'});
  });
  it('fails closed for sent/executed prior exception, bad SHA, secrets and chronology',()=>{
    const previous=exceptionFixture();const run=(row:typeof previous,ref='AGING-289-CASE',
      reason='PIN_CHANGED_RECEIPT_NOT_RECEIVED',when='2026-10-31T16:50:00Z')=>
      ql289PrepareReceiptAging(row,ref,reason as never,at(when));
    expect(run({...previous,scheduled:true as never}).ok).toBe(false);
    expect(run({...previous,sent:true as never}).ok).toBe(false);
    expect(run({...previous,executed:true as never}).ok).toBe(false);
    expect(run({...previous,originalAccepted:true as never}).ok).toBe(false);
    expect(run({...previous,ownerSignoff:'GIVEN' as never}).ok).toBe(false);
    expect(run({...previous,independentGET:'EXECUTED' as never}).ok).toBe(false);
    expect(run({...previous,previousSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...previous,currentSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...previous,pinMoved:true}).ok).toBe(false);
    expect(run({...previous,source:'fake' as never}).ok).toBe(false);
    expect(run(previous,'RECHECK-288-CASE').ok).toBe(false);
    expect(run(previous,'password-case').ok).toBe(false);
    expect(run(previous,'AGING-289-CASE','APPROVED').ok).toBe(false);
    expect(run(previous,'AGING-289-CASE','PIN_CHANGED_RECEIPT_NOT_RECEIVED','2026-10-31T16:47:00Z').ok).toBe(false);
  });
  it('keeps ACK delivery Under Review/Parked and all source integrations disabled',()=>{
    const packet=JSON.parse(ql289AuditPacket([],[],[],'2026-10-31T16:50:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.ackDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',originalsAccepted:0,
      authenticatedGETs:0,realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false});
    expect(packet.reviewerProvenance).toMatchObject({authenticatedDecisions:0,issuedChallenges:0});
    expect(packet.custodianWitness).toMatchObject({verifiedClosures:0,originalReceipts:0});
    expect(packet.sixAppReceiptAging).toMatchObject({moved:6,unchanged:0,missing:6,automaticPolling:false});
  });
  it('renders accessible QL-289 help entry and seven reviewer challenge gate statuses',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer provenance challenges, custodian witnesses & receipt aging').click());
    expect(host.querySelector('[data-ql289-desk]')).not.toBeNull();
    expect(host.querySelectorAll('[aria-label="Seven open reviewer provenance challenge gates"]>div')).toHaveLength(7);
    expect(button('Prepare unissued provenance challenge').disabled).toBe(true);
    expect(host.textContent).toContain('No QL-288 reviewer receipt gap audit');
    await act(async()=>button('02 Custodian witness closure').click());
    expect(host.querySelectorAll('[aria-label="Six open original custody and witness closure gates"]>div')).toHaveLength(6);
    expect(button('Prepare open witness closure review').disabled).toBe(true);
  });
  it('lists all six changed original source SHA exceptions and preserves parked ACK',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer provenance challenges, custodian witnesses & receipt aging').click());
    await act(async()=>button('03 Source receipt aging').click());
    expect(host.querySelectorAll('[aria-label="QL-289 immutable original receipt aging ledger"] [role="row"]')).toHaveLength(7);
    expect(host.querySelectorAll('[aria-label="QL-289 immutable original receipt aging ledger"] a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    await act(async()=>button('Changed pins (6)').click());
    expect(host.querySelectorAll('[aria-label="QL-289 immutable original receipt aging ledger"] [role="row"]')).toHaveLength(7);
    await act(async()=>button('Unchanged pins (0)').click());
    expect(host.querySelectorAll('[aria-label="QL-289 immutable original receipt aging ledger"] [role="row"]')).toHaveLength(1);
    await act(async()=>button('Recalculate age only').click());
    expect(host.textContent).toContain('No new GET was executed');
    expect(host.textContent).toContain('Under Review');
    expect(button('Prepare unsent receipt aging item').disabled).toBe(true);
  });
  it('navigates to QL-288 antecedent without falsely closing witness or reviewer cases',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer provenance challenges, custodian witnesses & receipt aging').click());
    await act(async()=>button('02 Custodian witness closure').click());
    await act(async()=>button('Open QL-288 custody preflight').click());
    expect(host.querySelector('[data-ql288-desk]')).not.toBeNull();
  });
  it('prepares three seeded local audits, copies only an unverified packet and clears local drafts',async()=>{
    await renderSeeded();
    await act(async()=>input('#ql289-reviewer-ref','CHALLENGE-289-UI'));
    await act(async()=>button('Prepare unissued provenance challenge').click());
    expect(host.textContent).toContain('LOCAL UNISSUED PROVENANCE CHALLENGE MATRIX');
    await act(async()=>button('02 Custodian witness closure').click());
    await act(async()=>input('#ql289-witness-ref','WITNESS-289-UI'));
    await act(async()=>button('Prepare open witness closure review').click());
    expect(host.textContent).toContain('LOCAL WITNESS CLOSURE READINESS OPEN');
    await act(async()=>button('03 Source receipt aging').click());
    await act(async()=>input('#ql289-aging-ref','AGING-289-UI'));
    await act(async()=>button('Prepare unsent receipt aging item').click());
    expect(host.textContent).toContain('LOCAL UNSENT EXCEPTION RECEIPT AGING FOLLOWUP');
    const copy=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
    await act(async()=>button('Copy QL-289 local packet').click());
    expect(copy).toHaveBeenCalledOnce();
    const data=JSON.parse(copy.mock.calls[0][0] as string);
    expect(data.reviewerProvenance.challenges).toHaveLength(1);
    expect(data.custodianWitness.witnesses).toHaveLength(1);
    expect(data.localUnsentFollowups).toHaveLength(1);
    expect(data.ackDeliveryEvidence.status).toBe('UNDER_REVIEW');
    await act(async()=>button('Clear QL-289 local drafts').click());
    expect(JSON.parse((host.querySelector('#ql289-packet') as HTMLTextAreaElement).value).localUnsentFollowups).toHaveLength(0);
    expect(host.textContent).toContain('Prior drafts, public proofs and parked ACK unchanged');
  });
  it('does not send a packet when clipboard access is unavailable',async()=>{
    await renderSeeded();
    await act(async()=>button('Copy QL-289 local packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });
});
