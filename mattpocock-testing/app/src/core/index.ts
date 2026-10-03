import Dexie, { type EntityTable } from "dexie";
import MiniSearch from "minisearch";
import { strToU8, zipSync, type Zippable } from "fflate";
import { v7 as uuidv7 } from "uuid";
import { openSettings } from "./settings";

const EXPORT_REMINDER_MS = 30 * 24 * 60 * 60 * 1000;

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
  /** Live Notes, newest updatedAt first. */
  list(): Promise<NoteView[]>;
  /** Move a Note to Trash (sets trashedAt). */
  trash(id: string): Promise<void>;
  /** Return a trashed Note to the list, Tags and search. */
  restore(id: string): Promise<void>;
  /** Permanently delete every trashed Note. */
  emptyTrash(): Promise<void>;
  /** Trashed Notes, most recently trashed first. */
  listTrash(): Promise<NoteView[]>;
  /** Tags in use by live Notes with Note counts: most used first, then alphabetical. */
  listTags(): Promise<TagCount[]>;
  /** Live Notes using the Tag (case-insensitive), newest updatedAt first. */
  notesByTag(tag: string): Promise<NoteView[]>;
  /** Live Notes matching the query, best match first. */
  search(query: string): Promise<NoteView[]>;
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
  /**
   * True when live Notes exist and the last export was 30+ days ago (or there
   * has never been one). Clears once exportBundle succeeds.
   */
  exportReminderDue(): Promise<boolean>;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface OpenNotesOptions {
  dbName?: string;
  /** Clock, injectable for tests. Defaults to Date.now. */
  now?: () => number;
}

export async function openNotes(options: OpenNotesOptions = {}): Promise<Notes> {
  const dbName = options.dbName ?? "notes";
  const now = options.now ?? Date.now;
  const settings = await openSettings(dbName);
  const db = new Dexie(dbName) as Dexie & {
    notes: EntityTable<Note, "id">;
  };
  db.version(1).stores({ notes: "id, updatedAt, trashedAt" });
  await db.open();

  const index = new MiniSearch<{ id: string; title: string; body: string }>({
    fields: ["title", "body"],
  });
  const indexDoc = (note: Note) => ({
    id: note.id,
    title: deriveTitle(note.text),
    body: note.text,
  });
  index.addAll((await db.notes.toArray()).map(indexDoc));

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
      index.add(indexDoc(note));
      return note;
    },

    async update(id, text) {
      const existing = await db.notes.get(id);
      if (!existing) throw new Error(`Note not found: ${id}`);
      const updated: Note = { ...existing, text, updatedAt: Date.now() };
      await db.notes.put(updated);
      index.replace(indexDoc(updated));
      return updated;
    },

    async list() {
      return (await readAll()).filter((note) => note.trashedAt === null);
    },

    async trash(id) {
      const updated = await db.notes.update(id, { trashedAt: now() });
      if (!updated) throw new Error(`Note not found: ${id}`);
    },

    async restore(id) {
      const updated = await db.notes.update(id, { trashedAt: null });
      if (!updated) throw new Error(`Note not found: ${id}`);
    },

    async emptyTrash() {
      const ids = await db.notes
        .filter((note) => note.trashedAt !== null)
        .primaryKeys();
      await db.notes.bulkDelete(ids);
      for (const id of ids) index.discard(id);
    },

    async listTrash() {
      return (await readAll())
        .filter((note) => note.trashedAt !== null)
        .sort((a, b) => b.trashedAt! - a.trashedAt!);
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

    async exportReminderDue() {
      const lastExportAt = await settings.getLastExportAt();
      if (lastExportAt !== null && now() - lastExportAt < EXPORT_REMINDER_MS) return false;
      return (await db.notes.filter((n) => n.trashedAt === null).count()) > 0;
    },

    async search(query) {
      const wanted = deriveTags(query);
      const text = query.replace(TAG_PATTERN, " ").trim();
      const all = await readAll();
      const byId = new Map(all.map((note) => [note.id, note]));
      const candidates =
        text === ""
          ? all
          : index
              .search(text, { prefix: true, fuzzy: 0.2, boost: { title: 3 } })
              .map((hit) => byId.get(hit.id)!);
      return candidates.filter(
        (note) =>
          note.trashedAt === null && wanted.every((tag) => note.tags.includes(tag)),
      );
    },

    async exportBundle() {
      const live = await db.notes.filter((note) => note.trashedAt === null).toArray();
      const entries: Zippable = {};
      for (const note of live) {
        entries[`${note.id}.txt`] = [
          strToU8(note.text),
          {
            mtime: note.updatedAt,
            extra: { 0x5455: extendedTimestamp(note.updatedAt) },
          },
        ];
      }
      const zip = zipSync(entries);
      await settings.setLastExportAt(now());
      return zip;
    },
  };
}

const TAG_PATTERN = /(?<=^|\s)#([a-z][a-z0-9-]*)/gim;

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

function deriveTags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(TAG_PATTERN)) {
    tags.add(match[1]!.toLowerCase());
  }
  return [...tags];
}
