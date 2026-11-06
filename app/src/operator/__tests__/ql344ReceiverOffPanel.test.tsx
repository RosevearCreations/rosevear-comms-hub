// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,expect,it} from 'vitest';
import {Ql344ReceiverOffPanel,parseQl344Observation} from '../Ql344ReceiverOffPanel';

const off={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
  state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',computer:'DESKTOP-AE894KC',
  windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
  tailscaleServeNoConfig:true,inertDrillFileCount:1,
  capturedAt:'2026-11-06T02:46:24.842Z',receiverOffObserved:true,
  tlsCertificateFileSha256:'a'.repeat(64),
  evidenceDigests:{windowsWitnessSha256:'a'.repeat(64),
    privateTlsWitnessSha256:'b'.repeat(64),tailnetAclWitnessSha256:'c'.repeat(64),
    rollbackWitnessSha256:'d'.repeat(64)},originalReceiverStopped:false,
  originalIssuerEvidenceIndependentlyVerified:false,
  independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
  requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
  connected:false,customerCommunications:false,deviceActions:false};

it('recognizes only an OFF-format document; never accepts elevated states',()=>{
  expect(parseQl344Observation(off).receiverOffObserved).toBe(true);
  for(const mutation of [{originalReceiverStopped:true},{sourceSigned:true},
    {masterSigned:true},{requestMayBeSigned:true},{receiverActivated:true},
    {databaseEnrollmentCreated:true},{connected:true},
    {originalIssuerEvidenceIndependentlyVerified:true},
    {independentOriginalOwnerApproval:true},{localListenerCount:1},
    {tailscaleServeNoConfig:false},{customerCommunications:true},
    {tlsCertificateFileSha256:'invalid'}])
    expect(()=>parseQl344Observation({...off,...mutation})).toThrow();
});

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql344ReceiverOffPanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
it('shows safe local observation and independent review without any signing button',()=>{
  const pane=host.querySelector('[data-ql344-mode="offline-original-off-review"]')!;
  expect(pane.textContent).toContain('INDEPENDENT REVIEW · HOLD');
  expect(pane.textContent).toContain('-Status');
  expect(pane.textContent).toContain('-Capture');
  expect(pane.textContent).toContain('CAPTURE_RECEIVER_OFF_EVIDENCE');
  expect(pane.textContent).toContain('No owner signatures'.toUpperCase());
  expect(pane.querySelector('button')).toBeNull();
  expect(pane.querySelector('input[type="file"]')).not.toBeNull();
});
