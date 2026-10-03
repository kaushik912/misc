import { strToU8, zipSync, type Zippable } from "fflate";
import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `scale-test-${++n}`;

const COUNT = 2000;

function bundleOf(count: number): Uint8Array {
  const entries: Zippable = {};
  for (let i = 0; i < count; i++) {
    const id = `00000000-0000-7000-8000-${String(i).padStart(12, "0")}`;
    entries[`${id}.txt`] = [
      strToU8(`Note ${i}\ncommon words here #t${i % 10}`),
      { mtime: Date.UTC(2024, 0, 1) + i * 60_000 },
    ];
  }
  return zipSync(entries, { level: 0 });
}

// Generous bounds: these only catch order-of-magnitude regressions
// (e.g. re-reading and re-deriving every Note on each call).
describe(`at ${COUNT} Notes`, () => {
  it("imports a large bundle, then serves repeated reads quickly", async () => {
    const notes = await openNotes({ dbName: freshDb() });

    const importStart = performance.now();
    expect(await notes.importBundle(bundleOf(COUNT))).toEqual({
      added: COUNT,
      updated: 0,
      skipped: 0,
    });
    expect(performance.now() - importStart).toBeLessThan(15_000);

    const start = performance.now();
    for (let i = 0; i < 40; i++) {
      await notes.list();
      await notes.listTags();
      await notes.search("common");
      await notes.notesByTag("t3");
      await notes.exportReminderDue();
    }
    expect(performance.now() - start).toBeLessThan(1_500);

    const all = await notes.list();
    expect(all).toHaveLength(COUNT);
    expect(all[0]!.title).toBe(`Note ${COUNT - 1}`);
    expect((await notes.listTags()).map((t) => t.count)).toEqual(Array(10).fill(COUNT / 10));
  });
});
