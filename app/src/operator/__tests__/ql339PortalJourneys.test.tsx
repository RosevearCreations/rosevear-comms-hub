// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Ql339PortalJourneys} from '../Ql339PortalJourneys';

let host:HTMLDivElement;let root:Root;
beforeEach(()=>{
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();});
describe('QL-339 public portal truth',()=>{
  it('renders all four separate business scopes, no customer payloads or false active connections',async()=>{
    const network=vi.spyOn(globalThis,'fetch');
    await act(async()=>root.render(<Ql339PortalJourneys/>));
    expect(host.querySelectorAll('[role="listitem"]')).toHaveLength(4);
    for(const name of ['Yard Workers','iCamp','Rosie Dazzlers','Devil n Dove'])
      expect(host.textContent).toContain(name);
    expect(host.textContent).toContain('TEST · DISCONNECTED / HOLD');
    expect(host.textContent).toContain('no live customer records');
    expect(host.textContent).toContain('cross-business 403');
    expect(host.textContent).toContain('source-app owner controls');
    expect(network).not.toHaveBeenCalled();
    const link=host.querySelector<HTMLAnchorElement>('.ql339-action a')!;
    expect(link.href).toContain('QL-339_CHILD_SAFE_PORTAL_CONSENT_HOLD.md');
    expect(link.rel).toBe('noopener noreferrer');
  });
});
