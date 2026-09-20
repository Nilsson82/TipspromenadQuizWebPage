const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../lib/walk-core');
const Correction=require('../lib/correction');
const bank=require('../Data/revision-1.json');
const settings={name:'Test walk',language:'en',answerCount:3,display:'all',walk:'none',walkValue:0,resultMode:'collect'};
const quiz=()=>C.create(bank,settings,bank.questions.filter(q=>!q.deprecated&&q.translations.en).slice(0,25).map(q=>q.questionId));
test('all six walk dictionaries have complete UI and error keys',()=>{
 const messages=require('../locales/walk.json');for(const language of C.languages)assert.deepEqual(Object.keys(messages[language]).sort(),Object.keys(messages.en).sort());
});
test('canonical source has unique numeric IDs and four options in every translation',()=>{
 C.validateBank(bank);assert.equal(bank.questions.length,30);assert.equal(quiz().questionIds.length,25);
 const bad=structuredClone(bank);bad.questions[1].questionId=bad.questions[0].questionId;assert.throws(()=>C.validateBank(bad),/question_id/);
 bad.questions[1].questionId=2;bad.questions[0].translations.en.options.pop();assert.throws(()=>C.validateBank(bad),/four_options/);
});
test('2/3/4 visible options include correct answer and deterministic order',()=>{
 for(let seed=0;seed<100;seed++)for(let correct=0;correct<4;correct++)for(const count of [2,3,4]){const a=C.options(seed,25,correct,count);assert.equal(a.length,count);assert(a.includes(correct));assert.equal(new Set(a).size,count);assert.deepEqual(a,C.options(seed,25,correct,count));}
});
test('25-question binary roundtrip and compact budget',()=>{
 const q=quiz(),code=C.encodeQuiz(q),loaded=C.decodeQuiz(code);assert.deepEqual(loaded,q);
 assert(Buffer.from(code.split('.')[1],'base64url').length<=150);
 assert.deepEqual(C.resolve(loaded,structuredClone(bank)),C.resolve(q,bank));
});
test('corruption, type mismatch, future versions, revision and missing IDs are rejected',()=>{
 const q=quiz(),code=C.encodeQuiz(q);assert.throws(()=>C.decodeResult(code),/code_type/);
 const b=Buffer.from(code.split('.')[1],'base64url');b[9]^=1;assert.throws(()=>C.decodeQuiz('TIPQ1.'+b.toString('base64url')),/checksum/);
 assert.throws(()=>C.resolve({...q,revision:99},bank),/revision/);
 assert.throws(()=>C.resolve({...q,questionIds:[16000000]},bank),/missing_question/);
 assert.throws(()=>C.resolve({...q,language:'fi'},bank),/language/);
 assert.throws(()=>C.encodeQuiz({...q,version:2}),/version/);
 assert.throws(()=>C.decodeQuiz(code+'A'));
});
test('create/share/join/play/import/reimport and ranked leaderboard',()=>{
 const q=quiz(),joined=C.decodeQuiz(C.encodeQuiz(q)),questions=C.resolve(joined,bank);
 const result={version:1,quizId:q.quizId,resultId:C.randomHex(),fingerprint:C.fingerprint(q),name:'Åsa 🌲',answers:questions.map(q=>q.correctIndex)};
 const decoded=C.decodeResult(C.encodeResult(result));assert.deepEqual(decoded,result);
 const rows=C.addResult(q,bank,[],decoded);assert.equal(rows[0].score,25);assert.equal(rows[0].incorrect,0);
 assert.throws(()=>C.addResult(q,bank,rows,decoded),/duplicate_result/);
 assert.throws(()=>C.score({...q,seed:(q.seed^1)>>>0},bank,decoded),/wrong_quiz/);
 const second={...result,resultId:C.randomHex(),name:'Alex',answers:questions.map(q=>q.visible.find(i=>i!==q.correctIndex))};
 const both=C.addResult(q,bank,rows,second);assert.equal(C.leaderboard(both).average,12.5);assert.deepEqual(C.leaderboard(both).rows.map(r=>r.rank),[1,2]);
 const tied=C.addResult(q,bank,both,{...result,resultId:C.randomHex(),name:'Robin'});assert.deepEqual(C.leaderboard(tied).rows.map(r=>r.rank),[1,1,3]);
 assert.throws(()=>C.encodeResult({...result,name:'🌲'.repeat(9)}),/name/);assert.throws(()=>C.encodeResult({...result,answers:[null]}),/answers/);
});
test('walking settings and pool shortage fail clearly',()=>{
 const q=quiz();assert.throws(()=>C.encodeQuiz({...q,walk:'time',walkValue:180}),/settings/);
 assert.equal(C.decodeQuiz(C.encodeQuiz({...q,display:'one',walk:'distance',walkValue:100})).walk,'distance');
 assert.throws(()=>C.choose([1,2],5,1),/insufficient/);assert.equal(new Set(C.choose([1,2,3],3,1)).size,3);
});
test('quiz and result QR decode to the exact portable text',()=>{
 const qrFactory=require('../lib/vendor/qrcode');
 const q=quiz(),codes=[C.encodeQuiz(q),C.encodeResult({version:1,quizId:q.quizId,resultId:C.randomHex(),fingerprint:C.fingerprint(q),name:'Anders',answers:C.resolve(q,bank).map(q=>q.correctIndex)})];
 for(const code of codes){const qr=qrFactory(0,'M');qr.addData(code);qr.make();const n=qr.getModuleCount(),scale=5,size=(n+8)*scale,pixels=new Uint8ClampedArray(size*size*4);pixels.fill(255);for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){const p=(((y+4)*scale+dy)*size+(x+4)*scale+dx)*4;pixels[p]=pixels[p+1]=pixels[p+2]=0;}assert.equal(Correction.decode({getImageData:()=>({data:pixels})},size,size),code);}
});
