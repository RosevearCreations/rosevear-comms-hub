/**
 * QL-502: Pure, scoped, client-side PREVIEW of delivery-version and
 * outdated-reply decisions. Production effects require separately verified,
 * signed server records and an authorized operator session.
 */
import type { OrganizationId } from './ql191Organizations';

export type Ql502Scenario = 'saved_only' | 'version_changed' |
  'outdated_reply' | 'opted_out' | 'provider_outage';
export type Ql502StepState = 'SAVED_NOT_SENT' | 'PROVIDER_ACCEPTED_NOT_DELIVERED' |
  'DELIVERY_CLAIM_SYNTHETIC' | 'SUPERSEDED' | 'REPLY_NEEDS_REVIEW' |
  'SEND_HELD' | 'UNVERIFIED';
export interface Ql502Step {
  id: string;
  version: number;
  title: string;
  state: Ql502StepState;
  explanation: string;
  source: 'SYNTHETIC_FIXTURE';
}
export interface Ql502Review {
  state: 'PREVIEW_ONLY' | 'ACCESS_DENIED';
  organizationId: OrganizationId;
  scenario: Ql502Scenario;
  displayTenant: string | null;
  steps: readonly Ql502Step[];
  currentVersion: number | null;
  replyNeedsAttention: boolean;
  canSend: false;
  liveProviderDeliveryVerified: false;
  humanAcknowledgementVerified: false;
  customerWrites: false;
  networkRequests: 0;
}
const step=(id:string,version:number,title:string,state:Ql502StepState,explanation:string):Ql502Step=>
  ({id,version,title,state,explanation,source:'SYNTHETIC_FIXTURE'});
const blocked=(organizationId:OrganizationId,scenario:Ql502Scenario):Ql502Review=>({
  state:'ACCESS_DENIED',organizationId,scenario,displayTenant:null,steps:[],
  currentVersion:null,replyNeedsAttention:false,canSend:false,
  liveProviderDeliveryVerified:false,humanAcknowledgementVerified:false,
  customerWrites:false,networkRequests:0
});
/** Show only a fictional Camp Rosevear scenario when that business is selected.
 * This organization switcher is NOT a server authorization check.
 */
export function ql502ReviewScenario(
  organizationId:OrganizationId,
  scenario:Ql502Scenario
):Ql502Review {
  if(organizationId!=='icamp')return blocked(organizationId,scenario);
  const initial=step('v1-saved',1,'Gate instructions v1',
    'SAVED_NOT_SENT','The draft exists in this rehearsal only. No provider delivery or guest acknowledgement.');
  let steps:Ql502Step[]=[initial];
  let currentVersion=1;
  if(scenario==='version_changed'||scenario==='outdated_reply'){
    steps=[
      initial,
      step('v1-demo-accepted',1,'Illustrative provider acceptance',
        'PROVIDER_ACCEPTED_NOT_DELIVERED','A provider acceptance would not prove carrier delivery or that a guest read it. This event is fabricated.'),
      step('v1-superseded',1,'Original arrival gate instructions replaced',
        'SUPERSEDED','Staff changed the gate; old instructions remain in the history for reply context.'),
      step('v2-saved',2,'New gate instructions v2',
        'SAVED_NOT_SENT','The updated version must be authorized and separately delivered before it can be called received.')
    ];
    currentVersion=2;
  }
  if(scenario==='outdated_reply'){
    steps=[...steps,step('reply-to-v1',1,'Guest replies to old instructions',
      'REPLY_NEEDS_REVIEW','Fictional inbound reply refers to v1. Staff must answer with the current v2 gate under the iCamp tenant brand.')];
  }else if(scenario==='opted_out'){
    steps=[initial,step('opt-out',1,'Consent or preference veto',
      'SEND_HELD','A retry must recheck the current preference. The synthetic message is withheld.')];
  }else if(scenario==='provider_outage'){
    steps=[initial,step('provider-outage',1,'Provider cannot confirm delivery',
      'UNVERIFIED','Do not label the message delivered; preserve the queued request and check permission before any retry.')];
  }
  return {state:'PREVIEW_ONLY',organizationId,scenario,
    displayTenant:'Camp Rosevear · fictional example',
    steps,currentVersion,replyNeedsAttention:scenario==='outdated_reply',
    canSend:false,liveProviderDeliveryVerified:false,
    humanAcknowledgementVerified:false,customerWrites:false,networkRequests:0};
}

export type Ql502RetryContext={
  organizationId:OrganizationId;
  tenantId:string;
  expectedTenantId:string;
  requestedVersion:number;
  currentVersion:number;
  consent:'service_allowed'|'opted_out'|'unknown';
  purpose:'service'|'marketing';
  cancelled:boolean;
  slotFilled:boolean;
  disputedLine:boolean;
  providerHealthy:boolean;
  authorizedOperator:boolean;
  expiresAtMs:number;
  nowMs:number;
};
/** Used by future real server integration only after re-validating current
 * owning-product state and server-side permission. Never a send authorization.
 */
export function ql502CheckRetrySnapshot(input:Ql502RetryContext){
  const deny=(reason:string)=>({state:'HOLD' as const,reason,canSend:false as const});
  if(input.tenantId!==input.expectedTenantId||
    !/^[a-zA-Z0-9_-]{4,96}$/.test(input.tenantId)||!input.authorizedOperator)
    return deny('TENANT_OR_OPERATOR_NOT_AUTHORIZED');
  if(!Number.isSafeInteger(input.requestedVersion)||input.requestedVersion<1||
    input.requestedVersion!==input.currentVersion)
    return deny('SUPERSEDED_OR_INVALID_VERSION');
  if(!Number.isSafeInteger(input.nowMs)||!Number.isSafeInteger(input.expiresAtMs)||
    input.nowMs>=input.expiresAtMs)return deny('OFFER_OR_MESSAGE_EXPIRED');
  if(input.cancelled||input.slotFilled||input.disputedLine)
    return deny('BUSINESS_STATE_CHANGED_RECHECK_REQUIRED');
  if(input.consent==='opted_out'||input.consent==='unknown'||
    (input.purpose==='marketing'&&input.consent!=='service_allowed'))
    return deny('CURRENT_CONSENT_NOT_CONFIRMED');
  if(!input.providerHealthy)return deny('PROVIDER_UNAVAILABLE');
  return {state:'PRECHECK_ONLY' as const,
    reason:'SERVER_RECHECK_REQUIRED_BEFORE_ANY_REAL_SEND',canSend:false as const};
}
