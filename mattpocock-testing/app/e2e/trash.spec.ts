import { expect, test } from "@playwright/test";

test("trash a Note and restore it", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Doomed note");
  const noteButton = page
    .getByRole("list", { name: "Notes" })
    .getByRole("button", { name: "Doomed note", exact: true });
  await expect(noteButton).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(noteButton).toHaveCount(0);

  await page.getByRole("button", { name: "Trash (1)", exact: true }).click();
  await expect(page.getByRole("list", { name: "Trashed notes" })).toContainText("Doomed note");
  await page.getByRole("button", { name: "Restore Doomed note", exact: true }).click();
  await expect(page.getByRole("list", { name: "Trashed notes" })).not.toContainText("Doomed note");

  await page.getByRole("button", { name: "Trash (0)", exact: true }).click();
  await expect(noteButton).toBeVisible();
});

test("Empty Trash asks for confirmation", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Temporary");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Trash (1)", exact: true }).click();

  await page.getByRole("button", { name: "Empty Trash", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("list", { name: "Trashed notes" })).toContainText("Temporary");

  await page.getByRole("button", { name: "Empty Trash", exact: true }).click();
  await page.getByRole("button", { name: "Confirm empty Trash", exact: true }).click();
  await expect(page.getByRole("list", { name: "Trashed notes" })).not.toContainText("Temporary");
});
