# Verifiering av fas 1

Utfört 2026-09-11 i Windows, med JDK 21 för Android.

| Kontroll | Resultat |
| --- | --- |
| `gradlew build assembleDebugAndroidTest` | BUILD SUCCESSFUL; debug och osignerad release skapade |
| Android JVM-tester | 8 per variant, 0 fel (5 språk, 2 resurser, 1 befintligt exempel) |
| Android instrumentering | Test-APK kompilerad; inte körd på enhet/emulator |
| Android lint | 0 fel, 21 varningar; även en varning om deprecated resursfilter i byggkonfigurationen |
| Webb, Node-testsviter | 12 tester, 0 fel |
| Tipspromenad webpack | Produktionsbygge godkänt med befintlig låsfil |
| Schemaexempel + sexspråkig bank | Godkända mot JSON Schema 2020-12 via Ajv |
| Lokal statisk startsida | HTTP 200 från förhandsvisningsadressen |

Interaktiv webbläsartestning och Android UI-/enhetstester har inte körts. HTTP-kontroll ersätter inte sådan provning. GPS, QR och garanterat offlinebruk är inte implementerade eller testade.

Originalfilerna en/es/sv bevaras. Tester verifierar facitreferenser och att läsaren inte ändrar data/ordning. Tolv svenska frågor i andra projektet har flyttats till JSON med kompatibel JavaScript-export. Hela originalbanken är inte översatt eller faktagranskad. Den nya banken har sex frågor på sex språk. Äldre bildreferenser är inte fullständigt kontrollerade.

Webbverktygens befintliga npm-låsfil har 38 rapporterade auditfynd: 6 låga, 11 måttliga, 18 höga, 3 kritiska. Installation och bygge fungerar; beroendeuppdatering är separat arbete. Ingen `audit fix --force` har körts.

Androids språkurval använder AppCompat och Androids resursmatchning. Appspråk/frågespråk sparas separat. Frågespråksfunktionen kräver att nya webbversionen publiceras. Androids URL-parametrar har företräde framför webbsidans sparade språkpreferens vid ny laddning.

Implementationsreferenser: [App languages](https://developer.android.com/guide/topics/resources/app-languages), [WebView](https://developer.android.com/reference/android/webkit/WebView). Frågekällor finns i webbprojektens `QUESTION_SOURCES.md`.
