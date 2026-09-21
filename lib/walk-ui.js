/* Offline creator and participant workflow. Portable sharing plus isolated experimental phone-hosted LAN sharing. */
(function(root){
 'use strict';
 const C=root.WalkCore,S=root.WalkStore;
 async function mount(host){
  const params=new URLSearchParams(location.search),native=location.hostname==='appassets.androidplatform.net';
  const messages=await (await fetch('locales/walk.json')).json();
  const saved=await S.get('settings')||{};
  let settings={language:params.get('quizLang')||'en',ui:params.get('ui')||'en',count:5,answerCount:4,display:'all',walk:'none',walkValue:0,resultMode:'instant',...saved};
  const t=key=>messages[settings.ui]?.[key]||messages.en[key]||key;
  let bank,active=null,cleanup=()=>{},viewGeneration=0;
  try {bank=C.validateBank(await(await fetch('Data/revision-2.json')).json());}catch(_){throw Error('database');}
  let latestBank=bank;try{const cached=await S.get('latest-bank');if(cached&&cached.revision>=bank.revision)latestBank=bank=C.validateBank(cached);}catch(_){}
  async function ensureRevision(quiz){
   if(bank.revision===quiz.revision){C.resolve(quiz,bank);return;}
   if(quiz.revision===latestBank.revision){bank=latestBank;C.resolve(quiz,bank);return;}
   if([1,2].includes(quiz.revision)){const bundled=C.validateBank(await(await fetch('Data/revision-'+quiz.revision+'.json')).json());C.resolve(quiz,bundled);bank=bundled;return;}
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
  function page(title){cleanup();cleanup=()=>{};viewGeneration++;active=null;settingsReturn=home;wizardBack=null;atHome=title==='home';content.onchange=null;content.classList.remove('single-question');content.replaceChildren();if(!atHome)content.append(action('home',home));content.append(el('h2',t(title)));return content;}
  window.tipspromenadBack=()=>{const dialog=host.querySelector('dialog[open]');if(dialog){dialog.close();return true;}if(wizardBack){wizardBack();return true;}if(atHome)return false;home().catch(fail);return true;};
  function field(parent,label,type='text',value=''){const wrapper=el('label',null,'walk-field');wrapper.append(el('span',t(label)));const input=el('input');input.type=type;input.value=value;wrapper.append(input);parent.append(wrapper);return input;}
  function select(parent,label,values,value){const wrapper=el('label',null,'walk-field');wrapper.append(el('span',t(label)));const input=el('select');values.forEach(([id,label])=>input.add(new Option(label,id)));input.value=String(value);wrapper.append(input);parent.append(wrapper);return input;}
  function config(parent,value){
   const language=select(parent,'language',Object.entries(QuizI18n.languageNames),value.language);
   const count=field(parent,'count','number',value.count);count.min=1;count.max=25;count.step=1;
   const answers=select(parent,'answer_count',[2,3,4].map(n=>[n,String(n)]),value.answerCount);
   const display=select(parent,'display',[['all',t('all')],['one',t('one')]],value.display);
   const walk=select(parent,'walk',[['none',t('none')],['time',t('time')],['distance',t('distance')],['both',t('both')]],value.walk);
   const walkValue=field(parent,'walk_value','number',value.walkValue);const seconds=field(parent,'time_seconds','number',value.timeSeconds||90);seconds.min=1;seconds.max=1800;walkValue.min=0;walkValue.max=10000;walkValue.step=1;
   const result=select(parent,'result_mode',[['collect',t('collect')],['instant',t('instant')]],value.resultMode);
   parent.append(el('p',t('walking_help')));
   walk.addEventListener('change',()=>{walkValue.value=walk.value==='time'?180:['distance','both'].includes(walk.value)?100:0;if(walk.value!=='none')display.value='one';});
   const visibility=()=>{seconds.parentElement.hidden=walk.value!=='both';walkValue.parentElement.hidden=walk.value==='none';};walk.addEventListener('change',visibility);visibility();
   return()=>({language:language.value,count:Number(count.value),answerCount:Number(answers.value),display:display.value,walk:walk.value,walkValue:Number(walkValue.value),resultMode:result.value,...(walk.value==='both'?{timeSeconds:Number(seconds.value)}:{})});
  }
  function showSettings(){
   const dialog=el('dialog',null,'settings-dialog');dialog.append(el('h2',t('settings')));
   const ui=select(dialog,'app_language',Object.entries(QuizI18n.languageNames),settings.ui),read=config(dialog,settings);
   const advanced=el('details');advanced.append(el('summary',t('categories')));const readFilters=categoryPicker(advanced,settings.filters);dialog.append(advanced);const returnTo=settingsReturn;
   dialog.append(action('save',async()=>{const next={...settings,...read(),ui:ui.value,filters:readFilters()};C.check(C.uint(next.count,25)&&next.count>0,'settings');C.validateQuiz({version:2,revision:1,quizId:'0000000000000000',seed:0,created:0,name:'Settings',questionIds:[1],...next});const languagesChanged=next.ui!==settings.ui||next.language!==settings.language;await S.put('settings',next);settings=next;dialog.close();await returnTo();if(languagesChanged&&native&&root.TipspromenadHost)root.TipspromenadHost.setLanguages(next.ui,next.language);}),action('close',()=>dialog.close()));
   dialog.addEventListener('close',()=>dialog.remove());host.append(dialog);dialog.showModal();
  }
  window.addEventListener('tipspromenad:settings',showSettings);
  async function home(){page('home');const generation=viewGeneration;document.documentElement.lang=settings.ui;
   const choices=el('div',null,'walk-actions');choices.append(action('random',randomScreen),action('join',join));choices.append(action('create',builder));choices.append(action('classic',()=>{const u=new URL(location.href);u.searchParams.set('mode','classic');if(!['en','sv','es','da','no','fi'].includes(settings.language))u.searchParams.set('quizLang','en');if(!['en','sv','es','da','no','fi'].includes(settings.ui))u.searchParams.set('ui','en');location.href=u.href;}));choices.classList.add('home-cards');
   [...choices.children].forEach(button=>{const key=button.dataset.action;button.replaceChildren(el('strong',t(key)),el('span',t(key+'_hint'),'menu-description'),el('span','→','menu-arrow'));});
   content.append(choices,action('experimental',lanLobby));
   const attempt=await S.get('attempt');if(viewGeneration!==generation)return;if(attempt)content.append(action('resume',()=>play(attempt)));
   {const quizzes=await S.list('quiz:');if(viewGeneration!==generation)return;if(quizzes.length)content.append(el('h3',t('saved_quizzes')));for(const record of quizzes.sort((a,b)=>b.quiz.created-a.quiz.created)){const b=action('open',()=>organizer(record.quiz));b.textContent=record.quiz.name;content.append(b);}}
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
    for(const sub of [...new Set(bank.questions.filter(q=>q.category===category&&!q.deprecated&&q.type!=='numeric').map(q=>q.subcategory))]) {
     const key=category+'/'+sub,label=el('label'),input=el('input');input.type='checkbox';input.checked=!selected||selected.includes(key);
     checks.push({key,input});label.append(input,document.createTextNode(t('sub_'+sub)));group.append(label);
    }
    filters.append(group);
   }
   parent.append(filters);return()=>checks.filter(c=>c.input.checked).map(c=>c.key);
  }
  function questionPool(filters) {
   return bank.questions.filter(q=>!q.deprecated&&q.type!=='numeric'&&((q.translations[settings.language]||q.translations.en)||q.translations.en)&&(!filters||filters.includes(q.category+'/'+q.subcategory)));
  }
  function randomScreen() {bank=latestBank;
   page('random');settingsReturn=randomScreen;summaryCard(content);
   content.append(el('p',t('random_hint')));
   content.append(action('start',async()=>{
    const ids=C.choose(questionPool(settings.filters).map(q=>q.questionId),settings.count,C.randomSeed());
    await startAttempt(C.create(bank,{...settings,resultMode:'instant',name:t('random')},ids),'',true);
   }));
  }
  function builder() {bank=latestBank;
   let step=0,name=t('default_name'),filters=settings.filters,method='random',selected=[],tieBreakerId=null,difficulty='all',setId='all';
   function draw() {
    page('create');settingsReturn=draw;
    const pool=()=>questionPool(filters).filter(q=>(difficulty==='all'||q.difficulty===Number(difficulty))&&(setId==='all'||bank.sets?.find(s=>s.id===setId)?.questionIds.includes(q.questionId)));const available=pool();selected=selected.filter(id=>available.some(q=>q.questionId===id));
    if(step===3&&selected.length!==settings.count)step=2;
    wizardBack=step>0?()=>{step--;draw();}:null;
    const titles=['step_name','step_categories','step_selection','review'];
    const steps=el('ol',null,'wizard-steps');steps.setAttribute('aria-label',t('create'));
    titles.forEach((key,i)=>{const item=el('li',`${i+1}. ${t(key)}`);if(i===step)item.setAttribute('aria-current','step');steps.append(item);});content.append(steps);
    const body=el('section',null,'wizard-body');content.append(body);let capture=()=>{};
    if(step===0) {
     const input=field(body,'quiz_name','text',name);input.maxLength=32;
     input.addEventListener('input',()=>{name=input.value;});const count=field(body,'count','number',settings.count);count.min=1;count.max=25;count.step=1;count.addEventListener('input',()=>{if(C.uint(Number(count.value),25)&&Number(count.value)>0)settings.count=Number(count.value);});summaryCard(body);const tieSelect=select(body,'tie_breaker',[['',t('no_tie')],...bank.questions.filter(q=>q.type==='numeric'&&!q.deprecated).map(q=>[q.questionId,(q.translations[settings.language]||q.translations.en).question])],tieBreakerId||'');tieSelect.addEventListener('change',()=>{tieBreakerId=tieSelect.value?Number(tieSelect.value):null;});
     capture=()=>{name=input.value.trim();C.check(C.text(name,128),'name');C.check(C.uint(Number(count.value),25)&&Number(count.value)>0,'settings');settings.count=Number(count.value);};
    } else if(step===1) {
     const level=select(body,'difficulty',[['all',t('all')],['1',t('easy')],['2',t('medium')],['3',t('hard')]],difficulty);level.addEventListener('change',()=>{difficulty=level.value;});const set=select(body,'question_set',[['all',t('all')],...(bank.sets||[]).map(s=>[s.id,s.name])],setId);set.addEventListener('change',()=>{setId=set.value;});const read=categoryPicker(body,filters);const count=el('p');count.setAttribute('aria-live','polite');
     const update=()=>{filters=read();count.textContent=`${t('available')}: ${pool().length} / ${settings.count}`;};
     body.addEventListener('change',update);body.append(count);update();
     capture=()=>{filters=read();C.check(pool().length>=settings.count,'insufficient');};
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
     const quiz=C.create(bank,{...settings,name,...(tieBreakerId?{tieBreakerId}:{})},selected);
     await S.put('quiz:'+quiz.quizId,{quiz,results:[]});
     settings={...settings,filters};await S.put('settings',settings);await organizer(quiz);
    }));
    content.append(footer);
   }
   draw();
  }
  async function copyText(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}}catch(_){}const box=el('textarea');box.value=text;box.style.position='fixed';box.style.opacity='0';document.body.append(box);box.select();const copied=document.execCommand('copy');box.remove();C.check(copied,'copy');}
  function share(parent,code,isQuiz){const qr=el('img',null,'correction-qr');qr.src=QuizCorrection.qrImage(code);qr.alt=t(isQuiz?'quiz_qr':'result_qr');parent.append(qr);const box=el('textarea');box.readOnly=true;box.value=code;box.rows=4;box.setAttribute('aria-label',t(isQuiz?'quiz_code':'result_code'));parent.append(box,el('p',t('portable_help')));parent.append(action('copy',async()=>{await copyText(code);}));if(isQuiz){const url=new URL('https://nilsson82.github.io/TipspromenadQuizWebPage/');url.hash='quiz='+code;const link=field(parent,'participant_link','text',url.href);link.readOnly=true;}}
  async function organizer(quiz,section='share'){await ensureRevision(quiz);page('organizer');content.append(el('h3',quiz.name));const tabs=el('nav',null,'walk-tabs');for(const key of ['share','import','results']){const button=action(key,()=>organizer(quiz,key));button.setAttribute('aria-current',key===section?'page':'false');tabs.append(button);}content.append(tabs);
   const record=await S.get('quiz:'+quiz.quizId);C.check(record,'storage');
   if(section==='share'){share(content,C.encodeQuiz(quiz),true);content.append(action('host',()=>hostQuiz(quiz)));}
   if(section==='import'){const code=field(content,'result_code');const importResult=async(value)=>{const fresh=await S.get('quiz:'+quiz.quizId);const result=C.decodeResult(value.trim());const results=C.addResult(quiz,bank,fresh.results,result);await S.put('quiz:'+quiz.quizId,{quiz,results});await organizer(quiz,'results');};content.append(action('import',()=>importResult(code.value)));if(native)content.append(action('scan',()=>scan(importResult)));}
   if(section==='results'){const stats=C.leaderboard(record.results.map(r=>C.score(quiz,bank,r)));content.append(el('p',`${t('participants')}: ${stats.count} · ${t('highest')}: ${stats.highest} · ${t('average')}: ${stats.average.toFixed(1)}`));const wrap=el('div',null,'walk-table'),table=el('table'),head=el('tr');['rank','name','correct','incorrect','score','tie_difference'].forEach(k=>head.append(el('th',t(k))));table.append(head);stats.rows.forEach(r=>{const row=el('tr');[r.rank,r.name,r.correct,r.incorrect,`${r.score} / ${r.total}`,r.tieDifference??'—'].forEach(v=>row.append(el('td',String(v))));table.append(row);});wrap.append(table);content.append(wrap);}
  }
  function join(){page('join');const code=field(content,'quiz_code');const load=async(value)=>{const quiz=C.decodeQuiz(value.trim());await ensureRevision(quiz);await askName(quiz);};content.append(action('join',()=>load(code.value)));if(native)content.append(action('scan',()=>scan(load)));content.append(el('p',t('portable_help')));}
  async function askName(quiz){page('join');C.resolve(quiz,bank);content.append(el('h3',quiz.name),el('p',`${quiz.questionIds.length} · ${QuizI18n.languageNames[quiz.language]}`));const name=field(content,'name','text',settings.participantName||'');name.autocomplete='given-name';name.maxLength=32;content.append(action('start',async()=>{C.check(C.text(name.value.trim(),quiz.version===2?128:32),'name');settings={...settings,participantName:name.value.trim()};await S.put('settings',settings);await startAttempt(quiz,settings.participantName,false);}));}
  async function startAttempt(quiz,name,random,lan=null){const state={quiz,name,random,lan,completed:false,resultId:C.randomHex(),answers:Array(quiz.questionIds.length).fill(null),index:0,unlocked:0,deadline:0,distance:0,result:null};await S.put('attempt',state);await play(state);}
  let writeQueue=Promise.resolve();
  function saveAttempt(state){const snapshot=JSON.parse(JSON.stringify(state));writeQueue=writeQueue.catch(()=>{}).then(()=>S.put('attempt',snapshot));return writeQueue;}
  async function play(state){
   await ensureRevision(state.quiz);page('play');active=state;const generation=viewGeneration,q=state.quiz,questions=C.resolve(q,bank),tie=C.tieBreaker(q,bank);
   if(state.result){resultPage(state);return;}
   content.append(el('h3',q.name));if(!state.random&&state.name)content.append(el('p',state.name,'participant-name'));
   if(!native&&['distance','both'].includes(q.walk))content.append(el('p',t('web_distance'),'feature-note'));
   const progress=el('p');progress.setAttribute('aria-live','polite');const body=el('div',null,'quiz-stage');content.append(progress,body);
   let timer=null,watch=null,lastPosition=null;
   const stop=()=>{clearInterval(timer);timer=null;if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;lastPosition=null;};cleanup=stop;
   const answered=()=>state.answers.filter(Number.isInteger).length;
   const showTie=()=>tie&&answered()===questions.length&&(q.display==='all'||state.index===questions.length-1);
   function draw(){
    stop();body.replaceChildren();const corrected=state.random&&state.completed;
    content.classList.toggle('single-question',q.display==='one'&&!corrected);
    progress.textContent=answered()+' / '+questions.length;
    const indices=corrected||q.display==='all'?questions.map((_,i)=>i):[state.index];
    for(const i of indices){const item=questions[i],card=el('fieldset',null,'question-card');card.lang=item.language;card.append(el('legend',(i+1)+'. '+item.question));
     if(item.language!==q.language)card.append(el('small',t('english_fallback')));
     item.visible.forEach((sourceIndex,optionIndex)=>{const label=el('label',null,'quiz-option'),radio=el('input');radio.type='radio';radio.name='walk-q-'+i;radio.checked=state.answers[i]===sourceIndex;radio.disabled=corrected;
      if(corrected){if(sourceIndex===item.correctIndex)label.classList.add('walk-answer-correct');else if(radio.checked)label.classList.add('walk-answer-wrong');}
      radio.addEventListener('change',async()=>{state.answers[i]=sourceIndex;try{await saveAttempt(state);progress.textContent=answered()+' / '+questions.length;updateGate();if(showTie()&&!body.querySelector('.tie-question'))draw();}catch(e){fail(e);}});
      label.append(radio,el('span',item.visible.length===3?['1','X','2'][optionIndex]:String(optionIndex+1),'option-symbol'),el('span',item.options[sourceIndex],'option-text'));
      if(corrected&&(sourceIndex===item.correctIndex||radio.checked))label.append(el('span',(sourceIndex===item.correctIndex?' ✓ ':' ✗ ')+t(sourceIndex===item.correctIndex?'correct':'incorrect'),'answer-mark'));card.append(label);
     });body.append(card);
    }
    if(corrected){const correct=questions.filter((item,i)=>state.answers[i]===item.correctIndex).length;const line=el('p',t('score')+': '+correct+' / '+questions.length+' · '+t('incorrect')+': '+(questions.length-correct),'walk-score');line.setAttribute('role','status');body.append(line);return;}
    if(showTie()){const section=el('section',null,'tie-question');section.append(el('h3',t('tie_breaker')),el('p',tie.question+' ('+tie.unit+')'));const estimate=field(section,'estimate','text',state.estimate??'');estimate.inputMode='decimal';estimate.addEventListener('input',()=>{const v=estimate.value.trim().replace(',','.');state.estimate=v!==''&&Number.isFinite(Number(v))?Number(v):null;saveAttempt(state).catch(fail);});body.append(section);}
    const status=el('p',null,'unlock-status');status.setAttribute('role','status');body.append(status);
    const nav=el('nav',null,'quiz-navigation');nav.setAttribute('aria-label',t('play'));body.append(nav);
    if(q.display==='one'&&state.index>0)nav.append(action('previous',async()=>{stop();state.index--;await saveAttempt(state);draw();}));
    if(q.display==='one'&&state.index<questions.length-1){const next=action('next',async()=>{
      C.check(WalkProgress.canAdvance(state,Date.now(),native),'locked');stop();state.index++;state.unlocked=Math.max(state.unlocked,state.index);await saveAttempt(state);draw();
     });nav.append(next);WalkProgress.open(state,Date.now());saveAttempt(state).catch(fail);timer=setInterval(()=>{updateGate();saveAttempt(state).catch(fail);},1000);updateGate();startLocation();}
    else status.hidden=true;
    if(q.display==='all'||state.index===questions.length-1)nav.append(action('finish',async()=>{
     await writeQueue;C.check(state.answers.every(Number.isInteger),'complete');if(tie)C.check(Number.isFinite(state.estimate)&&Math.abs(state.estimate)<=1e12,'estimate');
     if(state.random){state.completed=true;await saveAttempt(state);stop();draw();return;}
     const result={version:q.version,quizId:q.quizId,resultId:state.resultId,fingerprint:C.fingerprint(q),name:state.name,answers:[...state.answers]};if(tie)result.estimate=state.estimate;
     C.score(q,bank,result);state.result=C.encodeResult(result);await saveAttempt(state);resultPage(state);
    }));
   }
   function updateGate(){const next=body.querySelector('[data-action=next]'),status=body.querySelector('.unlock-status');if(!next||!status)return;
    const gate=WalkProgress.open(state,Date.now()),value=WalkProgress.status(q,gate,Date.now(),native),unlocked=state.index<state.unlocked;
    next.disabled=!WalkProgress.canAdvance(state,Date.now(),native);
    const parts=[];if(!unlocked&&value.seconds)parts.push(value.elapsed+' sec / '+value.seconds+' sec');if(!unlocked&&value.metres)parts.push(value.distance+' m / '+value.metres+' m');
    if(!Number.isInteger(state.answers[state.index]))parts.push(t('answer_first'));if(!unlocked&&!value.ready)parts.push(t('locked_help'));else if(parts.length&&Number.isInteger(state.answers[state.index]))parts.push(t('ready'));
    status.textContent=parts.join(' · ');status.hidden=!parts.length;
   }
   function startLocation(){if(!native||!['distance','both'].includes(q.walk)||state.index<state.unlocked||document.hidden||watch!==null)return;
    if(!navigator.geolocation){fail(Error('location'));return;}const gate=WalkProgress.open(state,Date.now());
    if(gate.distance>=q.walkValue)return;
    watch=navigator.geolocation.watchPosition(position=>{if(viewGeneration!==generation)return;const current={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy,time:position.timestamp};const changed=WalkMotion.advance(lastPosition,current,gate.distance);lastPosition=changed.previous;gate.distance=changed.total;saveAttempt(state).catch(fail);updateGate();},()=>{if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;fail(Error('location'));const status=body.querySelector('.unlock-status');if(status&&!body.querySelector('[data-action=retry]'))status.after(action('retry',()=>{body.querySelector('[data-action=retry]')?.remove();startLocation();}));},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
   }
   draw();const visibility=()=>{if(document.hidden){if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;lastPosition=null;}else{updateGate();startLocation();}};document.addEventListener('visibilitychange',visibility);cleanup=()=>{stop();document.removeEventListener('visibilitychange',visibility);};
  }
  function resultPage(state){page('answer_sheet');if(state.lan){const status=el('p',t('pending'));content.append(status);WalkLAN.queue(state.lan,state.result).then(sent=>{status.textContent=t(sent?'sent':'pending');}).catch(fail);const timer=setInterval(()=>S.get('lan-delivered:'+state.result).then(sent=>{if(sent)status.textContent=t('sent');}).catch(fail),4000);cleanup=()=>clearInterval(timer);}const result=C.decodeResult(state.result);content.append(el('h3',state.name));share(content,state.result,false);if(state.quiz.resultMode==='instant'){const score=C.score(state.quiz,bank,result);content.append(el('p',`${t('score')}: ${score.correct} / ${score.total}`));const tie=C.tieBreaker(state.quiz,bank);if(tie)content.append(el('p',t('tie_breaker')+': '+result.estimate+' · '+t('reference')+': '+tie.referenceAnswer+' '+tie.unit+' · '+t('tie_difference')+': '+score.tieDifference));for(const [i,q]of C.resolve(state.quiz,bank).entries())content.append(el('p',`${i+1}. ${q.question} — ${q.options[q.correctIndex]} ${result.answers[i]===q.correctIndex?'✓':'✗'}`));}}
  async function lanLobby(prefill=''){
   page('experimental');const generation=viewGeneration;content.append(el('p',t('lan_help')));if(native){content.append(action('start_host',()=>{root.TipspromenadHost.startLocalHost();content.append(el('p',t('host_starting')));let checks=0;const timer=setInterval(async()=>{if(await WalkLAN.available()){clearInterval(timer);lanLobby();}else if(++checks>=20)clearInterval(timer);},1000);cleanup=()=>clearInterval(timer);}),action('stop_host',()=>{root.TipspromenadHost.stopLocalHost();home();}));}
   const available=await WalkLAN.available();if(generation!==viewGeneration)return;
   if(!available){content.append(el('p',t('lan_unavailable')));return;}
   const code=field(content,'join_code','text',typeof prefill==='string'?prefill:''),name=field(content,'name','text',settings.participantName||'');
   content.append(action('join',async()=>{C.check(C.text(name.value.trim(),128),'name');const joinCode=code.value.trim().toUpperCase();const response=await WalkLAN.request('/api/join',{joinCode,name:name.value.trim()});const quiz=C.decodeQuiz(response.code);const received=C.validateBank(response.bank);C.resolve(quiz,received);C.tieBreaker(quiz,received);await S.put('bank:'+quiz.revision,received);bank=received;settings={...settings,participantName:name.value.trim()};await S.put('settings',settings);await startAttempt(quiz,name.value.trim(),false,{joinCode,participantToken:response.participantToken});}));
   if(native){content.append(el('h3',t('host')));for(const record of await S.list('quiz:')){if(!record)continue;const button=action('host',()=>hostQuiz(record.quiz));button.textContent=record.quiz.name;content.append(button);}content.append(action('create',builder));}
   for(const record of await S.list('lan-host:')){if(!record)continue;const button=action('results',()=>hostResults(record));button.textContent=t('results')+' · '+record.joinCode;content.append(button);}
  }
  async function hostQuiz(quiz){if(!native){await lanLobby();return;}if(!await WalkLAN.available()){await lanLobby();return;}const record=await WalkLAN.request('/api/hosts',{code:C.encodeQuiz(quiz)});record.name=quiz.name;await S.put('lan-host:'+record.joinCode,record);await hostResults(record);}
  async function hostResults(record){page('experimental');const generation=viewGeneration;content.append(el('h3',record.name),el('p',t('join_code')+': '+record.joinCode));
   const status=await WalkLAN.request('/api/status');const url=new URL(status.addresses?.[0]||location.href);url.pathname='/';url.search='?lan='+encodeURIComponent(record.joinCode);url.hash='';const link=field(content,'participant_link','text',url.href);link.readOnly=true;
   content.append(action('copy',()=>copyText(url.href)));const info=status;for(const address of info.addresses||[]){if(new URL(address).host!==location.host){const lanLink=field(content,'participant_link','text',address+'/?lan='+record.joinCode);lanLink.readOnly=true;}}const body=el('section');content.append(body);
   const update=async()=>{try{const data=await WalkLAN.request('/api/hosts/'+record.joinCode,null,record.adminToken);if(generation!==viewGeneration)return;body.replaceChildren(el('p',data.count+' / '+data.participants.length+' '+t('completed')));const table=el('table',null,'lan-results'),head=el('tr');['rank','name','score','percent','tie_difference'].forEach(k=>head.append(el('th',t(k))));table.append(head);for(const row of data.rows){const tr=el('tr');[row.rank,row.name,row.correct+' / '+row.total,Math.round(row.correct/row.total*100)+'%',row.tieDifference??'—'].forEach(v=>tr.append(el('td',String(v))));table.append(tr);}body.append(table);for(const participant of data.participants.filter(p=>!p.completed))body.append(el('p',participant.name+' · '+t('in_progress')));}catch(_){if(generation===viewGeneration)body.replaceChildren(el('p',t('pending')));}};
   content.append(action('refresh',update));const timer=setInterval(update,5000);cleanup=()=>clearInterval(timer);await update();
  }
  async function scan(accept){
   const dialog=el('dialog',null,'settings-dialog'),video=el('video',null,'scanner-video'),status=el('p',t('camera_help'));video.playsInline=true;video.muted=true;let stream,timer,closed=false,busy=false;
   const stop=()=>{closed=true;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;if(dialog.open)dialog.close();dialog.remove();window.removeEventListener('tipspromenad:stop-camera',stop);document.removeEventListener('visibilitychange',hidden);};
   const hidden=()=>{if(document.hidden)stop();};dialog.append(el('h2',t('scan')),video,status,action('close',stop));dialog.addEventListener('close',stop);window.addEventListener('tipspromenad:stop-camera',stop);document.addEventListener('visibilitychange',hidden);host.append(dialog);dialog.showModal();
   try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});if(closed){stream.getTracks().forEach(t=>t.stop());return;}video.srcObject=stream;await video.play();const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});async function frame(){if(closed)return;try{if(video.videoWidth&&!busy){const scale=Math.min(1,640/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);ctx.drawImage(video,0,0,canvas.width,canvas.height);const value=QuizCorrection.decode(ctx,canvas.width,canvas.height);if(value){busy=true;try{await accept(value);stop();return;}catch(e){status.textContent=t('error_'+e.message)||t('error');busy=false;}}}timer=setTimeout(frame,300);}catch(_){stream?.getTracks().forEach(t=>t.stop());status.textContent=t('error_camera');}}frame();}catch(_){stream?.getTracks().forEach(t=>t.stop());status.textContent=t('error_camera');}
  }
  const hash=new URLSearchParams(location.hash.slice(1));if(params.has('lan')){await lanLobby(params.get('lan'));}else if(hash.has('quiz')){try{const quiz=C.decodeQuiz(hash.get('quiz'));await ensureRevision(quiz);await askName(quiz);}catch(e){await home();fail(e);}}else await home();
  if(!params.has('lan'))WalkDatabase.latest(latestBank).then(updated=>{if(updated){latestBank=updated;if(atHome){bank=updated;home().catch(fail);}}});
 }
 root.WalkUI={mount};
})(globalThis);
