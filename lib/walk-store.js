(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WalkStore=api;})(globalThis,function(){
 'use strict';
 // User-owned offline records. A failed write must never be reported as saved.
 let connection;
 function open(){return connection||(connection=new Promise((resolve,reject)=>{const request=indexedDB.open('tipspromenad-walks',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onsuccess=()=>resolve(request.result);request.onerror=()=>{connection=null;reject(Error('storage'));};}));}
 async function get(key){const db=await open();return new Promise((resolve,reject)=>{const request=db.transaction('records').objectStore('records').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('storage'));});}
 async function put(key,value){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put(value,key);tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(Error('storage'));});}
 async function list(prefix){const db=await open();return new Promise((resolve,reject)=>{const request=db.transaction('records').objectStore('records').openCursor();const rows=[];request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve(rows);return;}if(String(cursor.key).startsWith(prefix))rows.push(cursor.value);cursor.continue();};request.onerror=()=>reject(Error('storage'));});}
 return{get,put,list};
});
