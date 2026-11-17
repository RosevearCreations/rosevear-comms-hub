// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {Ql465PrivacyReadiness} from '../Ql465PrivacyReadiness';
describe('QL-465 public-safe operator privacy readiness',()=>{
 it('marks owner and runtime acceptance held, with no fake privacy execution',async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  const host=document.createElement('div');document.body.append(host);
  const root=createRoot(host);
  try{
   await act(async()=>root.render(<Ql465PrivacyReadiness/>));
   expect(host.querySelectorAll('.ql465-readiness [role="listitem"]')).toHaveLength(5);
   expect(host.textContent).toContain('NOT ACTIVATED');
   expect(host.textContent).toContain('Runtime acceptance: HOLD');
   expect(host.textContent).toContain('no live customer records');
   expect(host.querySelectorAll('button')).toHaveLength(0);
   const selector=host.querySelector<HTMLSelectElement>('#ql465-control-select')!;
   expect(selector).toBeTruthy();
   await act(async()=>{selector.value='consent';selector.dispatchEvent(new Event('change',{bubbles:true}));});
   expect(host.querySelector('.ql465-guide article')?.textContent).toContain('Signed consent-withdrawal receipts');
   await act(async()=>{selector.value='subject-requests';selector.dispatchEvent(new Event('change',{bubbles:true}));});
   expect(host.querySelector('.ql465-guide article')?.textContent).toContain('no customer export or erasure');
  }finally{await act(async()=>root.unmount());host.remove();}
 });
});
