// Den valgfrie sjette posten: løping, sykling og alt annet som ikke måles i
// kilo. Settet passer på at den kan stå alene, at den ikke smitter over på
// utviklingskurven, og at den kan rettes og fjernes igjen.
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
await p.fill('#p-navn','Annen'); await p.fill('#p-pin','1234'); await p.fill('#p-pin2','1234');
await p.locator('#port-knapp').click();
await p.waitForSelector('#innhold:not([hidden])');
await p.waitForFunction(() => { const e = document.querySelector('#innhold'); return e && !e.classList.contains('laster'); });

const apneAnnet = async () => {
  if ((await p.locator('#rad-annet .rad-topp').getAttribute('aria-expanded')) !== 'true') {
    await p.locator('#rad-annet .rad-topp').click(); await p.waitForTimeout(200);
  }
};

console.log('--- Kortet ---');
sjekk('«Annet» ligger sist', (await p.locator('.rad').last().getAttribute('id')) === 'rad-annet',
  await p.locator('.rad').last().getAttribute('id'));
sjekk('den er merket valgfri', (await p.locator('#rad-annet .maal').textContent()) === 'valgfritt');
sjekk('den åpner seg ikke av seg selv',
  (await p.locator('#rad-annet .rad-topp').getAttribute('aria-expanded')) === 'false');
sjekk('lagreknappen er av til å begynne med', await p.locator('#lagre').isDisabled());

// Fokus går tre runder gjennom de fem øvelsene. «Annet» hører ikke hjemme
// der: en løpetur har ingen runde to.
await p.locator('#fokus-start').click(); await p.waitForTimeout(300);
sjekk('fokus har 15 steg, ikke 18', (await p.locator('.prikk').count()) === 15,
  (await p.locator('.prikk').count()) + ' steg');
sjekk('telleren teller fem øvelser', (await p.locator('.fokus-teller').textContent()).includes('/5'),
  (await p.locator('.fokus-teller').textContent()).replace(/\s+/g,' ').trim());
await p.keyboard.press('Escape'); await p.waitForTimeout(250);

console.log('--- En løpetur er en økt god nok ---');
await apneAnnet();
await p.fill('#annet-hva','Løping');
await p.waitForTimeout(200);
sjekk('fritekst alene slår på lagreknappen', !(await p.locator('#lagre').isDisabled()));
sjekk('sammendraget viser det du skrev',
  (await p.locator('#rad-annet .rad-sum').textContent()).includes('Løping'),
  (await p.locator('#rad-annet .rad-sum').textContent()).trim());
await p.fill('#annet-min','30');
await p.waitForTimeout(200);
sjekk('minuttene blir med i sammendraget',
  (await p.locator('#rad-annet .rad-sum').textContent()).replace(/\s+/g,' ').includes('Løping · 30 min'),
  (await p.locator('#rad-annet .rad-sum').textContent()).replace(/\s+/g,' ').trim());

await p.locator('#lagre').click();
await p.waitForFunction(() => /lagret/i.test(document.querySelector('#kvittering')?.textContent||''));
await p.waitForTimeout(200);
sjekk('økta uten et eneste løft er lagret', (await p.locator('#antall').textContent()) === '1');
sjekk('den står i loggen', (await p.locator('.okt-annet').first().textContent()).replace(/\s+/g,' ') === 'Løping · 30 min',
  (await p.locator('.okt-annet').first().textContent()).replace(/\s+/g,' '));
sjekk('feltene er tømt til neste økt', (await p.locator('#rad-annet .rad-sum').textContent()).includes('ikke ført'));

console.log('--- Den blander seg ikke inn i utviklingen ---');
const utv = await p.locator('#innhold').textContent();
sjekk('utviklingen teller økta', utv.includes('Én økt loggført'), 'ser etter «Én økt loggført»');
sjekk('«Annet» står ikke som en øvelse i utviklingen',
  (await p.locator('.utv-navn').allTextContents()).every(t => !/annet/i.test(t)));

console.log('--- Løft og «Annet» i samme økt ---');
await p.fill('#v-knebøy-0','24'); await p.fill('#r-knebøy-0','10');
await apneAnnet();
await p.fill('#annet-hva','Sykling');
await p.waitForTimeout(200);
await p.locator('#lagre').click();
await p.waitForFunction(() => document.querySelector('#antall')?.textContent === '2');
await p.waitForTimeout(200);
const rad = await p.locator('.okt').first().textContent();
sjekk('loggraden viser både løftet og turen', rad.includes('Knebøy 24×10') && rad.includes('Sykling'),
  rad.replace(/\s+/g,' ').trim());
sjekk('uten minutter står bare hva du gjorde',
  (await p.locator('.okt-annet').first().textContent()).trim() === 'Sykling');
// «Annet» skal skille seg fra løftene i loggraden, ikke gå i ett med dem.
const [fAnnet, fLoft] = await Promise.all([
  p.locator('.okt-annet').first().evaluate(el => getComputedStyle(el).color),
  p.locator('.okt-tall span:not(.okt-annet)').first().evaluate(el => getComputedStyle(el).color),
]);
sjekk('den er farget som et tillegg, ikke som et løft', fAnnet !== fLoft, fAnnet + ' mot ' + fLoft);

console.log('--- Endre og fjerne ---');
await p.locator('.okt-knapp').first().click(); await p.waitForTimeout(300);
sjekk('«Annet» kan rettes i Endre-skjermen', (await p.inputValue('#rett-annet-hva')) === 'Sykling');
await p.fill('#rett-annet-hva','Rulleski'); await p.fill('#rett-annet-min','45');
await p.locator('#rett-lagre').click();
await p.waitForFunction(() => !document.querySelector('#rett')?.classList.contains('apen'));
await p.waitForTimeout(400);
sjekk('rettingen slår gjennom i loggen',
  (await p.locator('.okt-annet').first().textContent()).replace(/\s+/g,' ') === 'Rulleski · 45 min',
  (await p.locator('.okt-annet').first().textContent()).replace(/\s+/g,' '));

await p.locator('.okt-knapp').first().click(); await p.waitForTimeout(300);
await p.fill('#rett-annet-hva','');
await p.locator('#rett-lagre').click();
await p.waitForFunction(() => !document.querySelector('#rett')?.classList.contains('apen'));
await p.waitForTimeout(400);
sjekk('tomt felt fjerner «Annet» fra økta', (await p.locator('.okt-annet').count()) === 1,
  (await p.locator('.okt-annet').count()) + ' igjen (løpeøkta skal stå)');
sjekk('løftet står igjen', (await p.locator('.okt').first().textContent()).includes('Knebøy 24×10'));

console.log('--- En økt kan ikke tømmes helt ---');
await p.locator('.okt-knapp').first().click(); await p.waitForTimeout(300);
await p.fill('#rv-knebøy-0',''); await p.fill('#rr-knebøy-0','');
await p.fill('#rv-knebøy-1',''); await p.fill('#rr-knebøy-1','');
await p.fill('#rv-knebøy-2',''); await p.fill('#rr-knebøy-2','');
await p.locator('#rett-lagre').click(); await p.waitForTimeout(300);
sjekk('siste innhold kan ikke fjernes ved retting',
  (await p.locator('#rett-melding').textContent()).includes('minst ett løft'),
  (await p.locator('#rett-melding').textContent()).trim());
sjekk('skjermen står åpen så tallene ikke går tapt', await p.locator('#rett.apen').isVisible());

await b.close();
console.log('');
if (feil.length) { console.log('FEIL:'); feil.forEach(f => console.log(' - ' + f)); process.exit(1); }
console.log('«Annet» kan stå alene, sammen med løft, og fjernes igjen.');
