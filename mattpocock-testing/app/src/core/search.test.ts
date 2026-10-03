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

  it("ranks Title matches above body matches", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Weekend\ngarden garden garden garden garden garden garden garden garden garden garden garden");
    await notes.create("Garden\nplant tomatoes and a very long list of other chores for the day and then some more words to pad this note out even further so it is clearly the longest one around");
    expect((await notes.search("garden"))[0]?.title).toBe("Garden");
  });

  it("filters by a #tag token, case-insensitively", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Plan\n#Work quarterly review");
    await notes.create("Chores\n#home laundry");
    expect(titles(await notes.search("#work"))).toEqual(["Plan"]);
  });

  it("combines a #tag token with text", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Plan\n#work budget review");
    await notes.create("Standup\n#work daily sync");
    await notes.create("Taxes\n#home budget review");
    expect(titles(await notes.search("budget #work"))).toEqual(["Plan"]);
  });

  it("requires every #tag token to match", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("A\n#work #urgent");
    await notes.create("B\n#work");
    expect(titles(await notes.search("#work #urgent"))).toEqual(["A"]);
  });

  it("tolerates typos",async () => {
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
