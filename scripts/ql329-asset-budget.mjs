import {readFileSync,readdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const QL329_BUDGET={
  jsBytes:3_500_000,cssBytes:550_000,jsGzipBytes:780_000,cssGzipBytes:115_000
};
export function assessAssets(dir,{limits=QL329_BUDGET}={}){
  const names=readdirSync(dir).filter(name=>/^index-[A-Za-z0-9_-]+\.(?:js|css)$/.test(name));
  const js=names.filter(name=>name.endsWith('.js'));
  const css=names.filter(name=>name.endsWith('.css'));
  if(js.length!==1||css.length!==1)throw Error('QL329_EXPECTED_ONE_INDEX_JS_AND_CSS');
  const jsContent=readFileSync(join(dir,js[0]));
  const cssContent=readFileSync(join(dir,css[0]));
  const values={jsFile:js[0],cssFile:css[0],
    jsBytes:jsContent.byteLength,cssBytes:cssContent.byteLength,
    jsGzipBytes:gzipSync(jsContent).byteLength,cssGzipBytes:gzipSync(cssContent).byteLength};
  const failures=Object.entries(limits).filter(([key,max])=>values[key]>max).map(([key,max])=>key+' '+values[key]+' exceeds '+max);
  return {values,limits,failures,pass:failures.length===0};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const path=process.argv[2]??join(process.cwd(),'dist','assets');
  const outcome=assessAssets(path);
  console.log(JSON.stringify({build:'QL-329',...outcome},null,2));
  if(!outcome.pass)process.exitCode=1;
}
