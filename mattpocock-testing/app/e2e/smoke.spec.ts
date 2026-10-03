import { expect, test } from "@playwright/test";

test("create a Note and see it in the list after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(["Untitled"]);

  await page.reload();
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(["Untitled"]);
});
