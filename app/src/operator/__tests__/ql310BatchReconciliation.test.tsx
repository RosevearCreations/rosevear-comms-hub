// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {QL310_RELEASE_RECEIPTS,QL310_SIGNOFF_GATES,ql310EvidenceReadback,ql310LocalReviewDraft,ql310ManagementReadback,ql310ReceiptLinks} from '../ql310BatchReconciliation';
import {Ql310BatchReconciliation} from '../Ql310BatchReconciliation';

describe('QL-310 software batch reconciliation and unsigned management readback',()=>{
  it('reconciles closed QL-290–304 and five separately verified prior software releases',()=>{
    expect(QL310_RELEASE_RECEIPTS.map(row=>row.id)).toEqual(['QL-305','QL-306','QL-307','QL-308','QL-309']);
    expect(QL310_SIGNOFF_GATES).toHaveLength(5);
    expect(QL310_RELEASE_RECEIPTS.every(row=>/^[a-f0-9]{40}$/.test(row.sha))).toBe(true);
    for(const row of QL310_RELEASE_RECEIPTS){const links=ql310ReceiptLinks(row.id);expect(links.commit).toContain(row.sha);expect(links.pr).toContain(`/pull/${row.pr}`);}
    expect(ql310EvidenceReadback()).toEqual({closedHistoricalBatch:15,closedHistoricalTarget:15,separateVerifiedReleases:5,totalVerifiedSoftwareReleases:20,releasesPinned:true,proofCoverage:true,missingOriginalProofs:6,mockContractCases:28,contractSafe:true,preflightSources:6,preflightSourceLineage:true,independentGatesRequired:5,ownerSignoffs:0,independentlyAcceptedProofs:0,connectedSources:0,realGatewayGETs:0,releaseStatus:'SOFTWARE_RELEASE_GREEN',operationalStatus:'NO_GO_DISCONNECTED_HOLD',acknowledgements:'UNDER_REVIEW / PARKED_FOR_LATER'});
  });
  it('keeps any local follow-up separate from signed owner acceptance and integration authorization',()=>{
    const valid=ql310LocalReviewDraft(' BATCH_310_A ','INDEPENDENT_EVIDENCE_REQUIRED');
    expect(valid.error).toBeNull();expect(valid.review).toEqual({reference:'BATCH_310_A',route:'INDEPENDENT_EVIDENCE_REQUIRED'});
    const readback=ql310ManagementReadback(valid.review!);
    expect(readback).toMatchObject({outcome:'NOT_OWNER_SIGNED',localReference:'BATCH_310_A',localRoute:'INDEPENDENT_EVIDENCE_REQUIRED',noOwnerDecision:true,externalMessages:0,permissionsGranted:0,sourcesDisconnected:6});
    expect(readback.summary).toContain('0 independent owner sign-offs');
    for(const ref of ['sk-secret','eyJhbGci','https://example.com','x','private receipt'])expect(ql310LocalReviewDraft(ref,'AWAIT_OWNER_WALKTHROUGH').error).not.toBeNull();
    expect(ql310LocalReviewDraft('BATCH_310_A','UNKNOWN' as never).error).toBe('Invalid review route');
    expect(()=>ql310ReceiptLinks('QL-999' as never)).toThrow('UNKNOWN_RELEASE');
  });
  it('renders Management reconciliation with 5 receipt links, 5 unverified external gates, local-only review',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    await act(async()=>root.render(<Ql310BatchReconciliation/>));
    expect(host.querySelectorAll('.ql310-table tbody tr')).toHaveLength(5);
    expect(host.querySelectorAll('.ql310-review li')).toHaveLength(5);
    expect(host.textContent).toContain('20 / 20');expect(host.textContent).toContain('NOT_OWNER_SIGNED');
    expect(host.querySelectorAll('.ql310-table a')).toHaveLength(10);
    const input=host.querySelector<HTMLInputElement>('#ql310-reference')!;
    await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'BATCH_310_A');input.dispatchEvent(new Event('input',{bubbles:true}));});
    await act(async()=>host.querySelector<HTMLFormElement>('.ql310-signoff')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(host.textContent).toContain('Local reference BATCH_310_A');
    expect(host.textContent).toContain('still NOT SIGNED');
    await act(async()=>root.unmount());host.remove();
  });
});
