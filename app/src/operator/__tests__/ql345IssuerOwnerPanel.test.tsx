// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,expect,it} from 'vitest';
import {Ql345IssuerOwnerPanel,parseQl345Challenge} from '../Ql345IssuerOwnerPanel';

const packet={schema:'rosevear.hub.ql345.issuer-owner-review-challenge.v1',
  state:'ORIGINAL_ISSUER_AND_OWNER_REVIEW_ONLY_NOT_SIGNABLE',
  environment:'TEST',audience:'rosevear-comms-hub:nonproduction',
  issuedAt:'2026-11-06T04:20:10.000Z',expiresAt:'2026-11-06T04:40:10.000Z',
  observationSha256:'a'.repeat(64),tlsCertificateFileSha256:'b'.repeat(64),
  evidenceDigests:{windowsWitnessSha256:'a'.repeat(64),
    privateTlsWitnessSha256:'b'.repeat(64),tailnetAclWitnessSha256:'c'.repeat(64),
    rollbackWitnessSha256:'d'.repeat(64)},rollbackKind:'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
  ownerAuthorityPins:{schema:'rosevear.hub.ql339b.owner-authorities.v1',
    source:{keyId:'source-owner-ql340a',publicKeyPem:'nonsecret'},
    master:{keyId:'comms-master-jack-ql340a',publicKeyPem:'nonsecret'}},
  deviceKeyId:'hub-ql339b',originalIssuerIndependentlyConfirmed:false,
  sourceOwnerEnrollmentApproved:false,masterOwnerEnrollmentApproved:false,
  requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
  connected:false};

it('local public challenge import never interprets a REVIEW as owner authorization',()=>{
  expect(parseQl345Challenge(packet).requestMayBeSigned).toBe(false);
  for(const mutation of [{originalIssuerIndependentlyConfirmed:true},
    {sourceOwnerEnrollmentApproved:true},{masterOwnerEnrollmentApproved:true},
    {requestMayBeSigned:true},{receiverActivated:true},
    {databaseEnrollmentCreated:true},{connected:true},{environment:'PROD'},
    {expiresAt:'2026-11-06T06:40:10.000Z'}])
    expect(()=>parseQl345Challenge({...packet,...mutation})).toThrow();
});

let root:Root,host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql345IssuerOwnerPanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

it('guides Ree and Jack without signing, issuing TEST requests or network actions',()=>{
  const p=host.querySelector('[data-ql345="original-issuer-and-separate-owners"]')!;
  expect(p).not.toBeNull();
  expect(p.textContent).toContain('TEST ENROLLMENT · HOLD');
  expect(p.querySelectorAll('ol li')).toHaveLength(4);
  expect(p.textContent).toContain('--stage-local');
  expect(p.textContent).toContain('--decide');
  expect(p.textContent).toContain('review-only, not enrollment consent');
  expect(p.querySelector('button')).toBeNull();
  expect(p.querySelector('input[type="file"]')).not.toBeNull();
});
