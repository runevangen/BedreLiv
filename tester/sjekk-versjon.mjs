import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

// Fasit rett fra datafila
const CG = new Function(readFileSync('/workspace/bedreliv/changelog.js','utf8')+';return CHANGELOG;')();

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
// Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
// å gi opp. Avbrytes den her, tar sidelastingen 0,1 sekund i stedet.
await p.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await p.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
p.on('console', m => { const t=m.text(); if(m.type()==='error' && !/ERR_CONNECTION_RESET|fonts\.g|401/.test(t)) feil.push('console: '+t); });
await p.goto(B);

console.log('--- Fasit i datafila ---');
sjekk('nyeste post øverst', CG.every((post,i) => i===0 || parseFloat(CG[i-1].v) > parseFloat(post.v)),
  CG.map(x=>x.v).join(' > '));
sjekk('starter på 0.01', CG[CG.length-1].v === '0.01');
sjekk('versjoner er strenger (0.10 blir ikke 0.1)', CG.every(x => typeof x.v === 'string'));
sjekk('ingen dupliserte numre', new Set(CG.map(x=>x.v)).size === CG.length);
sjekk('alle poster har måned og punkter', CG.every(x => x.d && Array.isArray(x.changes) && x.changes.length));

console.log('--- I appen ---');
sjekk('versjonen står rett bak appnavnet i topplinja', await p.locator('.topplinje-tittel .versjon').isVisible());
sjekk('viser nyeste nummer', (await p.locator('#versjon').textContent()) === 'v' + CG[0].v, await p.locator('#versjon').textContent());
sjekk('synlig før innlogging også', !(await p.locator('#innhold').isVisible()) && await p.locator('#versjon').isVisible());
sjekk('loggen er lukket', !(await p.locator('#endringer').isVisible()));

await p.locator('#versjon').click(); await p.waitForTimeout(250);
sjekk('trykk åpner loggen', await p.locator('#endringer').isVisible());
sjekk('alle versjonene listes', (await p.locator('.endr-post').count()) === CG.length, (await p.locator('.endr-post').count()) + ' av ' + CG.length);
const numre = await p.locator('.endr-nr b').allTextContents();
sjekk('i riktig rekkefølge', JSON.stringify(numre) === JSON.stringify(CG.map(x => 'v'+x.v)), numre.join(' '));
const punkter = await p.locator('.endr-post li').count();
const fasitPunkter = CG.reduce((n,x) => n + x.changes.length, 0);
sjekk('alle punktene kommer med', punkter === fasitPunkter, punkter + ' av ' + fasitPunkter);
sjekk('teksten stemmer med fila', (await p.locator('.endr-post li').first().textContent()) === CG[0].changes[0]);
sjekk('loggen dekker skjermen', Math.abs((await p.locator('#endringer').boundingBox()).height - 844) <= 2);

await p.keyboard.press('Escape'); await p.waitForTimeout(200);
sjekk('Escape lukker loggen', !(await p.locator('#endringer').isVisible()));
sjekk('siden kan rulles igjen', (await p.evaluate(() => document.body.style.overflow)) === '');

await p.locator('#versjon').click(); await p.waitForTimeout(200);
await p.locator('#endr-lukk').click(); await p.waitForTimeout(200);
sjekk('krysset lukker loggen', !(await p.locator('#endringer').isVisible()));

console.log('--- Sammen med resten ---');
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Rune'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])'); await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });
sjekk('versjonen står også når du er innlogget', await p.locator('#versjon').isVisible());
await p.locator('#tekststorrelse button[data-skala="storst"]').click(); await p.waitForTimeout(150);
await p.locator('#versjon').click(); await p.waitForTimeout(200);
const liStr = await p.locator('.endr-post li').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
sjekk('loggen følger tekststørrelsen', liStr > 13, liStr + 'px');
await p.keyboard.press('Escape'); await p.waitForTimeout(150);
await p.locator('#tekststorrelse button[data-skala="normal"]').click(); await p.waitForTimeout(150);

// Fokus åpent bak: Escape skal treffe loggen først, og rullesperren bli stående
await p.locator('#fokus-start').click(); await p.waitForTimeout(250);
await p.locator('#versjon').click({ force: true }).catch(() => {});
await p.evaluate(() => document.getElementById('versjon').click());
await p.waitForTimeout(200);
sjekk('loggen kan åpnes over fokus', await p.locator('#endringer').isVisible());
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
sjekk('Escape lukker loggen, ikke fokus', !(await p.locator('#endringer').isVisible()) && await p.locator('#fokus').isVisible());
sjekk('rullesperren står fortsatt for fokus', (await p.evaluate(() => document.body.style.overflow)) === 'hidden');

await p.locator('#versjon').click({ force: true }).catch(() => {});
await p.evaluate(() => document.getElementById('versjon').click());
await p.waitForTimeout(200);
await p.screenshot({ path: process.env.SHOT });
await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log('Versjonsloggen virker.');
