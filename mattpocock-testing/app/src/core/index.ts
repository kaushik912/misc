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
  /** Lowercase Tags derived from `text`, in order of first appearance. */
  tags: string[];
}

export interface Notes {
  create(text: string): Promise<Note>;
  /** Replace a Note's text and bump updatedAt. */
  update(id: string, text: string): Promise<Note>;
  /** Newest updatedAt first. */
  list(): Promise<NoteView[]>;
  /** Tags in use by live Notes with Note counts: most used first, then alphabetical. */
  listTags(): Promise<TagCount[]>;
  /** Live Notes using the Tag (case-insensitive), newest updatedAt first. */
  notesByTag(tag: string): Promise<NoteView[]>;
}

export interface TagCount {
  tag: string;
  count: number;
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

  async function readAll(): Promise<NoteView[]> {
    const all = await db.notes.orderBy("updatedAt").reverse().toArray();
    return all.map((note) => ({
      ...note,
      title: deriveTitle(note.text),
      tags: deriveTags(note.text),
    }));
  }

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
      return readAll();
    },

    async listTags() {
      const counts = new Map<string, number>();
      for (const note of await readAll()) {
        if (note.trashedAt !== null) continue;
        for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
      return [...counts]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    },

    async notesByTag(tag) {
      const wanted = tag.toLowerCase();
      return (await readAll()).filter(
        (note) => note.trashedAt === null && note.tags.includes(wanted),
      );
    },
  };
}

function deriveTitle(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "");
  return firstLine?.trim() ?? "Untitled";
}

function deriveTags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(/(?<=^|\s)#([a-z][a-z0-9-]*)/gim)) {
    tags.add(match[1]!.toLowerCase());
  }
  return [...tags];
}
