import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `export-test-${++n}`;

/**
 * Reads entry mtimes straight from the zip's central directory, independently
 * of the library that wrote it. Returns both encodings a bundle carries:
 * the extended-timestamp field (UTC seconds) and the DOS time (local, 2s).
 */
function readEntryTimes(zip: Uint8Array) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let eocd = zip.length - 22;
  while (v.getUint32(eocd, true) !== 0x06054b50) eocd--;
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out = new Map<string, { utcSeconds?: number; dos: Date }>();
  for (let i = 0; i < count; i++) {
    const time = v.getUint16(p + 12, true);
    const date = v.getUint16(p + 14, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const name = strFromU8(zip.subarray(p + 46, p + 46 + nameLen));
    let utcSeconds: number | undefined;
    let e = p + 46 + nameLen;
    const end = e + extraLen;
    while (e + 4 <= end) {
      const id = v.getUint16(e, true);
      const size = v.getUint16(e + 2, true);
      if (id === 0x5455 && v.getUint8(e + 4) & 1) {
        utcSeconds = v.getInt32(e + 5, true);
      }
      e += 4 + size;
    }
    const dos = new Date(
      1980 + (date >> 9),
      ((date >> 5) & 15) - 1,
      date & 31,
      time >> 11,
      (time >> 5) & 63,
      (time & 31) * 2,
    );
    out.set(name, { utcSeconds, dos });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

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
    const dbName = freshDb();
    const notes = await openNotes({ dbName });
    const live = await notes.create("keep");
    const gone = await notes.create("trash me");
    // Trash (ticket 05) does not exist yet: mark trashedAt directly in the store.
    const { default: Dexie } = await import("dexie");
    const raw = new Dexie(dbName);
    raw.version(1).stores({ notes: "id, updatedAt, trashedAt" });
    await raw.table("notes").update(gone.id, { trashedAt: Date.now() });
    raw.close();

    const files = unzipSync(await notes.exportBundle());
    expect(Object.keys(files)).toEqual([`${live.id}.txt`]);
  });
});
