import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function build432SourceCommit(){
 return {
  name:'build432-source-commit',
  closeBundle(){
   const commit=(process.env.WORKERS_CI_COMMIT_SHA||process.env.GITHUB_SHA||'0'.repeat(40)).trim();
   if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Build 432 source commit is not a 40-hex Git SHA');
   writeFileSync(resolve(process.cwd(),'dist/build432-source-commit.json'),JSON.stringify({commit})+'\n',{encoding:'utf8'});
  }
 };
}
export default defineConfig({
  plugins: [react(),build432SourceCommit()],
  server: { port: 5173 },
  preview: { port: 4173 }
});
