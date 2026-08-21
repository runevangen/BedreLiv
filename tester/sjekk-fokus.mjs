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
await p.waitForSelector('#innhold:not([hidden])');
await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

sjekk('fokusknapp finnes i loggen', await p.locator('#fokus-start').isVisible());
sjekk('fokus er lukket til å begynne med', !(await p.locator('#fokus').isVisible()));

await p.locator('#fokus-start').click();
await p.waitForTimeout(250);
sjekk('fokus åpner i fullskjerm', await p.locator('#fokus').isVisible());
sjekk('starter på runde 1, øvelse 1', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 1 av 5'));
sjekk('viser øvelsesnavnet stort', (await p.locator('.fokus-navn').textContent()) === 'Goblet knebøy');
sjekk('viser mål og antall manualer', (await p.locator('.fokus-maal').textContent()).includes('10 reps') && (await p.locator('.fokus-maal').textContent()).includes('1 manual'));
sjekk('to store figurer', (await p.locator('.fokus-figurer svg.fig').count()) === 2);
sjekk('«forrige» sier at det er første gang', (await p.locator('.fokus-forrige').textContent()).includes('utgangspunktet'));
sjekk('forrige-knappen er av på første øvelse', await p.locator('#fokus-tilbake').isDisabled());
sjekk('framknappen sier Neste', (await p.locator('#fokus-fram').textContent()).includes('Neste'));
const boks = await p.locator('#fv').boundingBox();
sjekk('vektfeltet er stort nok for tommelen', boks.height >= 55, Math.round(boks.height) + 'px høyt');

// Fyll inn og bla
await p.fill('#fv','24'); await p.fill('#fr','10');
await p.locator('#fokus-fram').click();
await p.waitForTimeout(200);
sjekk('blar til øvelse 2', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 2 av 5'));
sjekk('øvelse 2 er pressen', (await p.locator('.fokus-navn').textContent()) === 'Manualpress stående');
sjekk('to manualer vises for pressen', (await p.locator('.fokus-maal').textContent()).includes('2 manualer'));
sjekk('forrige-knappen er på nå', !(await p.locator('#fokus-tilbake').isDisabled()));

await p.locator('#fokus-tilbake').click();
await p.waitForTimeout(200);
sjekk('blar tilbake til øvelse 1', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 1 av 5'));
sjekk('tallene står igjen når du blar tilbake', (await p.inputValue('#fv')) === '24' && (await p.inputValue('#fr')) === '10');

// Piltaster
await p.locator('.fokus-navn').click();
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
sjekk('høyrepil blar fram', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 2 av 5'));
// Piltast i tallfeltet skal IKKE bla
await p.locator('#fv').click();
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
sjekk('pil i tallfeltet blar ikke', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 2 av 5'));

// Lukk med Escape, sjekk at tallene havnet i lista
await p.keyboard.press('Escape');
await p.waitForTimeout(250);
sjekk('Escape lukker fokus', !(await p.locator('#fokus').isVisible()));
sjekk('tallene fra fokus står i lista', (await p.inputValue('#v-knebøy-0')) === '24' && (await p.inputValue('#r-knebøy-0')) === '10');
sjekk('lagreknappen er slått på av fokus-utkastet', !(await p.locator('#lagre').isDisabled()));

// Motsatt vei: skriv i lista, åpne fokus
await p.fill('#v-press-0','16'); await p.fill('#r-press-0','8');
await p.locator('#fokus-start').click();
await p.waitForTimeout(250);
sjekk('gjenåpning fortsetter der du slapp', (await p.locator('.fokus-teller').textContent()).includes('Øvelse 2 av 5'));

// Hopp til siste steg i sirkelen og lagre derfra
await p.locator('.prikk').nth(14).click(); await p.waitForTimeout(150);
sjekk('siste steg i sirkelen nådd', (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').includes('Runde 3 av 3 · Øvelse 5 av 5'));
sjekk('framknappen sier Lagre økta', (await p.locator('#fokus-fram').textContent()).includes('Lagre'));
await p.locator('#fokus-fram').click();
await p.waitForFunction(() => document.querySelector('#antall') && document.querySelector('#antall').textContent === '1', null, { timeout: 5000 });
sjekk('lagring fra fokus lukker fokus', !(await p.locator('#fokus').isVisible()));
sjekk('økta er lagret', (await p.locator('.okt').count()) === 1);
sjekk('kvittering vises i loggen', (await p.locator('#kvittering').textContent()).includes('lagret'));

// Dommen i fokus
await p.locator('#fokus-start').click();
await p.waitForTimeout(250);
await p.fill('#fv','26'); await p.fill('#fr','10');
await p.waitForTimeout(150);
sjekk('tyngre løft gir «opp» i fokus', (await p.locator('#fokus-dom').textContent()).includes('opp'));
await p.fill('#fv','20');
await p.waitForTimeout(150);
sjekk('lettere løft gir «ned» i fokus', (await p.locator('#fokus-dom').textContent()).includes('ned'));
sjekk('markøren blir stående i feltet', await p.evaluate(() => document.activeElement && document.activeElement.id === 'fv'));
sjekk('«forrige» vises i fokus', (await p.locator('.fokus-forrige').textContent()).includes('24 kg × 10'));

// Overlayet skal dekke hele skjermen, og bunnknappene skal stå nederst.
const h = await p.locator('#fokus').boundingBox();
const vp = p.viewportSize();
sjekk('fokus dekker hele skjermen', Math.abs(h.height - vp.height) <= 2, Math.round(h.height) + ' av ' + vp.height + 'px');
const bunn = await p.locator('.fokus-bunn').boundingBox();
sjekk('knappene står nederst', (bunn.y + bunn.height) >= vp.height - 20, 'bunn på ' + Math.round(bunn.y + bunn.height));
const tilbake = await p.locator('#fokus-tilbake').boundingBox();
sjekk('forrige-knappen er på én linje', tilbake.height <= 58, Math.round(tilbake.height) + 'px høy');

await p.screenshot({ path: process.env.SHOT });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Fokus virker.');
