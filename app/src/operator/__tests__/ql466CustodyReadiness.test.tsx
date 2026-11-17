// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {Ql466CustodyReadiness} from '../Ql466CustodyReadiness';
describe('QL-466 accurate Master worker and sink readiness',()=>{
 it('reports missing live sink and holds reboot without any activation controls',async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  const host=document.createElement('div');document.body.append(host);
  const root=createRoot(host);
  try{
   await act(async()=>root.render(<Ql466CustodyReadiness/>));
   expect(host.querySelectorAll('[role="listitem"]')).toHaveLength(5);
   expect(host.textContent).toContain('REBOOT AUTHORIZATION: HOLD');
   expect(host.textContent).toContain('NOT IMPLEMENTED');
   expect(host.textContent).toContain('HOLD / UNKNOWN');
   expect(host.textContent).toContain('ql340c-windows-operator.ps1 -Start');
   expect(host.textContent).toContain('No automatic service installation');
   expect(host.querySelectorAll('button')).toHaveLength(0);
   expect(host.getAttribute('data-ql466-live')).toBeNull();
   expect(host.querySelector('[data-ql466-live="false"]')).not.toBeNull();
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
