# Backlog — Bedreliv

Sist oppdatert: 20.08.2026 · v0.08 i prod. Levert så langt: logg med PIN-innlogging
og backend (0.01), strekfigurer og programtekst (0.02), fokus i fullskjerm (0.03),
runder/sveip/tekststørrelse (0.04), utvikling over tid (0.05), versjonslogg (0.06),
Gjengen (0.07), heiarop (0.08). 213 sjekker i sju testsett.

**Venter på Runes avgjørelse:** #1 (repoets synlighet), #4 (samarbeid med venn).
**Klart til å bygges når som helst:** #3 (utkast i localStorage — liten).
**Fast rutine, ikke aktuell ennå:** #5 (månedsrydding av endringsloggen).

Punktene er sortert omtrent synkende etter viktighet. Hvert punkt har en
**I klartekst**-linje som sier hva det er og hvor stort, i vanlig språk.

Disiplin: testsettene ligger utenfor repoet, i arbeidsmappa til økta. De kjøres
mot en lokal etterlikning av Netlify Blobs. Endrer du noe som flytter et tall
eller en tekst en test sjekker, oppdater testen bevisst — ikke stille.

---

## Åpne spørsmål — venter på deg

### 1. Repoet er offentlig, ikke privat

Du valgte **Private** da vi startet, men `runevangen/BedreLiv` står som `public`
på GitHub. Det ble oppdaget rett etter første push og aldri endret.

- Ingen hemmeligheter ligger i koden. `ADMIN_PASSWORD` leses fra miljøvariabel,
  og Netlifys secret-scan har vært ren på hver eneste deploy.
- Men koden er lesbar for alle, og med den hele sikkerhetsmodellen: at PIN er en
  lett sperre, at `userId` sendes i klartekst, at endepunktene ikke krever token.
- **I klartekst:** ingen akutt fare, men det er ikke det du ba om. Fikses på ti
  sekunder: repoets Settings → General → Danger Zone → Change visibility.

### 2. `dev`-konteksten har et annet admin-passord

Miljøvariabelen `ADMIN_PASSWORD` har én verdi for `production`,
`branch-deploy`, `deploy-preview` og `dev-server` — og en helt annen, kortere
for `dev`. Den siste ser ut til å være hentet fra pizzame.

- `dev` brukes bare av `netlify dev` lokalt, så den live siden er upåvirket.
- Verdien vises dessuten i klartekst i API-et selv om variabelen er merket som
  hemmelig — maskeringen gjelder tydeligvis ikke alle kontekster.
- **I klartekst:** tester du Bedreliv lokalt en dag, virker ikke admin-passordet
  du satte. Enten rett den ene verdien, eller slett `dev`-oppføringen så den
  arver fra de andre.

---

## Funksjoner — klare til å bygges

### 3. Utkastet bør overleve at telefonen låser seg

Tallene du fører inn i en økt ligger bare i minnet (`utkast`-objektet). Låser
telefonen seg midt i økta og Safari laster fanen på nytt, er de borte.

- Fiksen er å speile `utkast` til localStorage ved hver endring, og lese det
  tilbake ved oppstart — samme mønster som tekststørrelsen alt bruker.
- Må ryddes ved lagring og ved utlogging, ellers dukker gamle tall opp i neste
  økt eller hos neste bruker på samme telefon.
- **I klartekst:** liten jobb, kanskje tjue linjer pluss tester. Den eneste
  fellen er oppryddingen — glemmer man den, arver neste økt tallene.

### 4. Samarbeide med en venn om appen

Å dele selve Claude Code-økta gir bare en lesevisning, ikke et arbeidsrom.
Reelt samarbeid går gjennom GitHub: vennen legges til som collaborator og
bruker sin egen Claude Code mot samme repo.

For at to personer ikke skal tråkke på hverandre trengs:

- Branch-beskyttelse på `main`, så ingen pusher rett dit
- En kort `CONTRIBUTING.md` med arbeidsflyten: egen branch, PR, review
- Bevissthet om at dere deler **én** Netlify-side og **ett** blob-lager. To som
  pusher til `main` samtidig deployer over hverandre; med PR-flyt får dere
  deploy-previews per branch i stedet
- **I klartekst:** en halvtimes jobb, mest skriving. Det viktigste er ikke
  oppsettet, men å bli enige om at `main` alltid er det som er ute.

---

## Rutiner — ikke aktuelt ennå

### 5. Månedsrydding av endringsloggen

Endringsloggen lastes ved hver appstart, så hele historikken koster noe for hver
bruker hver gang. Pizzame rydder derfor ved månedsskiftet: siste måned står i
full detalj i appen, eldre måneder kondenseres til én samlepost hver, og
detaljene flyttes tapsfritt til `CHANGELOG-ARKIV.md`.

- Bedreliv har åtte poster. Dette er ikke et problem på lenge.
- Filformatet er med vilje identisk med pizzame sitt, så `rydd_changelog.py`
  derfra kan brukes uendret når det blir aktuelt.
- **I klartekst:** ingenting å gjøre nå. Notert så det ikke må gjenoppdages.

---

## Observasjoner uten krav om handling

- **Gjenglista er tom i starten.** En venn med bare én loggført økt vises som
  «For få økter» — det trengs to for å regne en retning. Riktig oppførsel, men
  verdt å vite før du inviterer folk.
- **Ukas løft krever at noen slår seg selv.** Har ingen forbedret seg i samme
  øvelse denne uka, står det «Ingen har slått seg selv denne uka ennå». Det er
  meningen, men det betyr at feltet kan stå tomt i rolige uker.
