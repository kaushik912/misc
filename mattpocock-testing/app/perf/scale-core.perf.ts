import { describe, it } from "vitest";
import { openNotes } from "../src/core";
import { seedBundle } from "./seed";

const N = Number(process.env.PERF_N ?? 10_000);
const ms = async <T,>(label: string, fn: () => Promise<T>, runs = 5) => {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t = performance.now();
    await fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  process.stderr.write(`PERF ${label}: median ${times[Math.floor(runs / 2)]!.toFixed(1)} ms (min ${times[0]!.toFixed(1)}, max ${times[runs - 1]!.toFixed(1)})\n`);
};

describe(`scale at ${N} Notes`, () => {
  it("measures", { timeout: 600_000 }, async () => {
    const dbName = `perf-${Date.now()}`;
    const seed = await openNotes({ dbName });
    const bundle = seedBundle(N);
    await ms("seed importBundle", () => seed.importBundle(bundle), 1);
    await ms("open (index build)", () => openNotes({ dbName }), 3);
    const notes = await openNotes({ dbName });
    await ms("list()", () => notes.list());
    await ms("listTags()", () => notes.listTags());
    await ms("search('garden')", () => notes.search("garden"));
    await ms("search('budg') prefix+fuzzy", () => notes.search("budg"));
    await ms("search('#tag7')", () => notes.search("#tag7"));
    await ms("notesByTag('tag7')", () => notes.notesByTag("tag7"));
    const [first] = await notes.list();
    await ms("update()", () => notes.update(first!.id, first!.text + " edit"), 10);
    await ms("update() + list() + listTags() (autosave then refresh)", async () => {
      await notes.update(first!.id, first!.text + " edit");
      await notes.list();
      await notes.listTags();
    }, 10);
    await ms("create()", () => notes.create("new note #tag7"), 10);
    await ms("listTrash()", () => notes.listTrash());
    await ms("exportReminderDue()", () => notes.exportReminderDue());
    // The UI's refresh() after each autosave: tags + trash + reminder + list
    await ms("UI refresh (tags+trash+reminder+list)", async () => {
      await notes.listTags();
      await notes.listTrash();
      await notes.exportReminderDue();
      await notes.list();
    });
    await ms("UI refresh while searching 'garden'", async () => {
      await notes.listTags();
      await notes.listTrash();
      await notes.exportReminderDue();
      await notes.search("garden");
    });
  });
});
