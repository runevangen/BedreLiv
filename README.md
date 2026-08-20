# Bedreliv — Styrkelogg

Loggbok for 10-minutters manualprogrammet. Fem øvelser, vekt og reps per økt,
og en sammenlikning mot forrige gang så du ser om du gikk opp eller ned.

Brukerinnlogging med navn og firesifret PIN. Hver logg er privat — du ser bare
dine egne økter. Kjører på Netlify Functions + Netlify Blobs, så det er ingen
database å drifte.

## Struktur

```
index.html                    hele appen — innlogging, skjema og logg
changelog.js                  endringsloggen (ren data, nyeste først)
figurer.js                    strekfigurer for øvelsene (SVG, ingen bildefiler)
app-api.js                    klient mot backenden
netlify/functions/users.js    registrering, innlogging, admin
netlify/functions/okter.js    lagring av økter, én blob per økt
```

Hver øvelse viser to strekfigurer — start og slutt. Utførelsen og den
vanligste feilen ligger bak «Vis utførelse», så loggeskjermen er kort å
scrolle mens du trener. Teksten følger styrkeprogrammet: 3 runder, minimal
pause mellom øvelsene, 60 sekunder mellom rundene.

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

## Versjon og endringslogg

Versjonsnummeret står rett bak tittelen og åpner loggen. Nummeret leses fra
toppen av `CHANGELOG`, så det kan ikke komme ut av takt med lista.

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

**Ukas løft** er den største relative framgangen denne uka, målt mot personens
egen forrige økt i samme øvelse. Relativt framfor absolutt: ellers vinner den
tyngste hver uke.

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

### Om tonen

«Lettere» er ikke en feil, og er ikke farget som en. Advarselsrødt er
reservert for «Unngå»-linjene; retningen ned bruker en rolig oker. Delen har
en fast linje om at det finnes mange grunner til å løfte mindre en dag.
Retningen sies alltid med både symbol og ord, aldri farge alene.

## Tekststørrelse

Fire trinn i mastheaden. Alle `font-size` i stilarket går gjennom
`calc(Npx * var(--skala))`, og valget settes som `data-skala` på `<html>` og
huskes i localStorage. Selve velgeren er bevisst holdt utenfor skaleringen —
ellers flytter knappene seg under fingeren idet du trykker.

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
