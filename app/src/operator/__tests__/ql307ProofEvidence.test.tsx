// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {QL307_PUBLIC_RECHECK,ql307ClassifyPublicStatus,ql307IntakeDraft,ql307ReferenceError,ql307ReviewSummary} from '../ql307ProofEvidence';
import {Ql307ProofEvidence} from '../Ql307ProofEvidence';

describe('QL-307 immutable source proof and independent reference intake',()=>{
  it('preserves six pinned 404 observations as unauthenticated public evidence only',()=>{
    expect(QL307_PUBLIC_RECHECK).toHaveLength(6);
    expect(new Set(QL307_PUBLIC_RECHECK.map(row=>row.source)).size).toBe(6);
    for(const row of QL307_PUBLIC_RECHECK){expect(row.http).toBe(404);expect(row.priorHttp).toBe(404);expect(row.sha).toMatch(/^[a-f0-9]{40}$/);expect(row.url).toContain(`?ref=${row.sha}`);expect(row.url).not.toContain('ref=main');}
    expect(ql307ClassifyPublicStatus(404)).toBe('MISSING_404');
    expect(ql307ClassifyPublicStatus(200)).toBe('PUBLIC_FILE_PRESENT_UNVERIFIED');
    for(const code of [401,403,429])expect(ql307ClassifyPublicStatus(code)).toBe('GITHUB_RATE_LIMITED_OR_FORBIDDEN');
    expect(ql307ClassifyPublicStatus(null)).toBe('NETWORK_ERROR');
  });
  it('rejects private content, invalid sources and duplicate references without approving gates',()=>{
    for(const input of ['sk-secret','token_abc','https://example.org','ab','private evidence','eyJhbGci'])expect(ql307ReferenceError(input)).not.toBeNull();
    const first=ql307IntakeDraft('rosiedazzlers','ORIGINAL_PROOF_B',' CASE_307_A ',[]);
    expect(first.error).toBeNull();expect(first.entry).toMatchObject({source:'rosiedazzlers',reference:'CASE_307_A',state:'AWAITING_INDEPENDENT_VERIFICATION'});
    const entries=[first.entry!];
    expect(ql307IntakeDraft('rosiedazzlers','ORIGINAL_PROOF_B','CASE_307_A',entries).error).toContain('already');
    expect(ql307IntakeDraft('unknown' as never,'ORIGINAL_PROOF_B','CASE_307_B',entries).error).toBe('Unknown source');
    expect(ql307IntakeDraft('icamp','bad' as never,'CASE_307_B',entries).error).toBe('Unknown evidence type');
    expect(ql307ReviewSummary(entries)).toMatchObject({sources:6,missing:6,pending:1,independentlyVerified:0,approvedGates:0,requiredGates:5,privateGatewayRequests:0,notificationsSent:0,connectionEnabled:false,release:'DISCONNECTED / HOLD'});
  });
  it('shows accessible source-isolated intake and local-only dispositions',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    await act(async()=>root.render(<Ql307ProofEvidence/>));
    expect(host.querySelectorAll('.ql307-table tbody tr')).toHaveLength(6);
    const input=host.querySelector<HTMLInputElement>('#ql307-reference')!;
    // Set through the native setter so React observes the controlled input event.
    await act(async()=>{const native=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;native.call(input,'CASE_307_A');input.dispatchEvent(new Event('input',{bubbles:true}));});
    await act(async()=>host.querySelector<HTMLFormElement>('.ql307 form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(host.textContent).toContain('1 reference(s)');
    expect(host.textContent).toContain('CASE_307_A');
    const source=host.querySelector<HTMLSelectElement>('#ql307-source')!;
    await act(async()=>{source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('0 reference(s) for iCamp');
    expect(host.textContent).toContain('0 / 5');
    await act(async()=>root.unmount());host.remove();
  });
});
