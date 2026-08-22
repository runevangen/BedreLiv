// Enhetstester for beregning.js — rene funksjoner, ingen nettleser, ingen server.
// Kjører på millisekunder og er derfor porten som åpnes først: svikter
// matematikken, stopper alt før noen Chromium er startet.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(import.meta.dirname, '..');
const B = new Function(readFileSync(path.join(ROT, 'beregning.js'), 'utf8') + ';return Beregning;')();

let ok = 0;
const feil = [];
function sjekk(navn, verdi, fasit) {
  const a = JSON.stringify(verdi), b = JSON.stringify(fasit);
  if (a === b) { ok++; return; }
  feil.push(`${navn}\n      fikk:      ${a}\n      forventet: ${b}`);
}

// ===== Løft og runder =====
sjekk('volum ganger vekt og reps', B.volum(24, 10), 240);
sjekk('volum tåler tomme verdier', B.volum(null, 10), 0);

const okt = { ovelser: { knebøy: [{ vekt: 20, reps: 10 }, { vekt: 24, reps: 10 }, { vekt: 22, reps: 8 }] } };
sjekk('runderFor gir alle rundene', B.runderFor(okt, 'knebøy').length, 3);
sjekk('runderFor gir tom liste for ukjent øvelse', B.runderFor(okt, 'press'), []);
sjekk('besteRunde tar den tyngste', B.besteRunde(okt, 'knebøy'), { vekt: 24, reps: 10 });

const gammel = { ovelser: { knebøy: { vekt: 14, reps: 10 } } };
sjekk('gammelt format leses som én runde', B.runderFor(gammel, 'knebøy'), [{ vekt: 14, reps: 10 }]);
sjekk('besteRunde virker på gammelt format', B.besteRunde(gammel, 'knebøy'), { vekt: 14, reps: 10 });

// Halvutfylte runder skal ikke telle
const halv = { ovelser: { knebøy: [{ vekt: 20, reps: 10 }, { vekt: 30 }] } };
sjekk('runde uten reps forkastes', B.runderFor(halv, 'knebøy').length, 1);
sjekk('besteRunde ser bort fra den halve', B.besteRunde(halv, 'knebøy'), { vekt: 20, reps: 10 });

// Volum, ikke vekt: én rep mer er framgang
const lettMenFlere = { ovelser: { knebøy: [{ vekt: 20, reps: 12 }, { vekt: 22, reps: 10 }] } };
sjekk('flere reps kan slå tyngre vekt', B.besteRunde(lettMenFlere, 'knebøy'), { vekt: 20, reps: 12 });

// ===== Trend =====
const serie = (...tall) => tall.map(v => ({ volum: v }));
sjekk('for få økter gir ingen trend', B.trend(serie(200)), null);
sjekk('stigende serie er oppover', B.trend(serie(200, 220, 240)).retning, 'opp');
sjekk('flat serie er likt', B.trend(serie(200, 200, 200)).retning, 'likt');
sjekk('synkende serie er lettere', B.trend(serie(240, 220, 200)).retning, 'lettere');
sjekk('vingling under terskelen er likt', B.trend(serie(200, 202, 200, 202)).retning, 'likt');
sjekk('trenden ser bare på de siste seks', B.trend(serie(1000, 10, 20, 30, 40, 50, 60, 70)).serie.length, 6);
sjekk('en enkelt gammel topp velter ikke trenden',
  B.trend(serie(1000, 10, 20, 30, 40, 50, 60, 70)).retning, 'opp');

// Normaliseringen: tung og lett øvelse med samme relative stigning skal gi samme trend
const tung = B.trend(serie(2000, 2200, 2400)).pst;
const lett = B.trend(serie(100, 110, 120)).pst;
sjekk('normalisert: tung og lett øvelse er likestilt', Math.abs(tung - lett) < 1e-12, true);

// personRetning: flertallet av øvelsene
const oktMed = (kneboy, press) => ({ ovelser: { knebøy: [{ vekt: kneboy, reps: 10 }], press: [{ vekt: press, reps: 10 }] } });
sjekk('personRetning tar flertallet',
  B.personRetning([oktMed(20, 20), oktMed(22, 22), oktMed(24, 24)], ['knebøy', 'press']), 'opp');
sjekk('personRetning uten data er null', B.personRetning([], ['knebøy']), null);
sjekk('én opp og én ned blir likt',
  B.personRetning([oktMed(20, 24), oktMed(22, 22), oktMed(24, 20)], ['knebøy', 'press']), 'likt');

// ===== Uker =====
const man = new Date('2026-08-17T12:00:00');   // mandag
const sondag = new Date('2026-08-23T12:00:00');
sjekk('uka starter på mandag', B.ukeNokkel(man), B.ukeNokkel(sondag));
sjekk('mandag og forrige søndag er ulike uker',
  B.ukeNokkel(man) === B.ukeNokkel(new Date('2026-08-16T12:00:00')), false);
sjekk('forrigeUke går sju dager tilbake',
  B.ukeNokkel(B.forrigeUke(man)), B.ukeNokkel(new Date('2026-08-10T12:00:00')));

const d = (s) => new Date(s + 'T12:00:00');
const naa = d('2026-08-21');   // fredag i uke som starter 17.
sjekk('to økter denne uka gir én uke på rad',
  B.ukerPaaRad([d('2026-08-17'), d('2026-08-19')], 2, naa), 1);
sjekk('én økt denne uka bryter ikke rekka, men teller ikke',
  B.ukerPaaRad([d('2026-08-17'), d('2026-08-10'), d('2026-08-12')], 2, naa), 1);
sjekk('tre uker på rad',
  B.ukerPaaRad([d('2026-08-17'), d('2026-08-19'), d('2026-08-10'), d('2026-08-12'),
                d('2026-08-03'), d('2026-08-05')], 2, naa), 3);
sjekk('et hull bryter rekka',
  B.ukerPaaRad([d('2026-08-17'), d('2026-08-19'), d('2026-08-03'), d('2026-08-05')], 2, naa), 1);
sjekk('ingen økter gir null', B.ukerPaaRad([], 2, naa), 0);

// ===== Utfylling av runder =====
sjekk('runde én fyller de andre',
  B.spreRunder([{ vekt: 6.5, reps: 8 }], 3).map(r => [r.vekt, r.reps]),
  [[6.5, 8], [6.5, 8], [6.5, 8]]);
sjekk('rørt felt blir stående',
  B.spreRunder([{ vekt: 7, reps: 8 }, {}, { reps: 6, rortReps: true }], 3).map(r => [r.vekt, r.reps]),
  [[7, 8], [7, 8], [7, 6]]);
sjekk('rørt reps fryser ikke vekta',
  B.spreRunder([{ vekt: 7, reps: 8 }, {}, { vekt: 6.5, reps: 6, rortReps: true }], 3)[2].vekt, 7);
sjekk('rørt vekt blir stående',
  B.spreRunder([{ vekt: 7, reps: 8 }, { vekt: 5, rortVekt: true }, {}], 3)[1].vekt, 5);
sjekk('tom runde én sprer ingenting', B.spreRunder([], 3), []);

// ===== Datoer =====
sjekk('datoFeltVerdi gir ÅÅÅÅ-MM-DD', B.datoFeltVerdi(new Date('2026-08-05T12:00:00').toISOString()), '2026-08-05');
sjekk('ensifret måned og dag får null foran', B.toSiffer(3), '03');
sjekk('datoTekst skriver dag og måned', B.datoTekst(new Date('2026-08-21T12:00:00').toISOString()), 'Fredag 21. aug');
sjekk('datoTekst på en søndag', B.datoTekst(new Date('2026-08-23T12:00:00').toISOString()), 'Søndag 23. aug');

// ===== Stilarket: all tekst skal følge tekststørrelse-velgeren =====
// Legger man til en CSS-blokk etter at skaleringen er innført, er det lett å
// skrive «font-size: 12px» og glemme calc(). Da blir akkurat den delen stående
// liten når noen velger større tekst — som skjedde med hele Utvikling-delen.
{
  const html = readFileSync(path.join(ROT, 'index.html'), 'utf8');
  const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
  // Velgeren skal ikke skalere seg selv: knappene ville flyttet seg under
  // fingeren idet man trykker.
  const unntak = /\.tekststorrelse button/;
  let regel = '';
  const uskalerte = [];
  for (const linje of css.split('\n')) {
    const m = linje.match(/^\s*([.#][\w-][^{]*)\{/);
    if (m) regel = m[1].trim();
    if (/font-size:\s*[\d.]+px/.test(linje) && !linje.includes('var(--skala)') && !unntak.test(regel)) {
      uskalerte.push(regel);
    }
  }
  sjekk('all tekst utenom selve velgeren skalerer', uskalerte, []);
}

// ===== Stilarket: fargene skal komme fra tokenene =====
// Paletten byttes ved å definere tokenene om — én gang for mørkt tema, én
// gang for lyst. En farge skrevet rett inn i en regel følger ikke med på det
// byttet, og blir stående mørk på lys bakgrunn. Tokenblokkene og
// utskriftsreglene er unntatt: der ER fargene definisjonen, og papir er
// alltid hvitt.
{
  const html = readFileSync(path.join(ROT, 'index.html'), 'utf8');
  let css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
  css = css.slice(0, css.indexOf('@media print'));
  css = css.replace(/:root\s*\{[^}]*\}/g, '').replace(/html\[data-tema[^{]*\{[^}]*\}/g, '');
  let regel = '';
  const harde = [];
  for (const linje of css.split('\n')) {
    const m = linje.match(/^\s*([.#][\w-][^{]*)\{/);
    if (m) regel = m[1].trim();
    if (/#[0-9A-Fa-f]{3}\b|#[0-9A-Fa-f]{6}\b/.test(linje)) harde.push(regel + ': ' + linje.trim());
  }
  sjekk('ingen farger utenfor tokenene', harde, []);
}

console.log(`  ${ok} enhetssjekker`);
if (feil.length) {
  console.log('\n  FEIL:');
  feil.forEach(f => console.log('   - ' + f));
  process.exit(1);
}
