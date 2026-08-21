// Minne-etterligning av Netlify Blobs, kun for lokal testing.
const stores = new Map();
export function getStore(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  const m = stores.get(name);
  return {
    async get(key, opts) {
      const v = m.get(key);
      if (v === undefined) return null;
      return opts && opts.type === 'json' ? JSON.parse(v) : v;
    },
    async setJSON(key, val) { m.set(key, JSON.stringify(val)); },
    async delete(key) { m.delete(key); },
    async list() { return { blobs: [...m.keys()].map((key) => ({ key })) }; }
  };
}
