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
});
