import { expect, test } from "@playwright/test";

test("create a Note and see it in the list after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(["Untitled"]);

  await page.reload();
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(["Untitled"]);
});

test("edit a Note, auto-save, and see the new Title after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Grocery run\nmilk");

  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  await expect(items).toHaveText(["Grocery run"]);

  await page.reload();
  await expect(items).toHaveText(["Grocery run"]);
  await items.first().getByRole("button").click();
  await expect(page.getByRole("textbox", { name: "Note text" })).toHaveValue("Grocery run\nmilk");
});
