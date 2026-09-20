// Existing classic quiz flow; shared modules separate data, localization and UI.
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator && location.hostname !== 'appassets.androidplatform.net') {
    navigator.serviceWorker.register('service-worker.js').catch(error=>console.warn('Offline cache unavailable',error));
  }
  try {
    if (new URLSearchParams(location.search).get('mode') !== 'classic') {
      await WalkUI.mount(document.querySelector('.container'));
      return;
    }
    await QuizUI.mount({
      host: document.querySelector('.container'), storageId: 'quiz-web-page',
      async loadCollections(language) {
        const bank = await QuizUI.getJson('Data/multilingual.json');
        const starter = QuizCore.projectBank(bank, language);
        if (['en', 'es', 'sv'].includes(language)) {
          // Relative paths work on GitHub Pages and on a local HTTP server.
          const legacy = QuizCore.validateLegacy(await QuizUI.getJson(`Data/data_${language}.json`));
          return [...legacy, ...starter];
        }
        if (!starter.length) throw new Error('unavailable_language');
        return starter;
      }
    });
  } catch (error) {
    console.error(error);
    document.querySelector('.container').textContent = 'Could not load the quiz. Reload the page to try again.';
  }
});
