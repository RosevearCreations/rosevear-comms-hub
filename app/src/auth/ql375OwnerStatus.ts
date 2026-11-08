import type {OwnerEntryRole} from './ql374OwnerEntry';
import {ownerEntryTruth} from './ql374OwnerEntry';

/** Canonical shell-level identities from QL-365D. These are catalogue entries,
 * not live per-source claims or an authority to access tenant data. */
export const QL375_SHELLS=[
  {id:'yw',name:'Yard Workers',repository:'RosevearCreations/yw',boundary:'Platform shell, not Rosevear Landscaping or any customer business'},
  {id:'icamp',name:'iCamp',repository:'RosevearCreations/iCamp',boundary:'Platform shell, not Camp Rosevear or a campground tenant'},
  {id:'rosiedazzlers',name:'Rosie Dazzlers',repository:'RosevearCreations/rosiedazzlers',boundary:'Owned-business shell, not individual customer records'},
  {id:'devilndove',name:'Devil n Dove',repository:'RosevearCreations/devilndove-site',boundary:'Owned-business shell; Etsy and Meta require separate permissions'},
  {id:'ai-data-platform',name:'AI Data Platform',repository:'RosevearCreations/ai-data-platform',boundary:'Support broker and module, not a customer tenant'},
  {id:'rosevear-ai-hub',name:'Rosevear AI Hub',repository:'RosevearCreations/rosevear-ai-hub',boundary:'Original local support server, not a customer tenant'}
] as const;

export const QL375_HELP_LINKS=[
  {id:'status',label:'Refresh protected owner status',href:'#ql370-refresh-status',description:'Return to the server-protected, AAL2-gated status refresh'},
  {id:'ceremony',label:'Review enrollment steps',href:'#ql371-owner-ceremony',description:'Use the existing original-owner checklist; do not share private signing material'},
  {id:'guide',label:'Six-app integration reference',href:'https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md',description:'Read the published identity mapping; documentation does not prove a connection'}
] as const;

type EntryTruth=ReturnType<typeof ownerEntryTruth>;
/** The protected readback has ONLY an aggregate six-shell state; never pretend
 * that it independently attested each individual source. */
export function ownerShellStatus(truth:EntryTruth){
  if(truth.state==='STOP_REVIEW')return {label:'STOP — review server discrepancy',kind:'stop' as const,
    detail:'The protected aggregate readback does not reconcile. No individual source status can be trusted.'};
  if(truth.held)return {label:'HOLD · aggregate verified',kind:'held' as const,
    detail:'A recent protected server readback confirmed 6 of 6 shells held. This is aggregate evidence, not an individual live source check.'};
  return {label:'Unverified · refresh protected status',kind:'unknown' as const,
    detail:'There is no fresh, consistent, role-matched protected aggregate readback. No connection may be inferred.'};
}

export function safeOwnerHelpLink(href:string){
  return QL375_HELP_LINKS.some(item=>item.href===href);
}
export function ownerStatusIdentity(role:OwnerEntryRole){
  return role==='source'?'Ree':'Jack';
}
