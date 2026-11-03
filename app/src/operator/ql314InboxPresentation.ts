import {inboxChannels} from './ql192InboxFixtures';
import {
  defaultInboxTriageFilters, recoverInboxTriagePreset, triageLanes, triageOwners,
  type InboxTriageFilters
} from './ql292InboxTriage';
import type {OrganizationId} from './ql191Organizations';

export type Ql314FilterKey = 'search' | 'channel' | 'view' | 'lane' | 'priority' | 'owner' | 'status';
export interface Ql314FilterChip { key:Ql314FilterKey; label:string; value:string; }

const viewNames = {unread:'Unread',needs_reply:'Needs reply',follow_up:'Follow-up'} as const;
const statusNames = {new:'New',needs_reply:'Needs reply',waiting:'Waiting',resolved:'Resolved'} as const;
const filterOrder:readonly Ql314FilterKey[] = ['search','lane','view','channel','priority','owner','status'];

/** Presentation only: one removable chip for each non-default filter, in keyboard order. */
export function activeInboxTriageFilterChips(filters:InboxTriageFilters):Ql314FilterChip[] {
  const defaults=defaultInboxTriageFilters();
  return filterOrder.flatMap((key):Ql314FilterChip[]=>{
    if(filters[key]===defaults[key])return [];
    const value=filters[key];
    switch(key){
      case 'search':return [{key,label:'Search',value:value.trim()||'(empty)'}];
      case 'channel':return [{key,label:'Channel',value:inboxChannels.find(item=>item.id===value)?.label??value}];
      case 'view':return [{key,label:'View',value:viewNames[value as keyof typeof viewNames]??value}];
      case 'lane':return [{key,label:'Lane',value:triageLanes.find(item=>item.id===value)?.label??value}];
      case 'priority':return [{key,label:'Priority',value:value==='high'?'High':'Normal'}];
      case 'owner':return [{key,label:'Demo owner',value:triageOwners.find(item=>item.id===value)?.label??value}];
      case 'status':return [{key,label:'Status',value:statusNames[value as keyof typeof statusNames]??value}];
    }
  });
}

export function removeInboxTriageFilter(filters:InboxTriageFilters,key:Ql314FilterKey):InboxTriageFilters {
  return {...filters,[key]:defaultInboxTriageFilters()[key]};
}

/** A saved view belongs to this business only; never display rejected preset content. */
export function describeInboxTriagePreset(value:unknown,organizationId:OrganizationId):string {
  const safe=recoverInboxTriagePreset(value,organizationId);
  if(!safe)return 'No valid view saved in this slot.';
  const filters=activeInboxTriageFilterChips(safe).length;
  const sort=safe.sort==='attention'?'attention first':safe.sort==='subject'?'subject A–Z':'channel A–Z';
  return `Valid saved view · ${filters} active filter${filters===1?'':'s'} · ${sort}.`;
}
