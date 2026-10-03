import { expect, test } from "@playwright/test";
import { normalizeBase } from "../src/deploy/base";

test("app loads and works offline after the first load", async ({ page, context }) => {
  await page.goto("./");
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
  // Count calls inside the page (init script runs before app code) instead of
  // exposeFunction, whose binding can race the first navigation.
  await page.addInitScript(() => {
    const w = window as unknown as { persistCalls: number };
    w.persistCalls = 0;
    navigator.storage.persist = async () => {
      w.persistCalls++;
      return true;
    };
    navigator.storage.persisted = async () => false;
  });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "New note" })).toBeEnabled({ timeout: 30_000 });
  // Event-driven wait with a cold-start-sized timeout, not the 5s default poll.
  await page.waitForFunction(
    () => (window as unknown as { persistCalls: number }).persistCalls >= 1,
    undefined,
    { timeout: 30_000 },
  );
  expect(await page.evaluate(() => (window as unknown as { persistCalls: number }).persistCalls)).toBe(1);

  const manifest = await (await request.get("manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  // Under a subpath deploy (NOTES_BASE=/misc/) the app must be scoped to that subpath, not the origin root.
  const base = normalizeBase(process.env.NOTES_BASE);
  expect(manifest.scope).toBe(base);
  expect(manifest.start_url).toBe(base);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(new URL(scope).pathname).toBe(base);
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
});
