// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OperatorShell} from '../OperatorShell';

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

describe('QL-270 modern categorized operator shell',()=>{
  it('retains all workspaces while showing only compact Operations and IT categories',()=>{
    const groups=[...host.querySelectorAll<HTMLDetailsElement>('.ql172-nav-group')];
    expect(groups).toHaveLength(5);
    expect(groups.map(g=>g.querySelector('summary')?.textContent)).toEqual([
      'Operations12','IT & Connections6','Management & Reviews5','Analytics & Status2','Advanced / Historical35']);
    expect(groups.map(g=>g.open)).toEqual([true,true,false,true,false]);
    expect(host.querySelectorAll('.ql172-nav-button')).toHaveLength(60);
    expect(host.querySelectorAll('.ql172-brand')).toHaveLength(4);
    expect(host.querySelector('.ql172-nav-search')).not.toBeNull();
  });
  it('navigates to the connection inspector and explains both supporting systems',async()=>{
    const nav=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(b=>b.textContent?.includes('Connections · six apps'))!;
    await act(async()=>nav.click());
    expect(host.querySelector('.ql270-connect')).not.toBeNull();
    expect(host.textContent).toContain('AI Data Platform');
    expect(host.textContent).toContain('Rosevear AI Hub');
    expect(host.querySelector('.ql172-context h2')?.textContent).toContain('Connections');
    expect(host.querySelectorAll('.ql270-source')).toHaveLength(6);
  });
  it('preserves high-contrast, responsive, reduced-motion and compact navigation styles',()=>{
    const css=readFileSync('src/operator/operator-shell.css','utf8');
    const connections=readFileSync('src/operator/ql270-connections.css','utf8');
    expect(css).toContain('max-height:100dvh');
    expect(css).toContain('.ql172-nav-group');
    expect(css).toContain('.ql270-config-banner');
    expect(connections).toContain('prefers-reduced-motion:reduce');
    expect(connections).toContain('forced-colors:active');
  });
});
