// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {operatorOrganizations} from '../ql191Organizations';
import {QL305_FINDINGS,QL305_MAX_CASES,ql305Append,ql305Coverage,ql305Queue,ql305Retest,ql305ValidateReference} from '../ql305FeedbackTriage';
import {Ql305FeedbackTriage} from '../Ql305FeedbackTriage';

const input={organizationId:'rosiedazzlers' as const,device:'mobile' as const,check:'focus' as const,step:'inbox' as const,finding:'FOCUS_ORDER' as const,severity:'blocker' as const,disposition:'needs_retest' as const,reference:'FOCUS_MOBILE_01'};
describe('QL-305 safe local operator feedback and accessible device retest',()=>{
  it('accepts only harmless nonsecret case references and known scoped values',()=>{
    expect(ql305ValidateReference('FOCUS_MOBILE_01')).toBeNull();
    for(const invalid of ['x','hello world','sk_secret01','token-hello','anything@sample.ca'])expect(ql305ValidateReference(invalid)).not.toBeNull();
    expect(QL305_FINDINGS).toHaveLength(5);expect(QL305_MAX_CASES).toBe(24);
    expect(()=>ql305Append([],{...input,organizationId:'unknown' as never})).toThrow('INVALID_LOCAL_FEEDBACK');
    expect(()=>ql305Append([],{...input,device:'watch' as never})).toThrow('INVALID_LOCAL_FEEDBACK');
    expect(()=>ql305Append([],{...input,step:'not-a-step' as never})).toThrow('INVALID_LOCAL_FEEDBACK');
  });
  it('preserves isolation across companies, dedupes references and sorts severity',()=>{
    const first=ql305Append([],input);
    expect(first[0].ownerVerified).toBe(false);expect(first[0].retestVerified).toBe(false);
    expect(()=>ql305Append(first,{...input,reference:'focus_mobile_01'})).toThrow('DUPLICATE_COMPANY_REFERENCE');
    const second=ql305Append(first,{...input,organizationId:'icamp',reference:'FOCUS_MOBILE_01',severity:'minor'});
    const third=ql305Append(second,{...input,reference:'CONTRAST01',severity:'major'});
    expect(ql305Queue(third,'rosiedazzlers').map(item=>item.severity)).toEqual(['blocker','major']);
    expect(ql305Queue(third,'icamp').map(item=>item.reference)).toEqual(['FOCUS_MOBILE_01']);
    expect(ql305Queue(third,'rosiedazzlers','desktop')).toHaveLength(0);
    for(const company of operatorOrganizations)expect(ql305Coverage(third,company.id).ownerVerified).toBe(0);
  });
  it('changes only scoped local disposition; cannot certify independent retest or owner acceptance',()=>{
    const first=ql305Append([],input);
    const changed=ql305Retest(first,first[0].id,'rosiedazzlers','reproduced_locally');
    expect(changed[0].disposition).toBe('reproduced_locally');expect(changed[0].ownerVerified).toBe(false);expect(changed[0].retestVerified).toBe(false);
    expect(ql305Retest(changed,first[0].id,'icamp','deferred')).toEqual(changed);
    expect(ql305Coverage(changed,'rosiedazzlers')).toMatchObject({cases:1,locallyReproduced:1,checklistTotal:15,ownerVerified:0,externalNotifications:0});
  });
  it('offers accessible local entry, company switching, and workspace navigation',async()=>{
    const onNavigate=vi.fn();const onSelectOrganization=vi.fn();
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    await act(async()=>root.render(<Ql305FeedbackTriage organizationId="rosiedazzlers" onSelectOrganization={onSelectOrganization} onNavigate={onNavigate}/>));
    const field=host.querySelector<HTMLInputElement>('.ql305-form input')!;
    await act(async()=>{field.value='MOBILE_ISSUE01';field.dispatchEvent(new Event('input',{bubbles:true}));});
    // The initial empty view still truthfully exposes no verified owner evidence.
    expect(host.textContent).toContain('OWNER EVIDENCE · NOT VERIFIED');
    expect(host.querySelectorAll('.ql305-companies button')).toHaveLength(4);
    await act(async()=>host.querySelectorAll<HTMLButtonElement>('.ql305-companies button')[2].click());
    expect(onSelectOrganization).toHaveBeenCalledWith('icamp');
    await act(async()=>root.unmount());host.remove();
  });
});
