import {describe,expect,it} from 'vitest';
import {QL392_ILLUSTRATIVE_PREVIEW} from '../ql392OperatorIncidentReview';
import {QL394_DEMO_HISTORY,QL394_DEMO_NOW,QL394_MAX_SNAPSHOTS,
  type QL394Snapshot} from '../ql394DraftDecisionHistory';
import {compareOperatorEvidenceReviews} from '../ql395EvidenceReviewComparison';

const GROUP='correlation-ql392-workshop';
const FIRST='snapshot-ql394-0001';
const SECOND='snapshot-ql394-0002';
const THIRD='snapshot-ql394-0003';
const compare=(from=FIRST,to=SECOND,snapshots:readonly QL394Snapshot[]=QL394_DEMO_HISTORY)=>
  compareOperatorEvidenceReviews(QL392_ILLUSTRATIVE_PREVIEW,GROUP,snapshots,from,to,QL394_DEMO_NOW);

describe('QL-395 read-only operator comparison and original owner continuity',()=>{
  it('compares two chronological snapshots without accepting simulated grant changes',()=>{
    const result=compare();
    expect(result).toMatchObject({state:'INERT_PREVIEW',correlationId:GROUP,
      fromSnapshotId:FIRST,toSnapshotId:SECOND,sendEnabled:false,persisted:false,changedGates:2});
    expect(result.comparisons).toHaveLength(5);
    expect(result.comparisons.find(item=>item.gate==='SOURCE_OWNER')).toMatchObject({
      beforeDecision:'HOLD',afterDecision:'SIMULATED_PASS',kind:'SIMULATED_GRANT_CHANGE',authorization:'HOLD'});
    expect(result.comparisons.find(item=>item.gate==='SOURCE_PIN')).toMatchObject({
      kind:'REFERENCE_CHANGED',beforeReference:'pin:QL394DEMO0001',afterReference:'pin:QL394DEMO0002',
      authorization:'HOLD'});
    expect(result.resolutions.map(item=>item.code))
      .toEqual(['UNVERIFIED_GRANT_CHANGE','UNVERIFIED_GRANT_CHANGE','PIN_REFERENCE_DRIFT']);
    expect(result.resolutions.every(item=>item.ownerState==='NOT_ATTESTED'&&
      item.resolution==='OPEN_REVIEW_ONLY')).toBe(true);
    expect(result.ownerContinuity).toHaveLength(2);
    expect(result.ownerContinuity.every(item=>item.originalOwnerEvidence==='NOT_VERIFIED'&&
      item.continuity==='HOLD_RECHECK_ORIGINAL')).toBe(true);
  });

  it('shows scenario approval reversals and continuing original owner HOLD',()=>{
    const result=compare(SECOND,THIRD);
    expect(result).toMatchObject({state:'INERT_PREVIEW',changedGates:2,sendEnabled:false});
    expect(result.comparisons.filter(item=>item.kind==='REVERTED_TO_HOLD')).toHaveLength(2);
    expect(result.resolutions.map(item=>item.code)).toEqual(['GATE_REVERSAL','GATE_REVERSAL']);
    expect(result.ownerContinuity[0]).toMatchObject({priorScenarioDecision:'SIMULATED_PASS',
      latestScenarioDecision:'HOLD',originalOwnerEvidence:'NOT_VERIFIED'});
  });

  it('preserves intermediate alert history across a longer comparison',()=>{
    const result=compare(FIRST,THIRD);
    expect(result).toMatchObject({state:'INERT_PREVIEW',changedGates:1});
    expect(result.resolutions).toHaveLength(5);
    expect(result.resolutions[0].requiredReview).toContain('original owner');
    expect(result.comparisons.find(item=>item.gate==='SOURCE_OWNER')?.kind).toBe('UNCHANGED');
    expect(result.comparisons.find(item=>item.gate==='SOURCE_PIN')?.kind).toBe('PROVENANCE_CHANGED');
  });

  it('fails closed on missing, reversed, duplicate or identical scenario observations',()=>{
    expect(compare(FIRST,FIRST)).toMatchObject({state:'HOLD',comparisons:[],resolutions:[],ownerContinuity:[]});
    expect(compare(THIRD,FIRST)).toMatchObject({state:'HOLD',comparisons:[],resolutions:[]});
    expect(compare('snapshot-ql394-unknown',SECOND)).toMatchObject({state:'HOLD',comparisons:[]});
    expect(compare(FIRST,SECOND,[QL394_DEMO_HISTORY[0],QL394_DEMO_HISTORY[0]]))
      .toMatchObject({state:'HOLD',comparisons:[]});
  });

  it('rejects malformed source claims and oversized history before exposing any comparison',()=>{
    const wrongScope:QL394Snapshot={...QL394_DEMO_HISTORY[0],evidenceClaims:[{
      ...QL394_DEMO_HISTORY[0].evidenceClaims[0],sourceId:'camp-rosevear'}]};
    expect(compare(FIRST,SECOND,[wrongScope,QL394_DEMO_HISTORY[1]]))
      .toMatchObject({state:'HOLD',comparisons:[],sendEnabled:false,persisted:false});
    expect(compare(FIRST,SECOND,Array(QL394_MAX_SNAPSHOTS+1).fill(QL394_DEMO_HISTORY[0])))
      .toMatchObject({state:'HOLD',comparisons:[]});
    expect(compareOperatorEvidenceReviews(QL392_ILLUSTRATIVE_PREVIEW,'unregistered-correlation',
      QL394_DEMO_HISTORY,FIRST,SECOND,QL394_DEMO_NOW))
      .toMatchObject({state:'HOLD',comparisons:[],correlationId:null});
  });
});
