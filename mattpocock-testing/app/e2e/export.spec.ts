import { readFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { expect, test } from "@playwright/test";

test("Export downloads a zip containing the Note", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Exported note");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^notes-\d{4}-\d{2}-\d{2}\.zip$/);

  const files = unzipSync(new Uint8Array(readFileSync(await download.path())));
  expect(Object.keys(files)).toHaveLength(1);
  expect(Object.keys(files)[0]).toMatch(/\.txt$/);
  expect(strFromU8(Object.values(files)[0]!)).toBe("Exported note");
});
