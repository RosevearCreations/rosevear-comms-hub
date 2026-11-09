import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';

export const QL388_CONTRACT_VERSION='rosevear.comms.intake.v1' as const;
export const QL388_DESTINATION='rosevear-comms-hub' as const;
export const QL388_EVENT_KINDS=['notification','incident'] as const;
export const QL388_EVENT_CATEGORIES=['integration','security','operations','service'] as const;
export const QL388_SEVERITIES=['info','warning','critical'] as const;

export type CrossAppIntake={
  contractVersion:typeof QL388_CONTRACT_VERSION;
  messageId:string;
  correlationId:string;
  idempotencyKey:string;
  sourceId:string;
  destinationId:typeof QL388_DESTINATION;
  tenantScope:'shell';
  kind:(typeof QL388_EVENT_KINDS)[number];
  category:(typeof QL388_EVENT_CATEGORIES)[number];
  severity:(typeof QL388_SEVERITIES)[number];
  eventCode:string;
  occurredAt:string;
  evidenceRefs:string[];
};

export type IntakeContractReview={state:'DENIED'|'DESIGN_ONLY';reason:string;sourceId?:string;kind?:CrossAppIntake['kind']};

const keys:readonly (keyof CrossAppIntake)[]=[
  'contractVersion','messageId','correlationId','idempotencyKey','sourceId',
  'destinationId','tenantScope','kind','category','severity','eventCode',
  'occurredAt','evidenceRefs'
];
const idPattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const codePattern=/^[A-Z][A-Z0-9_]{2,63}$/;
const evidencePattern=/^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9_-]{8,100}$/;
const utcPattern=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const knownSources=new Set<string>(MASTER_SHELL_REGISTRY.map(source=>source.id));

/** Structure-only contract review. No signature, permission, receiver, replay,
 * freshness or tenant authority is attested by a matching client envelope. */
export function reviewCrossAppIntake(value:unknown):IntakeContractReview{
  const denied=(reason:string):IntakeContractReview=>({state:'DENIED',reason});
  if(!value||typeof value!=='object'||Array.isArray(value))return denied('An intake envelope object is required');
  const data=value as Record<string,unknown>;
  if(Object.keys(data).length!==keys.length||Object.keys(data).some(key=>!keys.includes(key as keyof CrossAppIntake)))
    return denied('Envelope fields differ from the approved contract; arbitrary payloads are prohibited');
  if(data.contractVersion!==QL388_CONTRACT_VERSION)return denied('Unknown or incompatible intake contract version');
  if(data.destinationId!==QL388_DESTINATION)return denied('Destination must be the Comms Hub shell intake');
  if(typeof data.sourceId!=='string'||!knownSources.has(data.sourceId))
    return denied('Unknown source ID or customer business is not a registered shell source');
  if(data.tenantScope!=='shell')return denied('Tenant/customer records require a separately authorized contract');
  if(!QL388_EVENT_KINDS.includes(data.kind as CrossAppIntake['kind']))return denied('Unknown event kind');
  if(!QL388_EVENT_CATEGORIES.includes(data.category as CrossAppIntake['category']))
    return denied('Unsupported category; module completion and monitoring belong to AI Data Platform');
  if(!QL388_SEVERITIES.includes(data.severity as CrossAppIntake['severity']))return denied('Unknown severity');
  for(const field of ['messageId','correlationId','idempotencyKey'] as const){
    if(typeof data[field]!=='string'||!idPattern.test(data[field]))return denied(`Invalid ${field}; a bounded opaque identifier is required`);
  }
  if(typeof data.eventCode!=='string'||!codePattern.test(data.eventCode))
    return denied('Event code must be a bounded machine-readable catalogue key, not free-form text');
  if(typeof data.occurredAt!=='string'||!utcPattern.test(data.occurredAt)||Number.isNaN(Date.parse(data.occurredAt)))
    return denied('occurredAt must be an ISO-8601 UTC timestamp');
  if(!Array.isArray(data.evidenceRefs)||data.evidenceRefs.length>5||
     data.evidenceRefs.some(ref=>typeof ref!=='string'||!evidencePattern.test(ref))||
     new Set(data.evidenceRefs).size!==data.evidenceRefs.length)
    return denied('Evidence references must be unique, bounded opaque IDs; URLs and customer data are prohibited');
  return {state:'DESIGN_ONLY',sourceId:data.sourceId,kind:data.kind as CrossAppIntake['kind'],
    reason:'Envelope shape matches; source signatures, approvals, receiver enrollment, replay protection and transport remain unverified'};
}

/** Demonstration data only. The receiver is not live and this is not a signed source event. */
export const QL388_EXAMPLE_EVENT:CrossAppIntake={
  contractVersion:QL388_CONTRACT_VERSION,messageId:'notification-ql388-0001',
  correlationId:'correlation-ql388-0001',idempotencyKey:'dedupe-ql388-0001',
  sourceId:'yw',destinationId:QL388_DESTINATION,tenantScope:'shell',
  kind:'incident',category:'integration',severity:'warning',eventCode:'SOURCE_HEALTH_STALE',
  occurredAt:'2026-11-08T00:00:00Z',evidenceRefs:['release:QL388DEMO0001']
};
