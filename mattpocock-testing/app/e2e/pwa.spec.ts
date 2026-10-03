import { expect, test } from "@playwright/test";

test("app loads and works offline after the first load", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Wait until the service worker controls the page (first load is uncontrolled).
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();

  await page.getByRole("button", { name: "New note" }).click();
  await page.getByRole("textbox", { name: "Note text" }).fill("Offline note");
  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  await expect(items).toContainText(["Offline note"]);
});

test("serves an installable manifest and requests persistent storage", async ({ page, request }) => {
  const calls: string[] = [];
  await page.exposeFunction("recordPersist", () => calls.push("persist"));
  await page.addInitScript(() => {
    const storage = navigator.storage;
    storage.persist = async () => {
      (window as unknown as { recordPersist: () => void }).recordPersist();
      return true;
    };
    storage.persisted = async () => false;
  });
  await page.goto("/");
  await expect.poll(() => calls.length).toBe(1);

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
});
