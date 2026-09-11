const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../lib/quiz-core');
const I18n = require('../lib/i18n');
const bank = require('../Data/multilingual.json');
const messages = require('../locales/ui.json');
const clone = value => JSON.parse(JSON.stringify(value));
test('canonicalizes aliases and regional tags without guessing unsupported content languages', () => {
  for (const [input, expected] of Object.entries({se:'sv',dk:'da','sv-SE':'sv','es_MX':'es','nb-NO':'no','nn':'no','FI':'fi'})) assert.equal(Core.normalizeLanguage(input), expected);
  assert.equal(Core.normalizeLanguage('de'), null);
});
test('all six UI dictionaries are complete and placeholders match English', () => {
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const language of Core.languages) {
    assert.deepEqual(Object.keys(messages[language]).sort(), Object.keys(messages.en).sort());
    for (const key of Object.keys(messages.en)) assert.deepEqual(placeholders(messages[language][key]), placeholders(messages.en[key]));
  }
  assert.equal(I18n.translate({en:{test:'Hello {name}'},fi:{}}, 'fi', 'test', {name:'Ada'}), 'Hello Ada');
});
test('starter contains six playable translations and preserves logical question IDs', () => {
  const ids = bank.questions.map(q => q.id);
  for (const language of Core.languages) {
    const quiz = Core.projectBank(bank, language)[0];
    assert.deepEqual(quiz.QuestionList.map(q=>q.id), ids);
    assert.equal(Core.score(quiz.QuestionList, quiz.QuestionList.map(Core.correctIndex)), ids.length);
    assert.equal(Core.score(quiz.QuestionList, []), 0);
  }
});
test('legacy Swedish, English and Spanish data remain readable with exact answer order', () => {
  for (const language of ['sv','en','es']) {
    const lists = JSON.parse(fs.readFileSync(path.join(__dirname, '../Data', `data_${language}.json`)));
    const before = JSON.stringify(lists);
    Core.validateLegacy(lists);
    assert.equal(JSON.stringify(lists), before);
    for (const list of lists) assert.equal(Core.score(list.QuestionList, list.QuestionList.map(Core.correctIndex)), list.QuestionList.length);
  }
});
test('malformed alternatives and missing correct answers are rejected', () => {
  const list = [{listName:'Sample', QuestionList:[{question:'Test?', answers:['A','B'], correctAnswer:'C'}]}];
  assert.throws(()=>Core.validateLegacy(list));
  list[0].QuestionList[0].correctAnswer = 0;
  assert.doesNotThrow(()=>Core.validateLegacy(list));
  list[0].QuestionList[0].answers = ['A','A'];
  assert.throws(()=>Core.validateLegacy(list));
});
test('duplicate IDs, wrong keys and inconsistent translated answer IDs are rejected', () => {
  let bad = clone(bank); bad.questions.push(bad.questions[0]); assert.throws(()=>Core.projectBank(bad, 'sv'));
  bad = clone(bank); bad.questions[0].correctAnswerId = 'not-an-answer'; assert.throws(()=>Core.projectBank(bad,'sv'));
  bad = clone(bank); bad.questions[0].translations.fi.answers.push({id:'extra',text:'Extra'}); assert.throws(()=>Core.projectBank(bad,'en'));
});
test('missing quiz translations do not silently fall back to English', () => {
  const partial = clone(bank); partial.questions.forEach(q=>delete q.translations.fi);
  assert.deepEqual(Core.projectBank(partial,'fi'), []);
  assert.throws(()=>Core.projectBank(bank,'de'));
});
test('unsafe image URLs are ignored and persistence tracks changes in the question data', () => {
  assert.equal(Core.safeImage('javascript:alert(1)'), null);
  assert.equal(Core.safeImage('data:image/svg+xml,test'), null);
  assert.equal(Core.safeImage('//unknown.test/a.png'), null);
  assert.equal(Core.safeImage('images/quiz.png'), 'images/quiz.png');
  const list = Core.projectBank(bank,'sv')[0], before = Core.collectionFingerprint(list);
  list.QuestionList[0].answers.reverse(); assert.notEqual(Core.collectionFingerprint(list), before);
});
