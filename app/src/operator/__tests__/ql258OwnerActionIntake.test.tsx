// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { Ql258OwnerActionIntake } from '../Ql258OwnerActionIntake';
import { QL258_APPS,QL258_STEPS,newQl258Ledger,ql258SanitizedHandoff,
  updateQl258Step } from '../ql258OwnerActionChecklist';

describe('QL-258 owner-only checklist and source census',()=>{
  it('returns six fixed genuine GitHub snapshots; no proof, key or owner permission',()=>{
    expect(QL258_APPS).toHaveLength(6);
    expect(new Set(QL258_APPS.map(app=>app.mainSha)).size).toBe(6);
    expect(QL258_APPS.every(app=>/^[a-f0-9]{40}$/.test(app.mainSha))).toBe(true);
    const ledger=newQl258Ledger();
    for(const app of QL258_APPS){
      const response=JSON.parse(ql258SanitizedHandoff(app.system,ledger[app.system]));
      expect(response.publicGitHubSnapshot.httpStatusAtObservedSha).toBe(404);
      expect(response.ownerTestAuthorization).toBe('NOT_GIVEN');
      expect(response.authenticatedGatewayGets).toBe(0);
      expect(response.sourceProofAccepted).toBe(false);
      expect(response.independentCustodyAuthenticated).toBe(false);
      expect(response.connection).toBe('DISCONNECTED');
    }
    expect(ledger.icamp.tenantIsolation).toBe('NOT_REPORTED');
    expect(ledger.yw.tenantIsolation).toBe('NOT_REPORTED');
    expect(ledger.devilndove.tenantIsolation).toBe('NOT_APPLICABLE');
  });

  it('an owner saying DONE changes a worksheet only, never proof or authorization',()=>{
    const start=newQl258Ledger();
    const after=updateQl258Step(start,'ai-data-platform','privateCustodian',
      'OWNER_REPORTS_DONE_NOT_VERIFIED');
    expect(start['ai-data-platform'].privateCustodian).toBe('NOT_REPORTED');
    const json=JSON.parse(ql258SanitizedHandoff('ai-data-platform',after['ai-data-platform']));
    expect(json.ownerReportedUnverifiedProgress.privateCustodian)
      .toBe('OWNER_REPORTS_DONE_NOT_VERIFIED');
    expect(json.disposition).toContain('NOT_SECURITY_EVIDENCE_HELD');
    expect(json.independentCustodyAuthenticated).toBe(false);
    expect(json.ownerTestAuthorization).toBe('NOT_GIVEN');
  });

  it('blocks fake proof/approval extras, credential fields, foreign apps and fake tenant exemption',()=>{
    const ledger=newQl258Ledger();
    const report=ledger.icamp;
    for(const unsafe of [
      {...report,ownerTestAuthorization:'APPROVED'},
      {...report,apiKey:'secret'},
      {...report,privateCustodian:'INDEPENDENTLY_AUTHENTICATED'},
      {...report,tenantIsolation:'NOT_APPLICABLE'}
    ])expect(()=>ql258SanitizedHandoff('icamp',unsafe as typeof report)).toThrow();
    expect(()=>ql258SanitizedHandoff('other-app' as 'icamp',report)).toThrow();
    expect(()=>updateQl258Step(ledger,'devilndove','tenantIsolation',
      'OWNER_REPORTS_DONE_NOT_VERIFIED')).toThrow();
    expect(()=>updateQl258Step(ledger,'icamp','privateHost',
      'APPROVED' as 'NOT_REPORTED')).toThrow();
  });

  it('offers six-app editor, copy-ready nonsecret packet and no network or storage',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql258OwnerActionIntake/>));
      const section=host.querySelector('[data-ql258-release]')!;
      expect(section.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(section.querySelectorAll('.ql258-owner-grid select')).toHaveLength(QL258_STEPS.length);
      expect(section.textContent).toContain('owner setup checklist');
      const appSelect=section.querySelector<HTMLSelectElement>('#ql258-app')!;
      await act(async()=>{
        appSelect.value='icamp';
        appSelect.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const tenant=section.querySelector<HTMLSelectElement>('#ql258-tenantIsolation')!;
      expect(tenant.disabled).toBe(false);
      await act(async()=>{
        tenant.value='OWNER_REPORTS_IN_PROGRESS';
        tenant.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const exported=JSON.parse(section.querySelector<HTMLTextAreaElement>('#ql258-handoff')!.value);
      expect(exported.system).toBe('icamp');
      expect(exported.ownerReportedUnverifiedProgress.tenantIsolation).toBe('OWNER_REPORTS_IN_PROGRESS');
      expect(exported.connection).toBe('DISCONNECTED');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSpy).not.toHaveBeenCalled();
    }finally{
      await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
    }
  });
});
