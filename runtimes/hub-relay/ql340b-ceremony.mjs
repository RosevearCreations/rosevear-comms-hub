/** QL-340B local operator utility. All actions remain OFFLINE and TEST-only. */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fileNames,hiddenPassphrase,restrictDirectory,roleDirectory} from './owner-authority-custody.mjs';
import {assembleSignedEnrollment,createEnrollmentRequest,hashWitnessFiles,
  inspectEnrollmentRequest,signOwnerRequest} from './ql340b-enrollment.mjs';

const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
const writeNew=(path,data)=>writeFileSync(resolve(path),JSON.stringify(data,null,2)+'\n',
  {flag:'wx',mode:0o600});
const help={schema:'rosevear.hub.ql340b.ceremony-cli.v1',
  commands:['--prepare DEVICE_PUBLIC SOURCE_PUBLIC MASTER_PUBLIC EVIDENCE_FILE_PATHS_JSON REQUEST_OUTPUT',
    '--inspect-request REQUEST','--sign source|master REQUEST REVIEWED_PAYLOAD_SHA256 APPROVAL_OUTPUT',
    '--assemble REQUEST SOURCE_APPROVAL MASTER_APPROVAL'],
  liveConnection:false,networkRequests:0,databaseMutations:0};

export async function runCeremonyCli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return help;
  if(args.length===6&&args[0]==='--prepare'){
    const [,devicePath,sourcePath,masterPath,evidencePaths,output]=args;
    const request=createEnrollmentRequest({device:readJson(devicePath),
      source:readJson(sourcePath),master:readJson(masterPath),
      witnessHashes:hashWitnessFiles(readJson(evidencePaths))});
    const inspected=inspectEnrollmentRequest(request);
    if(!inspected.valid)throw Error(inspected.state);
    writeNew(output,request);
    return {state:'UNSIGNED_20_MINUTE_TEST_REQUEST_CREATED_REVIEW_REQUIRED',
      requestPath:resolve(output),payloadSha256:inspected.payloadSha256,
      expiresAt:inspected.expiresAt,databaseEnrollmentCreated:false,receiverActivated:false};
  }
  if(args.length===2&&args[0]==='--inspect-request'){
    const inspected=inspectEnrollmentRequest(readJson(args[1]));
    return {...inspected,databaseEnrollmentCreated:false,receiverActivated:false};
  }
  if(args.length===5&&args[0]==='--sign'){
    const [,role,requestPath,reviewedSha256,outputPath]=args;
    if(!['source','master'].includes(role))throw Error('DENY_OWNER_SIGNING_ROLE');
    const request=readJson(requestPath),inspected=inspectEnrollmentRequest(request);
    if(!inspected.valid)throw Error(inspected.state);
    if(reviewedSha256!==inspected.payloadSha256)
      throw Error('DENY_OWNER_REVIEW_HASH_MISMATCH');
    const {privateKey,candidate}=fileNames(role,roleDirectory(role));
    if(!existsSync(privateKey)||!existsSync(candidate))throw Error('HOLD_REAL_LOCAL_OWNER_KEY_MISSING');
    const passphrase=await hiddenPassphrase(`Original ${role} owner: approve only the reviewed TEST request; passphrase (hidden): `);
    const approval=signOwnerRequest({request,role,
      localCandidate:readJson(candidate),encryptedPrivateKeyPem:readFileSync(privateKey,'utf8'),
      passphrase});
    writeNew(outputPath,approval);
    return {state:'SIGNED_TEST_APPROVAL_CREATED_PENDING_OTHER_OWNER_AND_FIELD_WITNESS',
      role,keyId:approval.keyId,payloadSha256:approval.payloadSha256,
      approvalPath:resolve(outputPath),privateKeyPrinted:false,
      databaseEnrollmentCreated:false,receiverActivated:false};
  }
  if(args.length===4&&args[0]==='--assemble'){
    const [,requestPath,sourcePath,masterPath]=args;
    const assembled=assembleSignedEnrollment({request:readJson(requestPath),
      sourceApproval:readJson(sourcePath),masterApproval:readJson(masterPath)});
    if(process.platform!=='win32'||!process.env.LOCALAPPDATA)
      throw Error('PRIVATE_WINDOWS_RECEIVER_HOST_REQUIRED');
    const directory=join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay','Enrollment');
    mkdirSync(directory,{recursive:true});restrictDirectory(directory);
    const enrollmentPath=join(directory,'ql340b-signed-test-enrollment.json');
    const pinsPath=join(directory,'ql340b-private-owner-public-pins.json');
    if(existsSync(enrollmentPath)||existsSync(pinsPath))
      throw Error('DENY_EXISTING_SIGNED_ENROLLMENT_NO_OVERWRITE');
    writeNew(enrollmentPath,assembled.enrollmentRecord);
    writeNew(pinsPath,assembled.ownerAuthorityPins);
    return {state:assembled.state,enrollmentPath,pinsPath,
      databaseEnrollmentCreated:false,receiverActivated:false,realDeviceReceiptObserved:false};
  }
  throw Error('DENY_UNAPPROVED_CEREMONY_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(await runCeremonyCli())+'\n');}
  catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;}
}
