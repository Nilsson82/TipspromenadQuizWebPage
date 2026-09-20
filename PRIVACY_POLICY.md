# Tipspromenad privacy information

Updated 2026-09-20 for the portable offline quiz build.

The app has no accounts, analytics, advertising SDKs or participant-record backend. Names, quiz answers, saved quizzes and leaderboards stay on the device. They are shared when you show or send a QR or portable code. A **result** code contains the participant name and answers; share it only with the intended organizer. A reusable quiz code contains no participant name.

Camera access is requested on scanning. Frames are decoded locally, not uploaded or saved. Capture stops when scanning closes or the app leaves the foreground. Precise location is requested only for distance walking. Coordinates are processed locally while the quiz is visible; only accumulated distance is saved. No route or location history is retained or transmitted. Other modes do not need location.

The APK bundles its starting question bank. Importing an unavailable database revision can download public data from GitHub. Ordinary connection information such as IP address is visible to GitHub, but participant names and answers are not sent. Classic images and About links can contact external hosts, whose privacy practices apply.

Android cloud and device-transfer backups of app data are excluded. Uninstalling or clearing storage removes local records. Browser users can clear the site's data to remove records/caches. Keep desired portable quiz/result codes before clearing data. Codes or screenshots shared outside the app remain under the control of you and their recipients.

The repository owner should review this document and publish its final URL before store release. Contact through the [Android project](https://github.com/Nilsson82/Tipspromenad-app-for-Android).
