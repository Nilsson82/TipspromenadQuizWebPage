(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuizI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const languageNames = {en: 'English', sv: 'Svenska', es: 'Español', da: 'Dansk', no: 'Norsk', fi: 'Suomi'};
  function translate(messages, language, key, params = {}) {
    const template = (messages[language] && messages[language][key]) || messages.en[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, name) => params[name] == null ? `{${name}}` : String(params[name]));
  }
  function readPreference(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function savePreference(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* Private browsing can disable storage. */ } }
  return {languageNames, translate, readPreference, savePreference};
});
