// Største tekstnivå skal holde på den minste skjermen — og fokus skal bruke
// det uansett hva som er valgt ellers, siden telefonen ofte ligger et stykke
// unna mens man trener.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();

for (const [bredde, hoyde, navn] of [[375, 667, 'iPhone SE'], [390, 844, 'iPhone 14']]) {
  const p = await b.newPage({ viewport: { width: bredde, height: hoyde } });
  // Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
  // å gi opp. Vi svarer med et tomt stilark i stedet: da tar sidelastingen
  // 0,1 sekund, og det oppstår ingen konsollfeil å måtte filtrere bort.
  await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
  p.on('pageerror', (e) => feil.push(navn + ': JS-feil ' + e.message));
  await p.goto(B);
  await p.locator('#port-bytt').click();
  await p.fill('#p-navn', 'Bruker' + bredde); await p.fill('#p-pin', '1234'); await p.fill('#p-pin2', '1234');
  await p.locator('#port-knapp').click();
  await p.waitForSelector('#innhold:not([hidden])');
  await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

  console.log('--- ' + navn + ', største tekst ---');
  await p.locator('#tekststorrelse button[data-skala="storst"]').click();
  await p.waitForTimeout(200);
  const sideScroll = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  sjekk(navn + ': ingen sidescroll i loggen', !sideScroll);
  const feltH = await p.locator('#v-knebøy-0').evaluate(el => el.getBoundingClientRect().height);
  sjekk(navn + ': tallfeltene vokser med', feltH > 34, Math.round(feltH) + 'px');

  console.log('--- ' + navn + ', fokus ---');
  await p.locator('#tekststorrelse button[data-skala="normal"]').click();
  await p.waitForTimeout(200);
  const normalH1 = await p.locator('.masthead h1').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await p.locator('#fokus-start').click();
  await p.waitForTimeout(300);
  const iFokus = await p.evaluate(() => document.documentElement.getAttribute('data-skala'));
  sjekk(navn + ': fokus setter største trinn', iFokus === 'storst', String(iFokus));
  const fokusScroll = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  sjekk(navn + ': ingen sidescroll i fokus', !fokusScroll);
  const bunn = await p.locator('.fokus-bunn').boundingBox();
  sjekk(navn + ': knappene er synlige nederst', bunn.y + bunn.height <= hoyde + 1 && bunn.y > 0,
    'y=' + Math.round(bunn.y));
  const fv = await p.locator('#fv').boundingBox();
  sjekk(navn + ': vektfeltet får plass i bredden', fv.x >= 0 && fv.x + fv.width <= bredde,
    Math.round(fv.x) + '–' + Math.round(fv.x + fv.width) + ' av ' + bredde);
  // Telleren skal stå på én linje: brekker den, dyttes lukkeknappen ned og
  // toppen ser slurvete ut.
  const tellerLinjer = await p.locator('.fokus-teller').evaluate(el => ({
    hoyde: el.getBoundingClientRect().height,
    px: parseFloat(getComputedStyle(el).fontSize),
    hoyre: el.getBoundingClientRect().right,
  }));
  const kryss = await p.locator('#fokus-lukk').boundingBox();
  sjekk(navn + ': telleren står på én linje', tellerLinjer.hoyde < tellerLinjer.px * 1.8,
    Math.round(tellerLinjer.hoyde) + 'px mot ' + tellerLinjer.px + 'px skrift');
  sjekk(navn + ': telleren kolliderer ikke med lukkeknappen', tellerLinjer.hoyre <= kryss.x + 1,
    Math.round(tellerLinjer.hoyre) + ' mot ' + Math.round(kryss.x));

  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const etter = await p.evaluate(() => document.documentElement.getAttribute('data-skala'));
  sjekk(navn + ': valget er tilbake etter fokus', etter === null, String(etter));
  const h1Etter = await p.locator('.masthead h1').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  sjekk(navn + ': skriften er tilbake til normal', h1Etter === normalH1, h1Etter + ' mot ' + normalH1);

  if (process.env.SHOT && bredde === 375) await p.screenshot({ path: process.env.SHOT });
  await p.close();
}

await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f => console.log(' - ' + f)); process.exit(1); }
console.log('Største tekst holder, og fokus bruker den.');
