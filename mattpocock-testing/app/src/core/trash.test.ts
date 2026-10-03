import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `trash-test-${++n}`;

const titles = (results: { title: string }[]) => results.map((r) => r.title);

describe("trash(id)", () => {
  it("removes the Note from list and moves it to listTrash with trashedAt set", async () => {
    const notes = await openNotes({ dbName: freshDb(), now: () => 5000 });
    await notes.create("Keep");
    const gone = await notes.create("Gone");
    await notes.trash(gone.id);

    expect(titles(await notes.list())).toEqual(["Keep"]);
    const trash = await notes.listTrash();
    expect(titles(trash)).toEqual(["Gone"]);
    expect(trash[0]!.trashedAt).toBe(5000);
  });

  it("excludes the Note from Tag counts, Tag filter and search in the same session", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Plan\n#work budget");
    const gone = await notes.create("Standup\n#work budget");
    expect(await notes.listTags()).toEqual([{ tag: "work", count: 2 }]);
    expect(titles(await notes.search("budget"))).toHaveLength(2);

    await notes.trash(gone.id);

    expect(await notes.listTags()).toEqual([{ tag: "work", count: 1 }]);
    expect(titles(await notes.notesByTag("work"))).toEqual(["Plan"]);
    expect(titles(await notes.search("budget"))).toEqual(["Plan"]);
  });
});

describe("restore(id)", () => {
  it("returns the Note to list, Tag counts and search, and out of the Trash", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const note = await notes.create("Plan\n#work budget");
    await notes.trash(note.id);
    await notes.restore(note.id);

    expect(titles(await notes.list())).toEqual(["Plan"]);
    expect(await notes.listTags()).toEqual([{ tag: "work", count: 1 }]);
    expect(titles(await notes.search("budget"))).toEqual(["Plan"]);
    expect(await notes.listTrash()).toEqual([]);
  });
});

describe("emptyTrash()", () => {
  it("permanently deletes trashed Notes only, including across reopen and search", async () => {
    const dbName = freshDb();
    const notes = await openNotes({ dbName });
    await notes.create("Keeper\nbudget");
    const gone = await notes.create("Goner\nbudget");
    await notes.trash(gone.id);
    await notes.emptyTrash();

    expect(await notes.listTrash()).toEqual([]);
    expect(titles(await notes.list())).toEqual(["Keeper"]);
    expect(titles(await notes.search("budget"))).toEqual(["Keeper"]);
    await expect(notes.restore(gone.id)).rejects.toThrow();

    const reopened = await openNotes({ dbName });
    expect(await reopened.listTrash()).toEqual([]);
    expect(titles(await reopened.search("goner"))).toEqual([]);
  });
});
