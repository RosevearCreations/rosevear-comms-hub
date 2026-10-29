// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {Ql259SixAppReturnIntake} from '../Ql259SixAppReturnIntake';
import {QL258_APPS,newQl258Ledger,ql258SanitizedHandoff,
  updateQl258Step} from '../ql258OwnerActionChecklist';
import {QL259_LATEST_SOURCES,inspectQl259Packet,intakeQl259Packet,
  ql259Portfolio,ql259SanitizedPortfolio} from '../ql259SixAppReturnReconciliation';

const starting=newQl258Ledger();
const packet=(system:typeof QL258_APPS[number]['system'])=>
  ql258SanitizedHandoff(system,starting[system]);

describe('QL-259 six-app offline owner return reconciliation',()=>{
  it('keeps newer real immutable source snapshots and original proofs held',()=>{
    expect(QL259_LATEST_SOURCES).toHaveLength(6);
    expect(QL259_LATEST_SOURCES.every((row,i)=>
      row.system===QL258_APPS[i].system&&String(row.sha)!==String(QL258_APPS[i].mainSha)&&
      /^[0-9a-f]{40}$/.test(row.sha))).toBe(true);
    const rows=ql259Portfolio({});
    expect(rows).toHaveLength(6);
    expect(rows.every(r=>r.publicProof==='HTTP_404'&&r.sourceRecheckRequired&&
      r.returnStatus==='NOT_RECEIVED')).toBe(true);
    const aggregate=JSON.parse(ql259SanitizedPortfolio({}));
    expect(aggregate.independentCustodyAuthenticated).toBe(0);
    expect(aggregate.authenticatedOwnerTestApprovals).toBe(0);
    expect(aggregate.authenticatedGatewayGets).toBe(0);
    expect(aggregate.connection).toBe('DISCONNECTED');
  });
  it('reconciles all six canonical owner returns without turning them into trusted custody',()=>{
    let ledger={};
    for(const app of QL258_APPS){
      const next=intakeQl259Packet(ledger,packet(app.system));
      expect(next.status).toBe('ACCEPTED_SELF_REPORTED_HELD');
      ledger=next.ledger;
    }
    const aggregate=JSON.parse(ql259SanitizedPortfolio(ledger));
    expect(aggregate.receivedSelfReportedPackets).toBe(6);
    expect(aggregate.portfolio.every((x:{sourceRecheckRequired:boolean})=>
      x.sourceRecheckRequired)).toBe(true);
    expect(aggregate.independentlyVerifiedPublicProofs).toBe(0);
    expect(aggregate.livePilotHolds).toBe(12);
    const done=updateQl258Step(starting,'yw','privateCustodian',
      'OWNER_REPORTS_DONE_NOT_VERIFIED');
    const entry=inspectQl259Packet(JSON.parse(ql258SanitizedHandoff('yw',done.yw)));
    expect(entry?.progress.privateCustodian).toBe('OWNER_REPORTS_DONE_NOT_VERIFIED');
    expect(entry?.disposition).toContain('CUSTODY_HELD');
  });
  it('rejects forged trusted state, extra secrets, invalid tenant, and substituted app metadata',()=>{
    const base=JSON.parse(packet('icamp'));
    for(const change of [
      {sourceProofAccepted:true},{independentCustodyAuthenticated:true},
      {ownerTestAuthorization:'APPROVED'},
      {authenticatedGatewayGets:1},{connection:'CONNECTED'},
      {livePilotHolds:0},{privateKey:'do-not-export'},
      {repository:'a-different-source'},
      {publicGitHubSnapshot:{...base.publicGitHubSnapshot,mainSha:'a'.repeat(40)}},
      {ownerReportedUnverifiedProgress:{...base.ownerReportedUnverifiedProgress,tenantIsolation:'NOT_APPLICABLE'}}
    ])expect(intakeQl259Packet({},JSON.stringify({...base,...change})).status)
      .toBe('REJECTED_UNSAFE_OR_INVALID_PACKET');
    expect(intakeQl259Packet({},'not JSON').status).toBe('REJECTED_UNSAFE_OR_INVALID_PACKET');
    expect(intakeQl259Packet({},'x'.repeat(12001)).status).toBe('REJECTED_UNSAFE_OR_INVALID_PACKET');
  });
  it('handles identical replay, conflict and independent app records without overwriting',()=>{
    const first=intakeQl259Packet({},packet('devilndove'));
    expect(intakeQl259Packet(first.ledger,packet('devilndove')).status)
      .toBe('DUPLICATE_IDENTICAL_NO_CHANGE_HELD');
    const changed=updateQl258Step(starting,'devilndove','privateHost',
      'OWNER_REPORTS_IN_PROGRESS');
    const conflict=intakeQl259Packet(first.ledger,
      ql258SanitizedHandoff('devilndove',changed.devilndove));
    expect(conflict.status).toBe('CONFLICT_REQUIRES_CLEAR_HELD');
    expect(conflict.ledger).toBe(first.ledger);
    expect(intakeQl259Packet(first.ledger,packet('icamp')).status)
      .toBe('ACCEPTED_SELF_REPORTED_HELD');
  });
  it('imports one exact packet in UI without fetch, localStorage, approvals or outbound calls',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const storageSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql259SixAppReturnIntake/>));
      const section=host.querySelector('[data-ql259-release]')!;
      expect(section.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(section.textContent).toContain('0/6 self-reported packets received');
      const input=section.querySelector<HTMLTextAreaElement>('#ql259-return-json')!;
      await act(async()=>{
        const setter=Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,'value')!.set!;
        setter.call(input,packet('rosiedazzlers'));
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
      await act(async()=>{
        section.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
      });
      const summary=JSON.parse(section.querySelector<HTMLTextAreaElement>('#ql259-portfolio')!.value);
      expect(summary.receivedSelfReportedPackets).toBe(1);
      expect(summary.portfolio.find((x:{system:string})=>x.system==='rosiedazzlers')
        .returnStatus).toContain('SCHEMA_ONLY_HELD');
      expect(summary.authenticatedOwnerTestApprovals).toBe(0);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(storageSpy).not.toHaveBeenCalled();
    }finally{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();}
  });
});
