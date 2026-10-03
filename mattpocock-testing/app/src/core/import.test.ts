import { strToU8, zipSync } from "fflate";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `import-test-${++n}`;

const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);
const at = (secondsAfterT0: number) => vi.setSystemTime(T0 + secondsAfterT0 * 1000);

describe("importBundle()", () => {
  afterEach(() => vi.useRealTimers());

  it("adds Notes from a bundle exported elsewhere, keeping their ids", async () => {
    const source = await openNotes({ dbName: freshDb() });
    const a = await source.create("First #x");
    const b = await source.create("Second");
    const bundle = await source.exportBundle();

    const target = await openNotes({ dbName: freshDb() });
    const result = await target.importBundle(bundle);

    expect(result).toEqual({ added: 2, updated: 0, skipped: 0 });
    const texts = Object.fromEntries((await target.list()).map((x) => [x.id, x.text]));
    expect(texts).toEqual({ [a.id]: "First #x", [b.id]: "Second" });
  });

  describe("files not named like an id", () => {
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/;

    it("become new Notes with fresh ids, every time", async () => {
      const zip = zipSync({
        "groceries.txt": strToU8("Milk\n#shopping"),
        "not-a-uuid-1234.txt": strToU8("Other"),
      });
      const notes = await openNotes({ dbName: freshDb() });

      expect(await notes.importBundle(zip)).toEqual({ added: 2, updated: 0, skipped: 0 });
      expect(await notes.importBundle(zip)).toEqual({ added: 2, updated: 0, skipped: 0 });

      const all = await notes.list();
      expect(all).toHaveLength(4);
      expect(new Set(all.map((x) => x.id)).size).toBe(4);
      for (const note of all) expect(note.id).toMatch(UUID);
      expect(all.filter((x) => x.text === "Milk\n#shopping")).toHaveLength(2);
    });

    it("take updatedAt from the entry time, falling back to DOS time", async () => {
      const local = new Date(2026, 2, 3, 4, 5, 6);
      const zip = zipSync({ "plain.txt": [strToU8("x"), { mtime: local }] });
      const notes = await openNotes({ dbName: freshDb() });

      await notes.importBundle(zip);

      expect((await notes.list())[0]!.updatedAt).toBe(local.getTime());
    });

    it("prefer the extended timestamp over DOS time when present", async () => {
      const zip = zipSync({
        "plain.txt": [
          strToU8("x"),
          { mtime: new Date(2020, 0, 1), extra: { 0x5455: new Uint8Array([1, 0x2c, 0x01, 0, 0]) } },
        ],
      });
      const notes = await openNotes({ dbName: freshDb() });

      await notes.importBundle(zip);

      expect((await notes.list())[0]!.updatedAt).toBe(300 * 1000);
    });
  });

  describe("collisions on the same id", () => {
    async function twoDevices() {
      vi.useFakeTimers({ toFake: ["Date"] });
      at(0);
      const a = await openNotes({ dbName: freshDb() });
      const b = await openNotes({ dbName: freshDb() });
      const note = await a.create("v1");
      await b.importBundle(await a.exportBundle());
      return { a, b, id: note.id };
    }
    const textOf = async (notes: Awaited<ReturnType<typeof openNotes>>, id: string) =>
      (await notes.list()).find((x) => x.id === id)?.text;

    it("overwrites when the bundle entry is newer", async () => {
      const { a, b, id } = await twoDevices();
      at(5);
      await a.update(id, "v2");

      const result = await b.importBundle(await a.exportBundle());

      expect(result).toEqual({ added: 0, updated: 1, skipped: 0 });
      expect(await textOf(b, id)).toBe("v2");
    });

    it("skips when the bundle entry is equal", async () => {
      const { a, b, id } = await twoDevices();

      const result = await b.importBundle(await a.exportBundle());

      expect(result).toEqual({ added: 0, updated: 0, skipped: 1 });
      expect(await textOf(b, id)).toBe("v1");
    });

    it("skips when the bundle entry is older, never losing newer work", async () => {
      const { a, b, id } = await twoDevices();
      at(5);
      await b.update(id, "newer local");

      const result = await b.importBundle(await a.exportBundle());

      expect(result).toEqual({ added: 0, updated: 0, skipped: 1 });
      expect(await textOf(b, id)).toBe("newer local");
    });

    it("treats sub-second differences as equal (bundle time is whole seconds)", async () => {
      const { a, b, id } = await twoDevices();
      vi.setSystemTime(T0 + 500);
      await b.update(id, "same second");

      const result = await b.importBundle(await a.exportBundle());

      expect(result.skipped).toBe(1);
    });
  });
});
