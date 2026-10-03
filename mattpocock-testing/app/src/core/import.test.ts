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
