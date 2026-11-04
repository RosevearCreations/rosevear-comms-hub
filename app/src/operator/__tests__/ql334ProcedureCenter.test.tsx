// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Ql334ProcedureCenter} from '../Ql334ProcedureCenter';
import {QL334_CONNECTIONS,QL334_PUBLIC_READBACK,QL334_STAGES} from '../ql334ProcedureTruth';

let host:HTMLDivElement;let root:Root;
beforeEach(()=>{
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(()=>{act(()=>root.unmount());host.remove();});
async function render(){await act(async()=>root.render(<Ql334ProcedureCenter/>));}

describe('QL-334 six-source connection centre and private procedure boundaries',()=>{
  it('shows all real source manifests, but no fabricated private authorization',()=>{
    expect(QL334_CONNECTIONS).toHaveLength(6);
    expect(new Set(QL334_CONNECTIONS.map(s=>s.id)).size).toBe(6);
    expect(QL334_CONNECTIONS.every(s=>s.manifestUrl.startsWith('https://github.com/RosevearCreations/'))).toBe(true);
    expect(QL334_PUBLIC_READBACK).toMatchObject({observedSourceManifests:6,procedureTemplates:18,
      verifiedWorkloads:0,ownerApprovals:0,activePrivateConnections:0,privateJobsQueued:0,
      communicationsEnabled:false});
  });
  it('renders navigation to every actual GitHub source manifest and verified app pages',async()=>{
    await render();
    const selector=host.querySelectorAll<HTMLButtonElement>('.ql334-sources button');
    expect(selector).toHaveLength(6);
    for(let i=0;i<selector.length;i++){
      await act(async()=>selector[i].click());
      const source=QL334_CONNECTIONS[i];
      expect(host.querySelector<HTMLAnchorElement>('a[href*=".well-known/"]')?.href).toBe(source.manifestUrl);
      expect(host.textContent).toContain(source.name);
      expect(host.textContent).toContain('PRIVATE CONNECTION HOLD');
      if(source.integrationUrl)expect(host.querySelector(`a[href="${source.integrationUrl}"]`)).toBeTruthy();
    }
  });
  it('exposes every mandatory stage and recovery reason without touching storage or network',async()=>{
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    try{
      await render();
      const toggle=host.querySelector<HTMLButtonElement>('.ql334-details-button')!;
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      await act(async()=>toggle.click());
      expect(host.querySelectorAll('#ql334-stages li')).toHaveLength(QL334_STAGES.length);
      expect(host.textContent).toContain('No owner-enrolled private approval');
      await act(async()=>toggle.click());
      expect(host.querySelector('#ql334-stages')).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(window.localStorage.length).toBe(0);
    }finally{fetchSpy.mockRestore();}
  });
  it('keeps its public UI static, responsive and keyboard-visible',()=>{
    const css=readFileSync('src/operator/ql334-procedure-center.css','utf8');
    const ui=readFileSync('src/operator/Ql334ProcedureCenter.tsx','utf8');
    expect(css).toContain('min-height:44px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(ui).toContain('aria-live="polite"');
    expect(ui).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*\(/);
  });
});
