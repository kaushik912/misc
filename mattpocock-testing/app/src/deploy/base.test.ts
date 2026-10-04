import { describe, expect, it } from "vitest";
import { normalizeBase } from "./base";

describe("normalizeBase", () => {
  it("defaults to the site root", () => {
    expect(normalizeBase(undefined)).toBe("/");
    expect(normalizeBase("")).toBe("/");
  });
  it("accepts a subpath with or without slashes", () => {
    expect(normalizeBase("/misc/")).toBe("/misc/");
    expect(normalizeBase("misc")).toBe("/misc/");
    expect(normalizeBase("/misc")).toBe("/misc/");
  });
  it("keeps nested subpaths", () => {
    expect(normalizeBase("a/b")).toBe("/a/b/");
  });
});
