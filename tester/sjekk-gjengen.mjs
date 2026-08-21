import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

// Faste datoer i denne uka og de forrige, regnet fra i dag.
const mandag = (uker) => { const d = new Date(); d.setHours(12,0,0,0);
  d.setDate(d.getDate() - ((d.getDay()+6)%7) - uker*7); return d; };
const dag = (uker, n) => { const d = mandag(uker); d.setDate(d.getDate()+n); return d.toISOString(); };

const b = await chromium.launch();
const lagBruker = async (navn, pin, okter) => {
  const p = await b.newPage({ viewport:{width:390,height:844} });
  // Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
  // å gi opp. Vi svarer med et tomt stilark i stedet: da tar sidelastingen
  // 0,1 sekund, og det oppstår ingen konsollfeil å måtte filtrere bort.
  await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
  p.on('pageerror', e => feil.push(navn+': JS-feil ' + e.message));
  await p.goto(B);
  await p.locator('#port-bytt').click();
  await p.fill('#p-navn',navn); await p.fill('#p-pin',pin); await p.fill('#p-pin2',pin);
  await p.locator('#port-knapp').click();
  await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
  for (const [ov, d] of okter) await p.evaluate(async ([o,dd]) => { await window.Api.saveOkt(o, dd); }, [ov, d]);
  return p;
};

// Rune: to økter denne uka + to hver de tre forrige -> 4 uker på rad. Går oppover.
const runeOkter = [];
[3,2,1].forEach((u,i) => {
  const v = 20 + i*2;
  runeOkter.push([{ 'knebøy':{vekt:v,reps:10}, press:{vekt:12+i,reps:8} }, dag(u,0)]);
  runeOkter.push([{ 'knebøy':{vekt:v,reps:10}, press:{vekt:12+i,reps:8} }, dag(u,3)]);
});
runeOkter.push([{ 'knebøy':{vekt:26,reps:10}, press:{vekt:15,reps:8} }, dag(0,0)]);
runeOkter.push([{ 'knebøy':{vekt:28,reps:10}, press:{vekt:16,reps:8} }, dag(0,2)]);

// Kari: én økt denne uka, stort byks i knebøy -> skal ta Ukas løft
const kariOkter = [
  [{ 'knebøy':{vekt:10,reps:10} }, dag(1,1)],
  [{ 'knebøy':{vekt:14,reps:10} }, dag(0,1)]
];
// Ola: ingen økter denne uka
const olaOkter = [
  [{ 'knebøy':{vekt:20,reps:10} }, dag(2,1)],
  [{ 'knebøy':{vekt:18,reps:10} }, dag(1,1)]
];

const pRune = await lagBruker('Rune','1111', runeOkter);
const pKari = await lagBruker('Kari','2222', kariOkter);
const pOla  = await lagBruker('Ola','3333', olaOkter);

await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Min logg skal ikke blandes med gjengens ---');
sjekk('teller bare mine egne økter', (await pRune.locator('#antall').textContent()) === '8',
  (await pRune.locator('#antall').textContent()) + ' (skal være 8)');
sjekk('loggen viser bare mine økter', (await pRune.locator('.okt').count()) === 8,
  (await pRune.locator('.okt').count()) + ' rader');
sjekk('«forrige» er min egen, ikke en venns', (await pRune.locator('#rad-knebøy .forrige').textContent()).includes('28 kg × 10'),
  (await pRune.locator('#rad-knebøy .forrige').textContent()).trim());
sjekk('min utvikling regner bare på meg', (await pRune.locator('.utv-rad', { hasText:'GOBLET KNEBØY' }).locator('.utv-dom').textContent()).includes('Oppover'));

console.log('--- Gjengen ---');
sjekk('gjengdelen finnes', (await pRune.locator('h2.gj-seksjon').count()) === 1);
sjekk('alle tre vises', (await pRune.locator('.gj-rad').count()) === 3,
  (await pRune.locator('.gj-rad').count()) + ' rader');
const navn = await pRune.locator('.gj-hode b').allTextContents();
sjekk('jeg er merket som meg', navn.some(n => n.includes('Rune') && n.includes('(deg)')), navn.join(' | '));
sjekk('mest aktive øverst', navn[0].includes('Rune'), navn.join(' | '));
sjekk('Ola uten økter denne uka er nederst', navn[2].includes('Ola'), navn.join(' | '));

const runeRad = pRune.locator('.gj-rad', { hasText: 'RUNE' });
sjekk('to fylte ruter for meg denne uka', (await runeRad.locator('.gj-uke i.fylt').count()) === 2);
const olaRad = pRune.locator('.gj-rad', { hasText: 'OLA' });
sjekk('ingen fylte ruter for Ola', (await olaRad.locator('.gj-uke i.fylt').count()) === 0);
sjekk('uker på rad telles', (await runeRad.locator('.gj-under').textContent()).includes('4 uker på rad'),
  (await runeRad.locator('.gj-under').textContent()).trim());
sjekk('retningen vises per person', (await runeRad.locator('.gj-dom').textContent()).includes('Oppover'));

console.log('--- Ukas løft: relativ, ikke tyngst ---');
const loft = await pRune.locator('.gj-loft').textContent();
sjekk('Kari vinner med 40 % på 14 kg', loft.includes('Kari'), loft.replace(/\s+/g,' ').trim());
sjekk('viser prosenten', loft.includes('+40 %'), loft.replace(/\s+/g,' ').trim());
sjekk('Rune med tyngre vekter vinner ikke', !loft.includes('Rune'));

console.log('--- Min skjerm, mine valg ---');
await pRune.locator('.gj-rad', { hasText:'OLA' }).locator('.gj-x').click();
await pRune.waitForTimeout(250);
sjekk('kan skjule en person fra egen visning', (await pRune.locator('.gj-rad').count()) === 2);
sjekk('skjulte listes med vei tilbake', (await pRune.locator('.gj-skjulte').textContent()).includes('Ola'));
sjekk('jeg kan ikke skjule meg selv', (await runeRad.locator('.gj-x').count()) === 0);
await pRune.locator('[data-vis]').click(); await pRune.waitForTimeout(250);
sjekk('kan hente personen tilbake', (await pRune.locator('.gj-rad').count()) === 3);

await pRune.locator('#gj-bryter').click(); await pRune.waitForTimeout(250);
sjekk('kan legge bort hele gjengen', (await pRune.locator('.gj-rad').count()) === 0);
sjekk('sier at de andre fortsatt ser deg', (await pRune.locator('#innhold').textContent()).includes('De andre ser deg fortsatt'));
await pRune.reload(); await pRune.waitForSelector('#innhold:not([hidden])'); await pRune.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('valget huskes etter refresh', (await pRune.locator('.gj-rad').count()) === 0);
await pRune.locator('#gj-bryter').click(); await pRune.waitForTimeout(250);
sjekk('kan hentes fram igjen', (await pRune.locator('.gj-rad').count()) === 3);

console.log('--- Kari ser det samme, fra sin side ---');
await pKari.reload(); await pKari.waitForSelector('#innhold:not([hidden])'); await pKari.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('Kari ser alle tre', (await pKari.locator('.gj-rad').count()) === 3);
const kariNavn = await pKari.locator('.gj-hode b').allTextContents();
sjekk('Kari er merket som seg selv', kariNavn.some(n => n.includes('Kari') && n.includes('(deg)')), kariNavn.join(' | '));
sjekk('Kari teller bare sine to økter', (await pKari.locator('#antall').textContent()) === '2');
sjekk('Runes skjuling gjelder ikke Karis skjerm', (await pKari.locator('.gj-skjulte').count()) === 0);

console.log('--- Invitasjon ---');
sjekk('inviter-knappen finnes', await pRune.locator('#inviter').isVisible());

await pRune.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Gjengen virker.');
