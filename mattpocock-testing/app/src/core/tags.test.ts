import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `tags-test-${++n}`;

async function tagsOf(text: string): Promise<string[]> {
  const notes = await openNotes({ dbName: freshDb() });
  await notes.create(text);
  const [note] = await notes.list();
  return note?.tags ?? [];
}

describe("deriving Tags", () => {
  it("derives Tags written inline, in order of first appearance", async () => {
    expect(await tagsOf("Plan #work and #home\n#ideas")).toEqual(["work", "home", "ideas"]);
  });

  it("is case-insensitive, stored lowercase, without duplicates", async () => {
    expect(await tagsOf("#Work #WORK #work")).toEqual(["work"]);
  });

  it("allows digits and hyphens after the first letter", async () => {
    expect(await tagsOf("#to-do-2 #a1")).toEqual(["to-do-2", "a1"]);
  });

  it("does not treat #123, #-x or a lone # as Tags", async () => {
    expect(await tagsOf("#123 #-x # #9lives")).toEqual([]);
  });

  it("does not treat page#section as a Tag", async () => {
    expect(await tagsOf("see page#section and a##b")).toEqual([]);
  });

  it("requires whitespace or line start before the #", async () => {
    expect(await tagsOf("(#nope) x\t#tab\n#start")).toEqual(["tab", "start"]);
  });

  it("stops a Tag at the first character that is not a letter, digit or -", async () => {
    expect(await tagsOf("#work, #home. #a_b")).toEqual(["work", "home", "a"]);
  });
});
