import { describe, expect, it } from "vitest";
import { requestPersistentStorage } from "./persist";

describe("requestPersistentStorage", () => {
  it("asks the browser to persist and reports the grant", async () => {
    let asked = 0;
    const storage = { persisted: async () => false, persist: async () => (asked++, true) };
    expect(await requestPersistentStorage(storage)).toBe(true);
    expect(asked).toBe(1);
  });

  it("does not ask again when storage is already persistent", async () => {
    let asked = 0;
    const storage = { persisted: async () => true, persist: async () => (asked++, true) };
    expect(await requestPersistentStorage(storage)).toBe(true);
    expect(asked).toBe(0);
  });

  it("reports false when the browser denies the request", async () => {
    const storage = { persisted: async () => false, persist: async () => false };
    expect(await requestPersistentStorage(storage)).toBe(false);
  });

  it("reports false when the browser has no storage manager", async () => {
    expect(await requestPersistentStorage(null)).toBe(false);
  });
});
