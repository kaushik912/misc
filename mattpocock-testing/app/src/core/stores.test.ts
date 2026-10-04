import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

const T0 = Date.UTC(2026, 0, 1);
let n = 0;
const freshDb = () => `stores-test-${++n}`;

/**
 * Two open stores on one database, as with two tabs or a PWA window beside a
 * tab. Reads may be stale until reopening, but writes must act on what is
 * actually stored, never on a store's cached copy.
 */
async function twoStores(clock = { t: T0 }) {
  const dbName = freshDb();
  const opts = { dbName, now: () => clock.t };
  const a = await openNotes(opts);
  const reopen = () => openNotes(opts);
  return { a, reopen };
}

describe("two stores on the same database", () => {
  it("update() does not un-trash a Note trashed in the other store", async () => {
    const { a, reopen } = await twoStores();
    const note = await a.create("Draft");
    const stale = await reopen();
    await a.trash(note.id);

    await stale.update(note.id, "Draft edited");

    const fresh = await reopen();
    expect(await fresh.list()).toEqual([]);
    expect((await fresh.listTrash()).map((x) => x.text)).toEqual(["Draft edited"]);
  });

  it("update() of a Note permanently deleted elsewhere is rejected, not resurrected", async () => {
    const { a, reopen } = await twoStores();
    const note = await a.create("Doomed");
    const stale = await reopen();
    await a.trash(note.id);
    await a.emptyTrash();

    await expect(stale.update(note.id, "Zombie")).rejects.toThrow(/not found/i);

    const fresh = await reopen();
    expect(await fresh.list()).toEqual([]);
    expect(await fresh.listTrash()).toEqual([]);
  });

  it("trash() keeps text edited in the other store", async () => {
    const { a, reopen } = await twoStores();
    const note = await a.create("v1");
    const stale = await reopen();
    await a.update(note.id, "v2");

    await stale.trash(note.id);

    expect((await stale.listTrash()).map((x) => x.text)).toEqual(["v2"]);
    expect((await (await reopen()).listTrash()).map((x) => x.text)).toEqual(["v2"]);
  });

  it("restore() keeps text edited in the other store", async () => {
    const { a, reopen } = await twoStores();
    const note = await a.create("v1");
    await a.trash(note.id);
    const stale = await reopen();
    await a.update(note.id, "v2");

    await stale.restore(note.id);

    expect((await stale.list()).map((x) => x.text)).toEqual(["v2"]);
    expect((await (await reopen()).list()).map((x) => x.text)).toEqual(["v2"]);
  });

  it("emptyTrash() deletes Notes trashed in the other store too", async () => {
    const { a, reopen } = await twoStores();
    const known = await a.create("Known");
    const other = await a.create("Trashed elsewhere");
    const stale = await reopen();
    await a.trash(other.id);
    await stale.trash(known.id);

    await stale.emptyTrash();

    const fresh = await reopen();
    expect(await fresh.listTrash()).toEqual([]);
    expect(await fresh.list()).toEqual([]);
  });

  it("importBundle() compares against stored Notes, not a stale copy", async () => {
    const clock = { t: T0 };
    const { a, reopen } = await twoStores(clock);
    const note = await a.create("v1");
    const stale = await reopen();
    clock.t = T0 + 2_000;
    await a.update(note.id, "v2");
    const bundleOfV2 = await a.exportBundle();
    clock.t = T0 + 5_000;
    await a.update(note.id, "v3");

    const result = await stale.importBundle(bundleOfV2);

    expect(result).toEqual({ added: 0, updated: 0, skipped: 1 });
    expect((await (await reopen()).list()).map((x) => x.text)).toEqual(["v3"]);
  });

  it("importBundle() does not resurrect a Note permanently deleted elsewhere as a stale update", async () => {
    const clock = { t: T0 };
    const { a, reopen } = await twoStores(clock);
    const note = await a.create("v1");
    const bundle = await a.exportBundle();
    const stale = await reopen();
    await a.trash(note.id);
    await a.emptyTrash();

    const result = await stale.importBundle(bundle);

    // The Note no longer exists, so it is simply added back from the bundle.
    expect(result).toEqual({ added: 1, updated: 0, skipped: 0 });
    expect((await (await reopen()).list()).map((x) => x.text)).toEqual(["v1"]);
  });

  it("exportBundle() contains what is stored, not what this store last saw", async () => {
    const { a, reopen } = await twoStores();
    const gone = await a.create("Trashed elsewhere");
    const stale = await reopen();
    await a.create("Created elsewhere");
    await a.trash(gone.id);

    const target = await openNotes({ dbName: freshDb() });
    await target.importBundle(await stale.exportBundle());

    expect((await target.list()).map((x) => x.text)).toEqual(["Created elsewhere"]);
  });
});
