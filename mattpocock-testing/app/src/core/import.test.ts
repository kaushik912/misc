import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `import-test-${++n}`;

describe("importBundle()", () => {
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
});
