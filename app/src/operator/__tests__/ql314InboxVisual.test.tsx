// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {inboxForOrganization} from '../ql192InboxFixtures';
import {defaultInboxTriageFilters,filterInboxTriage} from '../ql292InboxTriage';
import {activeInboxTriageFilterChips,describeInboxTriagePreset,removeInboxTriageFilter} from '../ql314InboxPresentation';

let root:Root,host:HTMLDivElement;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();
  host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();window.localStorage.clear();vi.restoreAllMocks();});

async function click(label:string,selector='button'){
  const target=[...host.querySelectorAll<HTMLButtonElement>(selector)].find(x=>x.textContent?.includes(label));
  expect(target,`Expected ${label} in ${selector}`).toBeDefined();
  await act(async()=>target!.click());
}
async function select(id:string,value:string){
  const target=host.querySelector<HTMLSelectElement>(`#${id}`)!;
  expect(target).not.toBeNull();
  await act(async()=>{target.value=value;target.dispatchEvent(new Event('change',{bubbles:true}));});
}
async function search(value:string){
  const target=host.querySelector<HTMLInputElement>('#ql192-search')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(target,value);target.dispatchEvent(new Event('input',{bubbles:true}));});
}
async function openInbox(){await click('Unified inbox','.ql172-nav-button');}

describe('QL-314 pure visual triage and saved-view readback',()=>{
  it('models each non-default filter as one ordered, individually removable text chip',()=>{
    const source={...defaultInboxTriageFilters(),search:'subject:"winter salt"',lane:'attention' as const,view:'unread' as const,owner:'unassigned' as const,status:'needs_reply' as const,sort:'subject' as const};
    const chips=activeInboxTriageFilterChips(source);
    expect(chips.map(chip=>chip.key)).toEqual(['search','lane','view','owner','status']);
    expect(chips.find(chip=>chip.key==='owner')?.value).toBe('Unassigned in demo');
    const next=removeInboxTriageFilter(source,'owner');
    expect(next.owner).toBe('all');
    expect(next.search).toBe(source.search);
    expect(next.sort).toBe('subject');
    expect(activeInboxTriageFilterChips(defaultInboxTriageFilters())).toHaveLength(0);
  });

  it('only describes valid current-business saved views and never leaks cross-brand preset labels',()=>{
    const filters={...defaultInboxTriageFilters(),lane:'attention' as const,priority:'high' as const};
    const preset={version:1,organizationId:'rosiedazzlers',filters};
    expect(describeInboxTriagePreset(preset,'rosiedazzlers')).toContain('2 active filters');
    expect(describeInboxTriagePreset(preset,'devilndove')).toBe('No valid view saved in this slot.');
    expect(describeInboxTriagePreset({...preset,version:2},'rosiedazzlers')).toBe('No valid view saved in this slot.');
  });

  it('keeps lane counters independent of combined-filter results for all four businesses',()=>{
    for(const business of ['rosiedazzlers','devilndove','yw','icamp'] as const){
      const all=inboxForOrganization(business);
      expect(all).toHaveLength(5);
      const filtered=filterInboxTriage(all,business,{...defaultInboxTriageFilters(),lane:'attention',owner:'unassigned'});
      expect(filtered.every(thread=>thread.organizationId===business)).toBe(true);
      expect(filtered.length).toBeLessThan(all.length);
    }
  });
});

describe('QL-314 actual operator inbox presentation',()=>{
  it('explains independent lane totals and exposes source, owner, status, priority and safe next action',async()=>{
    await openInbox();
    const area=host.querySelector<HTMLElement>('.ql314-inbox')!;
    expect(area.dataset.ql314Release).toContain('visual-triage');
    expect(area.querySelector('.ql292-lane-heading')?.textContent).toContain('before filters');
    expect(area.querySelectorAll('.ql292-lane')).toHaveLength(5);
    expect(area.querySelectorAll('.ql314-thread')).toHaveLength(5);
    expect(area.querySelectorAll('.ql314-source-badge')).toHaveLength(5);
    expect(area.querySelectorAll('.ql314-owner-badge')).toHaveLength(5);
    expect(area.querySelectorAll('.ql314-thread-tags .ql314-priority-high,.ql314-thread-tags .ql314-priority-normal')).toHaveLength(5);
    expect(area.querySelector('.ql314-result-toolbar')?.textContent).toContain('5 of 5 synthetic conversations');
    expect(area.querySelector('.ql314-result-toolbar')?.textContent).toContain('3 unread');
    expect(area.querySelector('.ql314-preview-loaded')?.textContent).toContain('no provider sync');
  });

  it('removes exactly one filter chip and reconciles combined results without clearing other choices',async()=>{
    await openInbox();
    await click('Priority now','.ql292-lane');
    await select('ql292-owner','unassigned');
    expect(host.querySelectorAll('.ql314-thread')).toHaveLength(1);
    const chips=[...host.querySelectorAll<HTMLButtonElement>('.ql314-filter-chip')];
    expect(chips.map(x=>x.getAttribute('aria-label'))).toEqual(['Remove Lane filter: Priority now','Remove Demo owner filter: Unassigned in demo']);
    await act(async()=>chips[1].click());
    expect(host.querySelectorAll('.ql314-thread')).toHaveLength(2);
    expect(host.querySelector<HTMLSelectElement>('#ql292-owner')?.value).toBe('all');
    expect(host.querySelector('.ql292-lane.active')?.textContent).toContain('Priority now');
    await click('Clear all filters','.ql314-clear-all');
    expect(host.querySelectorAll('.ql314-thread')).toHaveLength(5);
    expect(host.querySelectorAll('.ql314-filter-chip')).toHaveLength(0);
    expect(host.querySelector('.ql314-default-filter-note')?.textContent).toContain('eligible');
  });

  it('shows a distinct filtered-empty state with recovery; never pretends provider loading or failure',async()=>{
    await openInbox();
    await search('subject:"ceramic coating"');
    await select('ql292-priority','high');
    const empty=host.querySelector<HTMLElement>('.ql314-empty')!;
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('No matching sample conversations');
    expect(empty.textContent).toContain('not a provider loading or delivery error');
    expect(host.querySelectorAll('.ql314-filter-chip')).toHaveLength(2);
    await click('Clear filters','.ql314-empty button');
    expect(host.querySelectorAll('.ql314-thread')).toHaveLength(5);
  });

  it('reads back saved-view filter counts and restores tab-only filters without network or storage',async()=>{
    await openInbox();
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    await click('Priority now','.ql292-lane');
    await select('ql292-status','needs_reply');
    await click('Save current filters','.ql292-preset-actions button');
    expect(host.querySelector('.ql292-preset-status')?.textContent).toContain('2 active filters');
    await click('Dashboard','.ql172-nav-button');
    await openInbox();
    expect(host.querySelectorAll('.ql314-filter-chip')).toHaveLength(0);
    await click('Restore saved view','.ql292-preset-actions button');
    expect(host.querySelectorAll('.ql314-filter-chip')).toHaveLength(2);
    expect(host.querySelector<HTMLSelectElement>('#ql292-status')?.value).toBe('needs_reply');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('never carries one business filter or saved view into another business',async()=>{
    await openInbox();
    await search('salt');
    await click('Save current filters','.ql292-preset-actions button');
    await click('iCamp','.ql172-brand');
    expect(host.querySelector('.ql314-inbox')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.querySelectorAll('.ql314-thread')).toHaveLength(5);
    expect(host.querySelector('.ql292-preset-status')?.textContent).toContain('No valid view');
    expect(host.querySelectorAll('.ql314-filter-chip')).toHaveLength(0);
    expect(host.textContent).not.toContain('Interior salt-stain question');
  });

  it('renders separate scoped five-thread triage lists and visible demo badges for all four businesses',async()=>{
    await openInbox();
    const matrix:[string,string,string][]=[
      ['Rosie Dazzlers','rosiedazzlers','Interior salt-stain question'],
      ['Devil n Dove','devilndove','Engraved keepsake timing'],
      ['iCamp','icamp','Tent-site availability'],
      ['YW · Property Maintenance','yw','Snow plow service window']
    ];
    for(const [label,id,subject] of matrix){
      await click(label,'.ql172-brand');
      expect(host.querySelector('.ql314-inbox')?.getAttribute('data-organization')).toBe(id);
      expect(host.querySelectorAll('.ql314-thread')).toHaveLength(5);
      expect(host.querySelectorAll('.ql314-owner-badge')).toHaveLength(5);
      expect(host.querySelector('.ql192-thread-list')?.textContent).toContain(subject);
      expect(host.querySelector('.ql314-result-toolbar')?.textContent).toContain('5 of 5');
    }
  });

  it('labels missing saved-view recovery as safe default, never as a successful restore',async()=>{
    await openInbox();
    await click('Restore saved view','.ql292-preset-actions button');
    expect(host.querySelector('.ql314-preset-recovery')?.textContent).toContain('unavailable or invalid');
    expect(host.querySelector('.ql314-preset-recovery')?.textContent).toContain('safe default');
    expect(host.querySelectorAll('.ql314-filter-chip')).toHaveLength(0);
  });

  it('documents in-place help, responsive visual components, contrast and reduced motion',async()=>{
    await openInbox();
    await click('ⓘ Help','.ql192-inbox-header button');
    expect(host.querySelector('#ql192-inbox-help')?.textContent).toContain('Remove any active filter chip separately');
    expect(host.querySelector('#ql192-inbox-help')?.textContent).toContain('No live inbox');
    const css=readFileSync('src/operator/ql314-inbox-visual.css','utf8');
    for(const fragment of ['--ql312-cyan','--ql312-violet','--ql312-gold','--ql312-green','min-height:44px','max-width:620px','forced-colors:active','prefers-reduced-motion:reduce',':focus-visible'])expect(css).toContain(fragment);
    const matrix=JSON.parse(readFileSync('../docs/visual/ql314-inbox-visual-capture-matrix.json','utf8')) as {captureStatus:string;viewportWidths:number[];businesses:string[];scenarioNames:string[]};
    expect(matrix.captureStatus).toBe('PENDING_BROWSER_CAPTURE');
    expect(matrix.viewportWidths).toEqual([320,375,768,1024,1440]);
    expect(matrix.businesses).toEqual(['rosiedazzlers','devilndove','yw','icamp']);
    expect(matrix.scenarioNames).toContain('no results with removable filters');
  });
});
