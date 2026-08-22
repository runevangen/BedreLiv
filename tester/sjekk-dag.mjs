import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { ekteFonter } from './rigg/fonter.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };
const iDag = new Date(); const pad = n => (n<10?'0':'')+n;
const feltIDag = iDag.getFullYear()+'-'+pad(iDag.getMonth()+1)+'-'+pad(iDag.getDate());

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844} });
await ekteFonter(p, B);
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|40[0-9]/.test(t)) feil.push('console: '+t); });
await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Hvilken dag skriver jeg til ---');
sjekk('datofeltet står over øvelsene', await p.locator('#okt-dato').isVisible());
sjekk('det står på i dag', (await p.inputValue('#okt-dato')) === feltIDag, await p.inputValue('#okt-dato'));
const dagNavn = await p.locator('#okt-dag-navn').textContent();
sjekk('dagen skrives med navn', /dag \d+\./.test(dagNavn), dagNavn);
sjekk('lagreknappen sier hvilken dag', (await p.locator('#lagre-dag').textContent()) === dagNavn,
  (await p.locator('#lagre-dag').textContent()));

console.log('--- Utfylling forplanter seg ---');
await p.fill('#v-knebøy-0','6.5');
await p.waitForTimeout(200);
sjekk('vekta fylles i runde 2', (await p.inputValue('#v-knebøy-1')) === '6.5', await p.inputValue('#v-knebøy-1'));
sjekk('vekta fylles i runde 3', (await p.inputValue('#v-knebøy-2')) === '6.5');
sjekk('reps står tomme ennå', (await p.inputValue('#r-knebøy-1')) === '');
await p.fill('#r-knebøy-0','8');
await p.waitForTimeout(200);
sjekk('reps fylles i runde 2 og 3', (await p.inputValue('#r-knebøy-1')) === '8' && (await p.inputValue('#r-knebøy-2')) === '8');
sjekk('andre øvelser er urørt', (await p.inputValue('#v-press-1')) === '');

console.log('--- Rettet runde blir stående ---');
await p.fill('#r-knebøy-2','6');
await p.waitForTimeout(200);
await p.fill('#v-knebøy-0','7');
await p.waitForTimeout(250);
sjekk('runde 2 følger etter', (await p.inputValue('#v-knebøy-1')) === '7');
sjekk('rettet runde 3 beholder sine reps', (await p.inputValue('#r-knebøy-2')) === '6',
  'R3 reps = ' + (await p.inputValue('#r-knebøy-2')));
sjekk('men vekta i runde 3 er ikke rørt av deg, så den følger', (await p.inputValue('#v-knebøy-2')) === '7',
  'R3 vekt = ' + (await p.inputValue('#v-knebøy-2')));

console.log('--- Lagring til valgt dag ---');
await p.fill('#okt-dato','2026-08-19');
await p.waitForTimeout(250);
sjekk('dagnavnet følger valget', (await p.locator('#okt-dag-navn').textContent()).includes('Onsdag 19. aug'),
  await p.locator('#okt-dag-navn').textContent());
sjekk('lagreknappen følger valget', (await p.locator('#lagre-dag').textContent()).includes('Onsdag 19. aug'));
await p.locator('#lagre').click();
await p.waitForFunction(() => document.querySelector('#antall')?.textContent === '1', null, {timeout:6000});
const lagret = await p.evaluate(async () => {
  const uid = JSON.parse(localStorage.getItem('bedrelivUser')).id;
  const r = await fetch('/api/okter?userId=' + uid);
  return (await r.json()).okter[0];
});
sjekk('økta ble lagret på valgt dag', lagret.dato.slice(0,10) === '2026-08-19', lagret.dato);
sjekk('alle tre rundene kom med', lagret.ovelser['knebøy'].length === 3, JSON.stringify(lagret.ovelser['knebøy']));
sjekk('den rettede runden er bevart', lagret.ovelser['knebøy'][2].reps === 6, JSON.stringify(lagret.ovelser['knebøy'][2]));
sjekk('loggen viser valgt dag', (await p.locator('.okt-dato').first().textContent()).includes('Onsdag 19. aug'));
sjekk('datofeltet står på i dag igjen', (await p.inputValue('#okt-dato')) === feltIDag, await p.inputValue('#okt-dato'));
sjekk('lagreknappen er tilbake til i dag', (await p.locator('#lagre-dag').textContent()) === dagNavn);

console.log('--- Fokus forplanter også ---');
await p.locator('#fokus-start').click(); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelectorAll('.prikk')[0].click()); await p.waitForTimeout(300);
await p.fill('#fv','12'); await p.fill('#fr','9');
await p.waitForTimeout(250);
await p.evaluate(() => document.querySelectorAll('.prikk')[5].click()); await p.waitForTimeout(300);
sjekk('runde 2 i fokus er forhåndsfylt', (await p.inputValue('#fv')) === '12' && (await p.inputValue('#fr')) === '9',
  'fv=' + (await p.inputValue('#fv')) + ' fr=' + (await p.inputValue('#fr')));
await p.keyboard.press('Escape'); await p.waitForTimeout(400);

await p.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Dag og utfylling virker.');
