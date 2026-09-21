# Tipspromenad participant website

Static participant website plus the shared runtime bundled in the Android app. No backend, accounts or dependency installation.

The website offers **Random Quiz**, **Join Friend Quiz**, and the existing **Classic Quizzes**. Android additionally exposes Create Quiz and organizer result collection. Participants scan or paste a portable `TIPQ1.` code, enter their name, answer questions and return a `TIPR1.` result QR/code. These are complete offline payloads, not very short lookup keys. Future Wi-Fi lookup is not implemented.

Settings is in the top-right three-dot menu. App language and question language are independent; en/sv/es/da/no/fi are supported. New question selections use 2/3/4 visible answers derived deterministically from four stored options. The canonical bank currently has 25 selectable questions in en/sv/es and six in da/no/fi. Insufficient pools and incompatible revisions fail explicitly.

## Run and test

Node 22 or newer; no packages required:

```sh
node tools/serve.cjs
node --test tests/*.test.cjs
```

Preview: `http://127.0.0.1:8085`. Serve via HTTP/HTTPS, not file://. There is no production compilation step. Deploy the repository root on existing GitHub Pages, keeping HTML, CSS, JS, locales, Data and service-worker.js together. Nothing has been pushed or deployed by this development run.

A service worker caches the shell and bundled questions after an online visit. Load online before an offline walk and check the target browser; browser cache/storage policies can vary. Classic external images still need internet. Update the service-worker cache version whenever bundled files change. A previous worker can remain active until old tabs close.

## Structure

- `lib/walk-core.js`: compact formats, database validation, seeded options and scoring.
- `lib/walk-ui.js`: participant flow and Android organizer UI.
- `lib/walk-store.js`: device-local IndexedDB records.
- `lib/walk-motion.js`: foreground distance filtering and timer math.
- `lib/quiz-core.js`, `lib/quiz-ui.js`, `lib/correction.js`: retained classic behavior.
- `lib/vendor/`: local QR generator/decoder and notices.
- `Data/revision-1.json`: immutable distribution from [the canonical question repository](https://github.com/Nilsson82/Tipspromenad).
- `Data/data_*.json`, `Data/multilingual.json`: retained classic data; no destructive migration.
- `locales/walk.json`, `locales/ui.json`: UI translations.

Edit question revisions in Tipspromenad, shared runtime here, then run the Android workspace's `tools/sync-offline-assets.ps1`. Android assets are distributable copies, not a second editing source. This website runs without sibling checkouts.

## Privacy and limits

Participant names/answers/results remain in browser storage unless the user shares the result code. No user data is uploaded to the question repository. Optional revision downloads request only public question files. Clearing site data deletes attempts and offline caches. Scores are locally recomputed, but public source answers and unsigned result payloads do not prevent cheating.

See [privacy information](PRIVACY_POLICY.md), [portable format and verification](docs/PORTABLE-WALKS.md), [Source publication notice](LICENSE) and [Android app](https://github.com/Nilsson82/Tipspromenad-app-for-Android). Vendored QR licenses remain in lib/vendor. Legacy facts and translations still need editorial review; physical camera/GPS and cross-browser offline testing remain release checks.

## Current shared quiz features

Android and WebQuiz support quiz creation, manual/random category selection, difficulty filters, four answer alternatives, participant names and portable quiz/result codes. Numerical tie-breakers appear after normal questions and rank equal scores by absolute difference; they do not increase the normal score.

Progress gates are optional. Android requires both elapsed time and distance when both are enabled. Next stays disabled until the gate is satisfied and an answer is selected; readiness does not automatically advance. Attempts and gate progress persist locally. GPS measures foreground movement. WebQuiz ignores distance requirements and retains time requirements, with a visible explanation.

Experimental local sharing uses the **Android phone as the host**. Start hosting from Experimental Wi-Fi sharing, choose a saved quiz, and share the displayed local address and short room code. Participants open that address on the same Wi-Fi/hotspot. The phone serves the quiz database and collects results locally; no computer or cloud participant service is required. Keep the host service running (visible notification). Results that cannot be sent are saved locally and retried while the participant page is open. Network isolation on some Wi-Fi networks can prevent connections. Automatic discovery is not implemented. Physical phone-to-phone Wi-Fi and outdoor GPS still need real-device testing.

There are 17 selectable language codes: en, sv, es, da, no, fi, is, th, zh, ja, ko, de, fr, it, nl, pt, pl. Translation coverage varies: core navigation, six starter questions and two tie-breakers cover all 17; other missing text falls back to English. Classic quizzes retain the original six languages and use English for newly added languages.

Revision 2 contains 78 normal questions and two numerical tie-breakers, including 48 new normal questions. Existing questions remain, including previously deprecated entries. Published revisions must remain immutable. Online clients check the question repository's latest manifest and verified SHA-256; bundled/cached data supports offline use. Portable codes identify the exact revision and question IDs. LAN joining also transfers that revision's bank, so it works without Internet access.

Participant names and answers are stored locally. Experimental LAN sharing explicitly sends them to the organizer's phone on the local network. Public question data and reference answers are not a secure examination/anti-cheating system.
