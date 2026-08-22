// Testrigg for Bedreliv: serverer appen og kjører Netlify-funksjonene lokalt,
// mot en etterlikning av Netlify Blobs i minnet.
//
// Riggen setter seg selv opp ved oppstart — den kopierer funksjonene fra appen
// og legger stubben der Node leter etter «@netlify/blobs». Det er med vilje:
// da kan riggen aldri kjøre mot en gammel kopi, og repoet slipper å inneholde
// en node_modules-mappe.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const HER = import.meta.dirname;
const ROOT = process.env.APP_ROOT;
if (!ROOT) { console.error('Sett APP_ROOT til appens mappe.'); process.exit(1); }

// 1. Legg blob-stubben der en bar «@netlify/blobs»-import finner den.
const stubMappe = path.join(HER, 'node_modules', '@netlify', 'blobs');
fs.mkdirSync(stubMappe, { recursive: true });
fs.writeFileSync(path.join(stubMappe, 'package.json'), JSON.stringify({
  name: '@netlify/blobs', version: '0.0.0-test', type: 'module', main: 'index.js'
}));
fs.copyFileSync(path.join(HER, 'blobs-stub.js'), path.join(stubMappe, 'index.js'));

// 2. Hent ferske kopier av funksjonene fra appen.
const fnMappe = path.join(HER, 'fn');
fs.mkdirSync(fnMappe, { recursive: true });
for (const f of ['users.js', 'okter.js']) {
  fs.copyFileSync(path.join(ROOT, 'netlify', 'functions', f), path.join(fnMappe, f));
}

// 3. Først NÅ kan funksjonene lastes — de importerer stubben vi nettopp la ut.
const { getStore } = await import('@netlify/blobs');
const users = (await import('./fn/users.js')).default;
const okter = (await import('./fn/okter.js')).default;

const TYPER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // Kun for riggen: skriv en økt rett inn i lageret, forbi valideringen.
  // Trengs for å lage en økt i det GAMLE formatet — API-et vasker den om.
  if (url.pathname === '/__test/raa-okt' && req.method === 'POST') {
    const biter = [];
    for await (const c of req) biter.push(c);
    const okt = JSON.parse(Buffer.concat(biter).toString());
    await getStore('bedreliv-okter').setJSON(okt.id, okt);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    const biter = [];
    for await (const c of req) biter.push(c);
    const kropp = biter.length ? Buffer.concat(biter) : undefined;
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : kropp
    });
    const handler = url.pathname.startsWith('/api/users') ? users : okter;
    const r = await handler(request, {});
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(await r.text());
    return;
  }

  // Fontene fra Google Fonts, servert lokalt. Testene ruter fonts.googleapis.com
  // hit: uten de ekte fontene måler nettlesertestene fallback-fonten, som er
  // smalere enn Archivo Black — og da holder et oppsett i testen som flyter
  // over på telefonen.
  if (url.pathname.startsWith('/__fonter/')) {
    const navn = path.basename(url.pathname);
    const f = path.join(HER, 'fonter', navn);
    if (!fs.existsSync(f)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': TYPER[path.extname(f)] || 'application/octet-stream' });
    res.end(fs.readFileSync(f));
    return;
  }

  const fil = url.pathname === '/' ? '/index.html' : url.pathname;
  const full = path.join(ROOT, fil);
  if (!full.startsWith(ROOT) || !fs.existsSync(full)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': TYPER[path.extname(full)] || 'text/plain' });
  res.end(fs.readFileSync(full));
});

const PORT = Number(process.env.PORT || 8899);
server.listen(PORT, () => console.log('klar på ' + PORT));
