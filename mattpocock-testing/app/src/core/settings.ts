import Dexie, { type EntityTable } from "dexie";

interface SettingRow {
  key: string;
  value: number;
}

export interface Settings {
  /** Epoch ms of the last successful export, or null if never exported. */
  getLastExportAt(): Promise<number | null>;
  setLastExportAt(at: number): Promise<void>;
}

/**
 * Local settings live in their own small database so they never share a
 * schema version with the Notes store.
 */
export async function openSettings(dbName: string): Promise<Settings> {
  const db = new Dexie(`${dbName}-settings`) as Dexie & {
    settings: EntityTable<SettingRow, "key">;
  };
  db.version(1).stores({ settings: "key" });
  await db.open();

  return {
    async getLastExportAt() {
      return (await db.settings.get("lastExportAt"))?.value ?? null;
    },
    async setLastExportAt(at) {
      await db.settings.put({ key: "lastExportAt", value: at });
    },
  };
}
