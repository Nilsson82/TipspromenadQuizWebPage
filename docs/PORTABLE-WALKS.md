# Portable quiz walks

Updated 2026-09-20. This supersedes the earlier phase-1 architecture roadmap where they differ. The supplied work packages are planning inputs; the user's no-backend decision overrides optional server lookup examples.

## Repository roles and use

Android bundles the shared quiz engine and question bank under `app/src/main/assets/quiz`, served by AndroidX WebViewAssetLoader at a restricted local HTTPS origin. It creates and plays quizzes, shares portable codes, imports results and keeps local leaderboards. QuizWebPage is participant-focused: Random Quiz, Join Friend Quiz and Classic Quizzes. Creation/collection are visible only on the bundled Android origin, not enabled by a URL parameter. This is product presentation, not authentication.

Tipspromenad now contains canonical data and validation tooling, not an application. The former webpack application was preserved in the Android workspace under `legacy-projects/Tipspromenad-web` before removal from the data repository. Git history is retained. The existing classic quizzes remain playable in QuizWebPage and the APK.

1. Create quiz: select language, 1–25 questions, 2/3/4 visible answers, display/walking/result settings, categories and subcategories. Select randomly or manually choose exactly the requested number. The picker shows four source options and marks the correct answer.
2. Create saves ordered IDs, exact database revision, seed, settings and name. My quizzes reopens saved quizzes. Organizer sections: Share quiz, Import result and Results.
3. Share the QR or complete `TIPQ1.` portable code. The participant link carries the quiz in its URL fragment. There is no participant name in the reusable quiz code. Generic camera apps may show raw code text; use Join → Scan in the app/website, or share the participant link.
4. Participants import, enter their name, answer all questions, and finish. Resume restores the current attempt or finished answer sheet. The stable `TIPR1.` result contains their name and original source-answer indexes.
5. Organizer imports result QR/code. The engine rejects wrong quiz/definition, invalid answers, corrupt codes and duplicate result IDs, then recalculates scores. The leaderboard refreshes after import and uses competition ranking (1, 1, 3 for tied leaders).

There is **no short lookup code** yet. The longer code is the QR payload itself and works without a server. Android-hosted Wi-Fi/hotspot short-code lookup is deferred as requested. Checksums detect damage, not cheating: the public answer bank and client-side result format are not cryptographic proof of a participant's answers.

## Canonical bank and compatibility

Schema v2, immutable revision 1, 24-bit numeric IDs. Thirty questions: 24 legacy questions in en/sv/es plus six starter questions in en/sv/es/da/no/fi. Every translation has exactly four distinct source options. The ID registry records source mapping and added fourth distractors. IDs 1–24 map actual legacy question lists across the differing language list orders; IDs 25–30 map starter string IDs.

Five ambiguous/outdated questions (IDs 3, 5, 8, 18, 22) are deprecated for new quizzes, leaving **25 selectable in en/sv/es and six in da/no/fi**. Legacy templates are preserved in classic mode. These counts do not imply editorial verification; facts and translations still need review.

Never overwrite a published revision or reuse IDs. A SHA-256 lock detects accidental revision-1 edits. Word edits keep IDs but require a new revision. Import requires the exact revision and all referenced IDs/translations. Another revision is loaded from local cache or downloaded from the explicit canonical `main/database/revision-N.json` path and validated. Failure/offline gives a clear error without question substitution. No participant information accompanies downloads.

## Binary wire format v1

Case-sensitive text wrappers: `TIPQ1.` and `TIPR1.`, followed by unpadded Base64URL. Integers are unsigned big-endian. Inputs are limited to 512 characters. UTF-8 is decoded strictly. Names are nonblank, contain no ASCII controls and use at most 32 bytes. Unknown settings and trailing payload bytes are rejected. CRC32 uses IEEE polynomial 0xEDB88320, initial/final XOR 0xFFFFFFFF, covering every preceding byte. It is not a signature.

### Quiz bytes

| Field | Bytes |
| --- | ---: |
| Version = 1 | 1 |
| Database revision | 4 |
| Random quiz ID | 8 |
| Seed | 4 |
| Settings | 2 |
| Walking interval | 2 |
| Creation Unix seconds | 4 |
| Question count | 1 |
| Ordered unique question IDs | 3 × count |
| Quiz-name length | 1 |
| Quiz name | 1–32 |
| CRC32 | 4 |

Settings bits: 0–2 language index `[en,sv,es,da,no,fi]`; 3–4 answerCount−2; 5 one-at-a-time; 6–7 walking `[none,time,distance]`; 8 organizer-collect (zero instant); 9–15 reserved zero. Interval: zero for none, 180–1800 seconds for time, 100–10000 metres for distance. Walking requires one-at-a-time. Maximum 25-question payload with 32-byte name: **138 bytes**, or 184 Base64URL characters plus prefix.

### Deterministic options

Use unsigned xorshift32 with shifts 13 left, 17 unsigned right, 5 left. Initial state `(seed XOR imul(questionId+1, 0x9e3779b1)) >>> 0`; replace zero with 0x6d2b79f5. Each draw is `(state >>> 0) / 4294967296`. Fisher–Yates visits i descending, j = floor(random × (i+1)). Shuffle ascending incorrect source indexes, take answerCount−1, prepend correct index, then shuffle with the continued generator. Android and web execute this same source file.

### Result bytes

Version (1), quiz ID (8), result ID (8), quiz fingerprint (4), name length (1), UTF-8 name (1–32), answer count (1), packed answers (ceil(count/4)), CRC32 (4). Fingerprint is CRC32 over UTF-8 of the complete canonical encoded quiz code. Answers use original source indexes 0–3, two bits each, most-significant pair first; unused bits are zero. Unanswered values are forbidden. There is no submitted score. A full 25-question result with 32-byte name occupies 66 bytes before text encoding.

## Persistence, permissions and walking

IndexedDB stores device-local settings, quizzes, current attempt and results. Success is shown only after writes complete. App uninstallation/storage clearing removes records. Android cloud and device-transfer backups are excluded. Old remote WebView storage is not migrated to the new local origin, so earlier classic answers may not appear in the new app.

The website caches its shell and bundled bank through a service worker after a successful online visit. Load it online before an offline walk; browser cache/private-mode policies can vary. Classic external images may need a connection. Camera starts only on Scan and stops on close/background. GPS starts only for distance walking.

Time mode stores an absolute deadline, surviving background time and page recreation. GPS counts only with the quiz visible: accuracy must be <=30 m, speed <4 m/s and sample gaps <=30 s. Small steps accumulate against a retained baseline; jitter and jumps are excluded. Backgrounding stops location observation; press Next on return to resume. No background travel is inferred and no route is saved. This is foreground walking, not background tracking.

## Verification and release limits

Node tests cover classic behavior, canonical data, 2/3/4 answers, deterministic ordering, compact round-trips, QR decoding, missing/revision failures, Unicode names, corrupt/wrong/duplicate results, scoring/ties, timer and GPS filtering. Android build, JVM tests and lint pass. Three tests pass on Pixel 9 / Android 15 emulator, including the actual bundled create → join → answer → result → import UI. Test-created records are removed and prior drafts/settings restored. Screenshots are from that emulator, not mockups.

Still needed before production: physical phone-to-phone QR, permission-denial tests, outdoor GPS, cross-browser/offline web QA, editorial/native-language review, third-party question-content provenance review, production signing, store metadata and published privacy URL. The delivered APK is a debug build. No push, deployment or store release occurred.

WP6 Wi-Fi lookup is deferred by user decision. WP23 production release is pending. The implemented offline milestone covers the data/format/creation/sharing/result flow and foreground walking within the existing WebView architecture; it does not claim all release acceptance criteria in the planning documents are complete.

## Menu and creation update

Random Quiz starts with defaults or the last saved settings. Configuration is available through the top-right Settings menu. Android creation uses four steps: name, categories, selection, and review. The website remains participant-only. Project licensing follows the Nightfall Run source publication notice; third-party notices remain intact.

Random quizzes skip participant names and show correction in the original question layout after Finish: correct answers are highlighted, wrong selections are red, and the finish button becomes a score line. Completed correction persists when resuming. Shared quizzes prefill the last participant name stored locally and display it above the questions.
