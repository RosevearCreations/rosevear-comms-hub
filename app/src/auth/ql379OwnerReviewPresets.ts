import type {OwnerIncidentTriageOptions} from './ql378OwnerIncidentTriage';
export type OwnerReviewPreset='all'|'urgent'|'active'|'historical';
export type OwnerReviewSettings=Pick<OwnerIncidentTriageOptions,'search'|'status'|'severity'|'groupRepeats'>;
/** Session-only shortcuts; never alter the underlying observations. */
export function ownerReviewPreset(preset:OwnerReviewPreset):OwnerReviewSettings{
  switch(preset){
    case 'urgent':return {search:'',status:'showing',severity:'action',groupRepeats:true};
    case 'active':return {search:'',status:'showing',severity:'all',groupRepeats:true};
    case 'historical':return {search:'',status:'ended',severity:'all',groupRepeats:true};
    default:return {search:'',status:'all',severity:'all',groupRepeats:true};
  }
}
