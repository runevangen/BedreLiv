import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const lag = async (navn, pin, okter) => {
  const p = await b.newPage({ viewport:{width:390,height:844} });
  // Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
  // å gi opp. Vi svarer med et tomt stilark i stedet: da tar sidelastingen
  // 0,1 sekund, og det oppstår ingen konsollfeil å måtte filtrere bort.
  await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
  p.on('pageerror', e => feil.push(navn+': JS-feil ' + e.message));
  p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|40[0-9]/.test(t)) feil.push(navn+' console: '+t); });
  await p.goto(B);
  await p.locator('#port-bytt').click();
  await p.fill('#p-navn',navn); await p.fill('#p-pin',pin); await p.fill('#p-pin2',pin);
  await p.locator('#port-knapp').click();
  await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  for (const o of okter) await p.evaluate(async (oo) => { await window.Api.saveOkt(oo); }, o);
  await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  return p;
};

const pRune = await lag('Rune','1111', [{ 'knebøy':{vekt:24,reps:10} }, { 'knebøy':{vekt:26,reps:10} }]);
const pKari = await lag('Kari','2222', [{ 'knebøy':{vekt:12,reps:10} }]);
const pOla  = await lag('Ola','3333',  [{ 'knebøy':{vekt:18,reps:10} }]);
await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

const rad = (p, navn) => p.locator('.gj-rad', { hasText: navn });

console.log('--- Knappen ---');
sjekk('Kari ser heiaknapp på Rune', await rad(pKari,'RUNE').locator('.gj-heia').isVisible());
sjekk('Kari har ingen heiaknapp på seg selv', (await rad(pKari,'KARI').locator('.gj-heia').count()) === 0);
sjekk('ingen teller før noen har heiet', (await rad(pKari,'RUNE').locator('.gj-heia span').count()) === 0);
sjekk('ingen heiere-linje før noen har heiet', (await rad(pKari,'RUNE').locator('.gj-heiere').count()) === 0);

console.log('--- Kari heier på Rune ---');
await rad(pKari,'RUNE').locator('.gj-heia').click();
await pKari.waitForTimeout(600);
sjekk('telleren viser 1', (await rad(pKari,'RUNE').locator('.gj-heia span').textContent()) === '1');
sjekk('knappen er markert som min', await rad(pKari,'RUNE').locator('.gj-heia').evaluate(el => el.classList.contains('mitt')));
sjekk('linja sier at du heier', (await rad(pKari,'RUNE').locator('.gj-heiere').textContent()).includes('Du heier'),
  (await rad(pKari,'RUNE').locator('.gj-heiere').textContent()).trim());

console.log('--- Ola heier også ---');
await pOla.reload(); await pOla.waitForSelector('#innhold:not([hidden])'); await pOla.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('Ola ser Karis heiarop', (await rad(pOla,'RUNE').locator('.gj-heia span').textContent()) === '1');
sjekk('Ola ser Kari ved navn', (await rad(pOla,'RUNE').locator('.gj-heiere').textContent()).includes('Kari'));
sjekk('Olas knapp er ikke markert som hans', !(await rad(pOla,'RUNE').locator('.gj-heia').evaluate(el => el.classList.contains('mitt'))));
await rad(pOla,'RUNE').locator('.gj-heia').click();
await pOla.waitForTimeout(600);
sjekk('telleren viser 2', (await rad(pOla,'RUNE').locator('.gj-heia span').textContent()) === '2');
sjekk('«Du» står først i lista', (await rad(pOla,'RUNE').locator('.gj-heiere').textContent()).trim().startsWith('Du'),
  (await rad(pOla,'RUNE').locator('.gj-heiere').textContent()).trim());

console.log('--- Rune ser det på sin egen rad ---');
await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
const minRad = rad(pRune,'RUNE');
sjekk('Rune ser hvem som heier på ham', (await minRad.locator('.gj-heiere').textContent()).includes('Kari') &&
  (await minRad.locator('.gj-heiere').textContent()).includes('Ola'),
  (await minRad.locator('.gj-heiere').textContent()).trim());
sjekk('Rune kan ikke heie på seg selv', (await minRad.locator('.gj-heia').count()) === 0);
sjekk('Rune ser ikke «Du» blant heierne', !(await minRad.locator('.gj-heiere').textContent()).includes('Du'));

console.log('--- Trykk igjen tar det bort ---');
await rad(pKari,'RUNE').locator('.gj-heia').click();
await pKari.waitForTimeout(600);
sjekk('telleren faller til 1', (await rad(pKari,'RUNE').locator('.gj-heia span').textContent()) === '1');
sjekk('knappen er ikke lenger min', !(await rad(pKari,'RUNE').locator('.gj-heia').evaluate(el => el.classList.contains('mitt'))));
sjekk('bare Ola står igjen', (await rad(pKari,'RUNE').locator('.gj-heiere').textContent()).includes('Ola') &&
  !(await rad(pKari,'RUNE').locator('.gj-heiere').textContent()).includes('Du'));

console.log('--- Overlever refresh ---');
await pKari.reload(); await pKari.waitForSelector('#innhold:not([hidden])'); await pKari.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('heiaropet er lagret på serveren', (await rad(pKari,'RUNE').locator('.gj-heia span').textContent()) === '1');

await pOla.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Heiarop virker.');
