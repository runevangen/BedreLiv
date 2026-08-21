// Kjører hele testsettet: først enhetstestene, så nettlesertestene parallelt.
//
//   node tester/kjor.mjs              alt
//   node tester/kjor.mjs enhet        bare enhetstestene (millisekunder)
//   node tester/kjor.mjs rett runder  bare settene som matcher navnene
//
// Nettlesertestene får hver sin server på hver sin port, så de kan kjøre
// samtidig uten å tråkke på hverandres brukernavn. Antallet som kjører
// samtidig står i SAMTIDIG — fire kjerner tåler omtrent tre Chromium.
import { spawn } from 'node:child_process';
import { readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const HER = import.meta.dirname;
const ROT = path.resolve(HER, '..');
const SAMTIDIG = Number(process.env.SAMTIDIG || 4);
const BASEPORT = Number(process.env.BASEPORT || 8800);
const utMappe = mkdtempSync(path.join(tmpdir(), 'bedreliv-test-'));
const filtre = process.argv.slice(2);

// Tregeste sett først. Med en pool er det siste settet som starter, som
// avgjør når alt er ferdig — starter det lengste til slutt, venter de andre
// på det. Rekkefølgen er målt, ikke gjettet, og trenger bare være omtrentlig.
const TREGEST_FORST = [
  'sjekk-heiarop.mjs', 'sjekk-rett.mjs', 'sjekk-gjengen.mjs', 'sjekk-synlig.mjs',
  'sjekk-trend.mjs', 'e2e.mjs', 'sjekk-runder.mjs', 'sjekk-nytt.mjs'
];
const alle = readdirSync(HER)
  .filter((f) => f.endsWith('.mjs') && f !== 'kjor.mjs' && f !== 'test_enhet.mjs')
  .sort((a, b) => {
    const ia = TREGEST_FORST.indexOf(a), ib = TREGEST_FORST.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
const sett = filtre.length && !filtre.includes('enhet')
  ? alle.filter((f) => filtre.some((q) => f.includes(q)))
  : alle;

function kjor(kommando, args, env) {
  return new Promise((ferdig) => {
    const p = spawn(kommando, args, { cwd: ROT, env: { ...process.env, ...env } });
    let ut = '';
    p.stdout.on('data', (d) => { ut += d; });
    p.stderr.on('data', (d) => { ut += d; });
    p.on('close', (kode) => ferdig({ kode, ut }));
  });
}

function startServer(port) {
  const p = spawn('node', [path.join(HER, 'rigg', 'server.mjs')], {
    env: { ...process.env, APP_ROOT: ROT, PORT: String(port) },
    stdio: 'ignore'
  });
  return p;
}

async function ventPaaServer(port) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch('http://localhost:' + port + '/');
      if (r.ok) return true;
    } catch (e) { /* ikke oppe ennå */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

const start = Date.now();

// ===== 1. Enhetstestene, som port =====
const enhet = await kjor('node', [path.join(HER, 'test_enhet.mjs')], {});
process.stdout.write(enhet.ut);
if (enhet.kode !== 0) {
  console.log('\nEnhetstestene feilet — stopper her.');
  process.exit(1);
}
if (filtre.includes('enhet')) {
  console.log(`\nFerdig på ${((Date.now() - start) / 1000).toFixed(1)} s.`);
  process.exit(0);
}

// ===== 2. Nettlesertestene, parallelt =====
console.log(`  ${sett.length} nettlesersett, ${SAMTIDIG} om gangen\n`);

const servere = [];
const resultater = [];
let neste = 0;

async function arbeider(nr) {
  while (true) {
    const i = neste++;
    if (i >= sett.length) return;
    const fil = sett[i];
    const port = BASEPORT + i;
    const server = startServer(port);
    servere.push(server);
    if (!(await ventPaaServer(port))) {
      resultater.push({ fil, kode: 1, ut: 'Serveren startet ikke på port ' + port });
      continue;
    }
    const t = Date.now();
    const r = await kjor('node', [path.join(HER, fil)], {
      BASE: 'http://localhost:' + port,
      SHOT: path.join(utMappe, fil + '.png'),
      SHOT_SE: path.join(utMappe, fil + '-se.png'),
      TEKST: path.join(utMappe, fil + '.txt'),
      PDF: path.join(utMappe, fil + '.pdf')
    });
    const sekunder = ((Date.now() - t) / 1000).toFixed(0);
    const antall = (r.ut.match(/^ {2}OK /gm) || []).length;
    console.log(`  ${r.kode === 0 ? '✓' : '✗'} ${fil.padEnd(22)} ${String(antall).padStart(3)} sjekker  ${sekunder}s`);
    resultater.push({ fil, ...r, antall });
    server.kill();
  }
}

await Promise.all(Array.from({ length: SAMTIDIG }, (_, n) => arbeider(n)));
servere.forEach((s) => { try { s.kill(); } catch (e) {} });

const feilet = resultater.filter((r) => r.kode !== 0);
const sjekker = resultater.reduce((n, r) => n + (r.antall || 0), 0);
const tid = ((Date.now() - start) / 1000).toFixed(1);

console.log('');
if (feilet.length) {
  feilet.forEach((r) => {
    console.log(`===== ${r.fil} =====`);
    console.log(r.ut.split('\n').filter((l) => /FEIL|Error|Timeout/.test(l)).slice(0, 12).join('\n'));
  });
  console.log(`\n${feilet.length} av ${sett.length} sett feilet. ${tid} s.`);
  process.exit(1);
}
console.log(`Alt grønt: ${sett.length} sett, ${sjekker} nettlesersjekker. ${tid} s.`);
