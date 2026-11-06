// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,describe,expect,it} from 'vitest';
import {OperatorShell} from '../OperatorShell';

let host:HTMLDivElement, root:Root;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  window.localStorage.clear();
  host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

async function choose(label:string){
  const target=[...host.querySelectorAll<HTMLButtonElement>('.ql312-choice button')]
    .find(button=>button.textContent===label);
  expect(target).toBeDefined();
  await act(async()=>target!.click());
}

describe('QL-312 shared Standard Theme controls and cross-category design',()=>{
  it('defaults to readable comfortable spacing and standard contrast without enabling any connection',()=>{
    const shell=host.querySelector<HTMLElement>('.ql172-shell')!;
    expect(shell.getAttribute('data-ql312-density')).toBe('comfortable');
    expect(shell.getAttribute('data-ql312-contrast')).toBe('standard');
    expect(shell.getAttribute('data-ql349-appearance')).toBe('dark');
    expect(host.querySelector('[data-ql312-controls="true"]')).not.toBeNull();
    expect(host.querySelector('.ql172-status')?.textContent).toContain('DISABLED PREVIEW');
    expect(host.textContent).toContain('No live integrations');
  });

  it('switches both display modes via accessible pressed states with no local storage mutation',async()=>{
    await choose('Compact');
    await choose('High');
    const shell=host.querySelector<HTMLElement>('.ql172-shell')!;
    expect(shell.dataset.ql312Density).toBe('compact');
    expect(shell.dataset.ql312Contrast).toBe('high');
    expect(shell.dataset.ql349Appearance).toBe('dark');
    expect([...host.querySelectorAll<HTMLButtonElement>('.ql312-choice button[aria-pressed="true"]')].some(button=>button.textContent==='Compact')).toBe(true);
    expect([...host.querySelectorAll<HTMLButtonElement>('.ql312-choice button[aria-pressed="true"]')].map(button=>button.textContent)).toEqual(['Dark','Compact','High']);
    expect(window.localStorage.length).toBe(0);
    await choose('Comfortable');await choose('Standard');
    expect(shell.dataset.ql312Density).toBe('comfortable');
    expect(shell.dataset.ql312Contrast).toBe('standard');
    await choose('Light');expect(shell.dataset.ql349Appearance).toBe('light');
    await choose('Dark');expect(shell.dataset.ql349Appearance).toBe('dark');
  });

  it('explains six named colours and the three text-described permission-safe status types',async()=>{
    const help=host.querySelector<HTMLDetailsElement>('.ql312-style-help')!;
    await act(async()=>{help.open=true;help.dispatchEvent(new Event('toggle'));});
    expect(help.open).toBe(true);
    expect(help.querySelectorAll('.ql312-swatch')).toHaveLength(6);
    expect(help.querySelectorAll('.ql312-chip')).toHaveLength(3);
    expect(help.textContent).toContain('DISCONNECTED / HOLD');
    expect(help.textContent).toContain('UNDER REVIEW');
    expect(help.textContent).toContain('No display control enables an integration');
  });

  it('keeps the same theme controls across each of the six active command categories',async()=>{
    const matrix:[string,string][]=[
      ['front_end','Dashboard'],['admin','Accessibility owner walkthrough'],['it','Connections · six apps'],
      ['management','Management'],['statistics','Analytics & statistics'],['status','System status']
    ];
    await choose('Compact');
    for(const [section,targetLabel] of matrix){
      const area=host.querySelector(`[data-ql311-section="${section}"]`)!;
      const toggle=area.querySelector<HTMLButtonElement>('.ql311-nav-toggle')!;
      if(toggle.getAttribute('aria-expanded')==='false')await act(async()=>toggle.click());
      const destination=[...area.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')].find(button=>button.querySelector('strong')?.textContent===targetLabel);
      expect(destination,`Navigation destination ${targetLabel}`).toBeDefined();
      await act(async()=>destination!.click());
      expect(host.querySelector<HTMLElement>('.ql172-shell')?.dataset.ql312Density).toBe('compact');
      expect(host.querySelector('.ql311-breadcrumb')?.textContent).toContain(area.querySelector('.ql311-nav-toggle strong')?.textContent);
      expect(host.querySelector('.ql172-context h2')?.textContent).toBe(targetLabel);
      expect(host.querySelector('.ql172-status')?.textContent).toContain('DISABLED PREVIEW');
    }
  });

  it('provides shared tokens, focused controls, contrast, zoom-friendly breakpoints and reduced-motion styles',()=>{
    const css=readFileSync('src/operator/ql312-theme.css','utf8');
    for(const token of ['--ql312-canvas','--ql312-card','--ql312-ink','--ql312-border','--ql312-focus','--ql312-dark-ink','--ql312-cyan','--ql312-violet','--ql312-blue','--ql312-gold','--ql312-green','--ql312-rose'])expect(css).toContain(token);
    for(const selector of ['.ql191-metric','.ql299-list article','.ql270-metrics article','.ql301-metrics article','.ql271-chart-track','.ql271-status-table','.ql312-choice button[aria-pressed'])expect(css).toContain(selector);
    expect(css).toContain("data-ql312-density='compact'");
    expect(css).toContain("data-ql312-contrast='high'");
    expect(css).toContain(':focus-visible');
    expect(css).toContain('max-width:480px');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('forced-colors:active');
  });

  it('keeps light, dark and all status legend text pairs above WCAG AA normal-text contrast',()=>{
    const luminance=(hex:string)=>{
      const channels=hex.match(/[\da-f]{2}/gi)!.map(channel=>parseInt(channel,16)/255)
        .map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
      return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
    };
    const ratio=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const pairs:[string,string][]=[
      ['18334d','ffffff'],['456178','ffffff'],['eaf5ff','10253d'],['c2d5e8','10253d'],
      ['164f73','e4f5ff'],['804708','fff1d3'],['684494','f4e9ff']
    ];
    for(const [ink,surface] of pairs)expect(ratio(ink,surface),`${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
  });

  it('has a six-area visual comparison fixture with widths and zoom gates, not fabricated screenshot results',()=>{
    const fixture=JSON.parse(readFileSync('../docs/visual/ql312-standard-theme-capture-matrix.json','utf8')) as {
      captureStatus:string; viewportWidths:number[]; zoomPercent:number[];
      categoryScreens:{section:string;workspace:string;tone:string}[];
    };
    expect(fixture.captureStatus).toBe('PENDING_BROWSER_CAPTURE');
    expect(fixture.viewportWidths).toEqual([320,375,768,1024,1440]);
    expect(fixture.zoomPercent).toEqual([100,200,400]);
    expect(fixture.categoryScreens.map(screen=>screen.section)).toEqual(['front_end','admin','it','management','statistics','status']);
    expect(new Set(fixture.categoryScreens.map(screen=>screen.tone)).size).toBe(6);
  });
});
