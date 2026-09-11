# Tipspromenad – arkitektur, granskning och stegvis plan

Granskningen gäller de tre befintliga projekten och deras lokala källkod. De bevaras som separata projekt. Webbrepositorierna ligger i `related-projects/TipspromenadQuizWebPage` och `related-projects/Tipspromenad` så att de kan granskas och laddas upp var för sig. Detta dokument skiljer det granskade utgångsläget från fas 1-leveransen och senare planer.

## De tre befintliga projekten

| Projekt | Utgångsläge och ansvar | Viktiga filer |
| --- | --- | --- |
| Android-appen | En Kotlin-modul, XML-layouter, View Binding, AppCompat och Navigation. Appen är i huvudsak ett skal runt det befintliga webbquizet. | `app/build.gradle.kts`, `app/src/main/java/com/nilsson/tipspromenad/`, `app/src/main/res/`, `gradle/libs.versions.toml` |
| TipspromenadQuizWebPage | Statisk HTML/CSS/JavaScript utan byggkrav. Läser språkvisa JSON-filer, visar flera frågelistor, alla frågor samtidigt, direkt rättning och numerisk utslagsfråga. Det är denna webbplats som Android öppnar. | `index.html`, `script.js`, `styles.css`, `Data/data_{en,es,sv}.json` |
| Tipspromenad | Ett separat JavaScript-/webpackprojekt. `src/index.js` importerar svenska frågor från `src/data.js`, skapar formulär och räknar poäng. React finns bland beroendena men renderingen använder vanlig DOM, inte React-komponenter. | `package.json`, `src/index.js`, `src/data.js`, `src/server.js`, `src/webpack.config.js`, `public/index.html` |

Androids `MainActivity` sätter toolbar och navigationsvärd. `FirstFragment` visar WebView med JavaScript och DOM-lagring aktiverade. `SecondFragment` visar app- och utvecklarinformation. `nav_graph.xml` kopplar de två fragmenten. Manifestet har Internet-behörighet; utgångsläget har ingen platsbehörighet, QR-läsare eller lokal frågedatabas. `minSdk` är 32, `compileSdk` och `targetSdk` 36. Appens versionskatalog använder Android Gradle Plugin 8.13.2 och Kotlin 2.0.21. Byggversionerna här är observationer av projektet, inte rekommendationer att uppgradera.

Utgångslägets dataflöde är: Android → GitHub Pages-webbplats → `raw.githubusercontent.com` för språkfil → lokala svar i DOM → rättning mot JSON-facit. Det andra webbprojektet har i stället en egen inbakad svensk frågelista. Ingen av dessa vägar har en gemensam, versionslåst quizinstans som kan återupptas eller delas.

## Vad som bevaras

- Android-projektet, paketnamnet `com.nilsson.tipspromenad`, fragmentnavigationen, informationssidan och WebView-integrationen.
- Båda webbprojekten, deras egna startpunkter och separata publiceringsmöjligheter. Ingen ny stor frontend eller backend införs för språkstöd.
- Befintliga svenska, engelska och spanska JSON-filer, befintlig `src/data.js` och deras svarstexter och ordning.
- Klassiskt läge med alla frågor, listval där det finns, direkt rättning, valfritt antal svar och utslagsfrågor där texten finns.
- Vuxen-/barnlistor som fungerar som digitala svarsblanketter för redan utskrivna frågor. ”Fråga 1” är inte automatiskt en trasig kunskapsfråga.

## Fynd i källkoden före fas 1

| Område | Konkret fynd | Följd och åtgärd |
| --- | --- | --- |
| Webbspråk | Webbplatsen byggde `data_<webbläsarspråk>.json` direkt, trots att bara en/es/sv fanns. | Danska, norska och finska kunde få hämtningsfel. Inför explicit språkval, normalisering och kontrollerat fel-/tomtillstånd. |
| Hämtningsfel | `fetchQuizData` fångade felet men returnerade inget; `initQuiz` använde därefter `listQuizdata[0]`. | Ett nätfel kunde orsaka ytterligare undantag. Stoppa initialisering vid fel och erbjud ett begripligt nytt försök. |
| Språkkoppling | Samma webbläsarspråk bestämde UI och frågedata. Android hade huvudsakligen en resursuppsättning. | Lägg till två separata språkval och en central översättningsmekanism. |
| Första listan | Första `displayQuiz()` saknade argumenten för listans svarsetiketter och visningsriktning. | Den första visningen kunde skilja sig från samma lista efter manuellt val. Använd aktuell listkonfiguration konsekvent. |
| Mallfunktion | Androids FAB visade ”Replace with your own action”; inställningsvalet gjorde inget. | Ersätt med användbara språk-/inställningshandlingar. |
| WebView-livscykel | `FirstFragment` laddade startsidan på nytt varje gång vyn skapades, utan sparat WebView-tillstånd eller frågesnapshot. | Risk för tappade svar vid återöppning/rotation. Begränsad WebView-återställning kan förbättras nu; full återupptagning kräver fas 3. |
| Svarsrendering | Frågor och svar sattes in som `innerHTML`. | Importerat innehåll måste behandlas som text, med kontrollerade bild-URL:er. Förbered säker renderingsväg innan fri JSON-import. |
| Rättning/tillgänglighet | Resultat markerades till stor del med färg; modalstängningen var en klickbar span och utslagsfält saknade tydlig etikett. | Komplettera med textstatus, riktiga knappar, etiketter, fokus och tangentbord. |
| Byggning i Tipspromenad | Webpackkonfigurationen låg i `src/`, men npm-kommandot pekade inte ut den. Konfigurationens mål var `src/public`, medan servern serverade `public/`. | Gör in-/utdatavägar och npm-kommandon överensstämmande. |
| Utvecklingsserver | `src/server.js` krävde `express`, men paketet saknades bland deklarerade beroenden. | Använd fungerande befintlig verktygskedja eller en enkel statisk server; ingen server behövs för själva quizlogiken. |
| Tester/dokumentation | `npm test` var `package.json`. README beskrev start-/nästaflöde som koden inte hade. Webb-README kallade `correctAnswer` ett index. | Lägg till verkliga tester och beskriv faktisk körning. Facitfältet är en svarstext i alla granskade äldre filer. |

Dessa är fynd från det inspekterade utgångsläget. De ska inte läsas som att samtliga fel finns kvar efter leveransen; genomförda ändringar och verifieringsresultat redovisas i respektive README och slutrapport.

## Frågedata och redaktionell skuld

| Källa | Listor | Frågeposter | 3 alternativ | 4 alternativ | Bildreferenser |
| --- | ---: | ---: | ---: | ---: | ---: |
| `Data/data_en.json` | 4 | 48 | 25 | 23 | 6 |
| `Data/data_es.json` | 4 | 48 | 25 | 23 | 6 |
| `Data/data_sv.json` | 4 | 48 | 25 | 23 | 6 |
| `Tipspromenad/src/data.js` | 1 export | 12 | 0 | 12 | 0 |

De tre JSON-filerna innehåller 144 frågeposter; detta är inte 144 unika logiska frågor. Varje språk har två listor med faktisk frågetext och två tolvradiga 1-X-2-svarsblanketter. De 12 återkommande texterna per språk är blankettetiketterna. Båda blanketterna har utslagsvärdet 42 utan utslagsfrågetext. Detta bör beskrivas som en mall eller kompletteras av organisatören, inte raderas.

Samtliga 144 JSON-poster har ett `correctAnswer` som finns bland alternativen. Detta är bara strukturell kontroll. De saknar permanenta fråge-ID:n, kategori-/svårighetsmetadata, förklaringar, källor och verifieringsdatum. Bildreferenser räknades, men alla externa bilder har inte kontrollerats för tillgänglighet eller rättigheter.

Spanska filen har Venezuela före världsfrågorna; engelska och svenska har omvänd ordning. Världsfrågorna återkommer också i `src/data.js`, med delvis annan svarsordning och annat antal alternativ. `src/script.js` innehåller ytterligare två hårdkodade exempelfrågor och en andra formulärimplementation. Dessa källor ska kartläggas före deduplicering.

Prioriterade kandidater för redaktionell granskning är frågan om största befolkning utan årtal, ”världens största öken” utan definition av ökentyp, ”världens längsta flod” utan mätdefinition och utslagsfrågan om Venezuelas bergstopp där texten efterfrågar en topp men facit är ett tal. En svensk formulering som ”Vilken är den högsta berget” behöver språkgranskning. Bildfilnamnet med en finsk danssportorganisation vid en venezuelansk dansfråga bör kontrolleras. Dessa markeras för granskning; denna leverans påstår inte att hela korpusen har faktakontrollerats eller att alla översättningar har granskats av modersmålstalare.

## Målaritektur inom befintliga projekt

Android behåller Activity/Fragment och XML. UI-texter ligger i `values*` och språkinställningar separerar UI från innehåll. WebView är fortsatt produktionsväg i fas 1. Om native-spellägen införs senare bör `QuestionRepository` hantera JSON/validering, en separat quizmotor hantera ordning/poäng, ett `QuizViewModel` hantera skärmtillstånd och `QuizStateStore` lagra fryst quiz + svar. `LocationProgressTracker` och `QuizLinkCodec` tillkommer först i de faser som behöver dem. Lägg inte GPS, rättning, datalagring och QR i `FirstFragment`.

Webbprojekten behåller HTML/CSS/vanlig JavaScript. `locales/ui.json` och `lib/i18n.js` centraliserar UI-översättning med stabila nycklar. `lib/quiz-core.js` läser både legacydata och den nya bankformen och kan testas utan DOM. `lib/quiz-ui.js` hanterar renderingen, två språkval och lokal lagring av aktuella svar med ett datafingeravtryck som förhindrar återställning mot ändrade frågor. Detta ger begränsad lokal återställning i fas 1; den gemensamma, delbara och varaktiga quizsnapshoten hör till fas 3.

Den nya `Data/multilingual.json` innehåller sex frågor på alla sex språken; detta ger faktiskt frågeinnehåll på danska, norska och finska samtidigt som äldre en/es/sv-listor finns kvar. Det är inte en översättning av hela äldre korpusen. QuizWebPage är den kanoniska källan för gemensam runtime, språkordbok och webbassets. `tools/sync-web-assets.ps1` kopierar dem till Tipspromenads `public/` och kontrollerar matchande SHA-256 med `-Check`, så fristående projekt kan laddas upp utan osynliga beroenden på syskonmappar. Logiken ska ändras i källan och sedan synkas, inte underhållas som två oberoende kopior.

Det gemensamma kontraktet beskrivs i [contracts/README.md](contracts/README.md), med JSON Schema och exempel. JSON förblir maskinläsbar källa. Permanenta fråge-ID:n och semantiska svar-ID:n håller ihop översättningarna; en senare quizsnapshot fryser innehåll, ordning, språk och inställningar. UI-språk är lokalt och behöver därför inte vara identiskt mellan deltagare.

För sex tecken långa quizkoder krävs ett uppslag till lagrat innehåll. Börja med statiska snapshot-filer/JSON-export och länkar, och fatta ett separat beslut om kortkodsregistrering. En kod ersätter inte lagring. Skilj quizlänk från facitpayload redan i kontraktet och lås dem till exakt snapshot. Gömda facitfält i en redan nedladdad klient ger inte sekretess.

Offline i senare faser betyder paketerade frågor/bilder, lokalt tillstånd och lokal positionsbehandling. En WebView-cache ensam ska inte beskrivas som ett garanterat offlinepaket. GPS använder foreground-behörighet när spelet behöver den, filtrerar dålig noggrannhet och orimliga hopp, och sparar som standard endast den progress som behövs för att återuppta quizet. Offline- och GPS-beteende behöver riktiga enhetstester ute i rörelse.

## Prioriterad leveransplan

| Fas | Status i denna leverans | Omfattning och acceptanskrav |
| --- | --- | --- |
| 1 | Implementerad; byggen och automatiska tester godkända | Granska tre projekt, dokumentera, sex UI-språk, separata språkval, alias se/dk, explicit innehållsfallback, kompletterande sexspråkigt startquiz och riktade stabilitets-/byggfixar. Gamla data ska finnas kvar. |
| 2 | Kontrakt designat; full migrering planerad | Schema, bestående ID-manifest, bevarad ordning, granskade översättningskopplingar, kategorier, svårighet och importvalidering. Jämförelsetester mot legacy. |
| 3 | Planerad | Förbättrat quizval, filtrerad slumpning, sequential, fryst lokal quizstate och återupptagning. Testa rotation, processdöd och saknade översättningar. |
| 4 | Planerad | Offline GPS Walk, noggrannhetsfilter, nekad behörighet/avstängd GPS, avbrott och frivillig manuell hoppning enligt quizinställning. Testa syntetiska positionsserier och faktisk promenad. |
| 5 | Planerad | Export/länk/quiz-QR för identisk snapshot. Kortkod först efter beslut om bestående uppslag. Validera typ, version, storlek och identitet. |
| 6 | Direkt rättning bevaras; kod/QR planerat | Separat facitpaket och rättningskod/QR kopplade till exakt quizsnapshot. Testa fel quiz och läckande facitmetadata. |
| 7 | Planerad | Organisatörsläge, skapande, filtrering, import/export, utskrift och separat facitblad; därefter PWA/offlinepaket. |
| 8 | Planerad | GPS Station, kartor och eventuella lag/resultattavlor efter stabil kärna. Synkronisering och konton hålls valfria. |

Varje fas byggs och testas innan nästa aktiveras. Det finns ingen avsikt att genomföra GPS, QR, backend och arrangörsverktyg i samma stora ändring som språkstödet.

## Filplan

Fas 1 ändrar Androids `MainActivity.kt`, `FirstFragment.kt`, relevanta layouter/menyer, `strings.xml` och manifestkonfiguration för appens språk. Nya Androidresurser och en inställningshjälpare tillkommer utan kopierade layouter per språk.

I QuizWebPage ändras `index.html`, `script.js`, `styles.css` och `README.md`. Nya filer omfattar `lib/{quiz-core,i18n,quiz-ui}.js`, `locales/ui.json`, `Data/multilingual.json`, `tests/core.test.cjs`, `tools/serve.cjs` och `package.json`. I Tipspromenad ändras `src/index.js`, `src/webpack.config.js`, `public/index.html`, npm-/byggkonfiguration och README; de gemensamma webbdelarna medföljer under `public/`. Hanteringen av äldre `src/data.js` kan flyttas till en separat JSON-fil med kompatibel återexport, men originalfrågornas innehåll, ordning och facit ska behållas. Båda projekten fortsätter vara självständigt körbara.

Denna dokumentationsdel tillför `docs/ARCHITECTURE.md`, `docs/contracts/question-bank.schema.json`, `docs/contracts/quiz-snapshot.schema.json`, kontraktsexempel och migreringsanvisningar. `tools/assets/starter-multilingual.json` bevarar den ursprungligt författade startbanken; den kanoniska redigeringskällan efter integration är QuizWebPages `Data/multilingual.json`. Full migreringsmanifestfil, native quizrepository, varaktig quizstate, GPS-/QR-moduler, service worker och arrangörsvyer tillhör senare faser och ska inte räknas som färdiga filer nu.
