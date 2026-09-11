# Gemensamma datakontrakt – designutkast

Status: frågebankens minimala form används av den nya sexspråkiga startbanken i fas 1. Det fullständiga kontraktet och quizsnapshot-formatet här är förberedelser för fas 2–6, inte ett påstående om att GPS, delningskoder, QR eller import redan är implementerade.

`question-bank.schema.json` beskriver en redigerbar frågebank. `quiz-snapshot.schema.json` beskriver en fryst quizinstans som kan återupptas och senare delas. Validerare ska registrera båda schemana lokalt via deras `$id`; URN-referenserna ska inte hämtas över nätverket. Scheman använder JSON Schema draft 2020-12. Kör även semantisk validering enligt reglerna nedan; JSON Schema ensam kontrollerar inte relationer mellan ID:n.

## Språk och identitet

- Kanoniska språk: `en`, `es`, `sv`, `da`, `no`, `fi`. Import och språkval normaliserar `se` → `sv`, `dk` → `da`; alias sparas inte i ny JSON. Androids norska bokmålsresurs kan heta `values-nb`, medan innehållskontraktets norska nyckel är `no`.
- `id` tillhör den logiska frågan. Textändring eller översättning ska inte skapa ett nytt ID. En väsentligt annan fråga eller annan uppsättning svarsalternativ blir en separat frågevariant.
- `translations` får innehålla ett till sex språk. Samma svar-ID måste betyda samma sak i varje språk; position och svarstext är inte identitet.
- UI-språk sparas i appens lokala inställning. Det ingår inte i den delade quizinstansen. `language` i snapshot är frågespråket.
- Saknad UI-översättning får använda engelska. Saknat frågeinnehåll blockerar quizvalet eller kräver ett uttryckligt val. `contentFallback.allowed` är alltid obligatoriskt; `true` kräver ett namngivet språk och ett faktiskt användarval. Blanda inte språk utan en tydlig markering av varje avvikelse. Ny startbank har kompletta översättningar och behöver inte detta undantag.

## Regler utöver JSON Schema

1. Fråge-ID:n och kategori-ID:n är unika inom banken. Svar-ID:n är unika inom varje fråga. Trimma och avvisa text som bara är blanksteg.
2. Alla översättningar av en fråga har exakt samma uppsättning svar-ID:n. `correctAnswerId` måste finnas exakt en gång i varje översättning. Avvikande alternativ mellan äldre språkfiler kräver redaktionellt beslut, inte gissad koppling.
3. Om en kategorikatalog finns ska varje kategori-ID kunna slås upp där. Svårighetsgrad, målgrupp och kategorier använder stabila koder; etiketter översätts i UI/katalog. Tilldela inte svårighetsgrad automatiskt utifrån listnamn.
4. `questionOrder` är en permutation av snapshotens fråge-ID:n, utan bortfall eller dubbletter. `answerOrder` har exakt en post för varje fråga; dess lista är en permutation av frågans svar-ID:n. `1-X-2` används bara när samtliga frågor har tre alternativ; annars väljs exempelvis numeriska etiketter.
5. `supportedLanguages` innehåller bara språk där hela quizet finns: namn, frågor, alternativ och eventuell utslagsfråga. Beräkna detta från innehållet. Håll isär en frågebanks union av tillgängliga språk och ett quiz fullständiga språktäckning. Med tillåten fallback kan det valda `language` saknas i denna fullständighetslista; varje saknad text måste då finnas på den uttryckligen valda fallbacken.
6. Snapshoten innehåller frysta frågor samt konkret fråge- och svarsordning. Samma slumpfrö räcker inte när banken ändras. Uppdatering skapar nytt `snapshotId`; befintliga snapshotar ändras inte. `bankRevision` identifierar den exakta källversionen.
7. GPS-stationsläge kräver giltig position och radie på varje fråga. GPS-gångläge kräver positivt avstånd. Dessa fält beskriver inställningar, inte insamlad positionshistorik.
8. Direkt rättning kräver facit. Kod-/QR-rättning har bara `answerKeyId` i deltagarpaketet. Uteslut även avslöjande förklaringar och källtexter där det behövs, inte bara `correctAnswerId`. Ett separat framtida facitpaket måste ha annan typ (`kind: correction`), matchande `quizId`, exakt `snapshotId`, `answerKeyId` och giltiga svarreferenser. Avvisa fel quiz, fel snapshot och återanvända/tvetydiga payloadformat.
9. Schemaformatkontroll är inte URL-säkerhet. Tillåt endast avsedda HTTP(S)-adresser eller paketerade relativa bilder i läsaren. Förbjud skript-/fil-URL:er och behandla innehåll som text. Misslyckad bildladdning visar en lokal platshållare eller döljer bilden utan att förlora frågan. Kontrollera bildlicens och tillgänglighet separat.
10. Dubblettdetektion är en granskningssignal. Jämför normaliserad text, alternativ och facit per språk; slå inte automatiskt samman fysiska svarsblanketter med etiketter som ”Fråga 1”. Strukturell validering är inte faktagranskning.

## Migrering utan dataförlust

De befintliga `Data/data_en.json`, `data_es.json`, `data_sv.json` och `src/data.js` behålls. Fas 1 läser dem genom respektive adapter. Startbanken läggs till som ett separat innehållspaket; den ersätter inte de gamla listorna.

Föreslagen migrering i fas 2:

1. Frys en källrevision och beräkna SHA-256 för varje fil. Skapa en versionshanterad migreringsmanifestfil med bestående mappning från `(repo, fil, listIndex, questionIndex)` vid denna revision till tilldelade fråge- och quiz-ID:n. Index är endast adress i den frysta originalfilen. Efter tilldelning återanvänds ID:n från manifestet; de räknas inte om när text eller ordning ändras.
2. Bevara listordning, frågeordning, svarordning, visningsriktning och originaltext. Spara `legacyOrigin` för spårbarhet. Låt befintliga tre-/fyralternativsfrågor vara det antal de är.
3. Tilldela initialt exempelvis `q-000001` med svar `a1`, `a2`, … i originalordning. Språket anges i `translations` och källans proveniens, inte i frågans logiska ID. En granskad mappning kopplar senare samma logiska fråga på andra språk till detta permanenta ID och samma semantiska svar-ID:n. Spanska filens första två listor ligger i motsatt ordning mot svenska/engelska; matcha aldrig språk med enbart arrayindex.
4. Legacy `correctAnswer` är **en sträng med korrekt svarstext, inte ett index**. Matcha exakt mot `answers`; konvertera bara när det finns exakt en träff. Noll eller flera träffar ska ge ett granskningsfel, inte välja första svaret.
5. `src/data.js` exporterar 12 svenska objekt i JavaScript. Gör ett separat kontrollerat exportsteg till JSON eller läs dess kända struktur med en parser; kör aldrig godtycklig importerad JavaScript med `eval`. Everestfrågan har fyra alternativ där den andra webbanken har tre; registrera den som egen variant tills någon väljer en gemensam svaruppsättning. De två exemplen i `src/script.js` är ytterligare en separat källa, inte automatiskt produktionsdata.
6. `questionKnockout.question` → `tieBreaker.translations[lang]`, numeriskt `result` → facitets `correctAnswer`. De äldre vuxen-/barnblanketterna har ett resultat men ingen utslagsfrågetext. Behåll rådatat; markera posten ofullständig och låt organisatören komplettera den före export som ett komplett frågequiz. Förvandla inte texten ”Fråga 1” till en påhittad kunskapsfråga.
7. Jämför migreringens antal, ordning, texter och facit mot källan automatiskt. Exportera till ny sökväg, aldrig över originalen. Kör schema- och semantikvalidering samt jämförelsetester innan ny läsare får använda resultatet. Behåll legacy-adaptern under övergången.

Kort delningskod kräver en bestående uppslagning från kod till snapshot. En statisk JSON-fil per arrangerat quiz eller valfri liten lagring kan lösa detta; en kod kan inte ensam bära godtyckligt många frågor. Börja med exportfil eller länk till fryst snapshot. Ett facit som redan finns i klienten kan inte hållas hemligt av att endast gömma resultatskärmen. Besluta separat om önskad nivå av facitskydd innan kod-/QR-rättning implementeras.

## Verifiering

`question-bank.example.json` och `quiz-snapshot.example.json` är små kontraktsexempel med varierande antal alternativ och ofullständig språktäckning. Sexspråkigt faktiskt innehåll finns separat i `tools/assets/starter-multilingual.json` och kopiorna som medföljer webbprojekten. Schemat är avsiktligt större än fas 1-adaptern; en godkänd schemafil innebär inte att alla valfria funktioner fungerar i apparna ännu.
