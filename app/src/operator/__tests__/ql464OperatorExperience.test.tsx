// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {Ql464OperatorExperience} from '../Ql464OperatorExperience';
import {ql464Sources,ql464SourceStatus,ql464SampleTasks,ql464TaskMatches} from '../ql464OperatorSource';

describe('QL-464 operator source truth and accessibility',()=>{
  it('keeps seven peers unverified and sample tasks source-isolated',()=>{
    expect(ql464Sources).toHaveLength(7);
    expect(new Set(ql464Sources.map(s=>s.id)).size).toBe(7);
    ql464Sources.forEach(s=>expect(ql464SourceStatus(s.id)).toBe('UNVERIFIED'));
    expect(ql464SampleTasks.filter(t=>ql464TaskMatches(t,'','icamp'))).toHaveLength(1);
    expect(ql464SampleTasks.filter(t=>ql464TaskMatches(t,'','devilndove'))).toHaveLength(0);
    expect(ql464SampleTasks.filter(t=>ql464TaskMatches(t,'Windows','all'))).toHaveLength(1);
  });
  it('renders honest timeline, labelled controls, safe review toggles and keyboard shortcut',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    try{
      await act(async()=>root.render(<Ql464OperatorExperience/>));
      expect(host.querySelectorAll('.ql464-sources [role="listitem"]')).toHaveLength(7);
      expect(host.querySelectorAll('.ql464-timeline li')).toHaveLength(4);
      expect(host.textContent).toContain('Accepted baseline: not independently established');
      expect(host.textContent).toContain('No signed live peer or incident feed');
      expect(host.textContent).not.toContain('10pp achieved');
      expect(host.querySelectorAll('.ql464-tasks button')).toHaveLength(3);
      const button=host.querySelector<HTMLButtonElement>('.ql464-tasks button')!;
      await act(async()=>button.click());
      expect(button.getAttribute('aria-pressed')).toBe('true');
      await act(async()=>button.click());
      expect(button.getAttribute('aria-pressed')).toBe('false');
      const section=host.querySelector<HTMLElement>('.ql464')!;
      const search=host.querySelector<HTMLInputElement>('#ql464-search')!;
      await act(async()=>section.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true})));
      expect(document.activeElement).toBe(search);
      expect(search.getAttribute('aria-keyshortcuts')).toBe('/');
      expect(host.querySelector('label[for="ql464-app"]')).not.toBeNull();
    }finally{await act(async()=>root.unmount());host.remove();}
  });
});
