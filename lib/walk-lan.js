/* Same-origin local host only. Pending submissions survive reloads. */
(function(root){
 const pending=new Map();
 function reply(id,response){const item=pending.get(id);if(!item)return;clearTimeout(item.timer);pending.delete(id);if(response.status>=400)item.reject(Error(response.body.error));else item.resolve(response.body);}
 async function request(route,data,token){
  if(root.TipspromenadHost&&location.hostname==='appassets.androidplatform.net'){
   if(route==='/api/status')return JSON.parse(root.TipspromenadHost.localHostStatus());
   return new Promise((resolve,reject)=>{const id=WalkCore.randomHex();const timer=setTimeout(()=>{pending.delete(id);reject(Error('host_unavailable'));},10000);pending.set(id,{resolve,reject,timer});root.TipspromenadHost.requestLocal(id,JSON.stringify({method:data?'POST':'GET',path:route,data:data||{},authorization:token?'Bearer '+token:''}));});
  }
const response=await fetch(route,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(5000),cache:'no-store'});const body=await response.json();if(!response.ok)throw Error(body.error||'host_unavailable');return body;}
 async function available(){try{return(await request('/api/status')).localHost===true;}catch(_){return false;}}
 let busy=false;
 async function flush(){if(busy)return;busy=true;try{for(const item of (await WalkStore.list('lan-pending:')).filter(Boolean)){try{await request('/api/results',item);await WalkStore.put('lan-pending:'+item.code,null);await WalkStore.put('lan-delivered:'+item.code,true);}catch(_){}}}catch(_){}finally{busy=false;}}
 async function queue(session,code){await WalkStore.put('lan-pending:'+code,{joinCode:session.joinCode,participantToken:session.participantToken,code});await flush();return!!await WalkStore.get('lan-delivered:'+code);}
 root.WalkLAN={request,available,queue,flush,reply};window.addEventListener('online',flush);setInterval(flush,10000);flush();
})(globalThis);
