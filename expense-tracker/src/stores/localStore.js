// Browser-only store for demo mode. Same interface as firestoreStore.js — keep the two in sync
// (enforced by test/store.contract.test.js). Never touches Firebase.
//
// Data shape in storage: { [collection]: { [id]: doc } }, persisted as JSON under `key`.
// `seed` is an async fn returning that shape; used on first access and on reset().
export function createLocalStore({ storage, key = "expense-tracker-demo-v1", seed = async () => ({}) }) {
  let data = null;
  let counter = 0;

  async function load() {
    if (data) return data;
    const raw = storage.getItem(key);
    data = raw ? JSON.parse(raw) : await seed();
    persist();
    return data;
  }

  function persist() {
    storage.setItem(key, JSON.stringify(data));
  }

  function table(collection) {
    return (data[collection] ??= {});
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));

  return {
    newId() {
      return `local-${Date.now().toString(36)}-${(counter++).toString(36)}`;
    },

    async listRange(collection, uid, start, end) {
      await load();
      return Object.entries(table(collection))
        .filter(([, d]) => d.uid === uid && d.date >= start && d.date < end)
        .map(([id, d]) => ({ id, ...clone(d) }))
        .sort((a, b) => b.date.localeCompare(a.date));
    },

    async create(collection, id, doc) {
      await load();
      table(collection)[id] = clone(doc);
      persist();
    },

    async update(collection, id, fields) {
      await load();
      const t = table(collection);
      if (!t[id]) throw new Error(`No document to update: ${collection}/${id}`);
      t[id] = { ...t[id], ...clone(fields) };
      persist();
    },

    async remove(collection, id) {
      await load();
      delete table(collection)[id];
      persist();
    },

    async getDoc(collection, id) {
      await load();
      const d = table(collection)[id];
      return d ? clone(d) : null;
    },

    async addToArray(collection, id, field, value, extra = {}) {
      await load();
      const t = table(collection);
      const doc = { ...(t[id] ?? {}), ...clone(extra) };
      const arr = Array.isArray(doc[field]) ? doc[field] : [];
      doc[field] = arr.includes(value) ? arr : [...arr, value];
      t[id] = doc;
      persist();
    },

    // Demo-only: wipe local changes and re-seed.
    async reset() {
      data = await seed();
      persist();
    },
  };
}
