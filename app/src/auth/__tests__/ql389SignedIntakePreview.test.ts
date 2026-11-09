import {beforeAll,describe,expect,it} from 'vitest';
import {QL388_EXAMPLE_EVENT} from '../ql388CrossAppIntake';
import {ql389CanonicalIntakeBytes,reviewSignedIntakePreview,type QL389Scenario} from '../ql389SignedIntakePreview';

const encode=(data:ArrayBuffer)=>Buffer.from(data).toString('base64url');
const NOW=Date.parse('2026-11-08T00:00:30Z');
let validProof:{algorithm:'Ed25519';keyId:string;signatureBase64Url:string};
let scenario:QL389Scenario;
let wrongKeyProof:typeof validProof;

beforeAll(async()=>{
  const keys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const otherKeys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const signature=await crypto.subtle.sign('Ed25519',keys.privateKey,ql389CanonicalIntakeBytes(QL388_EXAMPLE_EVENT));
  const wrongSignature=await crypto.subtle.sign('Ed25519',otherKeys.privateKey,ql389CanonicalIntakeBytes(QL388_EXAMPLE_EVENT));
  validProof={algorithm:'Ed25519',keyId:'synthetic-ql389-key',signatureBase64Url:encode(signature)};
  wrongKeyProof={...validProof,signatureBase64Url:encode(wrongSignature)};
  scenario={
    nowMs:NOW,pins:[{sourceId:'yw',keyId:validProof.keyId,
      publicKeySpkiBase64Url:encode(await crypto.subtle.exportKey('spki',keys.publicKey))}],
    routes:[{sourceId:'yw',destinationId:'rosevear-comms-hub',kinds:['notification','incident'],categories:['integration','security']}],
    sourceOwnerDecision:'SIMULATED_APPROVED',masterOwnerDecision:'SIMULATED_APPROVED',
    receiverEnrollment:'SIMULATED_READY',previouslySeenMessageIds:[],previouslySeenIdempotencyKeys:[]
  };
});

describe('QL-389 inert signed intake authorization and replay preview',()=>{
  it('verifies synthetic Ed25519 but never authorizes an actual intake',async()=>{
    expect(await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,scenario))
      .toMatchObject({state:'PREVIEW_ONLY',stage:'INERT'});
  });
  it('rejects missing, wrong, tampered, and differently pinned source signatures',async()=>{
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,null,scenario)).stage).toBe('SIGNATURE');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,wrongKeyProof,scenario)).stage).toBe('SIGNATURE');
    expect((await reviewSignedIntakePreview({...QL388_EXAMPLE_EVENT,eventCode:'SECURITY_ALERT'},validProof,scenario)).stage).toBe('SIGNATURE');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,pins:[]})).stage).toBe('PIN');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,pins:[...scenario.pins,...scenario.pins]})).stage).toBe('PIN');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,{...validProof,algorithm:'HS256'},scenario)).stage).toBe('SIGNATURE');
  });
  it('enforces source-scoped replay and timestamp preview checks after signature verification',async()=>{
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,nowMs:NOW+6*60_000})).stage).toBe('FRESHNESS');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,nowMs:NOW-2*60_000})).stage).toBe('FRESHNESS');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,
      previouslySeenMessageIds:[`yw:${QL388_EXAMPLE_EVENT.messageId}`]})).stage).toBe('REPLAY');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,
      previouslySeenIdempotencyKeys:[`yw:${QL388_EXAMPLE_EVENT.idempotencyKey}`]})).stage).toBe('REPLAY');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,
      previouslySeenMessageIds:[`icamp:${QL388_EXAMPLE_EVENT.messageId}`]})).state).toBe('PREVIEW_ONLY');
  });
  it('keeps unknown sources, customer fields, wrong routes and absent owners on HOLD',async()=>{
    expect((await reviewSignedIntakePreview({...QL388_EXAMPLE_EVENT,sourceId:'camp-rosevear'},validProof,scenario)).stage).toBe('ENVELOPE');
    expect((await reviewSignedIntakePreview({...QL388_EXAMPLE_EVENT,tenantId:'camp-rosevear'},validProof,scenario)).stage).toBe('ENVELOPE');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,routes:[]})).stage).toBe('POLICY');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,sourceOwnerDecision:'HOLD'})).stage).toBe('POLICY');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,masterOwnerDecision:'HOLD'})).stage).toBe('POLICY');
    expect((await reviewSignedIntakePreview(QL388_EXAMPLE_EVENT,validProof,{...scenario,receiverEnrollment:'HOLD'})).stage).toBe('POLICY');
  });
});
