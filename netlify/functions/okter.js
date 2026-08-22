import { getStore } from '@netlify/blobs';

// Loggførte styrkeøkter — én blob per økt. Samme mønster som bakes.js i
// pizzame: hver økt eies av den som lagret den, og er privat som standard.
//
// GET    /api/okter?userId=X         -> ALLE i gjengen sine økter, eldst først
// GET    /api/okter?admin=PASSWORD   -> det samme (admin)
// POST   /api/okter                  -> ny økt { ownerId, dato, ovelser, savedBy?, shared? }
//
// «ovelser» er { øvelse-id: [ {vekt,reps}, ... ] } — én post per runde.
// «annet» er den valgfrie sjette posten: { hva, minutter } for løping,
// sykling og alt annet som ikke måles i kilo og repetisjoner. En økt er
// gyldig med løft, med annet, eller med begge.
// Økter lagret før runder ble loggført har { øvelse-id: {vekt,reps} }; det
// formatet leses fortsatt, og skrives om til en liste med én runde.
// PATCH  /api/okter/:id              -> rett opp en økt { userId, ovelser?, dato?, shared? }
//                                       Endres tallene, nullstilles heiaropene:
//                                       de gjaldt økta slik den sto.
// DELETE /api/okter/:id?userId=X     -> slett (kun eier eller admin)
// POST   /api/okter/:id/heiarop      -> heia på / ta bort heiarop { userId, navn }
//
// Heiarop har sin EGEN rute, i stedet for å gå gjennom PATCH. PATCH er
// forbeholdt eieren, og det vernet skal stå: en venn skal kunne heie, men
// ikke kunne rette på tallene dine. Denne ruta rører bare heiarop-lista.
//
// Admin-passord settes som miljøvariabelen ADMIN_PASSWORD i Netlify. Er den
// ikke satt, er admin-tilgangen avslått.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const STORE_OKTER = 'bedreliv-okter';

// Så mange øvelser kan én økt inneholde. Programmet har fem; taket er bare et
// vern mot at en rusk-klient sender inn noe absurd.
const MAKS_OVELSER = 40;

// Tak på runder per øvelse. Programmet har tre; taket er romslig så antallet
// kan endres uten at serveren står i veien.
const MAKS_RUNDER = 12;

// Tak på fritekst og varighet i «annet». Taket er bare et vern mot at en
// rusk-klient sender inn en roman eller et døgn på 100 timer.
const MAKS_ANNET_TEGN = 60;
const MAKS_MINUTTER = 1440;

// Tak på heiarop per økt. Vennegjengen er liten; taket er bare et vern mot at
// en rusk-klient fyller en post med tusenvis av oppføringer.
const MAKS_HEIAROP = 100;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function idFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

// /api/okter/:id/heiarop — id-en er nest sist, ikke sist.
function idFraHeiaropSti(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 2];
}

function isAdminPw(pw) {
  return !!ADMIN_PASSWORD && !!pw && pw === ADMIN_PASSWORD;
}

// Bedreliv er en venneapp: alle i gjengen ser hverandres økter. GET filtrerer
// derfor ikke på eierskap lenger — det gjør bare skriveoperasjonene, som
// fortsatt er forbeholdt eieren. Feltet «shared» blir stående på postene for
// historikkens skyld, men styrer ikke lenger hvem som får se dem.
//
// userId må være med for å liste. Det er en fartsdump mot tilfeldig skraping,
// ikke en lås — den er triviell å forfalske og skal ikke forveksles med
// innlogging. Innholdet er navn, kilo og datoer, ingen hemmeligheter.

function cleanStr(v, max) {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

function cleanRunde(val) {
  if (!val || typeof val !== 'object') return null;
  const vekt = Number(val.vekt);
  const reps = Number(val.reps);
  if (!Number.isFinite(vekt) || !Number.isFinite(reps)) return null;
  if (vekt <= 0 || reps <= 0) return null;
  if (vekt > 1000 || reps > 1000) return null;
  return { vekt, reps };
}

// Vasker { knebøy: [ {vekt,reps}, ... ] } til rene tall. Alt som ikke er et
// gyldig løft faller ut, så en halvutfylt rad aldri havner i loggen.
// Tar også imot det gamle formatet — ett {vekt,reps} per øvelse — og skriver
// det om til en liste med én runde, så eldre økter kan rettes uten videre.
function cleanOvelser(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const ut = {};
  let n = 0;
  for (const [key, val] of Object.entries(raw)) {
    if (n >= MAKS_OVELSER) break;
    const kandidater = Array.isArray(val) ? val : [val];
    const runder = [];
    for (const k of kandidater) {
      if (runder.length >= MAKS_RUNDER) break;
      const r = cleanRunde(k);
      if (r) runder.push(r);
    }
    if (!runder.length) continue;
    ut[String(key).slice(0, 40)] = runder;
    n++;
  }
  return Object.keys(ut).length ? ut : null;
}

// Vasker den valgfrie «annet»-posten. «hva» må stå — uten den er det ingen
// økt å vise. Minutter er valgfritt: noen vet hvor lenge de løp, andre ikke.
function cleanAnnet(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const hva = cleanStr(raw.hva, MAKS_ANNET_TEGN);
  if (!hva) return null;
  const m = Number(raw.minutter);
  const minutter = Number.isFinite(m) && m > 0 && m <= MAKS_MINUTTER ? Math.round(m) : null;
  return minutter ? { hva, minutter } : { hva };
}

function cleanDato(v) {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export default async (req) => {
  const store = getStore(STORE_OKTER);
  const url = new URL(req.url);
  const isCollection = url.pathname.endsWith('/okter') || url.pathname.endsWith('/okter/');
  const isHeiarop = url.pathname.endsWith('/heiarop');

  try {
    if (req.method === 'GET') {
      const userId = url.searchParams.get('userId') || null;
      const isAdmin = isAdminPw(url.searchParams.get('admin'));
      if (!userId && !isAdmin) return json(400, { error: 'Mangler userId' });
      const { blobs } = await store.list();
      // Isoler hver post: én korrupt blob skal ikke velte hele loggen.
      const raw = await Promise.all(
        blobs.map(async (b) => {
          try {
            return await store.get(b.key, { type: 'json' });
          } catch (err) {
            console.error('Kunne ikke lese økt', b.key, err && err.message);
            return null;
          }
        })
      );
      const okter = raw.filter((x) => x && typeof x === 'object');
      // Eldst først — front-end regner «forrige økt» ut fra rekkefølgen.
      okter.sort((a, b) => new Date(a.dato || 0) - new Date(b.dato || 0));
      return json(200, { okter });
    }

    // ===== Heiarop =====
    if (req.method === 'POST' && isHeiarop) {
      const id = idFraHeiaropSti(url.pathname);
      if (!id) return json(400, { error: 'Mangler id' });
      const body = await req.json();
      const userId = cleanStr(body.userId, 64);
      if (!userId) return json(400, { error: 'Mangler userId' });

      const okt = await store.get(id, { type: 'json' });
      if (!okt) return json(404, { error: 'Fant ikke økta' });
      if (okt.ownerId && okt.ownerId === userId) {
        return json(403, { error: 'Du kan ikke heie på din egen økt' });
      }

      const liste = Array.isArray(okt.heiarop) ? okt.heiarop : [];
      const finnes = liste.findIndex((h) => h && h.id === userId);
      if (finnes >= 0) {
        liste.splice(finnes, 1);   // trykk igjen = ta bort heiaropet
      } else {
        if (liste.length >= MAKS_HEIAROP) return json(400, { error: 'For mange heiarop' });
        liste.push({
          id: userId,
          navn: cleanStr(body.navn, 40) || 'Noen',
          naar: new Date().toISOString()
        });
      }
      okt.heiarop = liste;
      await store.setJSON(id, okt);
      return json(200, { heiarop: liste });
    }

    if (req.method === 'POST' && isCollection) {
      const body = await req.json();
      const ovelser = cleanOvelser(body.ovelser);
      const annet = cleanAnnet(body.annet);
      // En økt kan bestå av bare løft, bare «annet», eller begge. Bare tom
      // er den ikke lov å være.
      if (!ovelser && !annet) return json(400, { error: 'Økta inneholder verken løft eller annet' });
      const id = 'okt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const okt = {
        id,
        ownerId: cleanStr(body.ownerId, 64),
        savedBy: cleanStr(body.savedBy, 40),
        shared: body.shared === true,
        dato: cleanDato(body.dato) || new Date().toISOString(),
        ovelser: ovelser || {},
        annet: annet || null,
        heiarop: [],
        savedAt: new Date().toISOString()
      };
      await store.setJSON(id, okt);
      return json(201, okt);
    }

    if (req.method === 'PATCH') {
      const id = idFromPath(url.pathname);
      if (!id) return json(400, { error: 'Mangler id' });
      const existing = await store.get(id, { type: 'json' });
      if (!existing) return json(404, { error: 'Fant ikke økta' });
      const body = await req.json();
      // Eierskapsvakt: en eid økt kan bare endres av eieren eller admin.
      if (existing.ownerId && !isAdminPw(body.admin) && body.userId !== existing.ownerId) {
        return json(403, { error: 'Bare eieren kan endre denne økta' });
      }
      const updated = { ...existing };
      // Løft og «annet» rettes i samme kall. Én av dem må stå igjen etterpå —
      // ellers er det ingen økt, og da er sletting det riktige.
      const rorerOvelser = body.ovelser !== undefined;
      const rorerAnnet = body.annet !== undefined;
      if (rorerOvelser || rorerAnnet) {
        const ovelser = rorerOvelser ? cleanOvelser(body.ovelser) : cleanOvelser(existing.ovelser);
        const annet = rorerAnnet ? cleanAnnet(body.annet) : cleanAnnet(existing.annet);
        if (!ovelser && !annet) {
          return json(400, { error: 'Økta inneholder verken løft eller annet' });
        }
        // Heiarop er en reaksjon på et bestemt innhold. Endres løftene eller
        // det du gjorde ellers, gjelder de ikke lenger det noen heiet på, og
        // fjernes. Flytter du bare datoen, står de.
        //
        // Den lagrede økta vaskes gjennom de samme funksjonene før
        // sammenlikningen. Ellers ville en økt i det gamle formatet alltid
        // sett «endret» ut, og mistet heiaropene sine ved første berøring.
        const for1 = JSON.stringify([cleanOvelser(existing.ovelser), cleanAnnet(existing.annet)]);
        const etter = JSON.stringify([ovelser, annet]);
        if (etter !== for1) updated.heiarop = [];
        updated.ovelser = ovelser || {};
        updated.annet = annet || null;
      }
      const dato = cleanDato(body.dato);
      if (dato) updated.dato = dato;
      if (typeof body.shared === 'boolean') updated.shared = body.shared;
      updated.updatedAt = new Date().toISOString();
      await store.setJSON(id, updated);
      return json(200, updated);
    }

    if (req.method === 'DELETE') {
      const id = idFromPath(url.pathname);
      if (!id) return json(400, { error: 'Mangler id' });
      // Eierskapsvakt via query-parametre, siden DELETE-body er upålitelig i
      // enkelte klienter.
      const existing = await store.get(id, { type: 'json' });
      if (existing && existing.ownerId) {
        const isAdmin = isAdminPw(url.searchParams.get('admin'));
        if (!isAdmin && url.searchParams.get('userId') !== existing.ownerId) {
          return json(403, { error: 'Bare eieren kan slette denne økta' });
        }
      }
      await store.delete(id);
      return json(200, { deleted: id });
    }

    return json(405, { error: 'Metode ikke støttet' });
  } catch (e) {
    return json(500, { error: e.message || 'Ukjent feil' });
  }
};

export const config = { path: ['/api/okter', '/api/okter/:id', '/api/okter/:id/heiarop'] };
