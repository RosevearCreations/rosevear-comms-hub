/** Offline QL-256 decision queue; no real role assignment or connectivity. */
import { QL255_RESPONSE_DISPOSITIONS } from './ql255ProofDispositionReview';
export const QL256_RELEASE = 'ql256-original-signer-role-owner-test-scheduling-held-v1';
export const QL256_GUIDES = Object.freeze([
  {name:'AI Data Platform',repository:'ai-data-platform',file:'AI_DATA_PLATFORM_QL256.md'},
  {name:'Devil n Dove',repository:'devilndove-site',file:'DEVIL_N_DOVE_QL256.md'},
  {name:'Rosie Dazzlers',repository:'rosiedazzlers',file:'ROSIE_DAZZLERS_QL256.md'},
  {name:'Yard Workers',repository:'yw',file:'YARD_WORKERS_QL256.md'},
  {name:'iCamp',repository:'iCamp',file:'ICAMP_QL256.md'},
  {name:'Rosevear AI Hub',repository:'rosevear-ai-hub',file:'ROSEVEAR_AI_HUB_QL256.md'}
].map(guide => {
  const source=QL255_RESPONSE_DISPOSITIONS.find(item=>item.repository===guide.repository);
  return Object.freeze({...guide,mainSha:source?.mainSha??null,
    signer:'NOT_VERIFIED',roles:'NOT_ASSIGNED',proof:'404 / HELD'});
}));
export const QL256_GATES = Object.freeze({
  signedProofs:0,realCustodiansVerified:0,independentWitnessesVerified:0,
  ownerTestAuthorization:'NOT_GIVEN',ownerPilotAuthorization:'NOT_GIVEN',
  trialWindowsScheduled:0,privateRelayStarted:false,gatewayGets:0,
  connection:'DISCONNECTED',livePilotHolds:12
});
