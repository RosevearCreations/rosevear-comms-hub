import { readFileSync } from 'node:fs';
import {describe,expect,it} from 'vitest';

const catalog=JSON.parse(readFileSync(new URL('../../../../.github/rosevear-master-themes.v2.json',import.meta.url),'utf8')) as {
 themeIds:string[];
 themes:{id:string;text:string;panel:string}[];
 build359Extension:{sharedThemeCount:number;newThemeIds:string[]};
 presentationOnly:boolean;
 authorityTransfer:boolean;
};
const source=readFileSync(new URL('../Ql462UnifiedServerShell.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../ql462-unified-server-shell.css',import.meta.url),'utf8');
const names=['aurora','amber-night','orchid','daylight'];
describe('QL-468 cross-Master sixteen theme parity (display-only)',()=>{
 it('preserves previous twelve and adds the same four real selectable themes',()=>{
  expect(catalog.themeIds.length).toBe(16);
  expect(new Set(catalog.themeIds).size).toBe(16);
  expect(catalog.build359Extension.newThemeIds).toEqual(names);
  expect(catalog.build359Extension.sharedThemeCount).toBe(16);
  for(const theme of catalog.themeIds){
   expect(source).toContain("id:'"+theme+"'");
   if(theme!=='instrument')expect(css).toContain('data-ql462-theme="'+theme+'"');
  }
 });
 it('is cosmetic and never starts a private receiver or grants service authority',()=>{
  expect(catalog.presentationOnly).toBe(true);
  expect(catalog.authorityTransfer).toBe(false);
  expect(source).toContain('Private receiver OFF / unverified');
  expect(source).not.toContain('ql340c-windows-operator.ps1 -Start');
  expect(css).toContain('color-scheme:light');
  expect(css).toContain('input[type="date"]');
  expect(css).toContain('min-height:46px');
 });
});
