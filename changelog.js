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
    "v": "0.19",
    "d": "august 2026",
    "changes": [
      "Appen har fått UltimatePizzas drakt: den varme Forno-paletten med brent oransje aksent, og fontene Archivo Black på overskrifter, Archivo på brødtekst og IBM Plex Mono på tall og tellere.",
      "Tre temavalg, som i UltimatePizza: mørk, lys og system. Knappen øverst til høyre går rundt, valget huskes, og «system» snur med telefonen mens appen ligger åpen. Standard er mørk.",
      "Ny topplinje som blir stående når du blar: appnavnet med versjonsnummeret rett bak, og under det hvem du er logget inn som og hvilken dag det er. Navnet og datoen sto tidligere lenger ned og forsvant så snart du begynte å bla.",
      "Rettet at brødteksten i fokus, «Endre» og endringsloggen sto i nettleserens serif. De tre skjermene ligger utenfor hoveddelen av appen og arvet aldri appfonten."
    ]
  },
  {
    "v": "0.18",
    "d": "august 2026",
    "changes": [
      "Øvelsene står nå sammenslått til én linje hver, og du åpner den du holder på med. Åpner du en ny, lukkes den forrige, så siden er like kort uansett hvor langt ut i økta du er. Fem åpne kort var en lang side å bla gjennom; nå tar øvelsene under en tredjedel av plassen.",
      "Appen åpner selv den første øvelsen du ikke har ført. Har du ført alt, står alle sammenslått — da er det lagreknappen som står for tur. Etter at økta er lagret begynner den på øvelse én igjen.",
      "Den sammenslåtte linja viser hva du har ført: beste runde og om det gikk opp, ned eller likt. Har du ikke ført noe, står forrige økt der i stedet, så du ser hva du skal slå uten å åpne kortet.",
      "Sammenslått brukes kortnavnet — «PRESS» framfor «MANUALPRESS STÅENDE» — så navnet ikke blir kappet for å gi plass til tallet. Åpner du kortet, står hele navnet der."
    ]
  },
  {
    "v": "0.17",
    "d": "august 2026",
    "changes": [
      "Tekststørrelse-velgeren har fått et trinn til på toppen, og det minste trinnet er borte. Valgene er nå normal, stor, større og størst, der størst er tydelig større enn det som fantes før. Har du tidligere valgt det minste trinnet, står appen på normal neste gang du åpner den.",
      "Fokus bruker alltid største tekst, uansett hva du har valgt ellers. Telefonen ligger gjerne et stykke unna på gulvet mens du trener, og da skal vekt, repetisjoner og øvelsesnavn kunne leses derfra. Valget ditt røres ikke — det er tilbake så snart du lukker fokus.",
      "Telleren øverst i fokus er kortet ned til «Runde 1/3 · Øvelse 1/5». Med største tekst brakk den gamle skrivemåten i to linjer på en liten skjerm og dyttet lukkeknappen ned."
    ]
  },
  {
    "v": "0.16",
    "d": "august 2026",
    "changes": [
      "Fjernet den faste teksten under overskriften i Utvikling — den om at det ikke er et tilbakesteg å løfte mindre. Den sto der uansett hva utviklingen viste, også når det gikk oppover, og ble tapet i stedet for noe man leser. Prinsippet ligger fortsatt i delen: «lettere» har rolig oker og ikke advarselsrødt, og overskriften sier «Litt lettere om dagen», ikke noe om å mislykkes.",
      "Rettet samtidig at hele Utvikling-delen ikke fulgte tekststørrelse-velgeren. Valgte du større tekst, ble alt annet større mens overskriften, oppsummeringen og øvelsesradene der sto igjen små. Delen ble laget etter at skaleringen kom, og manglet den. En vakt i testene fanger det nå om det skjer igjen."
    ]
  },
  {
    "v": "0.15",
    "d": "august 2026",
    "changes": [
      "«Rett opp» heter nå «Endre» — på knappen i loggen, i overskriften på skjermen som åpner seg, og i kvitteringen etterpå."
    ]
  },
  {
    "v": "0.14",
    "d": "august 2026",
    "changes": [
      "Ingen synlig endring — opprydding i hvordan appen bygges og prøves. Regnestykkene (beste runde, trend, uker på rad, utfylling av runder) er flyttet ut av index.html til beregning.js: rene funksjoner uten skjerm og nettverk. De har fått 38 egne tester som kjører på 54 millisekunder, mot minutter da de samme reglene måtte prøves gjennom en nettleser.",
      "Målt effekt: en full testrunde tok åtte minutter og tar nå 18 sekunder. Mesteparten lå ett sted: fontlenka i toppen av siden går gjennom miljøets proxy og brukte 12,8 sekunder på å gi opp — ved hver eneste sidelasting, i hvert eneste sett. Testene svarer nå på den selv. Settene kjører dessuten fire om gangen, tregeste først.",
      "Testene lå til nå bare i en midlertidig arbeidsmappe. 374 sjekker som ville forsvunnet med maskinen ligger nå i repoet."
    ]
  },
  {
    "v": "0.13",
    "d": "august 2026",
    "changes": [
      "Fyller du inn runde én, fylles de andre rundene med det samme. Er de like — som de som regel er — er du ferdig etter to tall. Retter du siste runde ned fordi forma sviktet, blir den rettingen stående, også om du etterpå endrer runde én. Merkingen er per felt, ikke per runde: retter du reps i siste runde, følger vekta der fortsatt runde én, for den har du ikke rørt.",
      "Øverst står det nå «Økt for» med dagen skrevet ut, og lagreknappen sier hvilken dag den skriver til. Før sto datoen bare løst i hjørnet uten å si hva den gjaldt.",
      "Du kan velge dagen når du lagrer. Glemte du å føre inn onsdagens økt, setter du datoen og lagrer — uten å måtte gå veien om «Endre» på en gammel økt, som er nettopp den veien som gjør at dagens tall kan havne på feil dag."
    ]
  },
  {
    "v": "0.12",
    "d": "august 2026",
    "changes": [
      "Hver øvelse har nå ett felt per runde — tre rader, ikke ett felt du overskriver tre ganger. Alle rundene loggføres, og i fokus hører feltene til den runden du faktisk står i. Står du i runde tre og ikke husker hva du tok i runde én, står den nå der.",
      "Alt som sammenliknes — «forrige økt», utviklingen, gjengen og Ukas løft — går på den TYNGSTE runden, ikke summen. Summen ville falt bare fordi du rakk to runder i stedet for tre, og kalt en god dag et tilbakesteg. Slår du forrige økt i én runde, teller det.",
      "Økter loggført før denne versjonen leses fortsatt som før, med sitt ene tallpar som runde én. De teller med i loggen, utviklingen og gjengen, og kan åpnes og fylles ut med de andre rundene når du vil.",
      "Antall runder er fortsatt tre, satt ett sted i koden. Å la admin endre det står i backloggen sammen med brukeradministrasjonen."
    ]
  },
  {
    "v": "0.11",
    "d": "august 2026",
    "changes": [
      "Trykk på en økt i loggen for å endre den. Der kan du endre vekt og reps på hver øvelse, flytte økta til riktig dag hvis du glemte å logge den, fjerne en øvelse ved å tømme begge feltene — eller slette hele økta. Før fantes bare «Tøm hele loggen», som er alt-eller-ingenting og ikke duger når ett tall ble feil.",
      "Utviklingen, «forrige økt» og gjengens tall regnes om med én gang du lagrer. Retter du siste økt ned, snur kurven fra oppover til lettere på skjermen foran deg.",
      "Endrer du tallene, forsvinner heiaropene på den økta. Et heiarop gjaldt løftene slik de sto, og skal ikke henge igjen på tall ingen har sett. Flytter du bare datoen, står de — da er løftene de samme. Dette er en bevisst endring fra v0.08, der heiaropene overlevde enhver retting.",
      "En økt må ha minst ett løft. Tømmer du alle feltene, sier appen fra i stedet for å lagre en tom økt — vil du bli kvitt hele økta, sletter du den."
    ]
  },
  {
    "v": "0.10",
    "d": "august 2026",
    "changes": [
      "«Skriv ut programmet» gir et rent A4-ark: alle fem øvelsene med figurer, mål, utførelse og den vanligste feilen — pluss et tomt loggskjema med seks rader, så arket kan henges opp og fylles ut for hånd. Det er en egen versjon laget for papir, ikke skjermbildet presset gjennom en skriver: ingen knapper, ingen gjengliste, og øvelser som ikke brekkes midt i over et sideskift.",
      "«Kopier som tekst» legger hele programmet på utklippstavla som ren tekst, klart til å limes inn i en melding til en venn.",
      "Begge bygges av den samme øvelseslista som skjermen bruker. Retter vi en formulering ett sted, slår den gjennom alle tre.",
      "Øvelsene har fått kortnavn. Loggen sa før «Enarms 18×8» og «Rumensk 26×10» — første ord i navnet, som ikke er et brukbart navn på en øvelse. Nå står det «Roing» og «Markløft», og de samme navnene brukes som kolonner i loggskjemaet på utskriften."
    ]
  },
  {
    "v": "0.09",
    "d": "august 2026",
    "changes": [
      "Alle i gjengen er synlige fra dagen de registrerer seg, ikke først når de har loggført sin første økt. Før ble gjenglista bygget av øktene, så en nyregistrert venn var usynlig for de andre — og du var usynlig for ham — helt til noen hadde trent. Nå står de der med «Ikke i gang ennå».",
      "Rettet en feil i den samme delen: vakta som avgjorde om gjengen skulle vises telte antall personer i lista, i stedet for å spørre om det finnes noen andre enn deg. Manglet du selv fra lista, forsvant vennen din også — og appen påsto «Foreløpig er det bare deg her» om en liste som inneholdt vennen og ikke deg.",
      "Under panseret: et nytt, lite endepunkt gir navn og id for alle registrerte. PIN-hashen forlater aldri serveren. Svikter kallet, faller gjengen tilbake på dem som har økter — bedre en mager liste enn en tom skjerm."
    ]
  },
  {
    "v": "0.08",
    "d": "august 2026",
    "changes": [
      "Heiarop. Trykk 👏 på en venn i gjengen for å heie på siste økta deres. Trykk igjen tar det bort. Under raden står det hvem som heier — «Du og Kari heier på siste økt» — og du ser selv hvem som har heiet på deg.",
      "Du kan ikke heie på deg selv. Det er ikke et teknisk hinder, det er hele poenget: heiarop er noe som kommer fra andre.",
      "Under panseret fikk heiarop sin egen rute framfor å gå gjennom den vanlige oppdateringen av en økt. Å endre en økt er forbeholdt eieren, og det vernet skulle stå: en venn skal kunne heie, men ikke kunne rette på tallene dine. Ruta rører bare heiarop-lista, ingenting annet — og heiaropene overlever at eieren retter opp økta etterpå."
    ]
  },
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
      "Appen har fått versjonsnummer og endringslogg. Nummeret står rett bak tittelen og åpner denne lista. Loggen ligger som ren data i changelog.js, nyeste først, og leses av appen ved oppstart."
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
