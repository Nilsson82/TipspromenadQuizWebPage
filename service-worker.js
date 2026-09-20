// Offline participant shell. Version this cache name whenever bundled files change.
const CACHE='tipspromenad-portable-v1-20260920-inline-results';
const FILES=['./','index.html','script.js','styles.css','walk.css','lib/quiz-core.js','lib/i18n.js','lib/quiz-ui.js','lib/correction.js','lib/vendor/qrcode.js','lib/vendor/jsQR.js','lib/walk-core.js','lib/walk-store.js','lib/walk-motion.js','lib/walk-ui.js','locales/ui.json','locales/walk.json','Data/revision-1.json','Data/multilingual.json','Data/data_en.json','Data/data_sv.json','Data/data_es.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tipspromenad-portable-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(event.request,{ignoreSearch:true})||fetch(event.request)));
});
