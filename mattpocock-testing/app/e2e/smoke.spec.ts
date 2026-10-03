import { expect, test } from "@playwright/test";

test("create a Note and see it in the list after reload", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(["Untitled"]);

  await page.reload();
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveText(["Untitled"]);
});

test("Tags show as chips, in the sidebar with counts, and filter the list", async ({ page }) => {
  await page.goto("./");
  const text = page.getByRole("textbox", { name: "Note text" });
  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  const sidebar = page.getByRole("navigation", { name: "Tags" });

  await page.getByRole("button", { name: "New note" }).click();
  await text.fill("Standup #work");
  await expect(sidebar.getByRole("button", { name: "#work (1)" })).toBeVisible();

  await page.getByRole("button", { name: "New note" }).click();
  await expect(text).toHaveValue("");
  await text.fill("Dinner #home");
  await expect(sidebar.getByRole("button", { name: "#home (1)" })).toBeVisible();
  await expect(items).toHaveCount(2);

  await sidebar.getByRole("button", { name: "#work (1)" }).click();
  await expect(items).toHaveText(["Standup #work#work"]);

  await items.first().getByRole("button").click();
  await text.fill("Standup");
  await expect(sidebar.getByRole("button", { name: /#work/ })).toHaveCount(0);
  await expect(items).toHaveCount(2);
});

test("edit a Note, auto-save, and see the new Title after reload", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Grocery run\nmilk");

  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  await expect(items).toHaveText(["Grocery run"]);

  await page.reload();
  await expect(items).toHaveText(["Grocery run"]);
  await items.first().getByRole("button").click();
  await expect(page.getByRole("textbox", { name: "Note text" })).toHaveValue("Grocery run\nmilk");
});

test("search box filters the list by text and #tag", async ({ page }) => {
  await page.goto("./");
  const text = page.getByRole("textbox", { name: "Note text" });
  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  const search = page.getByRole("searchbox", { name: "Search notes" });
  const sidebar = page.getByRole("navigation", { name: "Tags" });

  await page.getByRole("button", { name: "New note" }).click();
  await text.fill("Quarterly budget #work");
  await expect(sidebar.getByRole("button", { name: "#work (1)" })).toBeVisible();
  await page.getByRole("button", { name: "New note" }).click();
  await expect(text).toHaveValue("");
  await text.fill("Dinner ideas #home");
  await expect(sidebar.getByRole("button", { name: "#home (1)" })).toBeVisible();

  await search.fill("budg");
  await expect(items).toHaveText(["Quarterly budget #work#work"]);
  await search.fill("#home");
  await expect(items).toHaveText(["Dinner ideas #home#home"]);
  await search.fill("");
  await expect(items).toHaveCount(2);
});

test("the sidebar Tag and the search box narrow the list together", async ({ page }) => {
  await page.goto("./");
  const text = page.getByRole("textbox", { name: "Note text" });
  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  const search = page.getByRole("searchbox", { name: "Search notes" });
  const sidebar = page.getByRole("navigation", { name: "Tags" });

  for (const [body, title] of [
    ["Budget plan #work", "Budget plan"],
    ["Budget dinner #home", "Budget dinner"],
    ["Standup #work", "Standup"],
  ] as const) {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(text).toHaveValue("");
    await text.fill(body);
    await expect(items.filter({ hasText: title })).toHaveCount(1);
  }
  await expect(sidebar.getByRole("button", { name: "#work (2)" })).toBeVisible();

  await search.fill("budget");
  await expect(items).toHaveCount(2);
  await sidebar.getByRole("button", { name: "#work (2)" }).click();
  await expect(items).toHaveText(["Budget plan #work#work"]);

  await search.fill("standup");
  await expect(items).toHaveText(["Standup #work#work"]);
  await search.fill("dinner");
  await expect(items).toHaveCount(0);

  await sidebar.getByRole("button", { name: "All notes" }).click();
  await expect(items).toHaveText(["Budget dinner #home#home"]);
});
