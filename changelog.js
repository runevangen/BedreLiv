// Endringslogg for Bedreliv. Rent datainnhold, ingen logikk. Lastes via
// <script src> FØR hovedscriptet i index.html, slik at CHANGELOG er
// tilgjengelig når resten kjører. Samme oppsett som i UltimatePizza.
//
// Reglene:
//   - Nyeste post øverst. Versjon som streng ("0.06"), så 0.10 ikke blir 0.1.
//   - Én post per versjon, «d» er måned og år.
//   - Skriv hva som ble annerledes for den som bruker appen — ikke hvilke
//     filer som ble rørt. Er endringen usynlig, si det rett ut og si hva den
//     var god for.
//   - Rettede feil hører hjemme i loggen på lik linje med nye ting.
//   - Blir lista lang: siste måned står i full detalj, eldre måneder
//     kondenseres til én samlepost hver og detaljene flyttes tapsfritt til
//     CHANGELOG-ARKIV.md. Loggen lastes ved hver appstart, så historikken
//     koster noe for hver bruker hver gang.
const CHANGELOG = [
  {
    "v": "0.07",
    "d": "august 2026",
    "changes": [
      "Gjengen er her. Bedreliv er en venneapp, og alle ser nå hverandres økter: én rad per person med ruter for ukas to økter, uker på rad, retningen på treningen og når vedkommende sist trente. Mest aktiv denne uka står øverst — aldri sortert etter vekt, for da hadde den sterkeste vunnet hver eneste uke og alle andre sluttet å se etter.",
      "«Ukas løft» trekker fram én person: den største RELATIVE framgangen denne uka, målt mot personens egen forrige økt i samme øvelse. Går du fra 10 til 14 kg, slår du den som gikk fra 26 til 28 — målestokken er deg selv, ikke gjengen.",
      "Du kan ikke skru av at du er synlig for de andre; det er premisset for en venneapp. Men skjermen din er din: legg bort hele gjengen, eller skjul enkeltpersoner. Begge deler gjelder bare din egen visning, huskes på telefonen, og kan hentes tilbake.",
      "«Inviter en venn» sender lenka via telefonens delingsmeny, eller kopierer den om nettleseren ikke har delingsmeny.",
      "Under panseret: serveren returnerer nå hele gjengens økter, mens appen skiller mellom dine og de andres. Uten det skillet ville «forrige økt» og din egen utvikling plutselig sammenliknet deg med en venn. Å endre eller slette er fortsatt forbeholdt eieren — bare det å se er blitt felles."
    ]
  },
  {
    "v": "0.06",
    "d": "august 2026",
    "changes": [
      "Appen har fått versjonsnummer og endringslogg. Nummeret står rett bak tittelen og åpner denne lista. Loggen ligger som ren data i changelog.js, nyeste først — samme oppsett som i UltimatePizza, så månedsryddingen derfra kan brukes her når lista blir lang."
    ]
  },
  {
    "v": "0.05",
    "d": "august 2026",
    "changes": [
      "Ny «Utvikling»-del under øvelsene: en sparkline over de siste seks øktene per øvelse, og et ord for retningen — oppover, som før eller lettere. Trenden regnes på volum (vekt × reps), ikke vekt alene, siden én repetisjon mer er reell framgang selv med samme manual. Stigningstallet deles på snittvolumet, så markløft med 26 kg ikke automatisk får brattere trend enn utfall med 12 kg.",
      "«Lettere» er ikke lenger farget som en feil. Dommen «ned» brukte nøyaktig samme alarmrøde som «Unngå»-linjene — å løfte 22 i stedet for 24 så altså ut som noe du hadde gjort galt. Den har fått en rolig oker, og rødt er nå reservert for faktiske advarsler. Delen sier også rett ut at søvn, en travel dag eller annen aktivitet teller inn: loggen er et minne om hva du gjorde, ikke en dom over det.",
      "Rettet før den rakk å lyve: sparkline skalerte til laveste og høyeste verdi, så en vingling på én prosent ble tegnet som en bratt bakke mens ordet ved siden av sa «som før». Ruta har nå en minstebredde på ti prosent av snittet — vingling gir 2 av 16 piksler utslag, reell stigning fyller fortsatt hele."
    ]
  },
  {
    "v": "0.04",
    "d": "august 2026",
    "changes": [
      "Fokus følger nå programmet som sirkel: 15 steg, tre runder gjennom alle fem øvelsene. «Neste» går fra siste øvelse i runde 1 rett til første øvelse i runde 2 — slik du faktisk trener. Femten prikker øverst viser hvor du er, og kan tappes for å hoppe. Tallfeltene hører til øvelsen, ikke runden, så tallet fra runde 1 står der når du kommer tilbake.",
      "Sveip til siden blar mellom stegene. Sveip som starter i et tallfelt navigerer ikke — der skal fingeren få markere tekst.",
      "Utførelsen i loggelista ligger nå bak «Vis utførelse». Figurene og antall manualer står alltid, så den raske påminnelsen er der uten at kortene blir høye å scrolle forbi mellom settene. Kortene gikk fra 334 til 225 piksler.",
      "Tekststørrelse i fire trinn, i toppen ved siden av navnet ditt. Valget huskes på telefonen. Tallfeltene holder seg over 16 piksler på alle trinn, så iOS ikke zoomer inn når du tapper dem."
    ]
  },
  {
    "v": "0.03",
    "d": "august 2026",
    "changes": [
      "Fokus: én øvelse i fullskjerm, med store figurer, store tallfelter og ett trykk videre — for telefonen som ligger på benken mellom settene. Skjermen holdes våken der nettleseren støtter det, og låsen tas tilbake hvis du bytter app og kommer tilbake.",
      "Fokus åpner på den første øvelsen som ikke er fylt ut, ikke på nummer én. Siste steg lagrer hele økta uten at du forlater fokus, og tallene er felles med loggelista begge veier.",
      "Rettet: «Innlogget som / Logg ut» sto synlig på innloggingsskjermen. Linja skal skjules med hidden-attributtet, men det slår ikke gjennom på et element som har fått display: flex av en klasse."
    ]
  },
  {
    "v": "0.02",
    "d": "august 2026",
    "changes": [
      "Hver øvelse viser to strekfigurer — start og slutt — tegnet som SVG i koden. Ingen bildefiler følger med, og de er skarpe uansett skjerm.",
      "Teksten følger styrkeprogrammet: 3 runder, minimal pause mellom øvelsene og 60 sekunder mellom rundene, målene per øvelse, utførelsen og den vanligste feilen. «Manualpress» heter nå «Manualpress stående», og «per bein» er byttet til per fot.",
      "Hver øvelse sier hvor mange manualer den krever. Det er ikke pynt: ved to manualer skal vekta på én av dem noteres, ikke summen — ellers ville noen ført 2 × 10 kg som 10 og andre som 20, og tallene i loggen hadde ikke vært sammenliknbare fra økt til økt."
    ]
  },
  {
    "v": "0.01",
    "d": "august 2026",
    "changes": [
      "Første versjon. Styrkelogg for 10-minutters manualprogrammet: fem øvelser, vekt og reps per økt, og en sammenlikning mot forrige gang som sier om du gikk opp, ned eller likt.",
      "Innlogging med navn og firesifret PIN. Hver logg er privat — du ser bare dine egne økter, og bare eieren kan endre eller slette dem. Loggen følger deg mellom telefon og PC.",
      "Kjører på Netlify Functions og Netlify Blobs. Ingen database å drifte, og ingen bildefiler eller rammeverk å laste."
    ]
  }
];
