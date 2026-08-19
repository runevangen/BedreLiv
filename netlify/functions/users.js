import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

// Enkel navn+PIN-innlogging. Samme mønster som pizzame, men egen blob-store,
// så Bedreliv har sine egne brukere.
// Ingen sensitive data — PIN er en lett sperre, ikke ekte sikkerhet.
//
// GET    /api/users?name=X            -> { exists: true|false }
// POST   /api/users                   -> registrer ny bruker { name, pin } -> { id, name }
// POST   /api/users/verify            -> logg inn { name, pin } -> { ok:true, id, name } | { ok:false }
// GET    /api/users/admin?password=X  -> (admin) alle brukere, uten PIN-hash
// PATCH  /api/users/admin/:id         -> (admin) sett ny PIN { password, newPin }
// DELETE /api/users/admin/:id?password=X -> (admin) slett bruker
//
// Admin-passord: sett miljøvariabelen ADMIN_PASSWORD i Netlify
// (Site settings → Environment variables). Er den ikke satt, er
// admin-endepunktene avslått — ingen innebygd fallback å glemme å bytte.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const STORE_USERS = 'bedreliv-users';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function hash(str) {
  return crypto.createHash('sha256').update(String(str)).digest('hex');
}

function checkAdminPassword(pw) {
  if (!ADMIN_PASSWORD || !pw) return false;
  return pw === ADMIN_PASSWORD;
}

function idFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

// Brukere lagres med normalisert navn som blob-nøkkel, ikke med den interne
// id-en. Admin sender inn "id" fra listen sin, så PATCH/DELETE må først finne
// den ekte nøkkelen — ellers treffer store.get/delete aldri noen faktisk blob
// og operasjonen feiler stille.
async function keyForUserId(store, id) {
  const { blobs } = await store.list();
  for (const b of blobs) {
    const u = await store.get(b.key, { type: 'json' });
    if (u && u.id === id) return b.key;
  }
  return null;
}

export default async (req) => {
  const store = getStore(STORE_USERS);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const isAdminPath = pathParts.includes('admin');
  const isVerifyPath = pathParts.includes('verify');

  try {
    // ===== ADMIN: liste alle brukere =====
    if (req.method === 'GET' && isAdminPath) {
      if (!checkAdminPassword(url.searchParams.get('password'))) {
        return json(401, { error: 'Feil passord' });
      }
      const { blobs } = await store.list();
      const users = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
      const safe = users.filter(Boolean).map((u) => ({
        id: u.id,
        name: u.displayName,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt
      }));
      safe.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return json(200, { users: safe });
    }

    // ===== ADMIN: sett ny PIN =====
    if (req.method === 'PATCH' && isAdminPath) {
      const id = idFromPath(url.pathname);
      const body = await req.json();
      if (!checkAdminPassword(body.password)) return json(401, { error: 'Feil passord' });
      if (!/^\d{4}$/.test(String(body.newPin || ''))) return json(400, { error: 'PIN må være 4 siffer' });
      const key = await keyForUserId(store, id);
      if (!key) return json(404, { error: 'Fant ikke bruker' });
      const existing = await store.get(key, { type: 'json' });
      if (!existing) return json(404, { error: 'Fant ikke bruker' });
      existing.pinHash = hash(body.newPin);
      await store.setJSON(key, existing);
      return json(200, { ok: true });
    }

    // ===== ADMIN: slett bruker =====
    if (req.method === 'DELETE' && isAdminPath) {
      const id = idFromPath(url.pathname);
      if (!checkAdminPassword(url.searchParams.get('password'))) {
        return json(401, { error: 'Feil passord' });
      }
      const key = await keyForUserId(store, id);
      if (!key) return json(404, { error: 'Fant ikke bruker' });
      await store.delete(key);
      return json(200, { deleted: id });
    }

    // ===== Finnes navnet fra før? =====
    if (req.method === 'GET') {
      const name = url.searchParams.get('name');
      if (!name) return json(400, { error: 'Mangler name' });
      const existing = await store.get(normalizeName(name), { type: 'json' });
      return json(200, { exists: !!existing });
    }

    // ===== Innlogging =====
    if (req.method === 'POST' && isVerifyPath) {
      const body = await req.json();
      const existing = await store.get(normalizeName(body.name), { type: 'json' });
      if (!existing || existing.pinHash !== hash(body.pin)) {
        return json(401, { ok: false });
      }
      existing.lastLoginAt = new Date().toISOString();
      await store.setJSON(normalizeName(body.name), existing);
      return json(200, { ok: true, id: existing.id, name: existing.displayName });
    }

    // ===== Registrering =====
    if (req.method === 'POST') {
      const body = await req.json();
      const displayName = String(body.name || '').trim().slice(0, 40);
      if (!displayName) return json(400, { error: 'Mangler navn' });
      if (!/^\d{4}$/.test(String(body.pin || ''))) return json(400, { error: 'PIN må være 4 siffer' });
      const key = normalizeName(displayName);
      if (await store.get(key, { type: 'json' })) {
        return json(409, { error: 'Navnet er allerede registrert' });
      }
      const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await store.setJSON(key, {
        id,
        displayName,
        pinHash: hash(body.pin),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
      return json(201, { id, name: displayName });
    }

    return json(405, { error: 'Metode ikke støttet' });
  } catch (e) {
    return json(500, { error: e.message || 'Ukjent feil' });
  }
};

export const config = {
  path: ['/api/users', '/api/users/verify', '/api/users/admin', '/api/users/admin/:id']
};
