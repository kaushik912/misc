import Dexie, { type EntityTable } from "dexie";
import { strToU8, zipSync, type Zippable } from "fflate";
import { v7 as uuidv7 } from "uuid";

export interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  trashedAt: number | null;
}

/** A Note as read back: Title is derived from `text`, never stored. */
export interface NoteView extends Note {
  title: string;
}

export interface Notes {
  create(text: string): Promise<Note>;
  /** Replace a Note's text and bump updatedAt. */
  update(id: string, text: string): Promise<Note>;
  /** Newest updatedAt first. */
  list(): Promise<NoteView[]>;
  /**
   * Export bundle: a zip with one `<id>.txt` (raw text) per live Note.
   *
   * Entry mtime carries `updatedAt` in two encodings: the extended timestamp
   * field (0x5455, UTC unix seconds, 1s precision) and the standard DOS time
   * (local wall-clock, 2s precision, rounded down). Sub-second precision is
   * lost; importers should compare `Math.floor(updatedAt / 1000)` against the
   * 0x5455 value, falling back to 2s-granular DOS time when it is absent.
   */
  exportBundle(): Promise<Uint8Array>;
}

export interface OpenNotesOptions {
  dbName?: string;
}

export async function openNotes(options: OpenNotesOptions = {}): Promise<Notes> {
  const db = new Dexie(options.dbName ?? "notes") as Dexie & {
    notes: EntityTable<Note, "id">;
  };
  db.version(1).stores({ notes: "id, updatedAt, trashedAt" });
  await db.open();

  return {
    async create(text) {
      const now = Date.now();
      const note: Note = {
        id: uuidv7(),
        text,
        createdAt: now,
        updatedAt: now,
        trashedAt: null,
      };
      await db.notes.add(note);
      return note;
    },

    async update(id, text) {
      const existing = await db.notes.get(id);
      if (!existing) throw new Error(`Note not found: ${id}`);
      const updated: Note = { ...existing, text, updatedAt: Date.now() };
      await db.notes.put(updated);
      return updated;
    },

    async list() {
      const all = await db.notes.orderBy("updatedAt").reverse().toArray();
      return all.map((note) => ({ ...note, title: deriveTitle(note.text) }));
    },

    async exportBundle() {
      const live = await db.notes.filter((note) => note.trashedAt === null).toArray();
      const entries: Zippable = {};
      for (const note of live) {
        entries[`${note.id}.txt`] = [
          strToU8(note.text),
          {
            level: 0,
            mtime: note.updatedAt,
            extra: { 0x5455: extendedTimestamp(note.updatedAt) },
          },
        ];
      }
      return zipSync(entries);
    },
  };
}

/** Info-ZIP "UT" payload: flags (mtime present) + int32 LE unix seconds. */
function extendedTimestamp(ms: number): Uint8Array {
  const bytes = new Uint8Array(5);
  bytes[0] = 1;
  new DataView(bytes.buffer).setInt32(1, Math.floor(ms / 1000), true);
  return bytes;
}

function deriveTitle(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "");
  return firstLine?.trim() ?? "Untitled";
}
