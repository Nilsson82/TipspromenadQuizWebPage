/* TIPQ/TIPR v1. Canonical executable format: see docs/PORTABLE-WALKS.md. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WalkCore=api;})(globalThis,function(){
 'use strict';
 const languages=['en','sv','es','da','no','fi'];
 const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
 const check=(ok,key)=>{if(!ok)throw Error(key);};
 const uint=(n,max=0xffffffff)=>Number.isInteger(n)&&n>=0&&n<=max;
 const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&enc.encode(s).length<=max&&!/[\u0000-\u001f\u007f]/.test(s);
 function validateBank(bank){
  check(bank?.schemaVersion===2&&uint(bank.revision)&&Array.isArray(bank.questions),'database');
  const ids=new Set();
  for(const q of bank.questions){
   check(uint(q.questionId,0xffffff)&&!ids.has(q.questionId),'question_id');ids.add(q.questionId);
   check(text(q.category,64)&&text(q.subcategory,64)&&q.translations&&Object.keys(q.translations).length,'database');
   for(const [lang,t] of Object.entries(q.translations))check(languages.includes(lang)&&text(t.question,2000)&&Array.isArray(t.options)&&t.options.length===4&&t.options.every(v=>text(v,500))&&new Set(t.options).size===4&&uint(t.correctIndex,3),'four_options');
  }return bank;
 }
 function randomHex(bytes=8){return Array.from(crypto.getRandomValues(new Uint8Array(bytes)),v=>v.toString(16).padStart(2,'0')).join('');}
 function randomSeed(){return crypto.getRandomValues(new Uint32Array(1))[0];}
 function rng(seed){let x=seed>>>0||0x6d2b79f5;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
 function shuffle(a,random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function options(seed,id,correct,count){check(uint(correct,3)&&[2,3,4].includes(count),'settings');const random=rng((seed^Math.imul(id+1,0x9e3779b1))>>>0);return shuffle([correct,...shuffle([0,1,2,3].filter(i=>i!==correct),random).slice(0,count-1)],random);}
 function validateQuiz(q){
  check(q&&q.version===1,'version');check(uint(q.revision)&&/^[a-f0-9]{16}$/.test(q.quizId)&&uint(q.seed),'quiz');
  check(languages.includes(q.language)&&[2,3,4].includes(q.answerCount)&&['all','one'].includes(q.display)&&['none','time','distance'].includes(q.walk)&&['instant','collect'].includes(q.resultMode),'settings');
  check(uint(q.walkValue,10000)&&(q.walk==='none'?q.walkValue===0:q.walk==='time'?q.walkValue>=180&&q.walkValue<=1800:q.walkValue>=100)&& (q.walk==='none'||q.display==='one'),'settings');
  check(Array.isArray(q.questionIds)&&q.questionIds.length>=1&&q.questionIds.length<=25&&q.questionIds.every(id=>uint(id,0xffffff))&&new Set(q.questionIds).size===q.questionIds.length,'question_id');
  check(text(q.name,32)&&uint(q.created),'name');return q;
 }
 function resolve(q,bank){validateQuiz(q);validateBank(bank);check(bank.revision===q.revision,'revision');return q.questionIds.map(id=>{const question=bank.questions.find(v=>v.questionId===id);check(question,'missing_question');const t=question.translations[q.language];check(t,'language');return{...question,...t,visible:options(q.seed,id,t.correctIndex,q.answerCount)};});}
 function create(bank,settings,ids){const q={version:1,revision:bank.revision,quizId:randomHex(),seed:randomSeed(),created:Math.floor(Date.now()/1000),...settings,questionIds:[...ids]};resolve(q,bank);return q;}
 function choose(pool,count,seed){check(uint(count,25)&&count>0&&pool.length>=count,'insufficient');return shuffle(pool,rng(seed)).slice(0,count);}
 function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
 class Writer{constructor(){this.a=[];}n(v,size){for(let i=size-1;i>=0;i--)this.a.push(Math.floor(v/2**(8*i))&255);}hex(v){for(let i=0;i<v.length;i+=2)this.n(parseInt(v.slice(i,i+2),16),1);}str(v){const b=enc.encode(v);this.n(b.length,1);this.a.push(...b);}finish(prefix){this.n(crc(this.a),4);return prefix+btoa(String.fromCharCode(...this.a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}}
 class Reader{constructor(code,prefix){check(typeof code==='string'&&code.length<=512&&code.startsWith(prefix),'code_type');const s=code.slice(prefix.length);check(/^[A-Za-z0-9_-]+$/.test(s)&&s.length%4!==1,'code');try{this.a=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}catch(_){throw Error('code');}this.i=0;check(this.a.length>=8,'code');const end=this.a.length-4;this.end=end;this.i=end;const checksum=this.n(4);this.i=0;check(crc(this.a.slice(0,end))===checksum,'checksum');}n(size){check(this.i+size<=this.a.length,'code');let n=0;for(let j=0;j<size;j++)n=n*256+this.a[this.i++];return n;}hex(size){let s='';for(let i=0;i<size;i++)s+=this.n(1).toString(16).padStart(2,'0');return s;}str(){const n=this.n(1);check(n<=32&&this.i+n<=this.end,'name');let s;try{s=dec.decode(this.a.slice(this.i,this.i+n));}catch(_){throw Error('name');}this.i+=n;return s;}done(){check(this.i===this.end,'code');}}
 function encodeQuiz(q){validateQuiz(q);const w=new Writer();w.n(1,1);w.n(q.revision,4);w.hex(q.quizId);w.n(q.seed,4);const settings=languages.indexOf(q.language)|((q.answerCount-2)<<3)|((q.display==='one'?1:0)<<5)|(['none','time','distance'].indexOf(q.walk)<<6)|((q.resultMode==='collect'?1:0)<<8);w.n(settings,2);w.n(q.walkValue,2);w.n(q.created,4);w.n(q.questionIds.length,1);q.questionIds.forEach(id=>w.n(id,3));w.str(q.name);return w.finish('TIPQ1.');}
 function decodeQuiz(code){const r=new Reader(code,'TIPQ1.');check(r.n(1)===1,'version');const q={version:1,revision:r.n(4),quizId:r.hex(8),seed:r.n(4)};const bits=r.n(2);check((bits&~511)===0,'settings');q.language=languages[bits&7];q.answerCount=((bits>>3)&3)+2;q.display=(bits&32)?'one':'all';q.walk=['none','time','distance'][(bits>>6)&3];q.resultMode=(bits&256)?'collect':'instant';q.walkValue=r.n(2);q.created=r.n(4);const n=r.n(1);check(n>=1&&n<=25,'question_id');q.questionIds=Array.from({length:n},()=>r.n(3));q.name=r.str();r.done();return validateQuiz(q);}
 function fingerprint(q){return crc(enc.encode(encodeQuiz(q)));}
 function validateResult(r){check(r?.version===1,'version');check(/^[a-f0-9]{16}$/.test(r.quizId)&&/^[a-f0-9]{16}$/.test(r.resultId)&&uint(r.fingerprint),'result');check(text(r.name,32),'name');check(Array.isArray(r.answers)&&r.answers.length>0&&r.answers.length<=25&&r.answers.every(a=>uint(a,3)),'answers');return r;}
 function encodeResult(r){validateResult(r);const w=new Writer();w.n(1,1);w.hex(r.quizId);w.hex(r.resultId);w.n(r.fingerprint,4);w.str(r.name);w.n(r.answers.length,1);for(let i=0;i<r.answers.length;i+=4){let b=0;for(let j=0;j<4;j++)b|=(r.answers[i+j]||0)<<(6-j*2);w.n(b,1);}return w.finish('TIPR1.');}
 function decodeResult(code){const r=new Reader(code,'TIPR1.');check(r.n(1)===1,'version');const result={version:1,quizId:r.hex(8),resultId:r.hex(8),fingerprint:r.n(4),name:r.str(),answers:[]};const n=r.n(1);check(n>=1&&n<=25,'answers');for(let i=0;i<n;i+=4){const b=r.n(1);for(let j=0;j<4&&i+j<n;j++)result.answers.push((b>>(6-2*j))&3);if(i+4>n)check((b&((1<<(2*(i+4-n)))-1))===0,'answers');}r.done();return validateResult(result);}
 function score(q,bank,result){validateResult(result);check(result.quizId===q.quizId&&result.fingerprint===fingerprint(q),'wrong_quiz');const questions=resolve(q,bank);check(result.answers.length===questions.length,'answers');check(questions.every((item,i)=>item.visible.includes(result.answers[i])),'answers');const correct=questions.reduce((sum,item,i)=>sum+(item.correctIndex===result.answers[i]?1:0),0);return{...result,correct,incorrect:questions.length-correct,total:questions.length,score:correct};}
 function addResult(q,bank,rows,result){check(!rows.some(row=>row.resultId===result.resultId),'duplicate_result');return[...rows,score(q,bank,result)];}
 function leaderboard(rows){const sorted=[...rows].sort((a,b)=>b.score-a.score||a.resultId.localeCompare(b.resultId));let rank=0;const ranked=sorted.map((r,i)=>{if(!i||r.score!==sorted[i-1].score)rank=i+1;return{...r,rank};});return{rows:ranked,count:rows.length,highest:rows.length?sorted[0].score:0,average:rows.length?rows.reduce((n,r)=>n+r.score,0)/rows.length:0};}
 return{languages,check,text,uint,validateBank,validateQuiz,resolve,create,choose,options,randomHex,randomSeed,encodeQuiz,decodeQuiz,encodeResult,decodeResult,fingerprint,score,addResult,leaderboard,crc};
});
