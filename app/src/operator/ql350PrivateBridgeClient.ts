/** QL-350 same-origin PRIVATE sidecar contract. No bearer key, DPAPI material,
 * arbitrary URL or source application address ever enters the browser. */
import {QL349_PUBLIC_SOURCES} from './ql349PublicSourceRefresh';

export const QL350_SCHEMA='rosevear.hub.ql350.private-connection-control.v1';
export type Ql350PrivateStatus={schema:typeof QL350_SCHEMA;state:string;
  connectedCount:0;authenticatedPrivateOperator:true;peerCount:6;
  originalEnrollmentCount:0|1;originalReceiptCount:number;
  originalReceiptVerified:boolean;readyForOneSourceTest:boolean;
  peers:Array<{sourceId:string;state:'DISCONNECTED / HOLD'}>};
export type Ql350TestResult={schema:typeof QL350_SCHEMA;state:string;
  connectedCount:0;sourceId?:string;authenticatedTest?:boolean};

const IDS=QL349_PUBLIC_SOURCES.map(s=>s.id);
const noRedirect=(r:Response)=>r.ok&&!r.redirected&&
  (!r.url||new URL(r.url).origin===window.location.origin);

export function inspectQl350PrivateStatus(value:unknown):Ql350PrivateStatus|null{
  const x=value as Partial<Ql350PrivateStatus>|null;
  if(!x||x.schema!==QL350_SCHEMA||x.connectedCount!==0||
    x.authenticatedPrivateOperator!==true||x.peerCount!==6||
    !Number.isSafeInteger(x.originalEnrollmentCount)||
    ![0,1].includes(x.originalEnrollmentCount!)||
    !Number.isSafeInteger(x.originalReceiptCount)||x.originalReceiptCount!<0||
    typeof x.originalReceiptVerified!=='boolean'||
    typeof x.readyForOneSourceTest!=='boolean'||
    !Array.isArray(x.peers)||x.peers.length!==6||
    !IDS.every(id=>x.peers!.some(peer=>peer.sourceId===id&&
      peer.state==='DISCONNECTED / HOLD'))||
    (x.readyForOneSourceTest===true&&
      (x.originalEnrollmentCount!==1||x.originalReceiptVerified!==true)))
    return null;
  return x as Ql350PrivateStatus;
}

export async function checkPrivateQl350Bridge(fetcher:typeof fetch=fetch){
  const response=await fetcher('/private/ql350/status',{method:'GET',
    credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',
    signal:AbortSignal.timeout(5000)});
  if(!noRedirect(response))return null;
  return inspectQl350PrivateStatus(await response.json());
}

export async function requestOnePrivateQl350Test(sourceId:string,operationId:string,
  fetcher:typeof fetch=fetch):Promise<Ql350TestResult|null>{
  if(!IDS.includes(sourceId as typeof IDS[number])||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(operationId))
    return null;
  const response=await fetcher('/private/ql350/test',{method:'POST',
    credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sourceId,operationId}),signal:AbortSignal.timeout(90000)});
  if(response.redirected||response.status<200||response.status>=300)return null;
  const value=await response.json() as Partial<Ql350TestResult>;
  if(value.schema!==QL350_SCHEMA||value.connectedCount!==0||
    typeof value.state!=='string'||value.state.length>120||
    value.sourceId&&value.sourceId!==sourceId)return null;
  return value as Ql350TestResult;
}
