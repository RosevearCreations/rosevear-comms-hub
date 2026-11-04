import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assessAssets,QL329_BUDGET} from '../ql329-asset-budget.mjs';

function fixture(js,css,action){
  const root=mkdtempSync(join(tmpdir(),'ql329-'));
  const assets=join(root,'assets');mkdirSync(assets);
  writeFileSync(join(assets,'index-test.js'),js);writeFileSync(join(assets,'index-test.css'),css);
  try{return action(assets);}finally{rmSync(root,{recursive:true,force:true});}
}
test('QL-329 accepts a bounded built bundle and measures both raw and gzip bytes',()=>{
  fixture('const a=1;','.a{color:red}',assets=>{
    const out=assessAssets(assets);
    assert.equal(out.pass,true);
    assert.ok(out.values.jsBytes>0&&out.values.jsGzipBytes>0);
    assert.deepEqual(out.failures,[]);
  });
});
test('QL-329 rejects raw and gzip over-budget output instead of silently calling it optimized',()=>{
  fixture('const a=1;','.a{color:red}',assets=>{
    const out=assessAssets(assets,{limits:{jsBytes:3,cssBytes:2,jsGzipBytes:4,cssGzipBytes:4}});
    assert.equal(out.pass,false);
    assert.deepEqual(new Set(out.failures.map(x=>x.split(' ')[0])),
      new Set(['jsBytes','cssBytes','jsGzipBytes','cssGzipBytes']));
  });
});
test('QL-329 fails closed on missing or duplicate Vite entry assets',()=>{
  const root=mkdtempSync(join(tmpdir(),'ql329-empty-'));
  try{assert.throws(()=>assessAssets(root),/QL329_EXPECTED_ONE_INDEX_JS_AND_CSS/);}
  finally{rmSync(root,{recursive:true,force:true});}
});
test('QL-329 checks deployed app size ceilings with documented deterministic budgets',()=>{
  assert.deepEqual(QL329_BUDGET,{jsBytes:3500000,cssBytes:550000,
    jsGzipBytes:780000,cssGzipBytes:115000});
});
