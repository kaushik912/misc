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
});
