// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL311_SECTIONS,ql311FilteredSections,ql311NavigationSections,ql311SectionForWorkspace} from '../ql311Navigation';
import type {OperatorWorkspace} from '../ql191Organizations';

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

describe('QL-311 categorized command navigation and setup help',()=>{
  it('contains the six first-class areas plus historical archive with no duplicate or missing routes',()=>{
    const buttons=[...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')];
    const ids=buttons.map(button=>button.textContent?.trim());
    expect(buttons).toHaveLength(56);
    expect(new Set(ids).size).toBe(56);
    expect(host.querySelectorAll('[data-ql311-section]')).toHaveLength(7);
    expect(QL311_SECTIONS.map(section=>section.id)).toEqual(['front_end','admin','it','management','statistics','status','archive']);
    expect(host.querySelector('[aria-label="Workspace breadcrumb"]')?.textContent).toContain('Front End / Operator');
  });

  it('searches across collapsed archive, reveals matching route and preserves scoped navigation',async()=>{
    const search=host.querySelector<HTMLInputElement>('#ql172-nav-search')!;
    await act(async()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;setter.call(search,'Evidence recurrence & handoff continuity');search.dispatchEvent(new Event('input',{bubbles:true}));});
    expect(host.querySelector('.ql311-nav-result')?.textContent).toContain('1 matching workspace');
    const archive=host.querySelector('[data-ql311-section="archive"]')!;
    expect(archive.querySelector('.ql172-nav-items')?.hasAttribute('hidden')).toBe(false);
    const button=archive.querySelector<HTMLButtonElement>('.ql172-nav-button')!;
    await act(async()=>button.click());
    expect(host.querySelector('.ql172-context h2')?.textContent).toContain('Evidence recurrence & handoff continuity');
    expect(host.querySelector('.ql311-breadcrumb')?.textContent).toContain('Advanced / Historical');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
  });

  it('opens and closes categories and keeps workspace guide and safe setup instructions accessible',async()=>{
    const admin=host.querySelector<HTMLButtonElement>('[data-ql311-section="admin"] .ql311-nav-toggle')!;
    expect(admin.getAttribute('aria-expanded')).toBe('false');
    await act(async()=>admin.click());
    expect(admin.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('[data-ql311-section="admin"] .ql172-nav-items')?.hasAttribute('hidden')).toBe(false);
    expect(host.querySelector('.ql311-workspace-guide summary')?.textContent).toContain('About this area');
    expect(host.querySelector('.ql311-sidebar-help')?.textContent).toContain('Supabase login is optional');
    expect(host.querySelector('.ql172-status')?.textContent).toContain('DISABLED PREVIEW');
  });

  it('helper keeps both the active category and historical fallback explicit',()=>{
    const entries=[{id:'dashboard' as OperatorWorkspace,label:'Dashboard',description:'Company home'},
      {id:'receipt_handoff' as OperatorWorkspace,label:'Receipt handoff',description:'Historical'}];
    const sections=ql311NavigationSections(entries);
    expect(ql311SectionForWorkspace(sections,'dashboard').id).toBe('front_end');
    expect(ql311SectionForWorkspace(sections,'receipt_handoff').id).toBe('archive');
    expect(ql311FilteredSections(sections,'historical').flatMap(section=>section.items)).toHaveLength(1);
  });
});
