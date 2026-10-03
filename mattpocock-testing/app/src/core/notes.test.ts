import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `notes-test-${++n}`;

describe("creating a Note", () => {
  it("persists a Note with id, timestamps and trashedAt null", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const before = Date.now();
    const created = await notes.create("Hello world");

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(created.text).toBe("Hello world");
    expect(created.trashedAt).toBeNull();
    expect(created.createdAt).toBeGreaterThanOrEqual(before);
    expect(created.updatedAt).toBe(created.createdAt);
  });

  it("survives reopening the store (reload)", async () => {
    const dbName = freshDb();
    const first = await openNotes({ dbName });
    const created = await first.create("Remember me");

    const reloaded = await openNotes({ dbName });
    const list = await reloaded.list();

    expect(list.map((note) => note.id)).toEqual([created.id]);
    expect(list[0]?.text).toBe("Remember me");
  });
});

describe("listing Notes", () => {
  it("shows the first non-blank line, trimmed, as the Title", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("\n   \n  Shopping list  \nmilk\neggs");

    const [note] = await notes.list();

    expect(note?.title).toBe("Shopping list");
  });

  it("shows an empty Note as Untitled", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("");
    await notes.create("  \n \n");

    const titles = (await notes.list()).map((note) => note.title);

    expect(titles).toEqual(["Untitled", "Untitled"]);
  });

  it("lists every created Note", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("one");
    await notes.create("two");

    const titles = (await notes.list()).map((note) => note.title).sort();

    expect(titles).toEqual(["one", "two"]);
  });
});
