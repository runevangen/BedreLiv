import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch({ args: ['--host-resolver-rules=MAP fonts.googleapis.com 127.0.0.1, MAP fonts.gstatic.com 127.0.0.1'] });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true });
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|401/.test(t)) feil.push('console: '+t); });

await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Sammenleggbar utførelse ---');
sjekk('utførelsen er skjult som standard', !(await p.locator('.hvordan-mer').first().isVisible()));
sjekk('figurene står likevel', await p.locator('.figurer').first().isVisible());
sjekk('antall manualer står likevel', await p.locator('.utstyr').first().isVisible());
sjekk('knappen sier «Vis utførelse»', (await p.locator('.vis-mer').first().textContent()) === 'Vis utførelse');
const hoyFor = (await p.locator('#rad-knebøy').boundingBox()).height;
await p.locator('.vis-mer').first().click(); await p.waitForTimeout(150);
sjekk('trykk åpner utførelsen', await p.locator('.hvordan-mer').first().isVisible());
sjekk('knappen sier «Skjul utførelse»', (await p.locator('.vis-mer').first().textContent()) === 'Skjul utførelse');
const hoyEtter = (await p.locator('#rad-knebøy').boundingBox()).height;
sjekk('kortet vokser når du åpner', hoyEtter > hoyFor, Math.round(hoyFor)+' → '+Math.round(hoyEtter)+'px');
await p.locator('.vis-mer').first().click(); await p.waitForTimeout(150);
sjekk('trykk igjen lukker', !(await p.locator('.hvordan-mer').first().isVisible()));
sjekk('bare ett kort påvirkes', (await p.locator('.hvordan-mer').nth(1).isVisible()) === false);

console.log('--- Tekststørrelse ---');
const les = () => p.locator('.masthead h1').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
const normal = await les();
sjekk('velgeren finnes', await p.locator('#tekststorrelse').isVisible());
sjekk('«normal» er valgt fra start', await p.locator('#tekststorrelse button[data-skala="normal"]').evaluate(el => el.classList.contains('valgt')));
await p.locator('#tekststorrelse button[data-skala="storst"]').click(); await p.waitForTimeout(150);
const storst = await les();
sjekk('størst gjør teksten større', storst > normal, Math.round(normal)+' → '+Math.round(storst)+'px');
await p.locator('#tekststorrelse button[data-skala="liten"]').click(); await p.waitForTimeout(150);
const liten = await les();
sjekk('liten gjør teksten mindre', liten < normal, Math.round(normal)+' → '+Math.round(liten)+'px');
const feltStr = await p.locator('#v-knebøy-0').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
sjekk('tallfeltene holder seg over 16px (ingen iOS-zoom)', feltStr >= 16, feltStr+'px');
const knappStr = await p.locator('#tekststorrelse button[data-skala="normal"]').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
sjekk('selve velgeren skalerer ikke seg selv', knappStr === 13, knappStr+'px');
await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('valget huskes etter refresh', (await les()) === liten);
sjekk('riktig knapp er markert etter refresh', await p.locator('#tekststorrelse button[data-skala="liten"]').evaluate(el => el.classList.contains('valgt')));
await p.locator('#tekststorrelse button[data-skala="normal"]').click(); await p.waitForTimeout(150);

console.log('--- Runder i fokus ---');
await p.locator('#fokus-start').click(); await p.waitForTimeout(250);
sjekk('teller viser runde og øvelse', (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').trim() === 'Runde 1 av 3 · Øvelse 1 av 5');
sjekk('femten prikker', (await p.locator('.prikk').count()) === 15);
sjekk('tre grupper', (await p.locator('.rundegruppe').count()) === 3);
sjekk('første prikk er markert som nå', await p.locator('.prikk').first().evaluate(el => el.classList.contains('na')));
// Bla gjennom runde 1
for (let i=0;i<4;i++){ await p.locator('#fokus-fram').click(); await p.waitForTimeout(80); }
sjekk('siste øvelse i runde 1', (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').trim() === 'Runde 1 av 3 · Øvelse 5 av 5');
sjekk('framknappen sier fortsatt Neste', (await p.locator('#fokus-fram').textContent()).includes('Neste'));
await p.locator('#fokus-fram').click(); await p.waitForTimeout(120);
sjekk('går videre til runde 2, øvelse 1', (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').trim() === 'Runde 2 av 3 · Øvelse 1 av 5');
sjekk('fem prikker er nå gjort', (await p.locator('.prikk.gjort').count()) === 5);
// Hopp med prikk
await p.locator('.prikk').nth(12).click(); await p.waitForTimeout(120);
sjekk('prikk hopper til runde 3', (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').trim() === 'Runde 3 av 3 · Øvelse 3 av 5');
// Til siste steg
await p.locator('.prikk').nth(14).click(); await p.waitForTimeout(120);
sjekk('siste steg i sirkelen', (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').trim() === 'Runde 3 av 3 · Øvelse 5 av 5');
sjekk('framknappen sier Lagre økta', (await p.locator('#fokus-fram').textContent()).includes('Lagre'));

console.log('--- Tall på tvers av runder ---');
await p.locator('.prikk').nth(0).click(); await p.waitForTimeout(120);
await p.fill('#fv','24'); await p.fill('#fr','10');
await p.locator('.prikk').nth(5).click(); await p.waitForTimeout(150);   // samme øvelse, runde 2
sjekk('samme øvelse i runde 2', (await p.locator('.fokus-navn').textContent()) === 'Goblet knebøy');
sjekk('runde 2 er forhåndsfylt fra runde 1', (await p.inputValue('#fv')) === '24', await p.inputValue('#fv'));
sjekk('runde 1 vises som hjelp', (await p.locator('.fokus-tidligere').textContent()).includes('R1 24×10'),
  (await p.locator('.fokus-tidligere').textContent()).trim());

console.log('--- Sveip ---');
await p.locator('.prikk').nth(0).click(); await p.waitForTimeout(120);
const boks = await p.locator('.fokus-rull').boundingBox();
const midtY = boks.y + boks.height * 0.75;
await p.touchscreen.tap(boks.x + boks.width/2, midtY);
// sveip mot venstre = neste
await p.evaluate(([x1,x2,y]) => {
  const el = document.getElementById('fokus');
  const lag = (t, cx) => new TouchEvent(t, { bubbles:true, cancelable:true,
    touches: t==='touchend'?[]:[new Touch({identifier:1, target:el, clientX:cx, clientY:y})],
    changedTouches:[new Touch({identifier:1, target:el, clientX:cx, clientY:y})] });
  el.dispatchEvent(lag('touchstart', x1));
  el.dispatchEvent(lag('touchend', x2));
}, [300, 120, midtY]);
await p.waitForTimeout(150);
sjekk('sveip mot venstre blar fram', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 2'));
await p.evaluate(([x1,x2,y]) => {
  const el = document.getElementById('fokus');
  const lag = (t, cx) => new TouchEvent(t, { bubbles:true, cancelable:true,
    touches: t==='touchend'?[]:[new Touch({identifier:1, target:el, clientX:cx, clientY:y})],
    changedTouches:[new Touch({identifier:1, target:el, clientX:cx, clientY:y})] });
  el.dispatchEvent(lag('touchstart', x1));
  el.dispatchEvent(lag('touchend', x2));
}, [120, 300, midtY]);
await p.waitForTimeout(150);
sjekk('sveip mot høyre blar tilbake', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 1'));
// Kort sveip skal ikke bla
await p.evaluate(([x1,x2,y]) => {
  const el = document.getElementById('fokus');
  const lag = (t, cx) => new TouchEvent(t, { bubbles:true, cancelable:true,
    touches: t==='touchend'?[]:[new Touch({identifier:1, target:el, clientX:cx, clientY:y})],
    changedTouches:[new Touch({identifier:1, target:el, clientX:cx, clientY:y})] });
  el.dispatchEvent(lag('touchstart', x1));
  el.dispatchEvent(lag('touchend', x2));
}, [300, 270, midtY]);
await p.waitForTimeout(150);
sjekk('kort sveip blar ikke', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 1'));

await p.screenshot({ path: process.env.SHOT });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Alt det nye virker.');
