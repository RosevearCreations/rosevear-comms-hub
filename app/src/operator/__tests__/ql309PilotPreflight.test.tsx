// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {QL309_PACKET_ROWS,QL309_REQUIRED_EVIDENCE,ql309PacketText,ql309PreflightPacket,ql309PreflightSummary,ql309RecordLocalReview} from '../ql309PilotPreflight';
import {Ql309PilotPreflight} from '../Ql309PilotPreflight';

describe('QL-309 read-only nonproduction pilot preflight decision packet',()=>{
  it('builds six NO-GO packets from actual pinned public source and synthetic contract lineage',()=>{
    expect(QL309_PACKET_ROWS).toHaveLength(6);expect(QL309_REQUIRED_EVIDENCE).toHaveLength(5);
    expect(new Set(QL309_PACKET_ROWS.map(row=>row.id)).size).toBe(6);
    for(const row of QL309_PACKET_ROWS){const packet=ql309PreflightPacket(row.id);
      expect(packet.proofHttp).toBe(404);expect(packet.proofSha).toMatch(/^[a-f0-9]{40}$/);
      expect(packet.proofUrl).toContain(`?ref=${packet.proofSha}`);
      expect(packet.checks).toHaveLength(5);
      expect(packet.checks.every(item=>item.state==='NOT_VERIFIED')).toBe(true);
      expect(packet).toMatchObject({outcome:'NO_GO_REQUIRES_EXTERNAL_VERIFICATION',grant:'NONE',requestCount:0,externalSends:0,ownerApproval:false,signedProofAccepted:false,reviewerAuthenticated:false,credentialPresent:false,customerDataAccess:false,enabled:false,connection:'DISCONNECTED / HOLD'});
    }
    const summary=ql309PreflightSummary();
    expect(summary).toEqual({sources:6,businesses:4,supporting:2,missingProofs:6,requiredPerSource:5,independentlyVerified:0,ownerApproved:0,localReviews:0,sourceGETs:0,connections:0,externalSends:0,isolatedMockContractCases:28,release:'DISCONNECTED / HOLD'});
    expect(()=>ql309PreflightPacket('invalid' as never)).toThrow('UNKNOWN_SOURCE');
  });
  it('allows only source-scoped local nonsecret follow-up and never certifies evidence',()=>{
    const first=ql309RecordLocalReview([],'rosiedazzlers',' PREFLIGHT_309_A ','REFER_TO_INDEPENDENT_REVIEWER');
    expect(first.error).toBeNull();expect(first.entries).toHaveLength(1);
    expect(first.entries[0]).toEqual({source:'rosiedazzlers',reference:'PREFLIGHT_309_A',disposition:'REFER_TO_INDEPENDENT_REVIEWER'});
    const second=ql309RecordLocalReview(first.entries,'icamp','PREFLIGHT_309_B','OWNER_DECISION_REQUIRED');
    expect(second.entries).toHaveLength(2);
    expect(ql309PreflightPacket('rosiedazzlers',second.entries[0]).outcome).toBe('NO_GO_REQUIRES_EXTERNAL_VERIFICATION');
    expect(ql309PreflightPacket('rosiedazzlers',second.entries[1]).reviewReference).toBeNull();
    expect(ql309PreflightSummary(second.entries).localReviews).toBe(2);
    expect(ql309PacketText('rosiedazzlers',second.entries[0])).toContain('UNSENT / UNAUTHORIZED');
    expect(ql309PacketText('rosiedazzlers',second.entries[0])).toContain('no credential, no owner TEST authorization');
    expect(ql309RecordLocalReview(first.entries,'rosiedazzlers','sk-secret','OWNER_DECISION_REQUIRED').error).not.toBeNull();
    expect(ql309RecordLocalReview(first.entries,'invalid' as never,'PREFLIGHT_309_C','OWNER_DECISION_REQUIRED').error).toBe('Unknown source');
    expect(ql309RecordLocalReview(first.entries,'rosiedazzlers','PREFLIGHT_309_C','bad' as never).error).toBe('Unknown review disposition');
  });
  it('renders accessible source-specific NO-GO and unsent decision packet',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    await act(async()=>root.render(<Ql309PilotPreflight/>));
    expect(host.querySelectorAll('.ql309-table tbody tr')).toHaveLength(6);
    expect(host.querySelectorAll('.ql309-inspector li')).toHaveLength(5);
    expect(host.querySelector<HTMLTextAreaElement>('.ql309-packet textarea')?.value).toContain('NO_GO_REQUIRES_EXTERNAL_VERIFICATION');
    const input=host.querySelector<HTMLInputElement>('#ql309-reference')!;
    await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'PREFLIGHT_309_A');input.dispatchEvent(new Event('input',{bubbles:true}));});
    await act(async()=>host.querySelector<HTMLFormElement>('.ql309 form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(host.textContent).toContain('Source has a local follow-up');
    const select=host.querySelector<HTMLSelectElement>('#ql309-source')!;
    await act(async()=>{select.value='icamp';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.querySelector<HTMLTextAreaElement>('.ql309-packet textarea')?.value).toContain('Source: iCamp');
    expect(host.textContent).toContain('0/5 accepted gates');
    await act(async()=>root.unmount());host.remove();
  });
});
