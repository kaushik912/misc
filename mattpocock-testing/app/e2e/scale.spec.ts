import { expect, test, type Page } from "@playwright/test";

const COUNT = 10_000;

/**
 * Seed IndexedDB (Dexie's "notes" database) directly, then reload so the app opens the 10k Notes.
 *
 * Schema coupling: this writes rows straight into the object store the app's core creates
 * (database "notes", store "notes", rows shaped like core's `Note`: id, text, createdAt, updatedAt,
 * trashedAt). If the core schema or row shape changes, update this seed. It is deliberately not
 * done through the UI or Export bundle because typing or importing 10k Notes would dominate the run.
 */
async function seed(page: Page) {
  await page.goto("./");
  await expect(page.getByRole("button", { name: "New note" })).toBeEnabled();
  await page.evaluate(async (count) => {
    const words = "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu budget garden meeting".split(" ");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("notes");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const base = Date.UTC(2024, 0, 1);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("notes", "readwrite");
      const store = tx.objectStore("notes");
      for (let i = 0; i < count; i++) {
        const body = Array.from({ length: 40 }, (_, j) => words[(i * 7 + j * 13) % words.length]).join(" ");
        const updatedAt = base + i * 60_000;
        store.put({
          id: `00000000-0000-7000-8000-${String(i).padStart(12, "0")}`,
          text: `${words[i % words.length]} note ${i}\n${body} #tag${i % 200}${i % 500 === 0 ? " quokka" : ""}`,
          createdAt: updatedAt,
          updatedAt,
          trashedAt: null,
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, COUNT);
}

const time = async (label: string, fn: () => Promise<void>) => {
  const t = performance.now();
  await fn();
  const took = performance.now() - t;
  process.stderr.write(`PERF-UI ${label}: ${took.toFixed(0)} ms\n`);
  return took;
};

test(`the UI stays responsive at ${COUNT} Notes`, async ({ page }) => {
  test.setTimeout(180_000);
  await seed(page);
  const items = page.getByRole("list", { name: "Notes" }).getByRole("listitem");
  const search = page.getByRole("searchbox", { name: "Search notes" });

  // Generous bounds: only meant to catch order-of-magnitude regressions.
  expect(
    await time("reload to list populated", async () => {
      await page.reload();
      await expect(items.first()).toBeVisible({ timeout: 60_000 });
    }),
  ).toBeLessThan(30_000);

  // The list renders a page of rows at a time, not all 10k.
  await expect(items).toHaveCount(200);
  await page.getByRole("button", { name: /Show more notes \(9800 more\)/ }).click();
  await expect(items).toHaveCount(400);

  expect(
    await time("search: type 'quokka' (6 keystrokes) until results settle", async () => {
      await search.pressSequentially("quokka", { delay: 50 });
      await expect(items.first()).toContainText("note", { timeout: 30_000 });
      await expect.poll(() => items.count(), { timeout: 30_000 }).toBeLessThan(COUNT);
    }),
  ).toBeLessThan(20_000);

  await search.fill("");
  await expect.poll(() => items.count(), { timeout: 30_000 }).toBeGreaterThan(0);

  await items.first().getByRole("button").click();
  const text = page.getByRole("textbox", { name: "Note text" });
  await expect(text).toBeVisible();
  expect(
    await time("edit: keystrokes, then autosave reflected in list Title", async () => {
      await text.press("Control+Home");
      await text.pressSequentially("Zebra edited", { delay: 30 });
      await expect(items.first()).toContainText("Zebra edited", { timeout: 30_000 });
    }),
  ).toBeLessThan(20_000);
});
