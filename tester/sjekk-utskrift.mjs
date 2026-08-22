import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { ekteFonter } from './rigg/fonter.mjs';
import { writeFileSync } from 'node:fs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844},
  permissions: ['clipboard-read','clipboard-write'] });
await ekteFonter(p, B);
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Knappene ---');
sjekk('utskriftsknappen finnes', await p.locator('#skriv-ut').isVisible());
sjekk('kopiknappen finnes', await p.locator('#kopier-program').isVisible());
sjekk('utskriftsdelen er skjult på skjerm', !(await p.locator('#utskrift').isVisible()));

console.log('--- Kopier som tekst ---');
await p.locator('#kopier-program').click();
await p.waitForTimeout(400);
sjekk('kvittering vises', (await p.locator('#program-kvitt').textContent()).includes('kopiert'),
  (await p.locator('#program-kvitt').textContent()).trim());
const tekst = await p.evaluate(() => navigator.clipboard.readText());
writeFileSync(process.env.TEKST, tekst);
sjekk('har overskrift', tekst.startsWith('STYRKELOGG'));
sjekk('har alle fem øvelsene', [1,2,3,4,5].every(n => tekst.includes(n + '. ')),
  tekst.split('\n').filter(l => /^\d\. /.test(l)).length + ' nummererte linjer');
sjekk('øvelsesnavnene stemmer', tekst.includes('GOBLET KNEBØY') && tekst.includes('MANUALPRESS STÅENDE') &&
  tekst.includes('UTFALL'));
sjekk('målene er med', tekst.includes('10 reps') && tekst.includes('8 reps per arm') && tekst.includes('8 reps per fot'));
sjekk('antall manualer er med', tekst.includes('1 manual') && tekst.includes('2 manualer'));
sjekk('utførelsen er med', tekst.includes('Hold én manual mot brystet'));
sjekk('«unngå» er med fem ganger', (tekst.match(/Unngå:/g) || []).length === 5);
sjekk('runde-regelen er med', tekst.includes('3 runder'));
sjekk('progresjonsregelen er med', tekst.includes('én repetisjon'));
sjekk('lenke til appen', tekst.includes('bedreliv.netlify.app'));
sjekk('ingen HTML i teksten', !/[<>]/.test(tekst));

console.log('--- Utskriftsversjonen ---');
await p.evaluate(() => { document.getElementById('skriv-ut').click(); });
await p.waitForTimeout(400);
const u = p.locator('#utskrift');
sjekk('fem øvelser på arket', (await u.locator('.pr-ovelse').count()) === 5);
sjekk('ti figurer på arket', (await u.locator('svg.fig').count()) === 10);
sjekk('loggskjema finnes', (await u.locator('.pr-skjema table').count()) === 1);
sjekk('seks tomme rader', (await u.locator('.pr-skjema tbody tr').count()) === 6);
sjekk('sju kolonner: dato + fem øvelser + Annet', (await u.locator('.pr-skjema thead th').count()) === 7,
  (await u.locator('.pr-skjema thead th').count()) + ' kolonner');
const kolonner = await u.locator('.pr-skjema thead th').allTextContents();
sjekk('kolonnene har brukbare navn', JSON.stringify(kolonner) === JSON.stringify(['Dato','Knebøy','Press','Roing','Markløft','Utfall','Annet']), kolonner.join(' | '));
sjekk('radene er tomme', (await u.locator('.pr-skjema tbody td').allTextContents()).every(t => t === ''));
sjekk('hver rad har en celle per kolonne', (await u.locator('.pr-skjema tbody td').count()) === 6 * 7,
  (await u.locator('.pr-skjema tbody td').count()) + ' celler');
sjekk('versjonen står i foten', (await u.locator('.pr-fot').textContent()).includes('v0.'),
  (await u.locator('.pr-fot').textContent()).trim());

console.log('--- Ved utskrift skjules appen ---');
await p.emulateMedia({ media: 'print' });
await p.waitForTimeout(200);
sjekk('utskriftsdelen vises ved print', await p.locator('#utskrift').isVisible());
sjekk('appen skjules ved print', !(await p.locator('#app').isVisible()));
sjekk('knappene er ikke med på arket', (await p.locator('#utskrift button').count()) === 0);
await p.pdf({ path: process.env.PDF, format: 'A4', printBackground: false });
await p.emulateMedia({ media: 'screen' });
await p.waitForTimeout(200);
sjekk('appen er tilbake etterpå', await p.locator('#app').isVisible());

await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Utskrift og kopiering virker.');
