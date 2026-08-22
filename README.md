# Bedreliv — Styrkelogg

Loggbok for 10-minutters manualprogrammet. Fem øvelser, vekt og reps per økt,
og en sammenlikning mot forrige gang så du ser om du gikk opp eller ned.

Brukerinnlogging med navn og firesifret PIN. Hver logg er privat — du ser bare
dine egne økter. Kjører på Netlify Functions + Netlify Blobs, så det er ingen
database å drifte.

## Struktur

```
index.html                    grensesnittet — skjema, logg, fokus, gjengen
beregning.js                  regnestykkene, rene funksjoner uten DOM
changelog.js                  endringsloggen (ren data, nyeste først)
BACKLOG.md                    åpne punkter og avgjørelser som venter
figurer.js                    strekfigurer for øvelsene (SVG, ingen bildefiler)
app-api.js                    klient mot backenden
netlify/functions/users.js    registrering, innlogging, admin
netlify/functions/okter.js    lagring av økter, én blob per økt
```

Hver øvelse viser to strekfigurer — start og slutt. Utførelsen og den
vanligste feilen ligger bak «Vis utførelse», så loggeskjermen er kort å
scrolle mens du trener. Teksten følger styrkeprogrammet: 3 runder, minimal
pause mellom øvelsene, 60 sekunder mellom rundene.

Øvelseskortene står sammenslått til én linje hver, og ett er åpent om
gangen: åpner du et nytt, lukkes det forrige. Fem åpne kort er 1660 piksler
å bla gjennom; ett åpent og fire sammenslåtte er 552. Uten at brukeren har
valgt noe, åpner appen den første øvelsen som ikke er ført ennå — er alt
ført, står alle sammenslått, og da er det lagreknappen som gjelder. Den
lukkede linja viser kortnavnet, beste runde du har ført og hvilken vei det
gikk, eller forrige økt hvis du ikke har ført noe.

To variabler styrer det: `apenOvelse` (hvilket kort) og `apenSatt` (om
brukeren har valgt selv). `apenSatt` nullstilles når økta er lagret, så
neste økt begynner på øvelse én igjen. `settApen()` bytter klasser i stedet
for å tegne siden på nytt — ellers mister feltet du står i både markør og
rulleposisjon.

## Utskrift og tekst

To lenker under banneret: **Skriv ut programmet** og **Kopier som tekst**.

Utskriften er en egen versjon bygget for papir — `#utskrift` fylles av
`byggUtskrift()` og vises bare under `@media print`, der resten av siden
skjules. Den inneholder de fem øvelsene med figurer og et tomt loggskjema med
seks rader. Øvelsene har `break-inside: avoid`, så ingen deles av et sideskift.

Begge versjonene bygges av den samme `OVELSER`-lista som skjermen. En rettet
formulering slår gjennom alle tre stedene uten videre arbeid.

Feltet `kort` på hver øvelse er navnet som brukes der plassen er trang: i
loggen på skjermen og som kolonneoverskrift i loggskjemaet.

## Fokus

Knappen øverst i loggen åpner **fokus**: én øvelse i fullskjerm, med store
figurer, store tallfelter og ett trykk videre. Laget for telefonen på benken
mellom settene.

Fokus følger programmet som sirkel: **15 steg** — 3 runder gjennom alle fem
øvelsene. «Neste» går fra siste øvelse i runde 1 rett til første øvelse i
runde 2. De femten prikkene øverst viser hvor du er, og kan tappes for å
hoppe.

- Første gang i en økt åpner den på første øvelse som ikke er fylt ut;
  siden fortsetter den der du slapp
- Sveip til siden, `←`/`→`, eller knappene. `Escape` lukker
- Pilene lar tallfeltene være i fred, og sveip som starter i et felt
  navigerer ikke
- Siste steg i sirkelen lagrer hele økta og lukker fokus
- Skjermen holdes våken via Wake Lock, der nettleseren støtter det

Tallfeltene hører til øvelsen, ikke runden: kommer du tilbake til knebøy i
runde 2, står tallet fra runde 1 der. Bare den tyngste runden loggføres, så
du retter bare opp hvis runden ble tyngre.

Utkastet er felles med loggskjermen, så tall skrevet i fokus står i lista
etterpå — og motsatt.

## Drakt: palett, fonter og topplinje

Appen bruker UltimatePizzas Forno-drakt. Tokenene er kopiert derfra uendret —
`--forno-bg`, `--forno-text`, `--forno-accent` og resten — og Bedrelivs egne
navn (`--paper`, `--ink`, `--aksent` …) er definert av dem. Resten av
stilarket rører bare Bedrelivs navn, så et nytt tema er å bytte tokenene, ikke
reglene. En enhetstest passer på at ingen regel utenfor tokenblokkene skriver
en farge rett inn.

Forno har bare én aksent. Bedreliv trenger i tillegg tre statusfarger som må
skilles fra hverandre *og* fra aksenten: `--opp`, `--lettere` og `--varsel`.
Alle tre er målt mot både `--paper` og `--plate` i sitt eget tema og klarer
WCAG AA; `sjekk-drakt.mjs` regner kontrasten på fargene nettleseren faktisk
maler, i begge temaer.

Fontene er UltimatePizzas tre: Archivo Black på appnavn, overskrifter og
øvelsesnavn, Archivo på brødtekst, IBM Plex Mono på tall, tellere og stempler.
Fonten står på `body`, ikke på `#app` — fokus, «Endre» og endringsloggen
ligger utenfor `#app` og arvet ellers nettleserens serif.

Tre temavalg, som i UltimatePizza: **mørk** (standard), **lys** og **system**.
Knappen i topplinja går rundt. Valget huskes i localStorage og settes som
`data-tema` på `<html>` av et lite skript i `<head>` — kjørte det etter
stilarket, ville appen blinket mørk før den ble lys. Står valget på «system»,
lytter appen på `prefers-color-scheme` og snur med telefonen mens den ligger
åpen.

Topplinja er bygget som UltimatePizzas: appnavn med versjonsnummeret rett bak,
et stempel under (hvem du er logget inn som · hvilken dag), og handlingene til
høyre. Den er `position: sticky`, så versjonen og navnet står der også langt
nede i loggen. Flata er den løftede (`--plate`), ikke den nedsenkede: på
`--forno-bg-sunken` faller aksenten til 3,8:1 i lyst tema.

## Versjon og endringslogg

Versjonsnummeret står rett bak appnavnet i topplinja og åpner loggen. Nummeret
leses fra toppen av `CHANGELOG`, så det kan ikke komme ut av takt med lista.

Reglene er de samme som i UltimatePizza:

- Nyeste post øverst. Versjon som **streng** (`"0.10"`), ellers blir 0.10 til 0.1
- Én post per versjon, `d` er måned og år
- Skriv hva som ble annerledes for den som bruker appen — ikke hvilke filer som
  ble rørt. Er endringen usynlig, si det rett ut og si hva den var god for
- Rettede feil hører hjemme i loggen på lik linje med nye ting
- Blir lista lang: siste måned står i full detalj, eldre måneder kondenseres til
  én samlepost hver, og detaljene flyttes tapsfritt til `CHANGELOG-ARKIV.md`.
  Loggen lastes ved hver appstart, så historikken koster noe for hver bruker
  hver gang. Filformatet er likt UltimatePizza sitt, så `rydd_changelog.py`
  derfra kan brukes når det blir aktuelt

## Gjengen

Bedreliv er en venneapp: alle ser hverandres økter. `GET /api/okter` filtrerer
derfor ikke på eierskap — det gjør bare skriveoperasjonene, som fortsatt er
forbeholdt eieren. Feltet `shared` blir stående på postene for historikkens
skyld, men styrer ikke lenger hvem som får se dem.

Klienten holder to lister: `okter` (dine egne) og `alleOkter` (hele gjengen).
Din egen logg, «forrige økt» og utviklingen regner **kun** på `okter`. Uten det
skillet ville du blitt sammenliknet med en venn uten å vite det.

Gjengdelen viser per person: ruter for ukas to økter, uker på rad, retning og
sist trent. Sortert på aktivitet denne uka, aldri på vekt.

Lista bygges fra **brukerregisteret**, ikke fra øktene, så alle er synlige fra
dagen de registrerer seg. Bygde man den av øktene, ville en nyregistrert venn
vært usynlig til han trente første gang. `GET /api/users/gjengen` gir navn og
id — aldri PIN-hashen. Svikter kallet, faller gjengen tilbake på dem som har
økter.

**Ukas løft** er den største relative framgangen denne uka, målt mot personens
egen forrige økt i samme øvelse. Relativt framfor absolutt: ellers vinner den
tyngste hver uke.

### Rette opp og slette en økt

Trykk på en økt i loggen. `#rett` åpner i fullskjerm med datoen og alle fem
øvelsene, og lar deg endre tall, flytte dagen, fjerne en øvelse (tøm begge
feltene) eller slette økta.

Etter lagring kalles `lastOkter()` på nytt framfor å flikke på lokal tilstand.
En retting flytter «forrige økt», utviklingskurven og gjengens tall samtidig —
å oppdatere hver av dem for hånd ville vært tre steder å glemme.

**Heiarop nullstilles når tallene endres.** `PATCH` sammenlikner de vaskede
øvelsene med de lagrede, og tømmer `heiarop` bare når de faktisk er
forskjellige. Et heiarop gjaldt løftene slik de sto. Flytter du bare datoen,
står heiaropene.

### Heiarop

👏 på en venns siste økt, med samme kall for å ta det bort igjen. Heiarop har
sin **egen rute** framfor å gå gjennom `PATCH`: å endre en økt er forbeholdt
eieren, og det vernet skal stå. En venn skal kunne heie, men ikke rette på
tallene dine. Ruta rører bare `heiarop`-lista.

Du kan ikke heie på din egen økt — serveren svarer 403. Det er ikke et teknisk
hinder, men poenget med mekanismen.

### Hva du styrer, og hva du ikke styrer

Du kan ikke skru av at du er synlig for de andre — det er premisset. Men din
egen skjerm styrer du: `bedrelivGjengSkjult` legger bort hele delen, og
`bedrelivSkjulte` skjuler enkeltpersoner. Begge er lokale og reversible, og
påvirker ingen andre.

`userId` kreves for å liste økter. Det er en fartsdump mot tilfeldig skraping,
ikke en lås — triviell å forfalske, og skal ikke forveksles med innlogging.

## Utvikling

Under øvelsene ligger en utviklingsdel: per øvelse en sparkline over de siste
seks øktene, og et ord for retningen — **oppover**, **som før** eller
**lettere**.

Trenden regnes på volum (vekt × reps), ikke vekt alene, siden én repetisjon
mer er reell framgang selv med samme manual. Stigningstallet finnes med minste
kvadraters metode og deles på snittvolumet, så en tung øvelse ikke automatisk
får brattere «trend» enn en lett. Terskelen er ±2 % per økt; innenfor det
heter det «som før».

Sparkline-domenet har en minstebredde på 10 % av snittet. Uten den ville en
vingling på én prosent blitt tegnet som en bratt bakke, mens ordet ved siden
av sa «som før».

### Sammenslått som standard

Delen viser **én** retning: en oppsummering med pil, overskrift og en linje om
hvordan de siste øktene fordeler seg. De fem øvelsesradene ligger bak et trykk
og åpnes alle på én gang. Fem piler under hverandre sa fem ganger det samme —
det er helheten du leser først, detaljene når du vil ha dem. Valget huskes i
localStorage (`bedrelivUtvApen`), som resten av visningsvalgene.

Helhetens retning er flertallet: flest øvelser oppover gir «Det går oppover»,
flest lettere gir «Litt lettere om dagen», og står det likt, «Du holder
nivået».

### Om tonen

«Lettere» er ikke en feil, og er ikke farget som en. `--varsel` er reservert
for «Unngå»-linjene; retningen ned bruker `--lettere`, en rolig blågrå som
verken er advarsel eller aksent. Retningen sies alltid med både symbol og ord,
aldri farge alene.

## Tekststørrelse

Fire trinn under overskriften. Alle `font-size` i stilarket går gjennom
`calc(Npx * var(--skala))`, og valget settes som `data-skala` på `<html>` og
huskes i localStorage. Selve velgeren er bevisst holdt utenfor skaleringen —
ellers flytter knappene seg under fingeren idet du trykker.

To steder står `min(calc(...), Nvw)` i stedet: overskriften «STYRKELOGG» og
telleren i fokus. Begge er enkeltord eller nowrap-linjer som verken kan brekke
eller kappes, og på største tekst er de bredere enn en telefonskjerm. Taket
lar dem vokse så langt skjermen rekker, og ikke lenger.

Nettlesertestene kjører med de **ekte** fontene, servert lokalt fra
`tester/rigg/fonter/`. Tidligere svarte de med et tomt stilark for å slippe
unna proxyen, men da tegnet Chromium i sin egen fallback-font — som er smalere
enn Archivo Black. Et oppsett kunne se ut til å få plass i testen og likevel
flyte over kanten på telefonen. `sjekk-storrelse.mjs` går gjennom alle fire
trinn på tre skjermbredder (320, 375, 390) og sammenlikner `scrollWidth` mot
`clientWidth` **per element**: et for bredt ord får ikke boksen sin til å
vokse, det renner bare ut av den, så en ren rect-sjekk ser ingenting.

## «Annet» — den valgfrie sjette

Løping, sykling, tur: alt som ikke måles i kilo og repetisjoner. Kortet ligger
sist på loggskjermen, med stiplet kant og «+» i stedet for et tall, så det
leses som et tillegg og ikke som øvelse nummer seks.

`ANNET` står **utenfor** `OVELSER` med vilje. Ligger den i lista, havner den i
runde-sirkelen i fokus (tre runder løping?), i utviklingskurven og i
øvelsesradene under Utvikling — ingen av delene gir mening for noe som ikke
har en tyngste runde å sammenlikne med forrige gang. Den har sin egen
kortbygger, sitt eget utkast (`utkastAnnet`) og sitt eget felt på økta.

På økta lagres den som `annet: { hva, minutter }`, eller `null`. `minutter` er
valgfritt — noen vet hvor lenge de løp, andre ikke. En økt er gyldig med løft,
med «annet», eller med begge: en løpetur er en økt god nok, og kan lagres selv
om ingen løft står. Bare tom kan den ikke være, verken ved lagring eller ved
retting.

Heiaropene nullstilles også når «annet» endres — de gjaldt økta slik den sto,
og en tur som blir til noe annet er en endring på lik linje med et rettet løft.

I loggen står den etter løftene, i aksentfarge, så den skiller seg fra dem. På
papir har den sin egen kolonne i loggskjemaet.

## Runder og datamodell

Programmet er tre runder, og hver øvelse har ett felt per runde. En økt lagres
som:

```json
"ovelser": {
  "knebøy": [ {"vekt":20,"reps":10}, {"vekt":22,"reps":10}, {"vekt":18,"reps":8} ]
}
```

Antall runder står som `RUNDER` ett sted i `index.html`. Kortene, fokus,
rettevinduet og prikkeraden leser den, så alt følger etter om tallet endres.
Serveren har et tak på 12 runder per øvelse.

**Runde én fyller de andre.** `spreFraForste()` kopierer runde éns tall til
senere runder — men bare til felt du ikke selv har rørt. Merkingen (`rortVekt`,
`rortReps`) er per **felt**, ikke per runde: retter du reps i siste runde,
følger vekta der fortsatt runde én.

**Dagen økta føres på** velges øverst (`oktDato`, null = i dag). Lagreknappen
skriver ut dagen, så det aldri er tvil om hvor tallene havner. Uten dette måtte
en glemt økt føres via «rett opp» på en gammel dag — og da skriver man over den
dagen i stedet for å lage en ny.

**Alt som sammenliknes går på den tyngste runden**, ikke summen — `besteRunde()`.
Summen ville falt bare fordi man rakk to runder i stedet for tre, og kalt en god
dag et tilbakesteg.

**Eldre økter** ble lagret som ett `{vekt,reps}` per øvelse. `runderFor()` leser
dem som én runde, og serveren skriver dem om til liste ved første retting. Ingen
migrering, ingenting går tapt.

## Én eller to manualer

Feltet `manualer` på hver øvelse i `OVELSER` sier hvor mange manualer øvelsen
krever, og vises som en merkelapp i kortet. Det er ikke kosmetikk: ved to
manualer noteres vekta på **én** av dem, ikke summen. Uten den regelen blir
tallene i loggen ikke sammenliknbare fra økt til økt.

| Øvelse | Manualer |
|---|---|
| Goblet knebøy | 1 |
| Manualpress stående | 2 |
| Enarms roing | 1 |
| Rumensk markløft | 2 |
| Utfall | 2 |

## API

### Brukere

| Metode | Sti | Hva |
|---|---|---|
| GET | `/api/users?name=X` | finnes navnet fra før? |
| POST | `/api/users` | registrer `{ name, pin }` |
| POST | `/api/users/verify` | logg inn `{ name, pin }` |
| GET | `/api/users/gjengen?userId=X` | navn og id for alle registrerte |
| GET | `/api/users/admin?password=X` | liste brukere (admin) |
| PATCH | `/api/users/admin/:id` | sett ny PIN (admin) |
| DELETE | `/api/users/admin/:id?password=X` | slett bruker (admin) |

Navn er unike og sammenliknes uten hensyn til store og små bokstaver, så
«Rune» og «rune» er samme bruker.

### Økter

| Metode | Sti | Hva |
|---|---|---|
| GET | `/api/okter?userId=X` | egne økter, eldst først |
| POST | `/api/okter` | ny økt `{ ownerId, dato, ovelser, savedBy? }` |
| PATCH | `/api/okter/:id` | rett opp en økt `{ userId, ovelser?, dato? }` |
| DELETE | `/api/okter/:id?userId=X` | slett (kun eier) |
| POST | `/api/okter/:id/heiarop` | heia på / ta bort heiarop `{ userId, navn }` |

En økt ser slik ut:

```json
{
  "id": "okt_1787170736736_zmzm7u",
  "ownerId": "user_1787170720163_7my62x",
  "savedBy": "Rune",
  "shared": false,
  "dato": "2026-08-18T10:00:00.000Z",
  "ovelser": {
    "knebøy": { "vekt": 24, "reps": 10 },
    "press":  { "vekt": 16, "reps": 8 }
  },
  "savedAt": "2026-08-19T20:18:56.737Z"
}
```

Økter er private for eieren. `shared: true` gjør en økt synlig for alle — det
er ikke tatt i bruk i grensesnittet ennå, men backenden støtter det.

## Oppsett i Netlify

1. Koble repoet til en Netlify-side.
2. Sett miljøvariabelen `ADMIN_PASSWORD` under Site settings → Environment
   variables. Uten den er admin-endepunktene avslått.
3. Deploy. Functions og Blobs settes opp av seg selv.

## Legge til flere øvelser

Lista `OVELSER` øverst i skriptet i `index.html` styrer hele skjemaet. Legg til
en rad med `id`, `navn`, `maal`, `manualer`, `slik` og `feil`, så følger både
skjema og logg etter. Vil du ha figurer på den nye øvelsen, legg inn to
positurer under samme `id` i `figurer.js` — mangler de, vises bare teksten.
Gamle økter mangler bare den nye øvelsen; ingenting går i stykker.

## Merk om sikkerhet

PIN er en lett sperre for en liten, kjent brukergruppe — ikke ekte
autentisering. Det finnes ingen sesjonstokens; klienten sender `userId` med
hvert kall, og den som kjenner en annens `userId` kan lese den loggen. Ikke
legg sensitive opplysninger i appen.
