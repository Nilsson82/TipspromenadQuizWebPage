/* Shared localized classic-quiz presentation. No framework or backend required. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./quiz-core'), require('./i18n'), require('./correction'));
  else root.QuizUI = factory(root.QuizCore, root.QuizI18n, root.QuizCorrection);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, I18n, Correction) {
  'use strict';
  async function mount(options) {
    const messages = options.messages || await getJson('locales/ui.json');
    const params = new URLSearchParams(location.search);
    // The Android host already provides native language settings in its menu.
    const nativeSettings = params.get('host') === 'android';
    let ui = Core.normalizeLanguage(params.get('ui') || I18n.readPreference('tips.ui') || navigator.language) || 'en';
    // Do not reinterpret an unsupported explicit question language as English.
    const requestedQuizLanguage = params.get('quizLang') || params.get('lang') || I18n.readPreference('tips.quizLang') || 'en';
    let quizLanguage = Core.normalizeLanguage(requestedQuizLanguage) || requestedQuizLanguage;
    let correctionMode = Correction.normalizeMode(params.get('correction') || I18n.readPreference('tips.correction'));
    let unlocked = false;
    let lists = [], selected = 0, answers = [], submitted = false, knockout = '', loading = true;
    let loadError = '', generation = 0;
    const host = options.host;
    const t = (key, data) => I18n.translate(messages, ui, key, data);
    function node(tag, className, content) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (content != null) element.textContent = content;
      return element;
    }
    host.replaceChildren();
    const title = node('h1');
    const toolbar = node('header', 'quiz-toolbar');
    toolbar.hidden = nativeSettings;
    const menu = node('details', 'overflow-menu');
    const menuToggle = node('summary', 'overflow-toggle', '⋮');
    const menuPanel = node('div', 'overflow-panel');
    const settingsButton = node('button'); settingsButton.type = 'button';
    menuPanel.append(settingsButton); menu.append(menuToggle, menuPanel);
    toolbar.append(title, menu);
    const homeLink = node('a', '', '← Tipspromenad');
    const homeUrl = new URL(location.href); homeUrl.searchParams.delete('mode'); homeUrl.hash = '';
    homeLink.href = homeUrl.href; host.append(homeLink);
    const settings = node('dialog', 'settings-dialog');
    const settingsTitle = node('h2'); settingsTitle.id = 'quiz-settings-title';
    settings.setAttribute('aria-labelledby', settingsTitle.id);
    settings.append(settingsTitle);
    settingsButton.addEventListener('click', () => { menu.open = false; settings.showModal(); });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { menu.open = false; menuToggle.focus(); }
    });
    document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
    const controls = node('div', 'language-controls');
    const uiLabel = node('label'), quizLabel = node('label');
    const uiText = node('span'), quizText = node('span');
    const uiSelect = node('select'), quizSelect = node('select');
    for (const [code, name] of Object.entries(I18n.languageNames)) {
      uiSelect.add(new Option(name, code)); quizSelect.add(new Option(name, code));
    }
    if (!Core.normalizeLanguage(quizLanguage)) quizSelect.add(new Option(quizLanguage, quizLanguage));
    uiLabel.append(uiText, uiSelect); quizLabel.append(quizText, quizSelect);
    controls.append(uiLabel, quizLabel);
    settings.append(controls);
    const correctionLabel = node('label'), correctionText = node('span'), correctionSelect = node('select');
    Correction.modes.forEach(mode=>correctionSelect.add(new Option(mode,mode)));
    correctionLabel.append(correctionText,correctionSelect); controls.append(correctionLabel);
    const organizerButton = node('button'); organizerButton.type = 'button';
    const organizer = node('dialog','settings-dialog');
    const organizerTitle = node('h2'); organizerTitle.id = 'organizer-title'; organizer.setAttribute('aria-labelledby',organizerTitle.id);
    const organizerHelp = node('p'), organizerName = node('p'), organizerCode = node('p','correction-code'), organizerImage = node('img','correction-qr');
    const organizerClose = node('button'); organizerClose.type = 'button'; organizerClose.addEventListener('click',()=>organizer.close());
    organizer.append(organizerTitle,organizerName,organizerHelp,organizerCode,organizerImage,organizerClose);
    settings.append(organizerButton);
    async function showOrganizer() {
      if (loading || !lists[selected]) return;
      window.tipspromenadOrganizerRequested=false;
      const list = lists[selected];
      try {
        const identity = await Correction.identity(list,quizLanguage);
        if (list !== lists[selected]) return;
        organizerName.textContent = list.listName; organizerName.lang = quizLanguage;
        organizerCode.textContent = identity.code;
        organizerImage.src = Correction.qrImage(identity.qr);
        if (!organizer.open) organizer.showModal();
      } catch (_) { status.hidden = false; status.textContent = t('correction_error'); }
    }
    organizerButton.addEventListener('click',showOrganizer);
    window.addEventListener('tipspromenad:organizer',showOrganizer);
    const settingsClose = node('button', 'settings-close'); settingsClose.type = 'button';
    settingsClose.addEventListener('click', () => settings.close());
    settings.append(settingsClose);
    settings.addEventListener('close', () => menuToggle.focus());
    const chooseLabel = node('label', 'quiz-picker'), chooseText = node('span'), choose = node('select');
    chooseLabel.append(chooseText, choose);
    const status = node('p', 'status'); status.setAttribute('role', 'status');
    const retry = node('button'); retry.type = 'button'; retry.addEventListener('click', load);
    const form = node('form');
    const listName = node('h2');
    const progress = node('p'); progress.setAttribute('aria-live', 'polite');
    const quiz = node('div');
    const knockoutLabel = node('label', 'knockout-label'), knockoutTitle = node('span'), knockoutQuestion = node('span');
    const knockoutInput = node('input'); knockoutInput.type = 'number'; knockoutInput.step = 'any';
    knockoutLabel.append(knockoutTitle, knockoutQuestion, knockoutInput);
    const submit = node('button', 'submit-button'); submit.type = 'submit';
    const results = node('div', 'result-panel'); results.setAttribute('role', 'status');
    const gate = node('section','correction-gate'), gateTitle = node('h3');
    const codeLabel = node('label'), codeText = node('span'), codeInput = node('input');
    codeInput.type = 'text'; codeInput.maxLength = 160; codeInput.autocomplete = 'off'; codeInput.spellcheck = false;
    codeLabel.append(codeText,codeInput);
    const unlockButton = node('button'); unlockButton.type = 'button';
    const scanButton = node('button'); scanButton.type = 'button';
    const gateStatus = node('p'); gateStatus.setAttribute('role','status');
    gate.append(gateTitle,codeLabel,unlockButton,scanButton,gateStatus);
    async function unlock(value) {
      if (!submitted || !lists[selected]) return false;
      const list = lists[selected];
      try {
        const identity = await Correction.identity(list,quizLanguage);
        if (list !== lists[selected] || !submitted) return false;
        if (!Correction.matches(value,identity)) { gateStatus.textContent = t('wrong_correction'); return false; }
        unlocked = true; stopCamera(); persist(); render(); return true;
      } catch (_) { gateStatus.textContent = t('correction_error'); return false; }
    }
    unlockButton.addEventListener('click',()=>unlock(codeInput.value));
    codeInput.addEventListener('keydown',event=>{ if(event.key==='Enter') {event.preventDefault(); unlock(codeInput.value);} });
    const scanner = node('dialog','settings-dialog'), scannerTitle = node('h2');
    scannerTitle.id = 'scanner-title'; scanner.setAttribute('aria-labelledby',scannerTitle.id);
    const cameraHelp = node('p'), video = node('video','scanner-video'), scannerStatus = node('p');
    video.muted = true; video.playsInline = true; scannerStatus.setAttribute('role','status');
    const scannerClose = node('button'); scannerClose.type='button'; scannerClose.addEventListener('click',stopCamera);
    scanner.append(scannerTitle,cameraHelp,video,scannerStatus,scannerClose);
    let stream = null, scanTimer = null, scanGeneration = 0;
    function stopCamera() {
      ++scanGeneration; clearTimeout(scanTimer); stream?.getTracks().forEach(track=>track.stop()); stream=null; video.srcObject=null;
      if (scanner.open) scanner.close();
    }
    scanner.addEventListener('close',stopCamera);
    document.addEventListener('visibilitychange',()=>{if(document.hidden) stopCamera();});
    window.addEventListener('pagehide',stopCamera);
    window.addEventListener('tipspromenad:stop-camera',stopCamera);
    scanButton.addEventListener('click',async()=>{
      stopCamera(); const generation = scanGeneration;
      scannerStatus.textContent=''; scanner.showModal();
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
        if(generation!==scanGeneration || !scanner.open) {acquired.getTracks().forEach(track=>track.stop());return;}
        stream=acquired; video.srcObject=stream; await video.play();
        const canvas=document.createElement('canvas'), context=canvas.getContext('2d',{willReadFrequently:true});
        async function scan() {
          if(generation!==scanGeneration || !scanner.open) return;
          try {
          if(video.videoWidth && video.videoHeight) {
            const scale=Math.min(1,640/video.videoWidth); canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
            context.drawImage(video,0,0,canvas.width,canvas.height);
            const value=Correction.decode(context,canvas.width,canvas.height);
            if(value) {if(await unlock(value)) return; scannerStatus.textContent=t('wrong_correction');}
          }
          if(generation===scanGeneration) scanTimer=setTimeout(scan,250);
          } catch (_) {
            if(generation!==scanGeneration) return;
            stream?.getTracks().forEach(track=>track.stop()); stream=null; video.srcObject=null;
            scannerStatus.textContent=t('camera_error');
          }
        }
        scan();
      } catch (_) {
        if(generation!==scanGeneration) return;
        stream?.getTracks().forEach(track=>track.stop()); stream=null; video.srcObject=null;
        scannerStatus.textContent=t('camera_error');
      }
    });
    const restart = node('button'); restart.type = 'button';
    form.append(listName, progress, quiz, knockoutLabel, submit, gate, results, restart);
    host.append(toolbar, settings, organizer, scanner, chooseLabel, status, retry, form);
    function updateUrl() {
      const next = new URL(location.href); next.searchParams.set('ui', ui); next.searchParams.set('quizLang', quizLanguage);
      next.searchParams.set('correction',correctionMode);
      history.replaceState(null, '', next); document.documentElement.lang = ui;
    }
    function persist() {
      if (!lists.length || loading) return;
      I18n.savePreference(`tips.progress.${options.storageId}.${quizLanguage}`, JSON.stringify({selected, answers, submitted, knockout, unlocked, correctionMode,
        fingerprint: Core.collectionFingerprint(lists[selected])}));
    }
    function restore() {
      try {
        const saved = JSON.parse(I18n.readPreference(`tips.progress.${options.storageId}.${quizLanguage}`));
        if (!saved || !Number.isInteger(saved.selected) || !lists[saved.selected] || saved.fingerprint !== Core.collectionFingerprint(lists[saved.selected])) return;
        selected = saved.selected;
        if ((saved.correctionMode || 'direct') !== correctionMode) return;
        answers = lists[selected].QuestionList.map((question, index) => Number.isInteger(saved.answers?.[index]) && saved.answers[index] >= 0 && saved.answers[index] < question.answers.length ? saved.answers[index] : null);
        submitted = saved.submitted === true && (saved.correctionMode || 'direct') === correctionMode;
        unlocked = submitted && (correctionMode === 'direct' || saved.unlocked === true);
        knockout = typeof saved.knockout === 'string' ? saved.knockout : '';
      } catch (_) { /* A corrupt or obsolete save must not prevent opening a quiz. */ }
    }
    function reset() { answers = []; submitted = false; unlocked = false; knockout = ''; codeInput.value=''; gateStatus.textContent=''; stopCamera(); }
    function hasProgress() { return answers.some(Number.isInteger) || knockout !== '' || submitted; }
    function confirmReset() { return !hasProgress() || window.confirm(t('reset_warning')); }
    async function load() {
      const current = ++generation;
      loading = true; loadError = ''; lists = []; reset(); render();
      try {
        if (!Core.normalizeLanguage(quizLanguage)) throw new Error('unavailable_language');
        const loaded = await options.loadCollections(quizLanguage);
        Core.validateLegacy(loaded);
        if (current !== generation) return;
        lists = loaded; selected = 0; restore();
      } catch (error) {
        if (current !== generation) return;
        loadError = error.message === 'unavailable_language' ? 'unavailable_language' : 'load_error';
        console.error('Quiz load failed', error);
      }
      loading = false; render();
      if (window.tipspromenadOrganizerRequested && lists.length) showOrganizer();
    }
    uiSelect.addEventListener('change', () => {
      ui = uiSelect.value; I18n.savePreference('tips.ui', ui); updateUrl(); render();
    });
    quizSelect.addEventListener('change', () => {
      if (!confirmReset()) { quizSelect.value = quizLanguage; return; }
      persist(); quizLanguage = quizSelect.value; I18n.savePreference('tips.quizLang', quizLanguage); updateUrl(); load();
    });
    correctionSelect.addEventListener('change',()=>{
      if(hasProgress() && !window.confirm(t('correction_reset'))) {correctionSelect.value=correctionMode;return;}
      correctionMode=correctionSelect.value; reset(); I18n.savePreference('tips.correction',correctionMode); updateUrl();persist();render();
    });
    choose.addEventListener('change', () => {
      if (!confirmReset()) { choose.value = selected; return; }
      selected = Number(choose.value); reset(); persist(); render();
    });
    knockoutInput.addEventListener('input', () => { knockout = knockoutInput.value; persist(); });
    form.addEventListener('submit', event => { event.preventDefault(); submitted = true; unlocked = correctionMode === 'direct'; persist(); render(); (unlocked ? results : gate).scrollIntoView({block: 'nearest'}); });
    restart.addEventListener('click', () => { if (confirmReset()) { reset(); persist(); render(); } });
    function renderProgress() {
      progress.textContent = t('progress', {answered: answers.filter(Number.isInteger).length, total: lists[selected].QuestionList.length});
    }
    function render() {
      document.documentElement.lang = ui; document.title = t('title'); title.textContent = t('title');
      menuToggle.setAttribute('aria-label', t('settings'));
      settingsButton.textContent = t('settings'); settingsTitle.textContent = t('settings');
      settingsClose.textContent = t('close');
      correctionText.textContent=t('correction_method'); correctionSelect.value=correctionMode;
      [...correctionSelect.options].forEach(option=>option.textContent=t('correction_'+option.value));
      organizerButton.textContent=t('organizer'); organizerButton.disabled=loading || !lists.length;
      organizerTitle.textContent=t('organizer'); organizerHelp.textContent=t('organizer_help'); organizerImage.alt=t('correction_qr'); organizerClose.textContent=t('close');
      scannerTitle.textContent=t('scan_correction'); cameraHelp.textContent=t('camera_help'); scannerClose.textContent=t('close');
      gateTitle.textContent=t('results_locked'); codeText.textContent=t('enter_correction'); unlockButton.textContent=t('unlock_results'); scanButton.textContent=t('scan_correction');
      gate.hidden=!submitted || unlocked; scanButton.hidden=correctionMode!=='qr';
      uiText.textContent = t('ui_language'); quizText.textContent = t('quiz_language');
      uiSelect.value = ui; quizSelect.value = quizLanguage; chooseText.textContent = t('choose_quiz');
      retry.textContent = t('retry'); retry.hidden = !loadError;
      status.textContent = loading ? t('loading') : loadError ? t(loadError) : '';
      status.hidden = !loading && !loadError;
      form.hidden = loading || !!loadError || !lists.length;
      chooseLabel.hidden = form.hidden;
      if (form.hidden) return;
      choose.replaceChildren(); lists.forEach((list, index) => choose.add(new Option(list.listName, String(index)))); choose.value = selected;
      const list = lists[selected]; listName.textContent = list.listName;
      const showAnswers = submitted && unlocked;
      // Screen readers pronounce question content in the independently selected language.
      listName.lang = quizLanguage; quiz.lang = quizLanguage; knockoutQuestion.lang = quizLanguage;
      renderProgress(); quiz.replaceChildren();
      list.QuestionList.forEach((question, index) => {
        const field = node('fieldset', 'question-card');
        const legend = node('legend', 'question', `${index + 1}. ${question.question}`); field.append(legend);
        const imageUrl = Core.safeImage(question.image);
        if (imageUrl) {
          const img = node('img', 'question-image'); img.src = imageUrl; img.alt = question.question; img.loading = 'lazy';
          img.addEventListener('error', () => { const missing = node('p', 'image-fallback', t('missing_image')); missing.lang = ui; img.replaceWith(missing); }); field.append(img);
        }
        const alternatives = node('div', `answers ${list.answerDisplay === 'horizontally' ? 'horizontal-display' : 'vertical-display'}`);
        question.answers.forEach((answer, answerIndex) => {
          const label = node('label');
          const radio = node('input'); radio.type = 'radio'; radio.name = `question${index}`; radio.value = String(answerIndex);
          radio.checked = answers[index] === answerIndex; radio.disabled = submitted;
          const prefix = list.answerOptions ? (question.answers.length === 3 ? ['1', 'X', '2'][answerIndex] : String(answerIndex + 1)) + '. ' : '';
          label.append(radio, document.createTextNode(prefix + answer));
          if (showAnswers && answerIndex === Core.correctIndex(question)) {
            label.classList.add('correct-answer'); const badge = node('span', 'answer-status', ` — ${t('correct')}`); badge.lang = ui; label.append(badge);
          } else if (showAnswers && answers[index] === answerIndex) {
            label.classList.add('incorrect-answer'); const badge = node('span', 'answer-status', ` — ${t('incorrect')}`); badge.lang = ui; label.append(badge);
          }
          radio.addEventListener('change', () => { answers[index] = answerIndex; persist(); renderProgress(); });
          alternatives.append(label);
        });
        field.append(alternatives);
        if (showAnswers && !Number.isInteger(answers[index])) { const missing = node('p', '', t('unanswered')); missing.lang = ui; field.append(missing); }
        if (showAnswers && question.explanation) field.append(node('p', 'explanation', question.explanation));
        quiz.append(field);
      });
      knockoutTitle.textContent = t('knockout'); knockoutQuestion.textContent = list.questionKnockout?.question || '';
      knockoutLabel.hidden = !list.questionKnockout?.question; knockoutInput.value = knockout; knockoutInput.disabled = submitted;
      submit.textContent = t('submit'); submit.hidden = submitted;
      restart.textContent = t('restart'); restart.hidden = !submitted;
      results.replaceChildren(); results.hidden = !showAnswers;
      if (showAnswers) {
        results.append(node('p', 'result', t('score', {score: Core.score(list.QuestionList, answers), total: list.QuestionList.length})));
        if (list.questionKnockout?.question && knockout !== '' && Number.isFinite(Number(knockout))) {
          results.append(node('p', 'result', t('knockout_result', {answer: knockout, correct: list.questionKnockout.result, difference: Math.abs(Number(knockout) - list.questionKnockout.result)})));
        }
      }
    }
    updateUrl(); await load();
  }
  async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  return {mount, getJson};
});
