const {test}=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../lib/quiz-core');
const Correction=require('../lib/correction');
const qrFactory=require('../lib/vendor/qrcode');
const jsQR=require('../lib/vendor/jsQR');
const bank=require('../Data/multilingual.json');
test('correction code is stable, accepts normalized typing and rejects other quizzes/languages',async()=>{
  const list=Core.projectBank(bank,'en')[0], identity=await Correction.identity(list,'en');
  assert.deepEqual(await Correction.identity(JSON.parse(JSON.stringify(list)),'en'),identity);
  assert.ok(Correction.matches(identity.code.toLowerCase(),identity));
  assert.ok(Correction.matches(identity.qr,identity));
  assert.equal(Correction.matches(identity.qr.replace(':correction:',':quiz:'),identity),false);
  assert.equal(Correction.matches('https://example.com/',identity),false);
  assert.equal(Correction.matches('A'.repeat(1000),identity),false);
  const finnish=await Correction.identity(Core.projectBank(bank,'fi')[0],'fi');
  assert.equal(Correction.matches(finnish.code,identity),false);
  list.QuestionList.reverse(); assert.notDeepEqual(await Correction.identity(list,'en'),identity);
});
test('correction changes when answer order or answer key changes',async()=>{
  const list=Core.projectBank(bank,'en')[0], original=await Correction.identity(list,'en');
  list.QuestionList[0].answers.reverse(); assert.notDeepEqual(await Correction.identity(list,'en'),original);
  list.QuestionList[0].answers.reverse(); list.QuestionList[0].correctAnswer=1;
  assert.notDeepEqual(await Correction.identity(list,'en'),original);
});
test('generated correction QR round-trips through the bundled decoder',async()=>{
  const identity=await Correction.identity(Core.projectBank(bank,'sv')[0],'sv');
  assert.match(Correction.qrImage(identity.qr),/^data:image\/gif;base64,/);
  const qr=qrFactory(0,'M');qr.addData(identity.qr);qr.make();
  const scale=6,margin=4,width=(qr.getModuleCount()+margin*2)*scale;
  const pixels=new Uint8ClampedArray(width*width*4).fill(255);
  for(let y=0;y<qr.getModuleCount();y++)for(let x=0;x<qr.getModuleCount();x++)if(qr.isDark(y,x)){
    for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){
      const offset=(((y+margin)*scale+dy)*width+(x+margin)*scale+dx)*4;
      pixels[offset]=pixels[offset+1]=pixels[offset+2]=0;
    }
  }
  const decoded=jsQR(pixels,width,width);assert.equal(decoded.data,identity.qr);
  assert.ok(Correction.matches(decoded.data,identity));
});
