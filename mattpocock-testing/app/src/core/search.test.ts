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

  it("ranks a Title match above a body match of similar length", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    // Some unrelated Notes so word rarity is realistic.
    await notes.create("Groceries\nbuy oat milk and bread today");
    await notes.create("Ideas\nwrite a novel about the sea");
    await notes.create("Taxes\nfile the forms before april");
    // The word appears only in the body here (three times, so a plain
    // unboosted score would favour it) and only in the Title there.
    await notes.create("Weekend\nwater the garden, rake the garden, trim the garden hedge");
    await notes.create("Garden plans for spring\nwater the lawn, rake the leaves, trim the hedge");
    expect((await notes.search("garden"))[0]?.title).toBe("Garden plans for spring");
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

  it("stays in sync as Notes are created and edited", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const note = await notes.create("Draft\nabout pelicans");
    expect(titles(await notes.search("pelican"))).toEqual(["Draft"]);
    await notes.update(note.id, "Draft\nabout walruses");
    expect(await notes.search("pelican")).toEqual([]);
    expect(titles(await notes.search("walrus"))).toEqual(["Draft"]);
    await notes.create("Fresh\nanother walrus");
    expect(await notes.search("walrus")).toHaveLength(2);
  });

  it("excludes trashed Notes", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const gone = await notes.create("Gone\nsecret #work");
    await notes.create("Kept\nsecret #work");
    await notes.trash(gone.id);
    expect(titles(await notes.search("secret"))).toEqual(["Kept"]);
    expect(titles(await notes.search("#work"))).toEqual(["Kept"]);
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

  it("requires every word to match (AND), keeping prefix and typo tolerance", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    await notes.create("Budget\nreview the numbers");
    await notes.create("Budget only\nnothing else");
    await notes.create("Review only\nnothing else");
    expect(titles(await notes.search("budget review"))).toEqual(["Budget"]);
    expect(titles(await notes.search("budg rev"))).toEqual(["Budget"]);
    expect(titles(await notes.search("budgit reviw"))).toEqual(["Budget"]);
  });
});
