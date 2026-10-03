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
});
