import {describe,expect,it} from 'vitest';
import {QL405_CAPTURED_AT,QL405_PUBLIC_EVIDENCE,QL405_MAX_SNAPSHOT_AGE_MS,
  filterQl405Acknowledgements,reviewQl405Acknowledgements} from '../ql405AcknowledgementLedger';

const captured=Date.parse(QL405_CAPTURED_AT);
const review=(evidence=QL405_PUBLIC_EVIDENCE,now=captured+1000)=>
  reviewQl405Acknowledgements(evidence,QL405_CAPTURED_AT,now);

describe('QL-405 source-side acknowledgement and revision truth',()=>{
  it('reconciles six identities without granting a connection',()=>{
    const r=review();
    expect(r).toMatchObject({state:'PUBLIC_SNAPSHOT_CONNECTION_HELD',age:'RECENT_SNAPSHOT',
      ackMatches:4,ackDrift:2,manifestPinDrift:6,connected:0,
      individuallyVerified:0,persisted:false,networkRequests:0});
    expect(r.rows.map(row=>row.sourceId)).toEqual([
      'yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']);
    expect(r.rows.every(row=>row.connection==='HOLD'&&row.ownerProof==='HOLD'&&
      row.signedReceipt==='HOLD'&&row.manifestConnection==='DISCONNECTED / HOLD')).toBe(true);
    expect(filterQl405Acknowledgements(r.rows,'MATCH_AT_CAPTURE')).toHaveLength(4);
    expect(filterQl405Acknowledgements(r.rows,'STALE_AT_CAPTURE').map(row=>row.sourceId))
      .toEqual(['ai-data-platform','rosevear-ai-hub']);
    expect(JSON.stringify(r)).not.toMatch(/password|access_token|private_key/i);
  });
  it('requires a fresh check after one hour and detects future clock skew',()=>{
    expect(review(QL405_PUBLIC_EVIDENCE,captured+QL405_MAX_SNAPSHOT_AGE_MS+1).age)
      .toBe('STALE_OR_UNVERIFIED_SNAPSHOT');
    expect(review(QL405_PUBLIC_EVIDENCE,captured-1).age).toBe('STALE_OR_UNVERIFIED_SNAPSHOT');
    expect(review(QL405_PUBLIC_EVIDENCE,Number.NaN).age).toBe('STALE_OR_UNVERIFIED_SNAPSHOT');
  });
  it('fails closed for duplicate, missing, unknown or corrupt source evidence',()=>{
    const base=QL405_PUBLIC_EVIDENCE[0];
    for(const invalid of [
      [base,base,...QL405_PUBLIC_EVIDENCE.slice(2)],
      QL405_PUBLIC_EVIDENCE.slice(1),
      [{...base,sourceId:'camp-rosevear'},...QL405_PUBLIC_EVIDENCE.slice(1)],
      [{...base,observedMainRevision:'not-a-sha'},...QL405_PUBLIC_EVIDENCE.slice(1)],
      [{...base,manifestPath:'evil.example/rosevear-integration-manifest.json'},...QL405_PUBLIC_EVIDENCE.slice(1)],
      [{...base,handlerPath:'server/forged-ql364-source-health.mjs'},...QL405_PUBLIC_EVIDENCE.slice(1)],
      [{...base,manifestConnection:'CONNECTED'},...QL405_PUBLIC_EVIDENCE.slice(1)],
      [{...base,ownerProof:'VERIFIED'},...QL405_PUBLIC_EVIDENCE.slice(1)],
      [{...base,signedReceipt:'VERIFIED'},...QL405_PUBLIC_EVIDENCE.slice(1)]
    ]){
      const r=review(invalid as typeof QL405_PUBLIC_EVIDENCE);
      expect(r).toMatchObject({state:'INVALID_PUBLIC_EVIDENCE_HOLD',rows:[],connected:0,
        individuallyVerified:0,persisted:false,networkRequests:0});
    }
  });
});
