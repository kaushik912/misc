type PersistentStorage = Pick<StorageManager, "persisted" | "persist">;

/** Ask the browser not to evict our data. Resolves to whether storage is persistent. */
export async function requestPersistentStorage(
  storage: PersistentStorage | null = typeof navigator === "undefined" ? null : (navigator.storage ?? null),
): Promise<boolean> {
  if (!storage) return false;
  if (await storage.persisted()) return true;
  return storage.persist();
}
