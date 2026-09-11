/* Shared runtime. Canonical source: TipspromenadQuizWebPage/lib/quiz-core.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuizCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const languages = ['en', 'sv', 'es', 'da', 'no', 'fi'];
  function normalizeLanguage(value) {
    const code = String(value || '').trim().toLowerCase().replace('_', '-').split('-')[0];
    const canonical = {se: 'sv', dk: 'da', nb: 'no', nn: 'no'}[code] || code;
    return languages.includes(canonical) ? canonical : null;
  }
  function text(value) { return typeof value === 'string' && value.trim().length > 0; }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function safeImage(value) {
    if (!value) return null;
    if (typeof value !== 'string') return null;
    // Content is data, never markup or executable URL schemes.
    if (/^https:\/\//i.test(value)) return value;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith('//') && !value.includes('\\')) return value;
    return null;
  }
  function validateLegacy(lists) {
    assert(Array.isArray(lists) && lists.length > 0, 'Expected a non-empty list of quizzes');
    const ids = new Set();
    lists.forEach((list) => {
      assert(list && text(list.listName), 'Missing quiz name');
      if (list.id != null) { assert(text(list.id) && !ids.has(list.id), 'Duplicate or invalid quiz ID'); ids.add(list.id); }
      assert(Array.isArray(list.QuestionList) && list.QuestionList.length > 0, 'Missing questions');
      const questionIds = new Set();
      list.QuestionList.forEach((q) => {
        assert(q && text(q.question), 'Missing question text');
        if (q.id != null) { assert(text(q.id) && !questionIds.has(q.id), 'Duplicate or invalid question ID'); questionIds.add(q.id); }
        assert(Array.isArray(q.answers) && q.answers.length >= 2 && q.answers.every(text), 'Invalid alternatives');
        assert(new Set(q.answers).size === q.answers.length, 'Duplicate alternatives');
        assert(correctIndex(q) >= 0 && correctIndex(q) < q.answers.length, 'Correct answer is missing');
      });
      if (list.questionKnockout != null) {
        assert((list.questionKnockout.question == null || text(list.questionKnockout.question)) && typeof list.questionKnockout.result === 'number' && Number.isFinite(list.questionKnockout.result), 'Invalid tie-breaker');
      }
    });
    return lists;
  }
  function correctIndex(question) {
    return Number.isInteger(question.correctAnswer) ? question.correctAnswer : question.answers.indexOf(question.correctAnswer);
  }
  function projectBank(bank, language) {
    const code = normalizeLanguage(language);
    assert(code, 'Unsupported question language');
    assert(bank && bank.schemaVersion === 1 && text(bank.id) && Array.isArray(bank.questions) && bank.questions.length > 0, 'Invalid question bank');
    const ids = new Set();
    const questions = [];
    bank.questions.forEach((question) => {
      assert(question && text(question.id) && !ids.has(question.id), 'Duplicate or missing question ID');
      ids.add(question.id);
      assert(text(question.correctAnswerId) && question.translations && typeof question.translations === 'object', 'Invalid question');
      let answerIds;
      Object.entries(question.translations).forEach(([locale, translation]) => {
        assert(languages.includes(locale), 'Translations must use canonical language codes');
        assert(translation && text(translation.question) && Array.isArray(translation.answers) && translation.answers.length >= 2, 'Invalid translation');
        const currentIds = translation.answers.map(answer => { assert(answer && text(answer.id) && text(answer.text), 'Invalid answer'); return answer.id; });
        assert(new Set(currentIds).size === currentIds.length && currentIds.includes(question.correctAnswerId), 'Invalid correct answer ID');
        assert(!answerIds || (answerIds.length === currentIds.length && answerIds.every(id => currentIds.includes(id))), 'Answer IDs differ between translations');
        answerIds = currentIds;
      });
      const translation = question.translations[code];
      // Explicit language only. Partial translations are allowed; no silent substitution.
      if (!translation) return;
      questions.push({id: question.id, question: translation.question,
        answers: translation.answers.map(answer => answer.text),
        correctAnswer: translation.answers.findIndex(answer => answer.id === question.correctAnswerId),
        explanation: translation.explanation || '', image: safeImage(typeof question.image === 'object' && question.image ? question.image.url : question.image)});
    });
    if (!questions.length || !text(bank.names && bank.names[code])) return [];
    return validateLegacy([{id: bank.id, listName: bank.names[code], answerOptions: true,
      answerDisplay: 'vertically', QuestionList: questions}]);
  }
  function score(questions, answers) {
    return questions.reduce((sum, question, index) => sum + (Number.isInteger(answers[index]) && answers[index] === correctIndex(question) ? 1 : 0), 0);
  }
  function collectionFingerprint(list) {
    // Persistence version: compare full data to avoid restoring answers against changed questions.
    return JSON.stringify(list);
  }
  return {languages, normalizeLanguage, validateLegacy, projectBank, correctIndex, score, safeImage, collectionFingerprint};
});
