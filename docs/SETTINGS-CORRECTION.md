# Settings and correction update — 2026-09-11

Both web projects have a three-dot menu beside the title at the top right. Settings opens a dialog with app language, question language and correction method. Android uses its native top-right Settings menu and hides the duplicate web toolbar. The controls no longer appear before the quiz.

Choose **After finishing**, **Correction code** or **Correction QR**. In code/QR mode, finishing freezes the answers and hides the score, answer markings and explanations until the matching code or QR is supplied. QR mode also accepts the typed code. Changing correction method resets the current attempt; the web UI asks before discarding progress.

The organizer selects the quiz and question language, then opens **Settings → Organizer: code / QR** to display its code and QR. Participants must select the same question content, language and correction method. In Android, apply changed settings before reopening the organizer display. The organizer button uses the currently loaded quiz.

Codes are deterministic and tied to the quiz content, answer order, answer key and question language. They are not session-specific secrets. There is no organizer login or server authorization: anyone can open the organizer display, and the static question files contain the answers. This feature controls when results are displayed; it does not prevent cheating. Session management, secret organizer credentials, printing and GPS remain future work.

QR generation and decoding use bundled qrcode-generator 2.0.4 (MIT) and jsQR 1.4.0 (Apache-2.0); attribution is under `lib/vendor/` (or `public/lib/vendor/`). Camera scanning requires HTTPS or localhost and camera permission. Android grants video access only to the configured quiz host/path. Closing the scanner or leaving the page stops capture. Camera failure leaves typed-code entry available.

## Verification

- Android `assembleDebug testDebugUnitTest assembleDebugAndroidTest`: successful. Device tests and actual camera permission/scanning on a phone have not been run.
- Both web Node suites: 15 tests passed, including wrong-quiz/language rejection and generated QR-to-decoder round trip.
- Secondary web production webpack build: successful.
- Local browser: top-right menu and Settings dialog, organizer code/QR, locked results, invalid code rejection and matching-code reveal verified. Physical camera capture has not been tested.

Upload the updated QuizWebPage files to its existing GitHub Pages repository and install the updated Android APK to use both halves. The secondary project deploys its rebuilt `dist/`. No push or deployment was performed.
