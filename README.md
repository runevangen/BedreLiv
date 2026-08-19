# Bedreliv — Styrkelogg

Loggbok for 10-minutters manualprogrammet. Fem øvelser, vekt og reps per økt,
og en sammenlikning mot forrige gang så du ser om du gikk opp eller ned.

Brukerinnlogging med navn og firesifret PIN. Hver logg er privat — du ser bare
dine egne økter. Kjører på Netlify Functions + Netlify Blobs, så det er ingen
database å drifte.

## Struktur

```
index.html                    hele appen — innlogging, skjema og logg
figurer.js                    strekfigurer for øvelsene (SVG, ingen bildefiler)
app-api.js                    klient mot backenden
netlify/functions/users.js    registrering, innlogging, admin
netlify/functions/okter.js    lagring av økter, én blob per økt
```

Hver øvelse viser to strekfigurer — start og slutt — sammen med utførelsen og
den vanligste feilen. Teksten følger styrkeprogrammet: 3 runder, minimal pause
mellom øvelsene, 60 sekunder mellom rundene.

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
