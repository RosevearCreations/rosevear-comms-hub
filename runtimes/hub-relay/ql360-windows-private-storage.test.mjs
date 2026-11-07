import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {createQl360WindowsPrivateStore} from './ql360-windows-private-storage.mjs';
const source=readFileSync(new URL('./ql360-windows-private-storage.mjs',import.meta.url),'utf8');

test('QL-360 original-only archival store cannot load with nonoriginal CI identity',()=>{
  // Both Linux and the non-Ree Windows GitHub runner must fail closed.
  if(process.platform!=='win32'||process.env.COMPUTERNAME?.toUpperCase()!=='DESKTOP-AE894KC')
    assert.throws(()=>createQl360WindowsPrivateStore(),/ORIGINAL_REE_WINDOWS_HOST/);
});

test('QL-360 archive uses current-user original Windows ACL, atomic create-new and hash readback',()=>{
  assert.match(source,/userInfo\(\)\.username\.toLowerCase\(\)!=='ree'/);
  assert.match(source,/restrictDirectory\(directory\)/);
  assert.match(source,/flag:'wx',mode:0o600/);
  assert.match(source,/sha\(data\.evidence\)!==expectedSha256/);
  assert.match(source,/!ID\.test\(archiveId/);
  assert.doesNotMatch(source,/service_role|NEXT_PUBLIC_|Start-Process|DATABASE_URL/);
});
