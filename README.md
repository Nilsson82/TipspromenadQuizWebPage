# Tipspromenad Quiz Web Page

Incremental update of `Nilsson82/TipspromenadQuizWebPage`. The existing classic quiz, list selection, answer layouts, direct scoring, images and optional numerical tie-breaker remain. No framework, backend or account is required.

## Languages

Choose UI and question languages independently: English, Swedish, Spanish, Danish, Norwegian Bokmål and Finnish. Codes: `en`, `sv`, `es`, `da`, `no`, `fi`. Aliases `se`/`dk` and Norwegian `nb`/`nn` are accepted. UI falls back to English; question content never switches language silently.

Original `Data/data_en.json`, `data_es.json`, `data_sv.json` remain unchanged (four lists each). New `Data/multilingual.json` has **six questions in all six languages**. It is not a translation of the entire original bank. Old data needs editorial review; new translations have not had native-editor review.

Use `?ui=sv&quizLang=fi` for Swedish UI and Finnish questions. Android uses these parameters, which override browser preferences. Without parameters, UI follows saved preference/browser language; questions start in English or the previously selected language. Answers, selected list, tie-breaker and results are saved locally against a data fingerprint. Clearing browser data removes progress; storage may be unavailable in private browsing.

## Run and test

Node.js 18 or later; no dependencies to install:

```sh
node tools/serve.cjs
node --test tests/core.test.cjs
```

Open `http://127.0.0.1:8085`. Serve over HTTP; opening `index.html` directly as `file://` cannot reliably fetch JSON. `npm start` / `npm test` are equivalent shortcuts. No production compilation is needed.

## Upload to GitHub Pages

Upload/commit this project's files to the existing `Nilsson82/TipspromenadQuizWebPage` repository. Keep `index.html`, `script.js`, `styles.css`, `lib/`, `locales/` and `Data/` together. Publish the repository root with its existing Pages configuration. Nothing has been pushed or published.

In the local Git copy, review `git status` / `git diff` before committing. ZIP delivery excludes `.git` and caches; extract the contents into the existing repository, not into a nested project directory. Verify the published `?ui=sv&quizLang=fi` page before distributing the Android APK.

## Structure and shared source

- `script.js`: entry point and collection loading.
- `lib/quiz-core.js`: normalization, validation, projection and scoring.
- `lib/i18n.js`, `locales/ui.json`: centralized UI translations/preferences.
- `lib/quiz-ui.js`: classic quiz rendering, language controls, saved answers/results.
- `Data/data_*.json`: original collections; legacy `correctAnswer` is an exact answer **string**, not an index.
- `Data/multilingual.json`: stable question/answer IDs, translations and explanations.
- `docs/`: architecture, schema design, migration plan and verification.

This repository is canonical for shared runtime/dictionary/starter data distributed to the separate Tipspromenad project. The Android workspace's `tools/sync-web-assets.ps1` copies them into that project's `public/`; `-Check` compares SHA-256. Neither deployed project needs its sibling's filesystem. `tools/assets/` in Android retains initial authored assets as provenance, not a second editing source.

## Scope

Phase 1 plus schema design. GPS, QR/correction codes, organizers, filters, printing and PWA/offline packs remain planned. Local answer saving is not guaranteed offline support: page/data loading and external images need a network. Missing images are handled gracefully; correct/incorrect answers have text labels as well as colour.

The original README described this project as MIT licensed; retain upstream licensing when distributing its content.
