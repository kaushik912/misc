import { describe, expect, it } from "vitest";
import { openNotes } from "./index";

let n = 0;
const freshDb = () => `reminder-test-${++n}`;
const DAY = 24 * 60 * 60 * 1000;

function clock(start = Date.UTC(2026, 0, 1)) {
  let t = start;
  return { now: () => t, advance: (ms: number) => void (t += ms) };
}

describe("export reminder", () => {
  it("is due when live Notes exist and there was never an export", async () => {
    const notes = await openNotes({ dbName: freshDb(), now: clock().now });
    await notes.create("hello");
    expect(await notes.exportReminderDue()).toBe(true);
  });

  it("clears after an export", async () => {
    const notes = await openNotes({ dbName: freshDb(), now: clock().now });
    await notes.create("hello");
    await notes.exportBundle();
    expect(await notes.exportReminderDue()).toBe(false);
  });

  it("becomes due again exactly 30 days after the last export", async () => {
    const c = clock();
    const notes = await openNotes({ dbName: freshDb(), now: c.now });
    await notes.create("hello");
    await notes.exportBundle();
    c.advance(30 * DAY - 1);
    expect(await notes.exportReminderDue()).toBe(false);
    c.advance(1);
    expect(await notes.exportReminderDue()).toBe(true);
  });

  it("remembers the last export across reopening the database", async () => {
    const c = clock();
    const dbName = freshDb();
    const first = await openNotes({ dbName, now: c.now });
    await first.create("hello");
    await first.exportBundle();
    const second = await openNotes({ dbName, now: c.now });
    expect(await second.exportReminderDue()).toBe(false);
    c.advance(30 * DAY);
    expect(await second.exportReminderDue()).toBe(true);
  });

  it("is not due after 30 days when there are no live Notes", async () => {
    const c = clock();
    const notes = await openNotes({ dbName: freshDb(), now: c.now });
    await notes.exportBundle();
    c.advance(31 * DAY);
    expect(await notes.exportReminderDue()).toBe(false);
  });
});
