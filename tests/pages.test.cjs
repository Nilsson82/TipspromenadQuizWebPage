const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('GitHub Pages offline shell references existing relative assets',()=>{
 const script=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const files=vm.runInNewContext(script+';FILES',{self:{addEventListener(){}}});
 for(const file of files){assert(!file.startsWith('/'));assert(fs.existsSync(path.join(root,file==='./'?'index.html':file)),file);}
 for(const match of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(path.join(root,match[1])),match[1]);
 assert(fs.existsSync(path.join(root,'.nojekyll')));
});
