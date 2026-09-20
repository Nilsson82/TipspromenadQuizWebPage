(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./quiz-core'), require('./vendor/qrcode'), require('./vendor/jsQR'));
  else root.QuizCorrection = factory(root.QuizCore, root.qrcode, root.jsQR);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, qrcode, jsQR) {
  'use strict';
  const modes = ['direct', 'code', 'qr'];
  function normalizeMode(value) { return modes.includes(value) ? value : 'direct'; }
  async function identity(list, language) {
    const content = JSON.stringify({version:1, language:Core.normalizeLanguage(language), id:list.id || list.listName,
      questions:list.QuestionList.map(q=>({id:q.id || q.question, question:q.question, answers:q.answers, correct:Core.correctIndex(q)})),
      tieBreaker:list.questionKnockout || null});
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
    const hash = Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
    return {code:'C1-'+hash.slice(0,16).toUpperCase(), qr:'tipspromenad:correction:v1:'+hash};
  }
  function matches(input, expected) {
    if (typeof input !== 'string' || input.length > 160) return false;
    const value = input.trim();
    return value === expected.qr || /^C1-[A-F0-9]{16}$/i.test(value) && value.toUpperCase() === expected.code;
  }
  function qrImage(payload) {
    const qr = qrcode(0, 'M'); qr.addData(payload); qr.make();
    return qr.createDataURL(6, 24);
  }
  // The caller owns permission and stream lifetime. No image leaves the device.
  function decode(context, width, height) {
    return jsQR(context.getImageData(0,0,width,height).data,width,height)?.data || null;
  }
  return {modes, normalizeMode, identity, matches, qrImage, decode};
});
