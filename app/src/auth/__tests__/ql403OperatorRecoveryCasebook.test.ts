import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {filterOperatorRecoveryCasebook,reviewOperatorRecoveryCasebook,
  QL403_DEFAULT_FILTERS,QL403_DEMO_ACKS,QL403_DEMO_AUDIT,QL403_DEMO_DRAFTS,
  QL403_DEMO_ENTRIES,QL403_DEMO_EXCEPTIONS,QL403_DEMO_NOTES,QL403_DEMO_NOW,
  QL403_DEMO_OUTCOMES,QL403_DEMO_REQUESTS,QL403_MAX_ENTRIES,type QL403CaseEntry}
  from '../ql403OperatorRecoveryCasebook';

const casebook=(entries:readonly QL403CaseEntry[]=QL403_DEMO_ENTRIES,now=QL403_DEMO_NOW)=>
  reviewOperatorRecoveryCasebook(QL392_ILLUSTRATIVE_PREVIEW,QL403_DEMO_REQUESTS,
    QL403_DEMO_OUTCOMES,QL403_DEMO_AUDIT,QL403_DEMO_EXCEPTIONS,QL403_DEMO_DRAFTS,
    QL403_DEMO_ACKS,QL403_DEMO_NOTES,entries,now);

describe('QL-403 original evidence requirements and independent owner handoff',()=>{
  it('makes source-bound, auditable HOLD casebook entries with five original requirements',()=>{
    const value=casebook();
    expect(value).toMatchObject({state:'INERT_PREVIEW',total:3,unverifiedEvidenceAxes:15,
      verifiedOriginals:0,verifiedOwnerDecisions:0,authorizedHandoffs:0,
      sendEnabled:false,persisted:false});
    expect(value.cases.map(item=>item.caseState)).toEqual([
      'HOLD_OWNER_VERIFICATION','HOLD_INTAKE','HOLD_INDEPENDENT_REVIEW']);
    expect(value.cases.every(item=>item.originalEvidenceRequirements.length===5&&
      item.originalEvidenceRequirements.every(check=>!check.verified&&
        check.evidenceIntake==='NOT_RECEIVED'&&check.independentReview==='NOT_PERFORMED'&&
        check.ownerDecision==='NOT_SIGNED')&&!item.originalCustodyVerified&&
        !item.independentReviewerVerified&&!item.sourceOwnerSigned&&!item.masterOwnerSigned&&
        !item.receiverVerified&&!item.consentVerified&&!item.handoffAuthorized&&
        item.closureDecision==='HOLD'&&!item.sendEnabled&&!item.persisted)).toBe(true);
    expect(value.cases[0].originalEvidenceRequirements.map(check=>check.gate)).toEqual([
      'SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT']);
    expect(JSON.stringify(value)).not.toContain('Camp Rosevear');
  });

  it('filters safely and does not infer a receipt from a proposed owner handoff',()=>{
    const value=casebook();
    expect(filterOperatorRecoveryCasebook(value,QL403_DEFAULT_FILTERS)).toHaveLength(3);
    expect(filterOperatorRecoveryCasebook(value,{sourceId:'icamp',kind:'ORIGINAL_EVIDENCE_INTAKE'}))
      .toHaveLength(1);
    expect(filterOperatorRecoveryCasebook(value,{sourceId:'icamp',kind:'OWNER_VERIFICATION'}))
      .toHaveLength(0);
    expect(filterOperatorRecoveryCasebook(value,{sourceId:'camp-rosevear',kind:'ALL'}))
      .toEqual([]);
    expect(filterOperatorRecoveryCasebook(value,{sourceId:'ALL',kind:'SEND' as 'ALL'}))
      .toEqual([]);
  });

  it('fails closed for cross-source, role, forged reviewer, duplicate and future records',()=>{
    const base=QL403_DEMO_ENTRIES[0];
    for(const bad of [
      {...base,caseId:'bad'},
      {...base,sourceId:'icamp'},
      {...base,correlationId:'correlation-ql392-integration'},
      {...base,assignmentId:'assignment-ql400-0002'},
      {...base,requestedBy:'MASTER_OWNER' as typeof base.requestedBy},
      {...base,kind:'SIGNED_CLOSURE' as typeof base.kind},
      {...base,recordedAt:'2026-11-09T09:44:40Z'},
      {...base,recordedAt:'2026-11-09T09:45:01Z'},
      {...base,recordedAt:'not-a-date'},
      {...base,referenceReviewId:'review-ql402-local-2'},
      {...base,referenceReviewId:'invented-review-0001'},
      {...base,caseId:'review-ql402-workshop-2'},
      {...base,caseId:'assignment-ql400-0001'}
    ])expect(casebook([bad])).toMatchObject({state:'HOLD',cases:[],authorizedHandoffs:0});
    expect(casebook([base,base])).toMatchObject({state:'HOLD',cases:[]});
    expect(casebook(Array(QL403_MAX_ENTRIES+1).fill(base))).toMatchObject({state:'HOLD',cases:[]});
    expect(casebook(QL403_DEMO_ENTRIES,Number.NaN)).toMatchObject({state:'HOLD',cases:[]});
  });

  it('does not accept invalid upstream decisions and sorts valid casebook entries',()=>{
    expect(casebook([...QL403_DEMO_ENTRIES].reverse()).cases).toEqual(casebook().cases);
    expect(casebook([])).toMatchObject({state:'INERT_PREVIEW',total:0,
      unverifiedEvidenceAxes:0,authorizedHandoffs:0});
    const bad=reviewOperatorRecoveryCasebook(QL392_ILLUSTRATIVE_PREVIEW,
      QL403_DEMO_REQUESTS,QL403_DEMO_OUTCOMES,QL403_DEMO_AUDIT,QL403_DEMO_EXCEPTIONS,
      [{...QL403_DEMO_DRAFTS[0],sourceId:'icamp'}],QL403_DEMO_ACKS,
      QL403_DEMO_NOTES,QL403_DEMO_ENTRIES,QL403_DEMO_NOW);
    expect(bad).toMatchObject({state:'HOLD',cases:[]});
  });
});
