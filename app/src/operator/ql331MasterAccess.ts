import { QL329_SHELLS, QL329_SUPPORT } from './ql329MasterShellTruth';

/**
 * QL-331: real database-enforced identity is the source of authorization.
 * The browser displays only public source metadata until Supabase Auth has
 * verified the user and PostgreSQL RLS returns a scoped principal/grant.
 * No user_metadata, emails, unsigned claims or client supplied role controls.
 */
export const QL331_REFERENCE_PROJECT = 'gxujcwpktaickcgzyvnu';
export const QL331_SNAPSHOT = {
  observedDate: '2026-11-03',
  authUsersAtPreflight: 0,
  masterPrincipalsAtPreflight: 0,
  ownerEnrollment: 'PENDING_VERIFIED_AUTH_USER',
  dbTables: ['master_principals', 'master_shell_registry', 'master_child_tenants',
    'master_shell_grants', 'master_security_audit'],
  sourceConnections: 0,
  externalSourceRequests: 0,
  externalWrites: 0,
  masterTenantReadGrants: 0,
  ack: 'UNDER_REVIEW / PARKED_FOR_LATER',
  windowsRelay: 'OFF',
} as const;

export const QL331_PUBLIC_SOURCES = [
  ...QL329_SHELLS.map(s => ({
    id: s.id, name: s.label, kind: 'business' as const,
    sourceAppId: s.integrationIdentity, ownedExample: s.ownerChild,
    permissionBoundary: 'PLATFORM_SHELL_NOT_CHILD',
    status: 'DISCONNECTED / HOLD',
  })),
  ...QL329_SUPPORT.map(s => ({
    id: s.id, name: s.label, kind: 'support' as const,
    sourceAppId: s.id, ownedExample: null,
    permissionBoundary: 'NO_CUSTOMER_TENANT',
    status: 'DISCONNECTED / HOLD',
  })),
] as const;

export const QL331_BOOTSTRAP_GATES = [
  {id: 'registered',label: 'Authentic user created in Supabase Auth',state: 'REQUIRED'},
  {id: 'verified',label: 'Email or identity ownership independently verified',state: 'REQUIRED'},
  {id: 'enrolled',label: 'Server-only owner enrolment with independent evidence receipt',state: 'REQUIRED'},
  {id: 'rls',label: 'Database RLS and negative permissions verified',state: 'ENFORCED_BY_SCHEMA'},
  {id: 'delegation',label: 'Each shell and child permission separately approved',state: 'NO_AUTOMATIC_GRANTS'},
  {id: 'gateway',label: 'Independent signed peer TEST authorization',state: 'HOLD'},
] as const;

export type Ql331Role = 'owner' | 'admin' | 'auditor' | 'shell_operator';
export type Ql331State =
  'CLIENT_DISABLED'|'AUTH_NOT_VERIFIED'|'NOT_ENROLLED'|'REJECTED'|
  'VERIFIED_METADATA_READ'|'DATABASE_ERROR';
export type Ql331AccessResult = {
  state: Ql331State;
  message: string;
  verifiedAuth: boolean;
  role: Ql331Role|null;
  readableShells: string[];
  activeGrantCount: number;
  childReadCount: number;
  masterUserEnrolled: boolean;
  scopeNote: string;
  sourceGets: 0;
  sourceWrites: 0;
  peerConnections: 0;
};

type AuthResponse = {
  data?: {user?: {id?: string; email_confirmed_at?: string|null; confirmed_at?: string|null}|null};
  error?: unknown;
};
type ReadResponse = {data?: unknown;error?: unknown};
export interface Ql331MasterReadGateway {
  auth: {getUser: () => Promise<AuthResponse>};
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string,value: string|boolean) => {maybeSingle: () => Promise<ReadResponse>; then?: unknown};
      order: (column: string) => Promise<ReadResponse>;
      then?: unknown;
    };
  };
}

function result(state: Ql331State, message: string,
  opts: Partial<Pick<Ql331AccessResult,'verifiedAuth'|'role'|'readableShells'|'activeGrantCount'|'childReadCount'|'masterUserEnrolled'>>={}):Ql331AccessResult {
  return {
    state,message,
    verifiedAuth:opts.verifiedAuth??false,
    role:opts.role??null,
    readableShells:opts.readableShells??[],
    activeGrantCount:opts.activeGrantCount??0,
    childReadCount:opts.childReadCount??0,
    masterUserEnrolled:opts.masterUserEnrolled??false,
    scopeNote:'Shell identity does not confer a child-tenant, customer, message or peer connection grant.',
    sourceGets:0,sourceWrites:0,peerConnections:0,
  };
}
const isRole=(x:unknown):x is Ql331Role =>
  x==='owner'||x==='admin'||x==='auditor'||x==='shell_operator';
const knownIds=new Set<string>(QL331_PUBLIC_SOURCES.map(s=>s.id));

/**
 * An explicit operator request, never a background probe. getUser() contacts
 * Auth to verify the access token; then the DB enforces auth.uid()-bound RLS.
 * No returned row is trusted as an authorization to an external child or peer.
 */
export async function ql331VerifyMasterAccess(gateway:Ql331MasterReadGateway|null):Promise<Ql331AccessResult>{
  if(!gateway) return result('CLIENT_DISABLED',
    'Optional Supabase client is disabled on the public preview. No authentication request was sent.');
  let auth:AuthResponse;
  try{auth=await gateway.auth.getUser();}
  catch{return result('AUTH_NOT_VERIFIED','Supabase Auth identity could not be verified.');}
  const user=auth.data?.user;
  if(auth.error||!user?.id||!(user.email_confirmed_at||user.confirmed_at))
    return result('AUTH_NOT_VERIFIED','No independently verified signed-in Auth user is available.');
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!uuid.test(user.id))
    return result('AUTH_NOT_VERIFIED','Invalid authenticated user identifier.');
  const authOnly={verifiedAuth:true};
  try{
    const principal = await gateway.from('master_principals')
      .select('user_id,master_role,active').eq('user_id',user.id).maybeSingle();
    if(principal.error) return result('DATABASE_ERROR','Master membership read was denied or unavailable.',authOnly);
    const p=principal.data as {user_id?:unknown; master_role?:unknown; active?:unknown}|null|undefined;
    if(!p||p.user_id!==user.id||p.active!==true||!isRole(p.master_role))
      return result('NOT_ENROLLED','Authenticated user has no active, owner-approved master membership.',authOnly);
    const grants=await gateway.from('master_shell_grants')
      .select('shell_id,child_tenant_id,grant_scope,state').order('shell_id');
    if(grants.error) return result('DATABASE_ERROR','Master grants are not available.',authOnly);
    const shells=await gateway.from('master_shell_registry')
      .select('shell_id,connection_status,shell_kind').order('shell_id');
    if(shells.error) return result('DATABASE_ERROR','Authenticated master registry read failed.',authOnly);
    const children=await gateway.from('master_child_tenants')
      .select('shell_id,child_tenant_id').order('shell_id');
    if(children.error) return result('DATABASE_ERROR','Authorized child context could not be verified.',authOnly);
    const grantsRows=Array.isArray(grants.data)?grants.data as Record<string,unknown>[]:[];
    const visible=Array.isArray(shells.data)?shells.data as Record<string,unknown>[]:[];
    const childRows=Array.isArray(children.data)?children.data as Record<string,unknown>[]:[];
    const readableShells=visible.filter(row=>typeof row.shell_id==='string'&&knownIds.has(row.shell_id)
      &&row.connection_status==='DISCONNECTED / HOLD').map(row=>row.shell_id as string);
    const permittedChildren=childRows.filter(row=>
      typeof row.shell_id==='string' && knownIds.has(row.shell_id) &&
      typeof row.child_tenant_id==='string'&&grantsRows.some(grant=>
        grant.shell_id===row.shell_id && grant.child_tenant_id===row.child_tenant_id
        &&grant.grant_scope==='child_read' && grant.state==='ACTIVE')).length;
    return result('VERIFIED_METADATA_READ',
      'Supabase Auth identity and the active master membership passed independent database reads. No external source is connected.',
      {verifiedAuth:true,role:p.master_role,
       readableShells:[...new Set(readableShells)],
       activeGrantCount:grantsRows.filter(row=>row.state==='ACTIVE'&&knownIds.has(String(row.shell_id))).length,
       childReadCount:permittedChildren,masterUserEnrolled:true});
  }catch {
    return result('DATABASE_ERROR','Master database could not complete a verified scoped read.',authOnly);
  }
}

export type Ql331RequestedScope='shell_metadata'|'child_records'|'support_as_child';
export type Ql331ScopeDecision='AUTHENTICATED_GRANT_REQUIRED'|'CHILD_GRANT_REQUIRED'|'DENY_SUPPORT_CHILD';
export function ql331PreviewScope(shellId:string, scope:Ql331RequestedScope):{
  decision:Ql331ScopeDecision;detail:string;liveAuthorized:false;accesses:0
}{
  const source=QL331_PUBLIC_SOURCES.find(s=>s.id===shellId);
  if(!source||source.kind==='support'||scope==='support_as_child')
    return {decision:'DENY_SUPPORT_CHILD',detail:'Supporting systems and unknown connectors are never customer child tenants.',
      liveAuthorized:false,accesses:0};
  if(scope==='child_records')
    return {decision:'CHILD_GRANT_REQUIRED',
      detail:'Only a source-owned child ID with a separate active database grant may be read. Master ownership alone is insufficient.',
      liveAuthorized:false,accesses:0};
  return {decision:'AUTHENTICATED_GRANT_REQUIRED',
    detail:'A verified Supabase Auth user, active master membership and RLS-granted shell scope are required.',
    liveAuthorized:false,accesses:0};
}

export function ql331Readiness(){
  const ids=QL331_PUBLIC_SOURCES.map(s=>s.id);
  return {
    sourceCount:ids.length,businessShells:QL331_PUBLIC_SOURCES.filter(s=>s.kind==='business').length,
    supports:QL331_PUBLIC_SOURCES.filter(s=>s.kind==='support').length,uniqueIds:new Set(ids).size,
    allHeld:QL331_PUBLIC_SOURCES.every(s=>s.status==='DISCONNECTED / HOLD'),
    masterAuthUsersAtPreflight:QL331_SNAPSHOT.authUsersAtPreflight,
    ownerEnrolled:false,externalPeerConnections:0,childTenantGrants:0,
  };
}
