/* Shared localized classic-quiz presentation. No framework or backend required. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./quiz-core'), require('./i18n'));
  else root.QuizUI = factory(root.QuizCore, root.QuizI18n);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, I18n) {
  'use strict';
  async function mount(options) {
    const messages = options.messages || await getJson('locales/ui.json');
    const params = new URLSearchParams(location.search);
    let ui = Core.normalizeLanguage(params.get('ui') || I18n.readPreference('tips.ui') || navigator.language) || 'en';
    // Do not reinterpret an unsupported explicit question language as English.
    const requestedQuizLanguage = params.get('quizLang') || params.get('lang') || I18n.readPreference('tips.quizLang') || 'en';
    let quizLanguage = Core.normalizeLanguage(requestedQuizLanguage) || requestedQuizLanguage;
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
    const restart = node('button'); restart.type = 'button';
    form.append(listName, progress, quiz, knockoutLabel, submit, results, restart);
    host.append(title, controls, chooseLabel, status, retry, form);
    function updateUrl() {
      const next = new URL(location.href); next.searchParams.set('ui', ui); next.searchParams.set('quizLang', quizLanguage);
      history.replaceState(null, '', next); document.documentElement.lang = ui;
    }
    function persist() {
      if (!lists.length || loading) return;
      I18n.savePreference(`tips.progress.${options.storageId}.${quizLanguage}`, JSON.stringify({selected, answers, submitted, knockout,
        fingerprint: Core.collectionFingerprint(lists[selected])}));
    }
    function restore() {
      try {
        const saved = JSON.parse(I18n.readPreference(`tips.progress.${options.storageId}.${quizLanguage}`));
        if (!saved || !Number.isInteger(saved.selected) || !lists[saved.selected] || saved.fingerprint !== Core.collectionFingerprint(lists[saved.selected])) return;
        selected = saved.selected;
        answers = lists[selected].QuestionList.map((question, index) => Number.isInteger(saved.answers?.[index]) && saved.answers[index] >= 0 && saved.answers[index] < question.answers.length ? saved.answers[index] : null);
        submitted = saved.submitted === true;
        knockout = typeof saved.knockout === 'string' ? saved.knockout : '';
      } catch (_) { /* A corrupt or obsolete save must not prevent opening a quiz. */ }
    }
    function reset() { answers = []; submitted = false; knockout = ''; }
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
    }
    uiSelect.addEventListener('change', () => {
      ui = uiSelect.value; I18n.savePreference('tips.ui', ui); updateUrl(); render();
    });
    quizSelect.addEventListener('change', () => {
      if (!confirmReset()) { quizSelect.value = quizLanguage; return; }
      persist(); quizLanguage = quizSelect.value; I18n.savePreference('tips.quizLang', quizLanguage); updateUrl(); load();
    });
    choose.addEventListener('change', () => {
      if (!confirmReset()) { choose.value = selected; return; }
      selected = Number(choose.value); reset(); persist(); render();
    });
    knockoutInput.addEventListener('input', () => { knockout = knockoutInput.value; persist(); });
    form.addEventListener('submit', event => { event.preventDefault(); submitted = true; persist(); render(); results.scrollIntoView({block: 'nearest'}); });
    restart.addEventListener('click', () => { if (confirmReset()) { reset(); persist(); render(); } });
    function renderProgress() {
      progress.textContent = t('progress', {answered: answers.filter(Number.isInteger).length, total: lists[selected].QuestionList.length});
    }
    function render() {
      document.documentElement.lang = ui; document.title = t('title'); title.textContent = t('title');
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
          if (submitted && answerIndex === Core.correctIndex(question)) {
            label.classList.add('correct-answer'); const badge = node('span', 'answer-status', ` — ${t('correct')}`); badge.lang = ui; label.append(badge);
          } else if (submitted && answers[index] === answerIndex) {
            label.classList.add('incorrect-answer'); const badge = node('span', 'answer-status', ` — ${t('incorrect')}`); badge.lang = ui; label.append(badge);
          }
          radio.addEventListener('change', () => { answers[index] = answerIndex; persist(); renderProgress(); });
          alternatives.append(label);
        });
        field.append(alternatives);
        if (submitted && !Number.isInteger(answers[index])) { const missing = node('p', '', t('unanswered')); missing.lang = ui; field.append(missing); }
        if (submitted && question.explanation) field.append(node('p', 'explanation', question.explanation));
        quiz.append(field);
      });
      knockoutTitle.textContent = t('knockout'); knockoutQuestion.textContent = list.questionKnockout?.question || '';
      knockoutLabel.hidden = !list.questionKnockout?.question; knockoutInput.value = knockout; knockoutInput.disabled = submitted;
      submit.textContent = t('submit'); submit.hidden = submitted;
      restart.textContent = t('restart'); restart.hidden = !submitted;
      results.replaceChildren(); results.hidden = !submitted;
      if (submitted) {
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
