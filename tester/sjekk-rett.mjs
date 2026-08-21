import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch({ args: ['--host-resolver-rules=MAP fonts.googleapis.com 127.0.0.1, MAP fonts.gstatic.com 127.0.0.1'] });
const lag = async (navn, pin, okter) => {
  const p = await b.newPage({ viewport:{width:390,height:844} });
  p.on('pageerror', e => feil.push(navn+': JS-feil ' + e.message));
  p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|40[0-9]/.test(t)) feil.push(navn+' console: '+t); });
  await p.goto(B);
  await p.locator('#port-bytt').click();
  await p.fill('#p-navn',navn); await p.fill('#p-pin',pin); await p.fill('#p-pin2',pin);
  await p.locator('#port-knapp').click();
  await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  for (const [o,d] of okter) await p.evaluate(async ([oo,dd]) => { await window.Api.saveOkt(oo, dd); }, [o,d]);
  await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  return p;
};

// Rune: tre økter, stigende -> «Oppover»
const pRune = await lag('Rune','1111', [
  [{ 'knebøy':{vekt:20,reps:10} }, '2026-08-03T17:00:00Z'],
  [{ 'knebøy':{vekt:22,reps:10} }, '2026-08-10T17:00:00Z'],
  [{ 'knebøy':{vekt:24,reps:10} }, '2026-08-17T17:00:00Z']
]);
const pKari = await lag('Kari','2222', [[{ 'knebøy':{vekt:12,reps:10} }, '2026-08-17T17:00:00Z']]);

console.log('--- Inngangen ---');
sjekk('øktene i loggen er trykkbare', (await pRune.locator('.okt-knapp').count()) === 3);
sjekk('det står «rett opp» på dem', (await pRune.locator('.okt-rett').first().textContent()) === 'rett opp');
sjekk('rettevinduet er lukket', !(await pRune.locator('#rett').isVisible()));

console.log('--- Åpne og lese ---');
await pRune.locator('.okt-knapp').first().click();   // nyeste øverst = 17. aug, 24 kg
await pRune.waitForTimeout(300);
sjekk('rettevinduet åpner', await pRune.locator('#rett').isVisible());
sjekk('dekker skjermen', Math.abs((await pRune.locator('#rett').boundingBox()).height - 844) <= 2);
sjekk('tallene er fylt inn', (await pRune.inputValue('#rv-knebøy-0')) === '24' && (await pRune.inputValue('#rr-knebøy-0')) === '10');
sjekk('datoen er fylt inn', (await pRune.inputValue('#rett-dato')) === '2026-08-17');
sjekk('alle fem øvelsene kan redigeres', (await pRune.locator('.rett-ovelse').count()) === 5);
sjekk('øvelser uten tall står tomme', (await pRune.inputValue('#rv-press-0')) === '');

console.log('--- Trenden justeres etter retting ---');
const retning = async () => (await pRune.locator('.utv-rad', { hasText:'GOBLET KNEBØY' }).locator('.utv-dom').textContent()).trim();
await pRune.locator('#rett-avbryt').click(); await pRune.waitForTimeout(300);
sjekk('før retting: oppover', (await retning()).includes('Oppover'), await retning());

// Snu siste økt fra 24 til 14 kg -> serien 20, 22, 14 skal gi «Lettere»
await pRune.locator('.okt-knapp').first().click(); await pRune.waitForTimeout(300);
await pRune.fill('#rv-knebøy-0','14');
await pRune.locator('#rett-lagre').click();
await pRune.waitForTimeout(1200);
sjekk('vinduet lukkes etter lagring', !(await pRune.locator('#rett').isVisible()));
sjekk('kvittering i loggen', (await pRune.locator('#kvittering').textContent()).includes('rettet opp'),
  (await pRune.locator('#kvittering').textContent()).trim());
sjekk('etter retting: lettere', (await retning()).includes('Lettere'), await retning());
sjekk('loggen viser det nye tallet', (await pRune.locator('.okt-knapp').first().textContent()).includes('Knebøy 14×10'));
sjekk('«forrige økt» følger med', (await pRune.locator('#rad-knebøy .forrige').textContent()).includes('14 kg × 10'));

console.log('--- Heiarop forsvinner når tallene endres ---');
await pKari.reload(); await pKari.waitForSelector('#innhold:not([hidden])'); await pKari.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
await pKari.locator('.gj-rad', { hasText:'RUNE' }).locator('.gj-heia').click();
await pKari.waitForTimeout(700);
sjekk('Kari har heiet', (await pKari.locator('.gj-rad', { hasText:'RUNE' }).locator('.gj-heia span').textContent()) === '1');
await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('Rune ser heiaropet', (await pRune.locator('.gj-rad', { hasText:'RUNE' }).locator('.gj-heiere').count()) === 1);
sjekk('rettevinduet varsler om heiaropet', await pRune.locator('.okt-knapp').first().click().then(async () => {
  await pRune.waitForTimeout(300);
  return (await pRune.locator('.rett-varsel').textContent()).includes('heiaropet');
}), (await pRune.locator('.rett-varsel').textContent()).trim().slice(-90));
await pRune.fill('#rv-knebøy-0','16');
await pRune.locator('#rett-lagre').click(); await pRune.waitForTimeout(1200);
sjekk('heiaropet er borte etter endring', (await pRune.locator('.gj-rad', { hasText:'RUNE' }).locator('.gj-heiere').count()) === 0);

console.log('--- Bare dato endret: heiaropet står ---');
await pKari.reload(); await pKari.waitForSelector('#innhold:not([hidden])'); await pKari.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
await pKari.locator('.gj-rad', { hasText:'RUNE' }).locator('.gj-heia').click(); await pKari.waitForTimeout(700);
await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
await pRune.locator('.okt-knapp').first().click(); await pRune.waitForTimeout(300);
await pRune.fill('#rett-dato','2026-08-19');
await pRune.locator('#rett-lagre').click(); await pRune.waitForTimeout(1200);
sjekk('heiaropet overlevde en ren datoflytting', (await pRune.locator('.gj-rad', { hasText:'RUNE' }).locator('.gj-heiere').count()) === 1);
sjekk('datoen er flyttet i loggen', (await pRune.locator('.okt-knapp').first().textContent()).includes('19. aug'),
  (await pRune.locator('.okt-knapp').first().locator('.okt-dato').textContent()).trim());

console.log('--- Vern ---');
await pRune.locator('.okt-knapp').first().click(); await pRune.waitForTimeout(300);
for (const ov of ['knebøy','press','roing','markloft','utfall']) {
  for (let r=0;r<3;r++){ await pRune.fill('#rv-'+ov+'-'+r,''); await pRune.fill('#rr-'+ov+'-'+r,''); }
}
await pRune.locator('#rett-lagre').click(); await pRune.waitForTimeout(400);
sjekk('nekter å lagre en tom økt', (await pRune.locator('#rett-melding').textContent()).includes('minst ett løft'));
sjekk('vinduet står åpent', await pRune.locator('#rett').isVisible());
await pRune.keyboard.press('Escape'); await pRune.waitForTimeout(300);
sjekk('Escape lukker uten å lagre', !(await pRune.locator('#rett').isVisible()));
sjekk('tallet er uendret etter avbrutt redigering', (await pRune.locator('.okt-knapp').first().textContent()).includes('Knebøy 16×10'));

console.log('--- Slette én økt ---');
pRune.on('dialog', d => d.accept());
const forFor = await pRune.locator('.okt-knapp').count();
await pRune.locator('.okt-knapp').first().click(); await pRune.waitForTimeout(300);
await pRune.locator('#rett-slett').click(); await pRune.waitForTimeout(1400);
sjekk('vinduet lukkes', !(await pRune.locator('#rett').isVisible()));
sjekk('én økt færre', (await pRune.locator('.okt-knapp').count()) === forFor - 1,
  forFor + ' → ' + (await pRune.locator('.okt-knapp').count()));
sjekk('telleren er oppdatert', (await pRune.locator('#antall').textContent()) === String(forFor - 1));
sjekk('kvittering om sletting', (await pRune.locator('#kvittering').textContent()).includes('slettet'));
await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('slettingen er lagret på serveren', (await pRune.locator('.okt-knapp').count()) === forFor - 1);
sjekk('Karis økt er urørt', (await pKari.locator('#antall').textContent()) === '1');

await pRune.locator('.okt-knapp').first().click(); await pRune.waitForTimeout(300);
await pRune.screenshot({ path: process.env.SHOT });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Retting og sletting virker.');
