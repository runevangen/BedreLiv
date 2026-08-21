import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
// Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
// å gi opp. Avbrytes den her, tar sidelastingen 0,1 sekund i stedet.
await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|401/.test(t)) feil.push('console: '+t); });

await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Uten data ---');
sjekk('utviklingsdelen finnes', (await p.locator('h2.seksjon', { hasText: 'Utvikling' }).count()) === 1);
sjekk('sier at det mangler økter', (await p.locator('#innhold').textContent()).includes('utviklingen dukker opp'));

// Fire økter med kjent utvikling:
//   knebøy  stiger jevnt          -> oppover
//   press   ligger helt likt      -> som før
//   roing   synker jevnt          -> lettere
//   markloft bare én økt          -> skal ikke vises
const okter = [
  { d:'2026-07-20T17:00:00Z', o:{ 'knebøy':[20,10], press:[16,8], roing:[22,8], markloft:[24,10] } },
  { d:'2026-07-27T17:00:00Z', o:{ 'knebøy':[22,10], press:[16,8], roing:[20,8] } },
  { d:'2026-08-03T17:00:00Z', o:{ 'knebøy':[24,10], press:[16,8], roing:[18,8] } },
  { d:'2026-08-10T17:00:00Z', o:{ 'knebøy':[26,10], press:[16,8], roing:[16,8] } }
];
for (const okt of okter) {
  const ov = {}; for (const [k,[v,r]] of Object.entries(okt.o)) ov[k] = { vekt:v, reps:r };
  await p.evaluate(async ([ov, d]) => { await window.Api.saveOkt(ov, d); }, [ov, okt.d]);
}
await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

console.log('--- Retning per øvelse ---');
const rad = async (navn) => p.locator('.utv-rad', { hasText: navn }).first();
sjekk('stigende serie leses som oppover', (await (await rad('GOBLET KNEBØY')).locator('.utv-dom').textContent()).includes('Oppover'));
sjekk('flat serie leses som som før', (await (await rad('MANUALPRESS')).locator('.utv-dom').textContent()).includes('Som før'));
sjekk('synkende serie leses som lettere', (await (await rad('ENARMS ROING')).locator('.utv-dom').textContent()).includes('Lettere'));
sjekk('øvelse med bare én økt utelates', (await p.locator('.utv-rad', { hasText: 'RUMENSK' }).count()) === 0);
sjekk('utfall uten data utelates', (await p.locator('.utv-rad', { hasText: 'UTFALL' }).count()) === 0);
sjekk('tre rader totalt', (await p.locator('.utv-rad').count()) === 3);

console.log('--- Oppsummeringen ---');
sjekk('overskriften er balansert (1 opp, 1 likt, 1 ned)', (await p.locator('.utv-overskrift').textContent()) === 'Du holder nivået');
const sum = await p.locator('.utv-sum').textContent();
sjekk('oppsummeringen teller riktig', sum.includes('1 øvelse går oppover') && sum.includes('1 ligger stabilt') && sum.includes('1 er lettere'), sum);
const trost = await p.locator('.utv-trost').textContent();
sjekk('den vennlige linja står der', trost.includes('ikke et tilbakesteg') && trost.includes('ikke en dom'), '');

console.log('--- Sparkline ---');
sjekk('én sparkline per rad', (await p.locator('svg.spark').count()) === 3);
const pkt = await (await rad('GOBLET KNEBØY')).locator('.spark-linje').getAttribute('points');
sjekk('fire punkter i linja', pkt.trim().split(/\s+/).length === 4, pkt);
const yFor = pkt.trim().split(/\s+/).map(q => parseFloat(q.split(',')[1]));
sjekk('stigende serie tegnes stigende (y synker)', yFor[0] > yFor[3], yFor.join(' → '));
const yFlat = (await (await rad('MANUALPRESS')).locator('.spark-linje').getAttribute('points')).trim().split(/\s+/).map(q => parseFloat(q.split(',')[1]));
sjekk('flat serie tegnes midt i ruta', yFlat.every(y => y === 13), yFlat.join(' '));
sjekk('siste punkt er farget etter retning', await (await rad('GOBLET KNEBØY')).locator('.spark-na').evaluate(el => el.classList.contains('opp')));

console.log('--- Farge er aldri eneste kanal ---');
for (const [navn, ord] of [['GOBLET KNEBØY','▲'],['MANUALPRESS','='],['ENARMS ROING','▼']]) {
  const t = await (await rad(navn)).locator('.utv-dom').textContent();
  sjekk(navn + ' har både symbol og ord', t.includes(ord) && /[A-Za-zÅÆØåæø]/.test(t), t.trim());
}
const nedFarge = await p.locator('.utv-dom.lettere').evaluate(el => getComputedStyle(el).color);
const rustFarge = await p.locator('.hvordan-tekst .feil').first().evaluate(el => getComputedStyle(el).color);
sjekk('«lettere» har ikke samme farge som advarsler', nedFarge !== rustFarge, nedFarge + ' vs ' + rustFarge);

console.log('--- Små svingninger skal ligge flatt ---');
// Utfall: 160 -> 162 -> 160 -> 162. Drøyt én prosent fram og tilbake.
await p.evaluate(async () => {
  const par = [[20,8,'2026-07-20'],[20.25,8,'2026-07-27'],[20,8,'2026-08-03'],[20.25,8,'2026-08-10']];
  for (const [v,r,d] of par) await window.Api.saveOkt({ utfall:{vekt:v,reps:r} }, d + 'T18:00:00Z');
});
await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
const utfallRad = p.locator('.utv-rad', { hasText: 'UTFALL' }).first();
sjekk('vingling leses som som før', (await utfallRad.locator('.utv-dom').textContent()).includes('Som før'));
const yU = (await utfallRad.locator('.spark-linje').getAttribute('points')).trim().split(/\s+/).map(q => parseFloat(q.split(',')[1]));
const spennU = Math.max(...yU) - Math.min(...yU);
sjekk('sparkline overdriver ikke vinglingen', spennU <= 4, spennU.toFixed(1) + 'px utslag av 16 mulige');
const yK = (await p.locator('.utv-rad', { hasText: 'GOBLET KNEBØY' }).first().locator('.spark-linje').getAttribute('points')).trim().split(/\s+/).map(q => parseFloat(q.split(',')[1]));
sjekk('reell stigning fyller fortsatt ruta', (Math.max(...yK) - Math.min(...yK)) >= 14, (Math.max(...yK)-Math.min(...yK)).toFixed(1) + 'px');

console.log('--- Ensidig utvikling ---');
await p.evaluate(async () => {
  // Alt oppover: legg til en økt der roing også stiger kraftig
  await window.Api.saveOkt({ 'knebøy':{vekt:30,reps:10}, press:{vekt:20,reps:8}, roing:{vekt:26,reps:10} }, '2026-08-17T17:00:00Z');
});
await p.reload(); await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('overskriften snur til oppover', (await p.locator('.utv-overskrift').textContent()) === 'Det går oppover');
sjekk('den vennlige linja står der uansett', (await p.locator('.utv-trost').count()) === 1);

await p.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Trenden regner riktig.');
