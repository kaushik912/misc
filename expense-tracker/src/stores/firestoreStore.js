// Firestore-backed store. Same interface as localStore.js — keep the two in sync
// (enforced by test/store.contract.test.js).
//
// Interface (all async except newId):
//   newId(collection)                         -> string
//   listRange(collection, uid, start, end)    -> docs with start <= date < end, date desc, each { id, ...data }
//   create(collection, id, doc)
//   update(collection, id, fields)
//   remove(collection, id)
//   getDoc(collection, id)                    -> data or null
//   addToArray(collection, id, field, value, extra) -> merge-upserts doc, adds value to array field if absent
export function createFirestoreStore(db, FieldValue) {
  return {
    newId(collection) {
      return db.collection(collection).doc().id;
    },

    async listRange(collection, uid, start, end) {
      const snapshot = await db.collection(collection)
        .where("uid", "==", uid)
        .where("date", ">=", start)
        .where("date", "<", end)
        .orderBy("date", "desc")
        .get();
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    async create(collection, id, doc) {
      await db.collection(collection).doc(id).set(doc);
    },

    async update(collection, id, fields) {
      await db.collection(collection).doc(id).update(fields);
    },

    async remove(collection, id) {
      await db.collection(collection).doc(id).delete();
    },

    async getDoc(collection, id) {
      const snap = await db.collection(collection).doc(id).get();
      return snap.exists ? snap.data() : null;
    },

    async addToArray(collection, id, field, value, extra = {}) {
      await db.collection(collection).doc(id).set(
        { ...extra, [field]: FieldValue.arrayUnion(value) },
        { merge: true }
      );
    },
  };
}
