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

describe("updating a Note", () => {
  it("persists the new text and bumps updatedAt, across reload", async () => {
    const dbName = freshDb();
    const notes = await openNotes({ dbName });
    const created = await notes.create("draft");
    await new Promise((resolve) => setTimeout(resolve, 5));

    const updated = await notes.update(created.id, "final\nbody");

    expect(updated.text).toBe("final\nbody");
    expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    expect(updated.createdAt).toBe(created.createdAt);

    const [reloaded] = await (await openNotes({ dbName })).list();
    expect(reloaded?.text).toBe("final\nbody");
    expect(reloaded?.updatedAt).toBe(updated.updatedAt);
  });

  it("changes the Title when the first line changes", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const created = await notes.create("old title");

    await notes.update(created.id, "new title\nmore");

    const [note] = await notes.list();
    expect(note?.title).toBe("new title");
  });

  it("rejects an unknown id", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await expect(notes.update("missing", "x")).rejects.toThrow(/not found/i);
  });
});

describe("ordering", () => {
  it("lists Notes by updatedAt descending, so an edited Note moves to the top", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const a = await notes.create("a");
    await new Promise((resolve) => setTimeout(resolve, 5));
    await notes.create("b");
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((await notes.list()).map((n) => n.title)).toEqual(["b", "a"]);

    await notes.update(a.id, "a edited");

    expect((await notes.list()).map((n) => n.title)).toEqual(["a edited", "b"]);
  });
});

describe("the injected clock", () => {
  it("stamps createdAt and updatedAt on create and update", async () => {
    let t = 1_000;
    const notes = await openNotes({ dbName: freshDb(), now: () => t });
    const created = await notes.create("a");
    expect([created.createdAt, created.updatedAt]).toEqual([1_000, 1_000]);

    t = 2_000;
    const updated = await notes.update(created.id, "a2");

    expect(updated.createdAt).toBe(1_000);
    expect(updated.updatedAt).toBe(2_000);
  });
});
