import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `search-test-${++n}`;

const titles = (results: { title: string }[]) => results.map((r) => r.title);

describe("search(query)", () => {
  it("finds Notes by a word in the body", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Groceries\nbuy oat milk");
    await notes.create("Ideas\nwrite a novel");
    expect(titles(await notes.search("milk"))).toEqual(["Groceries"]);
  });

  it("tolerates typos", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Groceries\nbuy oat milk");
    await notes.create("Ideas\nwrite a novel");
    expect(titles(await notes.search("grocries"))).toEqual(["Groceries"]);
  });

  it("matches word prefixes",async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Groceries\nbuy oat milk");
    await notes.create("Ideas\nwrite a novel");
    expect(titles(await notes.search("groc"))).toEqual(["Groceries"]);
  });
});
