(function(root){
 const base='https://raw.githubusercontent.com/Nilsson82/Tipspromenad/main/database/';
 async function latest(current){
  if(!globalThis.isSecureContext||!crypto.subtle)return null;
  try{const response=await fetch(base+'latest.json',{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(4000)});if(!response.ok)return null;const manifest=await response.json();if(!Number.isInteger(manifest.revision)||manifest.revision<=current.revision||manifest.file!=='revision-'+manifest.revision+'.json'||!/^[a-f0-9]{64}$/.test(manifest.sha256))return null;
   const data=await fetch(base+manifest.file,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(6000)});if(!data.ok)return null;const text=await data.text();if(text.length>2000000)return null;const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==manifest.sha256)return null;
   const bank=WalkCore.validateBank(JSON.parse(text));if(bank.revision!==manifest.revision)return null;await WalkStore.put('bank:'+bank.revision,bank);await WalkStore.put('latest-bank',bank);return bank;
  }catch(_){return null;}
 }
 root.WalkDatabase={latest};
})(globalThis);
