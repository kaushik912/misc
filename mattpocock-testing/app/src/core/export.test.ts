import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { openNotes } from "./index";
import { readEntryTimes } from "./zipEntryTimes";

let n = 0;
const freshDb = () => `export-test-${++n}`;

describe("exportBundle()", () => {
  it("contains one <id>.txt per Note holding its raw text", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const a = await notes.create("First\n\n  body with #tag  \n");
    const b = await notes.create("Second note");

    const files = unzipSync(await notes.exportBundle());

    expect(Object.keys(files).sort()).toEqual([`${a.id}.txt`, `${b.id}.txt`].sort());
    expect(strFromU8(files[`${a.id}.txt`]!)).toBe("First\n\n  body with #tag  \n");
    expect(strFromU8(files[`${b.id}.txt`]!)).toBe("Second note");
  });

  it("is a valid empty zip when there are no Notes", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    expect(Object.keys(unzipSync(await notes.exportBundle()))).toEqual([]);
  });

  it("round-trips non-ASCII text", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const a = await notes.create("Café ☕ 日本語");
    const files = unzipSync(await notes.exportBundle());
    expect(strFromU8(files[`${a.id}.txt`]!)).toBe("Café ☕ 日本語");
  });

  it("carries updatedAt as the entry mtime (UTC seconds, and DOS time to 2s)", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const a = await notes.create("x");
    const updated = await notes.update(a.id, "y");

    const times = readEntryTimes(await notes.exportBundle());
    const entry = times.get(`${a.id}.txt`)!;

    expect(entry.utcSeconds).toBe(Math.floor(updated.updatedAt / 1000));
    // DOS time is local wall-clock with 2s granularity, rounded down to even seconds.
    const dosFloor = Math.floor(updated.updatedAt / 2000) * 2000;
    expect(entry.dos.getTime()).toBe(dosFloor);
  });

  it("excludes trashed Notes", async () => {
    const notes = await openNotes({ dbName: freshDb() });
    const live = await notes.create("keep");
    const gone = await notes.create("trash me");
    await notes.trash(gone.id);

    const files = unzipSync(await notes.exportBundle());
    expect(Object.keys(files)).toEqual([`${live.id}.txt`]);
  });
});
