import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const B = process.env.BASE || 'http://localhost:8899';
const feil = [];
function sjekk(navn, ok, detalj) {
  console.log((ok ? '  OK   ' : '  FEIL ') + navn + (detalj ? '  — ' + detalj : ''));
  if (!ok) feil.push(navn);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
// Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på
// å gi opp. Avbrytes den her, tar sidelastingen 0,1 sekund i stedet.
await page.route('**://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await page.route('**://fonts.gstatic.com/**', (r) => r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
page.on('pageerror', (e) => feil.push('JS-feil i siden: ' + e.message));
// Forventet støy i testmiljøet: Google Fonts når ikke ut, og 401 er selve
// testen av feil PIN. Alt annet skal telle som en feil.
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (t.includes('ERR_CONNECTION_RESET') || t.includes('fonts.g') || t.includes('401')) return;
  feil.push('console.error: ' + t);
});

await page.goto(B);

// ===== Innlogging vises først =====
sjekk('porten vises for utlogget bruker', await page.locator('#port').isVisible());
sjekk('loggen er skjult', !(await page.locator('#innhold').isVisible()));
sjekk('brukerlinja er skjult for utlogget', !(await page.locator('#bruker').isVisible()));
sjekk('gjenta-PIN er skjult i innloggingsmodus', !(await page.locator('#p-pin2-boks').isVisible()));

// ===== Registrering: ulike PIN-er =====
await page.locator('#port-bytt').click();
sjekk('bytter til registrering', (await page.locator('#port-tittel').textContent()) === 'Ny bruker');
sjekk('gjenta-PIN vises i registrering', await page.locator('#p-pin2-boks').isVisible());
await page.fill('#p-navn', 'Testbruker');
await page.fill('#p-pin', '1111');
await page.fill('#p-pin2', '2222');
await page.locator('#port-knapp').click();
await page.waitForTimeout(200);
sjekk('ulike PIN-er avvises', (await page.locator('#port-feil').textContent()).includes('ulike'));

// ===== Registrering: PIN-felt tar bare siffer =====
await page.fill('#p-pin', '');
await page.type('#p-pin', 'ab12cd34');
sjekk('PIN-feltet filtrerer bort bokstaver', (await page.inputValue('#p-pin')) === '1234',
  'fikk «' + (await page.inputValue('#p-pin')) + '»');
await page.fill('#p-pin2', '1234');
await page.locator('#port-knapp').click();
await page.waitForSelector('#innhold:not([hidden])', { timeout: 5000 });
sjekk('registrering logger inn', await page.locator('#innhold').isVisible());
sjekk('navnet står i stempelet under appnavnet', (await page.locator('#stempel').textContent()).startsWith('Testbruker · '),
  await page.locator('#stempel').textContent());
sjekk('tom logg vises', (await page.locator('#innhold').textContent()).includes('Første økt setter utgangspunktet'));

// ===== Lagre en økt =====
sjekk('lagreknappen er av til å begynne med', await page.locator('#lagre').isDisabled());
await page.fill('#v-knebøy-0', '24');
await page.fill('#r-knebøy-0', '10');
sjekk('lagreknappen slås på', !(await page.locator('#lagre').isDisabled()));
await page.locator('#lagre').click();
await page.waitForFunction(() => document.querySelector('#kvittering') && document.querySelector('#kvittering').textContent.length > 0, null, { timeout: 5000 });
sjekk('kvittering etter lagring', (await page.locator('#kvittering').textContent()).includes('lagret'));
sjekk('antall økter = 1', (await page.locator('#antall').textContent()) === '1');
sjekk('økta står i loggen', (await page.locator('.okt').count()) === 1);
sjekk('feltene er tømt', (await page.inputValue('#v-knebøy-0')) === '');

// ===== Neste økt: sammenlikning mot forrige =====
sjekk('«forrige» viser 24 kg × 10', (await page.locator('#rad-knebøy .forrige').textContent()).includes('24 kg × 10'));
await page.fill('#v-knebøy-0', '26');
await page.fill('#r-knebøy-0', '10');
await page.waitForTimeout(100);
sjekk('tyngre løft gir «opp»', (await page.locator('#rad-knebøy .dommen').textContent()).includes('opp'));
sjekk('raden markeres som slått', await page.locator('#rad-knebøy').evaluate((el) => el.classList.contains('slatt')));
await page.fill('#v-knebøy-0', '20');
await page.waitForTimeout(100);
sjekk('lettere løft gir «ned»', (await page.locator('#rad-knebøy .dommen').textContent()).includes('ned'));
await page.fill('#v-knebøy-0', '24');
await page.waitForTimeout(100);
sjekk('samme løft gir «likt»', (await page.locator('#rad-knebøy .dommen').textContent()).includes('likt'));

await page.locator('#lagre').click();
await page.waitForFunction(() => document.querySelector('#antall').textContent === '2', null, { timeout: 5000 });
sjekk('andre økt lagret', (await page.locator('.okt').count()) === 2);

// ===== Lagringen overlever refresh =====
await page.reload();
await page.waitForSelector('#innhold:not([hidden])', { timeout: 5000 });
await page.waitForFunction(() => document.querySelectorAll('.okt').length === 2, null, { timeout: 5000 });
sjekk('fortsatt innlogget etter refresh', await page.locator('#innhold').isVisible());
sjekk('øktene hentes fra backend', (await page.locator('.okt').count()) === 2);

// ===== Logg ut / inn igjen =====
await page.locator('#logg-ut').click();
await page.waitForSelector('#port:not([hidden])', { timeout: 5000 });
sjekk('utlogging viser porten', await page.locator('#port').isVisible());
sjekk('brukerlinja skjules ved utlogging', !(await page.locator('#bruker').isVisible()));
await page.fill('#p-navn', 'Testbruker');
await page.fill('#p-pin', '9999');
await page.locator('#port-knapp').click();
await page.waitForTimeout(400);
sjekk('feil PIN avvises', (await page.locator('#port-feil').textContent()).includes('Feil navn eller PIN'));
await page.fill('#p-pin', '1234');
await page.locator('#port-knapp').click();
await page.waitForSelector('#innhold:not([hidden])', { timeout: 5000 });
await page.waitForFunction(() => document.querySelectorAll('.okt').length === 2, null, { timeout: 5000 });
sjekk('innlogging henter egne økter', (await page.locator('.okt').count()) === 2);

// ===== Annen bruker ser ikke loggen min =====
await page.locator('#logg-ut').click();
await page.waitForSelector('#port:not([hidden])');
await page.locator('#port-bytt').click();
await page.fill('#p-navn', 'Annenbruker');
await page.fill('#p-pin', '5678');
await page.fill('#p-pin2', '5678');
await page.locator('#port-knapp').click();
await page.waitForSelector('#innhold:not([hidden])', { timeout: 5000 });
await page.waitForTimeout(400);
sjekk('ny bruker har tom logg', (await page.locator('.okt').count()) === 0);
sjekk('ny bruker ser tom-teksten', (await page.locator('#innhold').textContent()).includes('Første økt setter utgangspunktet'));

// ===== Tøm loggen =====
page.on('dialog', (d) => d.accept());
await page.locator('#logg-ut').click();
await page.waitForSelector('#port:not([hidden])');
await page.fill('#p-navn', 'Testbruker');
await page.fill('#p-pin', '1234');
await page.locator('#port-knapp').click();
await page.waitForSelector('#innhold:not([hidden])', { timeout: 5000 });
await page.waitForFunction(() => document.querySelectorAll('.okt').length === 2, null, { timeout: 5000 });
await page.locator('#slett').click();
await page.waitForFunction(() => document.querySelector('#antall').textContent === '0', null, { timeout: 5000 });
sjekk('loggen er tømt', (await page.locator('.okt').count()) === 0);
await page.reload();
await page.waitForSelector('#innhold:not([hidden])', { timeout: 5000 });
await page.waitForTimeout(500);
sjekk('tømmingen ble lagret på serveren', (await page.locator('.okt').count()) === 0);

await page.screenshot({ path: process.env.SHOT || 'skjerm.png', fullPage: true });
await browser.close();

console.log('');
if (feil.length) { console.log('FEIL (' + feil.length + '):'); feil.forEach((f) => console.log(' - ' + f)); process.exit(1); }
console.log('Alle sjekker gikk gjennom.');
