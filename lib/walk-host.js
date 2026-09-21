/* The Android host executes this module in its dedicated local WebView engine.
   Storage stays in the same device-local IndexedDB as the app. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.WalkHost=factory(root.WalkCore,root.WalkStore,async revision=>(await root.WalkStore.get('bank:'+revision))||root.WalkCore.validateBank(await(await fetch('Data/revision-'+revision+'.json')).json()));})(globalThis,function(C,S,loadBank){
 let queue=Promise.resolve();
 async function route(request){
  const {method,path,data={},authorization=''}=request;
  try{
   if(method==='POST'&&path==='/api/hosts'){
    C.check((await S.list('lan-room:')).filter(r=>r&&Date.now()-r.created<7*86400000).length<100,'full');const quiz=C.decodeQuiz(data.code),bank=await loadBank(quiz.revision);C.resolve(quiz,bank);C.tieBreaker(quiz,bank);let joinCode;
    do{joinCode=C.randomHex(3).toUpperCase();}while(await S.get('lan-room:'+joinCode));
    const room={code:data.code,bank,adminToken:C.randomHex(24),created:Date.now(),participants:{}};await S.put('lan-room:'+joinCode,room);return{status:201,body:{joinCode,adminToken:room.adminToken}};
   }
   const joinCode=String(data.joinCode||path.split('/').at(-1)).trim().toUpperCase(),room=await S.get('lan-room:'+joinCode);
   if(!room||Date.now()-room.created>7*86400000)return{status:404,body:{error:'host_unavailable'}};
   const quiz=C.decodeQuiz(room.code);
   if(method==='POST'&&path==='/api/join'){
    C.check(C.text(data.name,quiz.version===2?128:32),'name');C.check(Object.keys(room.participants).length<200,'full');const participantToken=C.randomHex(24);room.participants[participantToken]={name:data.name,result:null};await S.put('lan-room:'+joinCode,room);return{status:200,body:{code:room.code,bank:room.bank,participantToken}};
   }
   if(method==='POST'&&path==='/api/results'){
    const participant=room.participants[data.participantToken];if(!participant)return{status:403,body:{error:'participant'}};
    const result=C.decodeResult(data.code);C.check(result.name===participant.name,'name');C.score(quiz,room.bank,result);
    if(participant.result){C.check(participant.result===data.code,'duplicate_result');return{status:200,body:{delivered:true}};}
    C.check(!Object.values(room.participants).some(p=>p.result&&C.decodeResult(p.result).resultId===result.resultId),'duplicate_result');participant.result=data.code;await S.put('lan-room:'+joinCode,room);return{status:200,body:{delivered:true}};
   }
   if(method==='GET'&&path.startsWith('/api/hosts/')){
    if(authorization!=='Bearer '+room.adminToken)return{status:403,body:{error:'host_key'}};
    const rows=Object.values(room.participants).filter(p=>p.result).map(p=>C.score(quiz,room.bank,C.decodeResult(p.result)));
    return{status:200,body:{...C.leaderboard(rows),participants:Object.values(room.participants).map(p=>({name:p.name,completed:!!p.result})),total:quiz.questionIds.length}};
   }
   return{status:404,body:{error:'route'}};
  }catch(e){return{status:400,body:{error:e.message}};}
 }
 // Serialize mutations from simultaneous phones so no result overwrites another.
 function handle(request){const work=queue.then(()=>route(request));queue=work.catch(()=>{});return work;}
 return{handle};
});
