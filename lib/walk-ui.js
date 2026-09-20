/* Offline creator and participant workflow. No network API or short-code lookup. */
(function(root){
 'use strict';
 const C=root.WalkCore,S=root.WalkStore;
 async function mount(host){
  const params=new URLSearchParams(location.search),native=location.hostname==='appassets.androidplatform.net';
  const messages=await (await fetch('locales/walk.json')).json();
  const saved=await S.get('settings')||{};
  let settings={language:params.get('quizLang')||'en',ui:params.get('ui')||'en',count:5,answerCount:3,display:'all',walk:'none',walkValue:0,resultMode:'instant',...saved};
  const t=key=>messages[settings.ui]?.[key]||messages.en[key]||key;
  let bank,active=null,cleanup=()=>{},viewGeneration=0;
  try {bank=C.validateBank(await(await fetch('Data/revision-1.json')).json());}catch(_){throw Error('database');}
  async function ensureRevision(quiz){
   if(bank.revision===quiz.revision){C.resolve(quiz,bank);return;}
   const cached=await S.get('bank:'+quiz.revision);
   if(cached){C.resolve(quiz,cached);bank=cached;return;}
   try {
    const response=await fetch(`https://raw.githubusercontent.com/Nilsson82/Tipspromenad/main/database/revision-${quiz.revision}.json`,{signal:AbortSignal.timeout(8000),credentials:'omit',referrerPolicy:'no-referrer'});
    C.check(response.ok,'revision');const body=await response.text();C.check(body.length<2000000,'database');
    const loaded=C.validateBank(JSON.parse(body));C.resolve(quiz,loaded);await S.put('bank:'+quiz.revision,loaded);bank=loaded;
   }catch(_){throw Error('revision');}
  }
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
  const error=el('p',null,'walk-error');error.setAttribute('role','alert');
  function fail(err){error.textContent=t('error_'+err.message)||t('error');if(error.textContent.startsWith('error_'))error.textContent=t('error');}
  function action(label,fn){const b=el('button',t(label));b.type='button';b.dataset.action=label;b.addEventListener('click',async()=>{error.textContent='';b.disabled=true;try{await fn();}catch(e){fail(e);}finally{b.disabled=false;}});return b;}
  const content=el('section',null,'walk-content');
  const toolbar=el('header',null,'quiz-toolbar');toolbar.append(el('h1','Tipspromenad'));
  const menu=el('details',null,'overflow-menu'),summary=el('summary','⋮','overflow-toggle');summary.setAttribute('aria-label',t('settings'));const panel=el('div',null,'overflow-panel');panel.append(action('settings',()=>{menu.open=false;showSettings();}));menu.append(summary,panel);toolbar.append(menu);toolbar.hidden=native;
  host.replaceChildren(toolbar,error,content);
  let atHome=false, settingsReturn=home, wizardBack=null;
  function page(title){cleanup();cleanup=()=>{};viewGeneration++;active=null;settingsReturn=home;wizardBack=null;atHome=title==='home';content.onchange=null;content.replaceChildren();if(!atHome)content.append(action('home',home));content.append(el('h2',t(title)));return content;}
  window.tipspromenadBack=()=>{const dialog=host.querySelector('dialog[open]');if(dialog){dialog.close();return true;}if(wizardBack){wizardBack();return true;}if(atHome)return false;home().catch(fail);return true;};
  function field(parent,label,type='text',value=''){const wrapper=el('label',null,'walk-field');wrapper.append(el('span',t(label)));const input=el('input');input.type=type;input.value=value;wrapper.append(input);parent.append(wrapper);return input;}
  function select(parent,label,values,value){const wrapper=el('label',null,'walk-field');wrapper.append(el('span',t(label)));const input=el('select');values.forEach(([id,label])=>input.add(new Option(label,id)));input.value=String(value);wrapper.append(input);parent.append(wrapper);return input;}
  function config(parent,value){
   const language=select(parent,'language',Object.entries(QuizI18n.languageNames),value.language);
   const count=field(parent,'count','number',value.count);count.min=1;count.max=25;count.step=1;
   const answers=select(parent,'answer_count',[2,3,4].map(n=>[n,String(n)]),value.answerCount);
   const display=select(parent,'display',[['all',t('all')],['one',t('one')]],value.display);
   const walk=select(parent,'walk',[['none',t('none')],['time',t('time')],['distance',t('distance')]],value.walk);
   const walkValue=field(parent,'walk_value','number',value.walkValue);walkValue.min=0;walkValue.max=10000;walkValue.step=1;
   const result=select(parent,'result_mode',[['collect',t('collect')],['instant',t('instant')]],value.resultMode);
   parent.append(el('p',t('walking_help')));
   walk.addEventListener('change',()=>{walkValue.value=walk.value==='time'?180:walk.value==='distance'?100:0;if(walk.value!=='none')display.value='one';});
   return()=>({language:language.value,count:Number(count.value),answerCount:Number(answers.value),display:display.value,walk:walk.value,walkValue:Number(walkValue.value),resultMode:result.value});
  }
  function showSettings(){
   const dialog=el('dialog',null,'settings-dialog');dialog.append(el('h2',t('settings')));
   const ui=select(dialog,'app_language',Object.entries(QuizI18n.languageNames),settings.ui),read=config(dialog,settings);
   const advanced=el('details');advanced.append(el('summary',t('categories')));const readFilters=categoryPicker(advanced,settings.filters);dialog.append(advanced);const returnTo=settingsReturn;
   dialog.append(action('save',async()=>{const next={...settings,...read(),ui:ui.value,filters:readFilters()};C.check(C.uint(next.count,25)&&next.count>0,'settings');C.validateQuiz({version:1,revision:1,quizId:'0000000000000000',seed:0,created:0,name:'Settings',questionIds:[1],...next});await S.put('settings',next);settings=next;dialog.close();await returnTo();if(native&&root.TipspromenadHost)root.TipspromenadHost.setLanguages(next.ui,next.language);}),action('close',()=>dialog.close()));
   dialog.addEventListener('close',()=>dialog.remove());host.append(dialog);dialog.showModal();
  }
  window.addEventListener('tipspromenad:settings',showSettings);
  async function home(){page('home');const generation=viewGeneration;document.documentElement.lang=settings.ui;
   const choices=el('div',null,'walk-actions');choices.append(action('random',randomScreen),action('join',join));if(native)choices.append(action('create',builder));choices.append(action('classic',()=>{const u=new URL(location.href);u.searchParams.set('mode','classic');location.href=u.href;}));choices.classList.add('home-cards');
   [...choices.children].forEach(button=>{const key=button.dataset.action;button.replaceChildren(el('strong',t(key)),el('span',t(key+'_hint'),'menu-description'),el('span','→','menu-arrow'));});
   content.append(choices);
   const attempt=await S.get('attempt');if(viewGeneration!==generation)return;if(attempt)content.append(action('resume',()=>play(attempt)));
   if(native){const quizzes=await S.list('quiz:');if(viewGeneration!==generation)return;if(quizzes.length)content.append(el('h3',t('saved_quizzes')));for(const record of quizzes.sort((a,b)=>b.quiz.created-a.quiz.created)){const b=action('open',()=>organizer(record.quiz));b.textContent=record.quiz.name;content.append(b);}}
   const privacy=el('details',null,'storage-note');privacy.append(el('summary',t('on_device')),el('p',t('offline_help')));content.append(privacy);
  }
  function summaryCard(parent) {
   const card=el('div',null,'settings-summary');
   card.append(el('strong',`${settings.count} ${t('questions_short')} · ${settings.answerCount} ${t('answers_short')}`),el('span',`${QuizI18n.languageNames[settings.language]} · ${t(settings.display)} · ${t(settings.walk)}`),el('small',t('settings_hint')));
   parent.append(card);
  }
  function categoryPicker(parent,selected) {
   const filters=el('fieldset',null,'category-picker');filters.append(el('legend',t('categories')));const checks=[];
   for(const category of bank.categories) {
    const group=el('div');group.append(el('strong',t('cat_'+category)));
    for(const sub of [...new Set(bank.questions.filter(q=>q.category===category&&!q.deprecated).map(q=>q.subcategory))]) {
     const key=category+'/'+sub,label=el('label'),input=el('input');input.type='checkbox';input.checked=!selected||selected.includes(key);
     checks.push({key,input});label.append(input,document.createTextNode(t('sub_'+sub)));group.append(label);
    }
    filters.append(group);
   }
   parent.append(filters);return()=>checks.filter(c=>c.input.checked).map(c=>c.key);
  }
  function questionPool(filters) {
   return bank.questions.filter(q=>!q.deprecated&&q.translations[settings.language]&&(!filters||filters.includes(q.category+'/'+q.subcategory)));
  }
  function randomScreen() {
   page('random');settingsReturn=randomScreen;summaryCard(content);
   content.append(el('p',t('random_hint')));
   content.append(action('start',async()=>{
    const ids=C.choose(questionPool(settings.filters).map(q=>q.questionId),settings.count,C.randomSeed());
    await startAttempt(C.create(bank,{...settings,resultMode:'instant',name:t('random')},ids),'',true);
   }));
  }
  function builder() {
   let step=0,name=t('default_name'),filters=settings.filters,method='random',selected=[];
   function draw() {
    page('create');settingsReturn=draw;
    const available=questionPool(filters);selected=selected.filter(id=>available.some(q=>q.questionId===id));
    if(step===3&&selected.length!==settings.count)step=2;
    wizardBack=step>0?()=>{step--;draw();}:null;
    const titles=['step_name','step_categories','step_selection','review'];
    const steps=el('ol',null,'wizard-steps');steps.setAttribute('aria-label',t('create'));
    titles.forEach((key,i)=>{const item=el('li',`${i+1}. ${t(key)}`);if(i===step)item.setAttribute('aria-current','step');steps.append(item);});content.append(steps);
    const body=el('section',null,'wizard-body');content.append(body);let capture=()=>{};
    if(step===0) {
     const input=field(body,'quiz_name','text',name);input.maxLength=32;
     input.addEventListener('input',()=>{name=input.value;});summaryCard(body);
     capture=()=>{name=input.value.trim();C.check(C.text(name,32),'name');};
    } else if(step===1) {
     const read=categoryPicker(body,filters);const count=el('p');count.setAttribute('aria-live','polite');
     const update=()=>{filters=read();count.textContent=`${t('available')}: ${questionPool(filters).length} / ${settings.count}`;};
     body.addEventListener('change',update);body.append(count);update();
     capture=()=>{filters=read();C.check(questionPool(filters).length>=settings.count,'insufficient');};
    } else if(step===2) {
     const choice=select(body,'selection',[['random',t('random_selection')],['manual',t('manual')]],method);
     const status=el('p');status.setAttribute('aria-live','polite');const list=el('div',null,'walk-question-picker');body.append(status,list);
     function update() {
      method=choice.value;list.replaceChildren();list.hidden=method!=='manual';
      status.textContent=`${t('selected')}: ${method==='random'?settings.count:selected.length} / ${settings.count}`;
      if(list.hidden){body.dataset.selection='random';return;}
      body.dataset.selection='manual';
      for(const q of available) {
       const tr=q.translations[settings.language],card=el('label',null,'walk-picker-item'),input=el('input');
       input.type='checkbox';input.checked=selected.includes(q.questionId);input.disabled=!input.checked&&selected.length>=settings.count;
       input.addEventListener('change',()=>{selected=input.checked?[...selected,q.questionId]:selected.filter(id=>id!==q.questionId);update();});
       card.append(input,el('strong',tr.question),el('small',`${t('cat_'+q.category)} / ${t('sub_'+q.subcategory)} · ${t('difficulty')} ${q.difficulty}`));
       const options=el('ol');tr.options.forEach((o,i)=>options.append(el('li',o+(i===tr.correctIndex?' ✓':''))));card.append(options);list.append(card);
      }
     }
     choice.addEventListener('change',update);update();
     capture=()=>{C.check(available.length>=settings.count,'insufficient');if(method==='manual')C.check(selected.length===settings.count,'selection');else selected=C.choose(available.map(q=>q.questionId),settings.count,C.randomSeed());};
    } else {
     body.append(el('h3',name));summaryCard(body);
     const list=el('ol',null,'review-questions');selected.forEach(id=>{const q=bank.questions.find(q=>q.questionId===id);list.append(el('li',q.translations[settings.language].question));});body.append(list);
    }
    const footer=el('div',null,'wizard-footer');
    if(step>0)footer.append(action('previous',()=>{step--;draw();}));
    if(step<3)footer.append(action('next',()=>{capture();step++;draw();}));
    else footer.append(action('create',async()=>{
     C.check(selected.length===settings.count,'selection');
     const quiz=C.create(bank,{...settings,name},selected);
     await S.put('quiz:'+quiz.quizId,{quiz,results:[]});
     settings={...settings,filters};await S.put('settings',settings);await organizer(quiz);
    }));
    content.append(footer);
   }
   draw();
  }
  function share(parent,code,isQuiz){const qr=el('img',null,'correction-qr');qr.src=QuizCorrection.qrImage(code);qr.alt=t(isQuiz?'quiz_qr':'result_qr');parent.append(qr);const box=el('textarea');box.readOnly=true;box.value=code;box.rows=4;box.setAttribute('aria-label',t(isQuiz?'quiz_code':'result_code'));parent.append(box,el('p',t('portable_help')));parent.append(action('copy',async()=>{await navigator.clipboard.writeText(code);}));if(isQuiz){const url=new URL('https://nilsson82.github.io/TipspromenadQuizWebPage/');url.hash='quiz='+code;const link=field(parent,'participant_link','text',url.href);link.readOnly=true;}}
  async function organizer(quiz,section='share'){await ensureRevision(quiz);page('organizer');content.append(el('h3',quiz.name));const tabs=el('nav',null,'walk-tabs');for(const key of ['share','import','results']){const button=action(key,()=>organizer(quiz,key));button.setAttribute('aria-current',key===section?'page':'false');tabs.append(button);}content.append(tabs);
   const record=await S.get('quiz:'+quiz.quizId);C.check(record,'storage');
   if(section==='share')share(content,C.encodeQuiz(quiz),true);
   if(section==='import'){const code=field(content,'result_code');const importResult=async(value)=>{const fresh=await S.get('quiz:'+quiz.quizId);const result=C.decodeResult(value.trim());const results=C.addResult(quiz,bank,fresh.results,result);await S.put('quiz:'+quiz.quizId,{quiz,results});await organizer(quiz,'results');};content.append(action('import',()=>importResult(code.value)),action('scan',()=>scan(importResult)));}
   if(section==='results'){const stats=C.leaderboard(record.results.map(r=>C.score(quiz,bank,r)));content.append(el('p',`${t('participants')}: ${stats.count} · ${t('highest')}: ${stats.highest} · ${t('average')}: ${stats.average.toFixed(1)}`));const wrap=el('div',null,'walk-table'),table=el('table'),head=el('tr');['rank','name','correct','incorrect','score'].forEach(k=>head.append(el('th',t(k))));table.append(head);stats.rows.forEach(r=>{const row=el('tr');[r.rank,r.name,r.correct,r.incorrect,`${r.score} / ${r.total}`].forEach(v=>row.append(el('td',String(v))));table.append(row);});wrap.append(table);content.append(wrap);}
  }
  function join(){page('join');const code=field(content,'quiz_code');const load=async(value)=>{const quiz=C.decodeQuiz(value.trim());await ensureRevision(quiz);await askName(quiz);};content.append(action('join',()=>load(code.value)),action('scan',()=>scan(load)),el('p',t('portable_help')));}
  async function askName(quiz){page('join');C.resolve(quiz,bank);content.append(el('h3',quiz.name),el('p',`${quiz.questionIds.length} · ${QuizI18n.languageNames[quiz.language]}`));const name=field(content,'name','text',settings.participantName||'');name.autocomplete='given-name';name.maxLength=32;content.append(action('start',async()=>{C.check(C.text(name.value.trim(),32),'name');settings={...settings,participantName:name.value.trim()};await S.put('settings',settings);await startAttempt(quiz,settings.participantName,false);}));}
  async function startAttempt(quiz,name,random){const state={quiz,name,random,completed:false,resultId:C.randomHex(),answers:Array(quiz.questionIds.length).fill(null),index:0,unlocked:0,deadline:0,distance:0,result:null};await S.put('attempt',state);await play(state);}
  let writeQueue=Promise.resolve();
  function saveAttempt(state){const snapshot=JSON.parse(JSON.stringify(state));writeQueue=writeQueue.catch(()=>{}).then(()=>S.put('attempt',snapshot));return writeQueue;}
  async function play(state){await ensureRevision(state.quiz);page('play');active=state;const generation=viewGeneration;const q=state.quiz,questions=C.resolve(q,bank);if(state.result){resultPage(state);return;}
   content.append(el('h3',q.name));if(!state.random&&state.name)content.append(el('p',state.name,'participant-name'));const progress=el('p');progress.setAttribute('aria-live','polite');const body=el('div');content.append(progress,body);let timer=null,watch=null,lastPosition=null;
   const stopLocation=()=>{if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;lastPosition=null;};
   cleanup=()=>{clearInterval(timer);stopLocation();};
   function draw(){body.replaceChildren();progress.textContent=`${state.answers.filter(Number.isInteger).length} / ${questions.length}`;const corrected=state.random&&state.completed;const indices=corrected||q.display==='all'?questions.map((_,i)=>i):[state.index];for(const i of indices){const item=questions[i],card=el('fieldset',null,'question-card');card.lang=q.language;card.append(el('legend',`${i+1}. ${item.question}`));item.visible.forEach(sourceIndex=>{const label=el('label'),radio=el('input');radio.type='radio';radio.name='walk-q-'+i;radio.checked=state.answers[i]===sourceIndex;radio.disabled=corrected;if(corrected){if(sourceIndex===item.correctIndex)label.classList.add('walk-answer-correct');else if(radio.checked)label.classList.add('walk-answer-wrong');}radio.addEventListener('change',async()=>{state.answers[i]=sourceIndex;try{await saveAttempt(state);progress.textContent=`${state.answers.filter(Number.isInteger).length} / ${questions.length}`;}catch(e){fail(e);}});label.append(radio,document.createTextNode(item.options[sourceIndex]));if(corrected&&(sourceIndex===item.correctIndex||radio.checked))label.append(el('span',(sourceIndex===item.correctIndex?' ✓ ':' ✗ ')+t(sourceIndex===item.correctIndex?'correct':'incorrect'),'answer-mark'));card.append(label);});body.append(card);}
    if(corrected){const correct=questions.filter((item,i)=>state.answers[i]===item.correctIndex).length;const line=el('p',`${t('score')}: ${correct} / ${questions.length} · ${t('incorrect')}: ${questions.length-correct}`,'walk-score');line.setAttribute('role','status');body.append(line);return;}
    if(q.display==='one'&&state.index>0)body.append(action('previous',()=>{state.index--;draw();}));
    if(q.display==='one'&&state.index<questions.length-1){body.append(action('next',async()=>{C.check(Number.isInteger(state.answers[state.index]),'complete');if(state.index<state.unlocked||q.walk==='none'){state.index++;state.unlocked=Math.max(state.unlocked,state.index);await saveAttempt(state);draw();return;}if(q.walk==='time'){if(!state.deadline){state.deadline=Date.now()+q.walkValue*1000;await saveAttempt(state);}waiting();}else startLocation();}));}
    if(q.display==='all'||state.index===questions.length-1)body.append(action('finish',async()=>{await writeQueue;C.check(state.answers.every(Number.isInteger),'complete');if(state.random){state.completed=true;await saveAttempt(state);cleanup();draw();return;}const result={version:1,quizId:q.quizId,resultId:state.resultId,fingerprint:C.fingerprint(q),name:state.name,answers:[...state.answers]};C.score(q,bank,result);state.result=C.encodeResult(result);await saveAttempt(state);resultPage(state);}));
   }
   function advance(){state.index=++state.unlocked;state.deadline=0;state.distance=0;stopLocation();saveAttempt(state).then(()=>{if(viewGeneration===generation)draw();}).catch(fail);}
   function waiting(){const status=el('p');body.append(status);clearInterval(timer);const tick=()=>{if(viewGeneration!==generation)return;const left=WalkMotion.remaining(state.deadline,Date.now());status.textContent=`${t('wait')}: ${left} s`;if(!left){clearInterval(timer);timer=null;advance();}};timer=setInterval(tick,1000);tick();}
   function startLocation(){if(watch!==null)return;const status=el('p',t('location_help'));body.append(status);if(!navigator.geolocation){fail(Error('location'));return;}watch=navigator.geolocation.watchPosition(position=>{if(viewGeneration!==generation)return;const current={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy,time:position.timestamp};const update=WalkMotion.advance(lastPosition,current,state.distance);lastPosition=update.previous;state.distance=update.total;saveAttempt(state).catch(fail);status.textContent=`${t('remaining')}: ${Math.max(0,Math.ceil(q.walkValue-state.distance))} m`;if(state.distance>=q.walkValue)advance();},()=>{stopLocation();fail(Error('location'));},{enableHighAccuracy:true,maximumAge:0,timeout:20000});}
   draw();if(state.deadline)waiting();
   const visibility=()=>{if(document.hidden)stopLocation();};document.addEventListener('visibilitychange',visibility);const oldCleanup=cleanup;cleanup=()=>{oldCleanup();document.removeEventListener('visibilitychange',visibility);};
  }
  function resultPage(state){page('answer_sheet');const result=C.decodeResult(state.result);content.append(el('h3',state.name));share(content,state.result,false);if(state.quiz.resultMode==='instant'){const score=C.score(state.quiz,bank,result);content.append(el('p',`${t('score')}: ${score.correct} / ${score.total}`));for(const [i,q]of C.resolve(state.quiz,bank).entries())content.append(el('p',`${i+1}. ${q.question} — ${q.options[q.correctIndex]} ${result.answers[i]===q.correctIndex?'✓':'✗'}`));}}
  async function scan(accept){
   const dialog=el('dialog',null,'settings-dialog'),video=el('video',null,'scanner-video'),status=el('p',t('camera_help'));video.playsInline=true;video.muted=true;let stream,timer,closed=false,busy=false;
   const stop=()=>{closed=true;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;if(dialog.open)dialog.close();dialog.remove();window.removeEventListener('tipspromenad:stop-camera',stop);document.removeEventListener('visibilitychange',hidden);};
   const hidden=()=>{if(document.hidden)stop();};dialog.append(el('h2',t('scan')),video,status,action('close',stop));dialog.addEventListener('close',stop);window.addEventListener('tipspromenad:stop-camera',stop);document.addEventListener('visibilitychange',hidden);host.append(dialog);dialog.showModal();
   try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});if(closed){stream.getTracks().forEach(t=>t.stop());return;}video.srcObject=stream;await video.play();const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});async function frame(){if(closed)return;try{if(video.videoWidth&&!busy){const scale=Math.min(1,640/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);ctx.drawImage(video,0,0,canvas.width,canvas.height);const value=QuizCorrection.decode(ctx,canvas.width,canvas.height);if(value){busy=true;try{await accept(value);stop();return;}catch(e){status.textContent=t('error_'+e.message)||t('error');busy=false;}}}timer=setTimeout(frame,300);}catch(_){stream?.getTracks().forEach(t=>t.stop());status.textContent=t('error_camera');}}frame();}catch(_){stream?.getTracks().forEach(t=>t.stop());status.textContent=t('error_camera');}
  }
  const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('quiz')){try{const quiz=C.decodeQuiz(hash.get('quiz'));await ensureRevision(quiz);await askName(quiz);}catch(e){await home();fail(e);}}else await home();
 }
 root.WalkUI={mount};
})(globalThis);
