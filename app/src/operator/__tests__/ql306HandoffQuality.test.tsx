// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {operatorOrganizations} from '../ql191Organizations';
import {ql306Audit,ql306LocalSummary,ql306Review,QL306_LANES} from '../ql306HandoffQuality';
import {Ql306HandoffQuality} from '../Ql306HandoffQuality';

describe('QL-306 synthetic four-business handoff regression',()=>{
  it('audits exactly four different, scoped handoff paths for every company',()=>{
    const intakePins=new Set<string>(),eventPins=new Set<string>();
    for(const company of operatorOrganizations){
      const audit=ql306Audit(company.id);
      expect(audit.rows).toHaveLength(4);
      expect(audit.summary).toMatchObject({lanes:4,fixtureQueue:4,mockEvents:6,mockTasks:4,validIntakeFields:4,idempotentReplay:true,externalSends:0,ownerAccepted:false});
      expect(audit.rows.map(row=>row.category)).toEqual(['intake','call','reply','task']);
      expect(audit.rows.every(row=>row.simulatedOnly&&row.externalSends===0&&!row.ownerVerified)).toBe(true);
      expect(audit.rows.every(row=>row.sourceReference.length>4&&row.taskSnapshot.includes('|'))).toBe(true);
      intakePins.add(audit.rows[0].sourceReference);eventPins.add(audit.rows[1].sourceReference);
    }
    expect(intakePins.size).toBe(4);expect(eventPins.size).toBe(4);
    expect(QL306_LANES.map(item=>item.workspace)).toEqual(['guided_intake','event_timeline','inbox','queue']);
    expect(()=>ql306Audit('unknown' as never)).toThrow('UNKNOWN_COMPANY');
  });
  it('isolates local outcomes by company and never upgrades them to owner acceptance',()=>{
    const first=ql306Review({},'rosiedazzlers','intake','locally_consistent');
    const second=ql306Review(first,'icamp','task','exception_noted');
    expect(ql306LocalSummary(second,'rosiedazzlers')).toEqual({total:4,pending:3,consistent:1,exceptions:0,ownerVerified:0,externalHandoffs:0});
    expect(ql306LocalSummary(second,'icamp')).toEqual({total:4,pending:3,consistent:0,exceptions:1,ownerVerified:0,externalHandoffs:0});
    expect(ql306LocalSummary(second,'yw').pending).toBe(4);
    expect(ql306Review(first,'rosiedazzlers','intake','not_reviewed').rosiedazzlers).toEqual({});
    expect(()=>ql306Review({},'invalid' as never,'task','locally_consistent')).toThrow('INVALID_LOCAL_QUALITY_REVIEW');
  });
  it('has observable accessible controls for the real workspaces and local review state',async()=>{
    const onNavigate=vi.fn(),onSelectOrganization=vi.fn();
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    await act(async()=>root.render(<Ql306HandoffQuality organizationId="rosiedazzlers" onSelectOrganization={onSelectOrganization} onNavigate={onNavigate}/>));
    expect(host.querySelector('[data-ql306-release]')).not.toBeNull();
    expect(host.querySelectorAll('.ql306-quality li')).toHaveLength(4);
    const button=[...host.querySelectorAll<HTMLButtonElement>('.ql306-actions button')][0];
    await act(async()=>button.click());expect(onNavigate).toHaveBeenCalledWith('guided_intake');
    const select=host.querySelector<HTMLSelectElement>('.ql306-actions select')!;
    await act(async()=>{select.value='locally_consistent';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('1 locally consistent');
    expect(host.textContent).toContain('0 owner-verified');
    await act(async()=>host.querySelectorAll<HTMLButtonElement>('.ql306-switcher button')[2].click());
    expect(onSelectOrganization).toHaveBeenCalledWith('icamp');
    await act(async()=>root.unmount());host.remove();
  });
});
