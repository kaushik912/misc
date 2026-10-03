import Dexie, { type EntityTable } from "dexie";
import MiniSearch from "minisearch";
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import { v7 as uuidv7 } from "uuid";
import { openSettings } from "./settings";
import { readEntryTimes } from "./zipTimes";

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
   * Import an Export bundle. For `<id>.txt` entries: an unknown id is added
   * with that id; a known id is overwritten when the entry time is strictly
   * newer than the stored updatedAt, otherwise skipped. Any other entry name
   * becomes a new Note with a fresh id.
   */
  importBundle(zip: Uint8Array): Promise<ImportSummary>;
  /**
   * True when live Notes exist and the last export was 30+ days ago (or there
   * has never been one). Clears once exportBundle succeeds.
   */
  exportReminderDue(): Promise<boolean>;
}

export interface ImportSummary {
  added: number;
  updated: number;
  skipped: number;
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
    // Title and body are separate fields so the Title boost is meaningful.
    body: deriveBody(note.text),
  });

  // Every Note as a NoteView, loaded once on open (the same read that builds
  // the search index) and kept in step by every write below, so reads never
  // touch IndexedDB or re-derive Titles/Tags. Assumes one open store per
  // database: writes from another tab are seen after reopening.
  const views = new Map<string, NoteView>();
  const toView = (note: Note): NoteView => ({
    ...note,
    title: deriveTitle(note.text),
    tags: deriveTags(note.text),
  });
  const stored = await db.notes.toArray();
  for (const note of stored) views.set(note.id, toView(note));
  index.addAll(stored.map(indexDoc));

  // Derived read models, rebuilt lazily after any write.
  let live: NoteView[] | null = null;
  let tagCounts: TagCount[] | null = null;
  const changed = () => {
    live = null;
    tagCounts = null;
  };
  const remember = (note: Note) => {
    views.set(note.id, toView(note));
    changed();
  };
  const liveNotes = () =>
    (live ??= [...views.values()]
      .filter((note) => note.trashedAt === null)
      .sort((a, b) => b.updatedAt - a.updatedAt || (a.id < b.id ? 1 : -1)));

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
      remember(note);
      return note;
    },

    async update(id, text) {
      const existing = views.get(id);
      if (!existing) throw new Error(`Note not found: ${id}`);
      const updated: Note = { ...storedNote(existing)!, text, updatedAt: Date.now() };
      await db.notes.put(updated);
      index.replace(indexDoc(updated));
      remember(updated);
      return updated;
    },

    async list() {
      return [...liveNotes()];
    },

    async trash(id) {
      const existing = views.get(id);
      if (!existing) throw new Error(`Note not found: ${id}`);
      const trashedAt = now();
      await db.notes.update(id, { trashedAt });
      views.set(id, { ...existing, trashedAt });
      changed();
    },

    async restore(id) {
      const existing = views.get(id);
      if (!existing) throw new Error(`Note not found: ${id}`);
      await db.notes.update(id, { trashedAt: null });
      views.set(id, { ...existing, trashedAt: null });
      changed();
    },

    async emptyTrash() {
      const ids = [...views.values()]
        .filter((note) => note.trashedAt !== null)
        .map((note) => note.id);
      await db.notes.bulkDelete(ids);
      for (const id of ids) {
        index.discard(id);
        views.delete(id);
      }
      changed();
    },

    async listTrash() {
      return [...views.values()]
        .filter((note) => note.trashedAt !== null)
        .sort((a, b) => b.trashedAt! - a.trashedAt! || (a.id < b.id ? 1 : -1));
    },

    async listTags() {
      if (!tagCounts) {
        const counts = new Map<string, number>();
        for (const note of liveNotes()) {
          for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
        tagCounts = [...counts]
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
      }
      return tagCounts.map((entry) => ({ ...entry }));
    },

    async notesByTag(tag) {
      const wanted = tag.toLowerCase();
      return liveNotes().filter((note) => note.tags.includes(wanted));
    },

    async exportReminderDue() {
      const lastExportAt = await settings.getLastExportAt();
      if (lastExportAt !== null && now() - lastExportAt < EXPORT_REMINDER_MS) return false;
      return liveNotes().length > 0;
    },

    async search(query) {
      const wanted = deriveTags(query);
      const text = query.replace(TAG_PATTERN, " ").trim();
      const candidates =
        text === ""
          ? liveNotes()
          : index
              .search(text, { prefix: true, fuzzy: 0.2, boost: { title: 3 } })
              .map((hit) => views.get(hit.id)!);
      return candidates.filter(
        (note) =>
          note.trashedAt === null && wanted.every((tag) => note.tags.includes(tag)),
      );
    },

    async exportBundle() {
      const entries: Zippable = {};
      for (const note of liveNotes()) {
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

    async importBundle(zip) {
      const summary: ImportSummary = { added: 0, updated: 0, skipped: 0 };
      const times = readEntryTimes(zip);
      // Decide against the in-memory Notes, then write everything in one batch.
      const writes = new Map<string, Note>();
      for (const [name, bytes] of Object.entries(unzipSync(zip))) {
        const entry = times.get(name);
        const seconds =
          entry?.utcSeconds ?? (entry ? Math.floor(entry.dos.getTime() / 1000) : undefined);
        const mtime = seconds === undefined ? Date.now() : seconds * 1000;
        const named = ID_FILENAME.exec(name)?.[1]?.toLowerCase();
        const id = named ?? uuidv7();
        const existing = named ? (writes.get(id) ?? storedNote(views.get(id))) : undefined;
        if (!existing) {
          writes.set(id, {
            id,
            text: strFromU8(bytes),
            createdAt: mtime,
            updatedAt: mtime,
            trashedAt: null,
          });
          summary.added++;
        } else if (Math.floor(existing.updatedAt / 1000) < mtime / 1000) {
          writes.set(id, { ...existing, text: strFromU8(bytes), updatedAt: mtime });
          summary.updated++;
        } else {
          summary.skipped++;
        }
      }
      if (writes.size > 0) {
        const notes = [...writes.values()];
        await db.notes.bulkPut(notes);
        for (const note of notes) {
          if (views.has(note.id)) index.replace(indexDoc(note));
          else index.add(indexDoc(note));
          views.set(note.id, toView(note));
        }
        changed();
      }
      return summary;
    },
  };
}

const TAG_PATTERN = /(?<=^|\s)#([a-z][a-z0-9-]*)/gim;

const ID_FILENAME = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.txt$/i;

/** Info-ZIP "UT" payload: flags (mtime present) + int32 LE unix seconds. */
function extendedTimestamp(ms: number): Uint8Array {
  const bytes = new Uint8Array(5);
  bytes[0] = 1;
  new DataView(bytes.buffer).setInt32(1, Math.floor(ms / 1000), true);
  return bytes;
}

function storedNote(view: NoteView | undefined): Note | undefined {
  if (!view) return undefined;
  const { title: _title, tags: _tags, ...note } = view;
  return note;
}

function deriveTitle(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "");
  return firstLine?.trim() ?? "Untitled";
}

/** Everything after the Title line. */
function deriveBody(text: string): string {
  const lines = text.split(/\r?\n/);
  const first = lines.findIndex((line) => line.trim() !== "");
  return first === -1 ? "" : lines.slice(first + 1).join("\n");
}

function deriveTags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(TAG_PATTERN)) {
    tags.add(match[1]!.toLowerCase());
  }
  return [...tags];
}
