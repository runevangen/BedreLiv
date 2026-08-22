// Drakta fra UltimatePizza: Forno-paletten, Archivo-fontene, topplinja og
// versjonsmekanikken. Settet passer på at begge temaene faktisk bytter alle
// flatene, at teksten holder WCAG AA mot flata den står på, og at ingenting
// faller tilbake til nettleserens standardfont.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { ekteFonter } from './rigg/fonter.mjs';
import { readFileSync } from 'node:fs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const VERSJON = (readFileSync(new URL('../changelog.js', import.meta.url), 'utf8')
  .match(/"v":\s*"([\d.]+)"/) || [])[1];

// WCAG-kontrast, regnet på de fargene nettleseren faktisk maler.
const relL = ([r,g,b]) => {
  const f = c => { c/=255; return c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4; };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
};
const rgb = (s) => s.match(/\d+/g).slice(0,3).map(Number);
const kontrast = (a, b) => {
  const [x, y] = [relL(rgb(a)), relL(rgb(b))];
  return (Math.max(x,y) + 0.05) / (Math.min(x,y) + 0.05);
};

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844} });
await ekteFonter(p, B);
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Drakt'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])');
await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

const tema = () => p.evaluate(() => document.documentElement.getAttribute('data-tema'));
const stil = (sel, egenskap) => p.locator(sel).first().evaluate((el, e) => getComputedStyle(el)[e], egenskap);

console.log('--- Topplinja ---');
sjekk('topplinja er klistret øverst', (await stil('.topplinje','position')) === 'sticky');
sjekk('appnavnet står der', (await p.locator('.topplinje-tittel > span').textContent()).includes('Bedreliv'));
sjekk('stempelet viser navn og dag', /^Drakt · \S+ \d+\./.test(await p.locator('#stempel').textContent()),
  await p.locator('#stempel').textContent());
await p.evaluate(() => window.scrollTo(0, 900));
await p.waitForTimeout(200);
const boks = await p.locator('.topplinje').boundingBox();
sjekk('topplinja blir stående når du blar', boks.y <= 1, 'y=' + Math.round(boks.y));
await p.evaluate(() => window.scrollTo(0, 0));

console.log('--- Versjonsmekanikken ---');
sjekk('versjonen leses av endringsloggen', (await p.locator('#versjon').textContent()) === 'v' + VERSJON,
  (await p.locator('#versjon').textContent()) + ' mot v' + VERSJON);
sjekk('versjonen står rett bak appnavnet',
  await p.locator('.topplinje-tittel > span > .versjon').isVisible());
await p.locator('#versjon').click(); await p.waitForTimeout(250);
sjekk('trykk åpner endringsloggen', await p.locator('#endringer.apen').isVisible());
sjekk('nyeste versjon øverst', (await p.locator('.endr-nr b').first().textContent()) === 'v' + VERSJON);
await p.locator('#endr-lukk').click(); await p.waitForTimeout(200);

console.log('--- Fontene ---');
const familie = async (sel) => (await stil(sel, 'fontFamily')).split(',')[0].replace(/["']/g,'');
sjekk('overskriften bruker display-fonten', (await familie('.masthead h1')) === 'Archivo Black',
  await familie('.masthead h1'));
sjekk('øvelsesnavnet bruker display-fonten', (await familie('.navn')) === 'Archivo Black');
sjekk('brødteksten bruker Archivo', (await familie('.banner')) === 'Archivo', await familie('.banner'));
sjekk('tallfeltene bruker mono', (await familie('#v-knebøy-0')) === 'IBM Plex Mono',
  await familie('#v-knebøy-0'));
sjekk('versjonen bruker mono', (await familie('.versjon')) === 'IBM Plex Mono');
// Fokus, «Endre» og endringsloggen ligger utenfor #app. Arver de ikke fonten
// fra body, faller brødteksten der tilbake til nettleserens serif.
await p.locator('#fokus-start').click(); await p.waitForTimeout(300);
sjekk('fokus arver fonten fra body', (await familie('.fokus-slik')) === 'Archivo',
  await familie('.fokus-slik'));
await p.keyboard.press('Escape'); await p.waitForTimeout(250);

console.log('--- Temaene ---');
const flater = ['body', '.rad', '.topplinje'];
const tekster = [
  ['.masthead h1', 'body'], ['.kicker', 'body'], ['.banner', 'body'],
  ['.navn', '.rad'], ['.rad-sum', '.rad'], ['.forrige', '.rad'],
  ['.hvordan-tekst .slik', '.rad'], ['.hvordan-tekst .feil', '.rad'],
  ['.topplinje-tittel small', '.topplinje'], ['.versjon', '.topplinje'],
];
// Nettleseren står lyst som standard. Vi sier det eksplisitt, så «system»
// har et kjent svar å følge.
await p.emulateMedia({ colorScheme: 'light' });
for (const [navn, forventet] of [['mørkt', null], ['lyst', 'lys']]) {
  if (navn !== 'mørkt') { await p.locator('#tema').click(); await p.waitForTimeout(250); }
  sjekk('temaet er ' + navn, (await tema()) === forventet, String(await tema()));
  const bg = {};
  for (const f of flater) bg[f] = await stil(f, 'backgroundColor');
  for (const [sel, flate] of tekster) {
    const k = kontrast(await stil(sel, 'color'), bg[flate]);
    sjekk('  ' + navn + ': ' + sel + ' mot ' + flate, k >= 4.5, k.toFixed(2) + ':1');
  }
}
console.log('--- «System» følger telefonen ---');
await p.locator('#tema').click(); await p.waitForTimeout(250);   // lys -> system
sjekk('system følger lys telefon', (await tema()) === 'lys', String(await tema()));
await p.emulateMedia({ colorScheme: 'dark' }); await p.waitForTimeout(250);
sjekk('system snur når telefonen snur', (await tema()) === null, String(await tema()));
await p.locator('#tema').click(); await p.waitForTimeout(250);   // system -> mørk
sjekk('fjerde trykk er tilbake på mørkt', (await tema()) === null, String(await tema()));

await p.locator('#tema').click(); await p.waitForTimeout(250);   // mørk -> lys
await p.reload();
await p.waitForSelector('#innhold:not([hidden])');
sjekk('temavalget overlever omstart', (await tema()) === 'lys', String(await tema()));

await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f => console.log(' - ' + f)); process.exit(1); }
console.log('Drakta sitter: palett, fonter, topplinje og versjon.');
