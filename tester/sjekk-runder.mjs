import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844} });
// Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
// å gi opp. Avbrytes den her, tar sidelastingen 0,1 sekund i stedet.
await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|40[0-9]/.test(t)) feil.push('console: '+t); });
await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Tre felt-rader per øvelse ---');
sjekk('tre runderader på knebøy', (await p.locator('#rad-knebøy .runde-linje').count()) === 3);
sjekk('femten runderader totalt', (await p.locator('#innhold .runde-linje').count()) === 15);
const merker = await p.locator('#rad-knebøy .runde-nr').allTextContents();
sjekk('rundene er nummerert', merker.join(',') === ',R1,R2,R3', merker.join(','));
sjekk('hver rad har to felt', (await p.locator('#rad-knebøy .runde-linje input').count()) === 6);

console.log('--- Alle runder lagres ---');
await p.fill('#v-knebøy-0','20'); await p.fill('#r-knebøy-0','10');
await p.fill('#v-knebøy-1','22'); await p.fill('#r-knebøy-1','10');
await p.fill('#v-knebøy-2','18'); await p.fill('#r-knebøy-2','8');
await p.locator('#lagre').click();
await p.waitForFunction(() => document.querySelector('#antall')?.textContent === '1', null, { timeout: 6000 });
const lagret = await p.evaluate(async () => {
  const r = await fetch('/api/okter?userId=' + JSON.parse(localStorage.getItem('bedrelivUser')).id);
  return (await r.json()).okter[0].ovelser['knebøy'];
});
sjekk('tre runder lagret', Array.isArray(lagret) && lagret.length === 3, JSON.stringify(lagret));
sjekk('rekkefølgen er bevart', lagret[0].vekt === 20 && lagret[1].vekt === 22 && lagret[2].vekt === 18);

console.log('--- Sammenlikningen går på beste runde ---');
sjekk('loggen viser beste runde', (await p.locator('.okt-knapp').first().textContent()).includes('Knebøy 22×10'),
  (await p.locator('.okt-tall').first().textContent()).trim());
sjekk('«forrige» viser beste runde', (await p.locator('#rad-knebøy .forrige').textContent()).includes('22 kg × 10'),
  (await p.locator('#rad-knebøy .forrige').textContent()).trim());

// Ny økt: bare to runder, men den tyngste er tyngre -> skal telle som opp
await p.fill('#v-knebøy-0','24'); await p.fill('#r-knebøy-0','10');
await p.waitForTimeout(200);
sjekk('to runder slår tre svakere runder', (await p.locator('#rad-knebøy .dommen').textContent()).includes('opp'),
  (await p.locator('#rad-knebøy .dommen').textContent()).trim());
await p.fill('#v-knebøy-0','15');
await p.waitForTimeout(200);
sjekk('lettere beste runde gir ned', (await p.locator('#rad-knebøy .dommen').textContent()).includes('ned'));
await p.fill('#v-knebøy-1','30'); await p.fill('#r-knebøy-1','10');
await p.waitForTimeout(200);
sjekk('en tung runde nummer to redder dommen', (await p.locator('#rad-knebøy .dommen').textContent()).includes('opp'));

console.log('--- Fokus: én runde om gangen ---');
await p.locator('#fokus-start').click(); await p.waitForTimeout(400);
sjekk('fokus åpner på en uferdig rute', (await p.locator('.fokus-teller').textContent()).includes('Runde'));
await p.evaluate(() => { document.querySelectorAll('.prikk')[0].click(); });
await p.waitForTimeout(300);
sjekk('runde 1 viser sitt eget tall', (await p.inputValue('#fv')) === '15', await p.inputValue('#fv'));
await p.evaluate(() => { document.querySelectorAll('.prikk')[5].click(); });   // runde 2, øvelse 1
await p.waitForTimeout(300);
sjekk('runde 2 viser sitt eget tall', (await p.inputValue('#fv')) === '30', await p.inputValue('#fv'));
sjekk('de andre rundene vises som hjelp', (await p.locator('.fokus-tidligere').textContent()).includes('R1 15×10'),
  (await p.locator('.fokus-tidligere').textContent()).trim());
await p.fill('#fv','33');
await p.waitForTimeout(200);
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
sjekk('fokus skriver i riktig runde', (await p.inputValue('#v-knebøy-1')) === '33',
  'R1=' + (await p.inputValue('#v-knebøy-0')) + ' R2=' + (await p.inputValue('#v-knebøy-1')));

console.log('--- Redigering viser alle rundene ---');
await p.locator('.okt-knapp').first().click(); await p.waitForTimeout(400);
sjekk('tre rader per øvelse i rettevinduet', (await p.locator('#rett .rett-ovelse').first().locator('.runde-linje').count()) === 3);
sjekk('alle tre tallene er fylt inn',
  (await p.inputValue('#rv-knebøy-0')) === '20' && (await p.inputValue('#rv-knebøy-1')) === '22' &&
  (await p.inputValue('#rv-knebøy-2')) === '18');
await p.fill('#rv-knebøy-1','26');
await p.locator('#rett-lagre').click(); await p.waitForTimeout(1200);
sjekk('rettet runde er lagret', (await p.locator('.okt-knapp').first().textContent()).includes('Knebøy 26×10'));

console.log('--- Økter fra før runder ble loggført ---');
const uid = await p.evaluate(() => JSON.parse(localStorage.getItem('bedrelivUser')).id);
await p.evaluate(async (id) => {
  await fetch('/__test/raa-okt', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id:'okt_gammel', ownerId:id, savedBy:'Rune', shared:false,
      dato:'2026-07-01T17:00:00Z', ovelser:{ 'knebøy':{vekt:14,reps:10}, press:{vekt:9,reps:8} },
      heiarop:[], savedAt:'2026-07-01T17:00:00Z' }) });
}, uid);
await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
const rader = await p.locator('.okt-tall').allTextContents();
sjekk('den gamle økta vises i loggen', rader.some(t => t.includes('Knebøy 14×10')), rader.join(' | '));
sjekk('den telles med', (await p.locator('#antall').textContent()) === '2');
sjekk('den er med i utviklingen', (await p.locator('.utv-rad', { hasText:'GOBLET KNEBØY' }).count()) === 1);
await p.locator('.okt-knapp').last().click(); await p.waitForTimeout(400);
sjekk('den kan åpnes for retting', (await p.inputValue('#rv-knebøy-0')) === '14');
sjekk('de tomme rundene står klare', (await p.inputValue('#rv-knebøy-1')) === '');
// Halv runde skal forkastes: vekt uten reps er ikke et løft.
await p.fill('#rv-knebøy-1','16');
await p.locator('#rett-lagre').click(); await p.waitForTimeout(1300);
const halv = await p.evaluate(async (id) => {
  const r = await fetch('/api/okter?userId=' + id);
  return (await r.json()).okter.find(o => o.id === 'okt_gammel').ovelser['knebøy'];
}, uid);
sjekk('halvutfylt runde forkastes', halv.length === 1, JSON.stringify(halv));

// Så en hel runde to
await p.locator('.okt-knapp').last().click(); await p.waitForTimeout(400);
await p.fill('#rv-knebøy-1','16'); await p.fill('#rr-knebøy-1','10');
await p.locator('#rett-lagre').click(); await p.waitForTimeout(1300);
const etter = await p.evaluate(async (id) => {
  const r = await fetch('/api/okter?userId=' + id);
  return (await r.json()).okter.find(o => o.id === 'okt_gammel').ovelser['knebøy'];
}, uid);
sjekk('gammel økt skrives om til runder', Array.isArray(etter) && etter.length === 2, JSON.stringify(etter));

await p.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Runder virker.');
