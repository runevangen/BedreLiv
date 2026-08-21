import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const B = process.env.BASE || 'http://localhost:8904';
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
// Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
// å gi opp. Avbrytes den her, tar sidelastingen 0,1 sekund i stedet.
await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])');
await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

sjekk('fem hvordan-blokker', (await p.locator('.hvordan').count()) === 5,
  (await p.locator('.hvordan').count()) + ' funnet');
sjekk('ti figurer (to per øvelse)', (await p.locator('svg.fig').count()) === 10,
  (await p.locator('svg.fig').count()) + ' funnet');

const utstyr = await p.locator('.utstyr').allTextContents();
sjekk('knebøy krever 1 manual', utstyr[0] === '1 manual', utstyr[0]);
sjekk('press krever 2 manualer', utstyr[1].startsWith('2 manualer'), utstyr[1]);
sjekk('roing krever 1 manual', utstyr[2] === '1 manual', utstyr[2]);
sjekk('markløft krever 2 manualer', utstyr[3].startsWith('2 manualer'), utstyr[3]);
sjekk('utfall krever 2 manualer', utstyr[4].startsWith('2 manualer'), utstyr[4]);
sjekk('to-manual-tekst forklarer hva som noteres', utstyr[1].includes('noter vekta på én'), utstyr[1]);

const maal = await p.locator('.maal').allTextContents();
sjekk('mål følger PDF-en', JSON.stringify(maal) === JSON.stringify(['10 reps','8 reps','8 reps per arm','10 reps','8 reps per fot']), maal.join(' / '));
sjekk('«bein» er byttet til «fot»', !(await p.locator('#innhold').textContent()).includes('bein'));

const navn = await p.locator('.navn').allTextContents();
sjekk('navnet fra PDF-en brukes', navn[1] === 'Manualpress stående', navn[1]);
sjekk('fem «unngå»-linjer', (await p.locator('.feil').count()) === 5);
sjekk('banner nevner 3 runder', (await p.locator('.banner').textContent()).includes('3 runder'));

// Figurene skal faktisk ha tegnet noe
const strekPerFigur = await p.locator('svg.fig').first().evaluate(el => el.querySelectorAll('path,circle').length);
sjekk('figuren har strek og hode', strekPerFigur >= 4, strekPerFigur + ' elementer');
// To manualer skal vises i markløft-figuren
const vekterMarkloft = await p.locator('#rad-markloft svg.fig').first().evaluate(el => el.querySelectorAll('.vekt').length);
sjekk('markløft-figuren viser to manualer', vekterMarkloft === 2, vekterMarkloft + ' vekter');
const vekterKnebøy = await p.locator('#rad-knebøy svg.fig').first().evaluate(el => el.querySelectorAll('.vekt').length);
sjekk('knebøy-figuren viser én manual', vekterKnebøy === 1, vekterKnebøy + ' vekt');

await p.screenshot({ path: process.env.SHOT, fullPage: true });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Alt stemmer.');
