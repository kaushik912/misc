import Dexie, { type EntityTable } from "dexie";
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
  list(): Promise<NoteView[]>;
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

    async list() {
      const all = await db.notes.toArray();
      return all.map((note) => ({ ...note, title: deriveTitle(note.text) }));
    },
  };
}

function deriveTitle(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "");
  return firstLine?.trim() ?? "Untitled";
}
