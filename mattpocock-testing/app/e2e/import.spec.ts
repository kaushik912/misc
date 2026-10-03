import { readFileSync } from "node:fs";
import { strToU8, zipSync } from "fflate";
import { expect, test } from "@playwright/test";

test("Export then import: same Note is skipped, a plain .txt becomes a new Note", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Round trip note");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export", exact: true }).click(),
  ]);
  const bundle = readFileSync(await download.path());

  await page.getByLabel("Import", { exact: true }).setInputFiles({
    name: "notes.zip",
    mimeType: "application/zip",
    buffer: bundle,
  });
  await expect(page.getByRole("status", { name: "Import summary" })).toHaveText(
    "Imported: 0 added, 0 updated, 1 skipped",
  );

  await page.getByLabel("Import", { exact: true }).setInputFiles({
    name: "other.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zipSync({ "plain.txt": strToU8("From elsewhere") })),
  });
  await expect(page.getByRole("status", { name: "Import summary" })).toHaveText(
    "Imported: 1 added, 0 updated, 0 skipped",
  );
  await expect(page.getByRole("list", { name: "Notes" })).toContainText("From elsewhere");
  await expect(page.getByRole("list", { name: "Notes" })).toContainText("Round trip note");
});
