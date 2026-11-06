// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {Ql343OwnerEvidencePanel,parseQl343OwnerReview} from '../Ql343OwnerEvidencePanel';

const packet={schema:'rosevear.hub.ql343.original-owner-evidence-review.v1',
  state:'EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED',
  rollbackKind:'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
  evidenceDigests:{windowsWitnessSha256:'a'.repeat(64),privateTlsWitnessSha256:'b'.repeat(64),
    tailnetAclWitnessSha256:'c'.repeat(64),rollbackWitnessSha256:'d'.repeat(64)},
  independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
  originalReceiverStopped:false,receiverActivated:false,databaseEnrollmentCreated:false,
  customerCommunications:false,deviceActions:false,connected:false,
  requestMayBeSigned:false};

it('accepts a public-only review shape but rejects forged owner/receiver/signed states',()=>{
  expect(parseQl343OwnerReview(packet).rollbackKind).toContain('INERT_ONLY');
  for(const mutation of [{independentOriginalOwnerApproval:true},{sourceSigned:true},
    {masterSigned:true},{originalReceiverStopped:true},{receiverActivated:true},
    {databaseEnrollmentCreated:true},{customerCommunications:true},
    {deviceActions:true},{connected:true},{requestMayBeSigned:true},
    {evidenceDigests:{...packet.evidenceDigests,rollbackWitnessSha256:'wrong'}}])
    expect(()=>parseQl343OwnerReview({...packet,...mutation})).toThrow();
});

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql343OwnerEvidencePanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
it('guides Ree and Jack without browser signing, network calls or keys',()=>{
  const section=host.querySelector('[data-ql343-mode="public-only-offline-review"]')!;
  expect(section).not.toBeNull();
  expect(section.querySelectorAll('ol li')).toHaveLength(3);
  expect(section.textContent).toContain('ENROLLMENT · HOLD');
  expect(section.textContent).toContain('--review-local');
  expect(section.textContent).toContain('--stage-local');
  expect(section.textContent).toContain('--compare-request');
  expect(section.textContent).toContain('not a real receiver stop');
  expect(section.textContent).toContain('20-minute');
  expect(section.querySelector('button')).toBeNull();
  expect(section.querySelector('input[type="file"]')).not.toBeNull();
});
