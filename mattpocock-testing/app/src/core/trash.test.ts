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
