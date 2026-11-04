// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Ql332CustodyControl} from '../Ql332CustodyControl';
import {QL332_BOOTSTRAP_STEPS,QL332_PREFLIGHT,ql332ReleaseReadiness,
  ql332ReviewGate,type Ql332Check} from '../ql332CustodyReadiness';

let host:HTMLDivElement;
let root:Root;
beforeEach(()=>{
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(()=>{act(()=>root.unmount());host.remove();});
async function render(mode:'it_command'|'management'|'analytics'|'system_status'='it_command'){
  await act(async()=>root.render(<Ql332CustodyControl mode={mode}/>));
}
async function choose(selector:string,value:string){
  await act(async()=>{const el=host.querySelector<HTMLSelectElement>(selector)!;
    el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));});
}
describe('QL-332 key custody fail-closed operator and registry',()=>{
  it('reports real preflight as zero trust/enrolled handles and six disconnected sources',()=>{
    expect(ql332ReleaseReadiness()).toMatchObject({sources:6,businessShells:4,supportingServices:2,
      allHeld:true,enrolledWorkloads:0,pinnedVerifiedIssuers:0,managedHandles:0,
      custodyStatus:'KEY CUSTODY HOLD',sourceConnections:0,externalKeyReads:0,externalWrites:0});
    expect(QL332_PREFLIGHT).toMatchObject({vaultExtensionObserved:'0.3.1',
      ownerAuthUsersAtPreflight:0,windowsRelay:'OFF',ack:'UNDER_REVIEW / PARKED_FOR_LATER'});
    expect(QL332_BOOTSTRAP_STEPS).toHaveLength(6);
  });
  it('denies unknown/child source, spoofed issuer, missing source authority and child reads',()=>{
    expect(ql332ReviewGate('rosevear-landscaping','rotation').verdict).toBe('HOLD_UNKNOWN_SHELL');
    for(const id of ['yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']){
      for(const check of ['fingerprint','rotation','source','emergency','child'] as Ql332Check[]){
        const outcome=ql332ReviewGate(id,check);
        expect(outcome.verdict).toMatch(/^HOLD_/);
        expect(outcome).toMatchObject({keyReads:0,sourceCalls:0,enrolledKeys:0,permissionsAdded:0});
      }
    }
  });
  it('shows honest status in I.T., Management, Analytics and Status',async()=>{
    for(const mode of ['it_command','management','analytics','system_status'] as const){
      await render(mode);
      expect(host.textContent).toContain('KEY CUSTODY HOLD');
      expect(host.textContent).toContain('0 / 6 CONNECTED');
      expect(host.textContent).toContain('no approved live keys');
    }
  });
  it('updates local gates without authentication, secrets, network or writes',async()=>{
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    try{
      await render();
      await choose('#ql332-source','icamp');
      await choose('#ql332-check','child');
      expect(host.querySelector('.ql332-decision')?.textContent).toContain('HOLD_NO_CHILD_AUTHORITY');
      await choose('#ql332-source','ai-data-platform');
      expect(host.querySelector('.ql332-decision')?.textContent).toContain('never customer child');
      await choose('#ql332-check','fingerprint');
      expect(host.querySelector('.ql332-decision')?.textContent).toContain('HOLD_ISSUER_UNVERIFIED');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(window.localStorage.length).toBe(0);
    }finally{fetchSpy.mockRestore();}
  });
  it('allows accessible checklist expansion and reset without any external effect',async()=>{
    await render();
    const button=host.querySelector<HTMLButtonElement>('.ql332-toggle')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    await act(async()=>button.click());
    expect(host.querySelectorAll('#ql332-steps li')).toHaveLength(6);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await act(async()=>button.click());
    expect(host.querySelector('#ql332-steps')).toBeNull();
  });
  it('has responsive and high-contrast style, only nonsecret client-side code',()=>{
    const css=readFileSync('src/operator/ql332-custody-control.css','utf8');
    const ui=readFileSync('src/operator/Ql332CustodyControl.tsx','utf8');
    const model=readFileSync('src/operator/ql332CustodyReadiness.ts','utf8');
    for(const value of ['min-height:44px',':focus-visible','max-width:1100px',
      'max-width:680px','forced-colors:active','prefers-reduced-motion:reduce'])expect(css).toContain(value);
    for(const value of ['aria-labelledby','aria-live','role="note"','aria-expanded'])expect(ui).toContain(value);
    expect(model+ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
    expect(model+ui).not.toMatch(/\b(service_role|decrypted_secret|private_key)\b/);
    expect(model+ui).not.toContain('.auth.getSession()');
  });
});
