import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { ekteFonter } from './rigg/fonter.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const lag = async (navn, pin, okter) => {
  const p = await b.newPage({ viewport:{width:390,height:844} });
await ekteFonter(p, B);
  p.on('pageerror', e => feil.push(navn+': JS-feil ' + e.message));
  await p.goto(B);
  await p.locator('#port-bytt').click();
  await p.fill('#p-navn',navn); await p.fill('#p-pin',pin); await p.fill('#p-pin2',pin);
  await p.locator('#port-knapp').click();
  await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  for (const o of okter) await p.evaluate(async (oo) => { await window.Api.saveOkt(oo); }, o);
  await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  return p;
};
const rad = (p, navn) => p.locator('.gj-rad', { hasText: navn });

console.log('--- Alene i appen, uten en eneste økt ---');
const pFersk = await lag('Fersk','1111', []);
sjekk('ingen rad når du er alene', (await pFersk.locator('.gj-rad').count()) === 0);
sjekk('sier riktig at det bare er deg', (await pFersk.locator('#innhold').textContent()).includes('bare deg her'));
sjekk('invitasjonsknappen står der', await pFersk.locator('#inviter').isVisible());

console.log('--- Venn med økter, jeg uten ---');
const pTrener = await lag('Trener','2222', [{ 'knebøy':{vekt:20,reps:10} }, { 'knebøy':{vekt:22,reps:10} }]);
await pFersk.reload(); await pFersk.waitForSelector('#innhold:not([hidden])'); await pFersk.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('jeg ser vennen', (await rad(pFersk,'TRENER').count()) === 1);
sjekk('jeg ser meg selv, selv uten økter', (await rad(pFersk,'FERSK').count()) === 1);
sjekk('sier at jeg ikke er i gang', (await rad(pFersk,'FERSK').locator('.gj-dom').textContent()).includes('Ikke i gang'));
sjekk('ingen dobbelt-tekst om null økter', !(await rad(pFersk,'FERSK').locator('.gj-under').textContent()).includes('0 økter totalt'),
  (await rad(pFersk,'FERSK').locator('.gj-under').textContent()).trim());
sjekk('begge to i lista', (await pFersk.locator('.gj-rad').count()) === 2);
sjekk('ingen påstand om at det bare er meg her',
  !(await pFersk.locator('#innhold').textContent()).includes('Foreløpig er det bare deg her'));
sjekk('jeg er merket som meg', (await rad(pFersk,'FERSK').locator('.gj-hode b').textContent()).includes('(deg)'));

console.log('--- Og andre veien: vennen ser meg uten at jeg har trent ---');
sjekk('vennen ser meg', (await rad(pTrener,'FERSK').count()) === 1,
  'rader hos Trener: ' + (await pTrener.locator('.gj-rad').count()));
sjekk('vennen ser at jeg ikke er i gang', (await rad(pTrener,'FERSK').locator('.gj-dom').textContent()).includes('Ikke i gang'));
sjekk('ingen heiaknapp på en uten økter', (await rad(pTrener,'FERSK').locator('.gj-heia').count()) === 0);
sjekk('heiaknapp finnes på den som HAR trent', (await rad(pFersk,'TRENER').locator('.gj-heia').count()) === 1);

console.log('--- Aktive sorteres over de som ikke er i gang ---');
const navn = await pFersk.locator('.gj-hode b').allTextContents();
sjekk('den som trener står øverst', navn[0].includes('Trener'), navn.join(' | '));

console.log('--- Faller tilbake om brukerlista svikter ---');
await pFersk.route('**/api/users/gjengen*', r => r.abort());
await pFersk.reload(); await pFersk.waitForSelector('#innhold:not([hidden])'); await pFersk.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('appen tegner fortsatt', await pFersk.locator('#innhold').isVisible());
sjekk('den som har økter vises likevel', (await rad(pFersk,'TRENER').count()) === 1);

await pFersk.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Alle er synlige fra dag én.');
