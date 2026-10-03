import { expect, test, type Page } from "@playwright/test";

const items = (page: Page) => page.getByRole("list", { name: "Notes" }).getByRole("listitem");

test.describe("phone width", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("one pane at a time: list, editor, back, tags drawer", async ({ page }) => {
    await page.goto("/");
    const text = page.getByRole("textbox", { name: "Note text" });
    const sidebar = page.getByRole("navigation", { name: "Tags" });

    // List pane only; sidebar and editor hidden.
    await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
    await expect(sidebar).toBeHidden();
    await expect(text).toBeHidden();

    // New note opens the editor and hides the list.
    await page.getByRole("button", { name: "New note" }).click();
    await expect(text).toBeVisible();
    await expect(page.getByRole("button", { name: "New note" })).toBeHidden();
    await text.fill("Standup #work");

    // Back to the list.
    await page.getByRole("button", { name: "Back to notes" }).click();
    await expect(text).toBeHidden();
    await expect(items(page)).toHaveText(["Standup #work#work"]);

    // Selecting opens the editor again.
    await items(page).first().getByRole("button").click();
    await expect(text).toHaveValue("Standup #work");

    // Delete returns to the list.
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(items(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "New note" })).toBeVisible();

    // Tags drawer: reachable, filters, and closes.
    await page.getByRole("button", { name: "New note" }).click();
    await text.fill("Dinner #home");
    await page.getByRole("button", { name: "Back to notes" }).click();
    await page.getByRole("button", { name: "Tags menu" }).click();
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole("button", { name: "New note" })).toBeHidden();
    await sidebar.getByRole("button", { name: "#home (1)" }).click();
    await expect(sidebar).toBeHidden();
    await expect(items(page)).toHaveText(["Dinner #home#home"]);

    // Trash is reachable from the drawer.
    await page.getByRole("button", { name: "Tags menu" }).click();
    await sidebar.getByRole("button", { name: /Trash/ }).click();
    await expect(page.getByRole("region", { name: "Trash" })).toBeVisible();
  });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New note" }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});

test.describe("wide layout", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("two panes and tag sidebar stay visible together", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Tags" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tags menu" })).toBeHidden();
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.getByRole("textbox", { name: "Note text" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to notes" })).toBeHidden();
  });
});
