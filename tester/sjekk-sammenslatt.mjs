// Øvelseskortene står sammenslått, ett åpent om gangen. Settet sjekker at
// riktig kort åpner seg av seg selv, at siden faktisk blir kortere, og at
// tallene du har ført overlever både lukking og åpning.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { ekteFonter } from './rigg/fonter.mjs';
const B = process.env.BASE;
const feil = [];
const sjekk = (n, ok, d) => { console.log((ok?'  OK   ':'  FEIL ')+n+(d?'  — '+d:'')); if(!ok) feil.push(n); };

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844} });
await ekteFonter(p, B);
p.on('pageerror', e => feil.push('JS-feil: ' + e.message));
await p.goto(B);
await p.locator('#port-bytt').click();
await p.fill('#p-navn','Sammen'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])');
await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

const apne = () => p.locator('.rad.apen').count();
const apenId = () => p.evaluate(() => { const r = document.querySelector('.rad.apen'); return r ? r.id : null; });
const hoyde = (id) => p.locator('#' + id).evaluate(el => el.getBoundingClientRect().height);

console.log('--- Utgangspunktet ---');
sjekk('nøyaktig ett kort er åpent', (await apne()) === 1, (await apne()) + ' åpne');
sjekk('det er den første øvelsen', (await apenId()) === 'rad-knebøy', await apenId());
sjekk('resten er slått sammen', (await p.locator('.rad-kropp:visible').count()) === 1);
sjekk('feltene i et lukket kort er ute av veien', !(await p.locator('#v-press-0').isVisible()));

const hApen = await hoyde('rad-knebøy');
const hLukket = await hoyde('rad-press');
sjekk('et sammenslått kort er en brøkdel av et åpent', hLukket < hApen / 3,
  Math.round(hLukket) + 'px mot ' + Math.round(hApen) + 'px');

// Hvor mye kortere er siden? Måles mot alternativet: fem åpne kort.
const sparte = await p.evaluate(() => {
  const rader = [...document.querySelectorAll('.rad')];
  const apen = rader.find(r => r.classList.contains('apen'));
  const enApen = apen.getBoundingClientRect().height;
  const na = rader.reduce((s, r) => s + r.getBoundingClientRect().height, 0);
  return { na: Math.round(na), alle: Math.round(enApen * rader.length) };
});
sjekk('øvelsene tar under halvparten av plassen', sparte.na < sparte.alle / 2,
  sparte.na + 'px mot ' + sparte.alle + 'px med alle åpne');

console.log('--- Sammendraget på den lukkede linja ---');
sjekk('uført øvelse sier ifra', (await p.locator('#rad-press .rad-sum').textContent()).includes('ikke ført'),
  (await p.locator('#rad-press .rad-sum').textContent()).trim());
sjekk('lukket kort har aria-expanded=false',
  (await p.locator('#rad-press .rad-topp').getAttribute('aria-expanded')) === 'false');
sjekk('åpent kort har aria-expanded=true',
  (await p.locator('#rad-knebøy .rad-topp').getAttribute('aria-expanded')) === 'true');

await p.fill('#v-knebøy-0','24'); await p.fill('#r-knebøy-0','10');
await p.waitForTimeout(200);
sjekk('sammendraget følger med mens du skriver',
  (await p.locator('#rad-knebøy .rad-sum').textContent()).replace(/\s+/g,' ').includes('24 × 10'),
  (await p.locator('#rad-knebøy .rad-sum').textContent()).replace(/\s+/g,' ').trim());

console.log('--- Å bytte kort ---');
await p.locator('#rad-press .rad-topp').click(); await p.waitForTimeout(200);
sjekk('det nye kortet åpner seg', (await apenId()) === 'rad-press', await apenId());
sjekk('fortsatt bare ett åpent', (await apne()) === 1, (await apne()) + ' åpne');
sjekk('det forrige er slått sammen', !(await p.locator('#v-knebøy-0').isVisible()));
sjekk('tallene fra knebøy står i sammendraget',
  (await p.locator('#rad-knebøy .rad-sum').textContent()).replace(/\s+/g,' ').includes('24 × 10'));

await p.locator('#rad-press .rad-topp').click(); await p.waitForTimeout(200);
sjekk('nytt trykk lukker kortet', (await apne()) === 0, (await apne()) + ' åpne');
const altLukket = await p.evaluate(() => Math.round([...document.querySelectorAll('.rad')]
  .reduce((s, r) => s + r.getBoundingClientRect().height, 0)));
sjekk('alle seks kortene tar under halve skjermen', altLukket < 360, altLukket + 'px');

await p.locator('#rad-knebøy .rad-topp').click(); await p.waitForTimeout(200);
sjekk('tallene er der når kortet åpnes igjen', (await p.inputValue('#v-knebøy-0')) === '24');

console.log('--- Etter lagring ---');
await p.locator('#lagre').click();
await p.waitForFunction(() => /lagret/i.test(document.querySelector('#kvittering')?.textContent || ''));
await p.waitForTimeout(200);
sjekk('første øvelse står åpen igjen', (await apenId()) === 'rad-knebøy', await apenId());
sjekk('sammendraget viser forrige økt', (await p.locator('#rad-press .rad-sum').textContent()).includes('ikke ført'));
sjekk('knebøy-linja peker på forrige økt',
  (await p.locator('#rad-knebøy .forrige').textContent()).includes('24 kg × 10'));

console.log('--- Fokus rører ikke sammenslåingen ---');
await p.locator('#fokus-start').click(); await p.waitForTimeout(250);
await p.keyboard.press('Escape'); await p.waitForTimeout(250);
sjekk('fortsatt bare ett kort åpent etter fokus', (await apne()) === 1, (await apne()) + ' åpne');

await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f => console.log(' - ' + f)); process.exit(1); }
console.log('Kortene slås sammen og åpnes som de skal.');
