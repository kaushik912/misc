import { memo, useCallback, useEffect, useRef, useState } from "react";
import "./app.css";
import { openNotes, type ImportSummary, type Notes, type NoteView, type TagCount } from "../core";

const AUTOSAVE_DELAY_MS = 400;

/** Memoised so a refresh re-renders only Notes that changed, not all 10k rows. */
const NoteRow = memo(function NoteRow({
  note,
  selected,
  onSelect,
}: {
  note: NoteView;
  selected: boolean;
  onSelect: (note: NoteView) => void;
}) {
  return (
    <li>
      <button onClick={() => onSelect(note)} aria-current={selected}>
        {note.title}
      </button>
      {note.tags.map((tag) => (
        <span key={tag} data-testid="tag-chip" style={{ marginLeft: 4, fontSize: 12 }}>
          #{tag}
        </span>
      ))}
    </li>
  );
});

export function App() {
  const [notes, setNotes] = useState<Notes | null>(null);
  const [list, setList] = useState<NoteView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const pending = useRef<{ id: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [tags, setTags] = useState<TagCount[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [reminderDue, setReminderDue] = useState(false);
  const [query, setQuery] = useState("");
  const queryRef = useRef("");
  const [showTrash, setShowTrash] = useState(false);
  const [trashed, setTrashed] = useState<NoteView[]>([]);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  // Narrow screens only (CSS ignores these on wide): which pane is showing.
  const [pane, setPane] = useState<"list" | "editor">("list");
  const [tagsOpen, setTagsOpen] = useState(false);

  const refreshList = useCallback(async (store: Notes, tag: string | null) => {
    const q = queryRef.current.trim();
    if (q) setList(await store.search(q));
    else setList(tag ? await store.notesByTag(tag) : await store.list());
  }, []);

  const refresh = useCallback(
    async (store: Notes, tag: string | null) => {
      const all = await store.listTags();
      setTags(all);
      // A Tag with no remaining Notes is gone: drop the filter with it.
      const live = tag && all.some((t) => t.tag === tag) ? tag : null;
      if (live !== tag) setActiveTag(live);
      setTrashed(await store.listTrash());
      setReminderDue(await store.exportReminderDue());
      await refreshList(store, live);
    },
    [refreshList],
  );

  useEffect(() => {
    openNotes().then(async (opened) => {
      setNotes(opened);
      await refresh(opened, null);
    });
  }, [refresh]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const job = pending.current;
    if (!job || !notes) return;
    pending.current = null;
    await notes.update(job.id, job.text);
    await refresh(notes, activeTag);
  }, [notes, activeTag, refresh]);

  async function filterBy(tag: string | null) {
    if (!notes) return;
    await flush();
    setTagsOpen(false);
    setActiveTag(tag);
    await refresh(notes, tag);
  }

  async function onSearch(value: string) {
    setQuery(value);
    queryRef.current = value;
    // Typing only changes the list; Tags, Trash and the reminder are unaffected.
    if (notes) await refreshList(notes, activeTag);
  }

  // Flush unsaved edits when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  async function newNote() {
    if (!notes) return;
    await flush();
    const created = await notes.create("");
    await refresh(notes, activeTag);
    setSelectedId(created.id);
    setDraft(created.text);
    setPane("editor");
  }

  async function trashSelected() {
    if (!notes || !selectedId) return;
    await flush();
    await notes.trash(selectedId);
    setSelectedId(null);
    setDraft("");
    setPane("list");
    await refresh(notes, activeTag);
  }

  async function restore(id: string) {
    if (!notes) return;
    await notes.restore(id);
    await refresh(notes, activeTag);
  }

  async function emptyTrash() {
    if (!notes) return;
    await notes.emptyTrash();
    setConfirmingEmpty(false);
    await refresh(notes, activeTag);
  }

  async function exportNotes() {
    if (!notes) return;
    await flush();
    const zip = await notes.exportBundle();
    const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setReminderDue(await notes.exportReminderDue());
  }

  async function importNotes(file: File) {
    if (!notes) return;
    await flush();
    setImportSummary(null);
    setImportError(null);
    try {
      setImportSummary(await notes.importBundle(new Uint8Array(await file.arrayBuffer())));
    } catch {
      setImportError("Could not read that file as an Export bundle.");
    }
    await refresh(notes, activeTag);
  }

  async function select(note: NoteView) {
    await flush();
    setSelectedId(note.id);
    setDraft(note.text);
    setPane("editor");
  }
  // Stable identity so memoised rows are not re-rendered by every App render.
  const selectRef = useRef(select);
  selectRef.current = select;
  const onSelect = useCallback((note: NoteView) => void selectRef.current(note), []);

  function edit(text: string) {
    if (!selectedId) return;
    setDraft(text);
    pending.current = { id: selectedId, text };
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  }

  return (
    <>
    {reminderDue && (
      <div role="status" aria-label="Export reminder">
        It has been a while since your last export. Back up your notes.{" "}
        <button onClick={() => void exportNotes()}>Export now</button>
      </div>
    )}
    <div className="topbar narrow-only">
      <button aria-expanded={tagsOpen} onClick={() => setTagsOpen((v) => !v)}>
        Tags menu
      </button>
    </div>
    <main className="layout" data-pane={pane} data-tags-open={tagsOpen}>
      <nav aria-label="Tags" className="tags">
        <ul>
          <li>
            <button onClick={() => void filterBy(null)} aria-pressed={activeTag === null}>
              All notes
            </button>
          </li>
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <button onClick={() => void filterBy(tag)} aria-pressed={activeTag === tag}>
                #{tag} ({count})
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            setShowTrash((v) => !v);
            setTagsOpen(false);
            setConfirmingEmpty(false);
          }}
          aria-pressed={showTrash}
        >
          Trash ({trashed.length})
        </button>
      </nav>
      {showTrash ? (
      <section aria-label="Trash" className="trash">
        <h2>Trash</h2>
        {trashed.length > 0 &&
          (confirmingEmpty ? (
            <div role="alertdialog" aria-label="Confirm empty Trash">
              Permanently delete {trashed.length} trashed note(s)? This cannot be undone.{" "}
              <button onClick={() => void emptyTrash()}>Confirm empty Trash</button>{" "}
              <button onClick={() => setConfirmingEmpty(false)}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmingEmpty(true)}>Empty Trash</button>
          ))}
        <ul aria-label="Trashed notes">
          {trashed.map((note) => (
            <li key={note.id}>
              {note.title}{" "}
              <button
                aria-label={`Restore ${note.title}`}
                onClick={() => void restore(note.id)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      </section>
      ) : (
      <>
      <section className="list">
        <button onClick={newNote} disabled={!notes}>
          New note
        </button>
        <input
          type="search"
          aria-label="Search notes"
          placeholder="Search (try #tag)"
          value={query}
          onChange={(e) => void onSearch(e.target.value)}
        />
        <button onClick={() => void exportNotes()} disabled={!notes}>
          Export
        </button>
        <label>
          Import
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={!notes}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importNotes(file);
            }}
          />
        </label>
        <div role="status" aria-label="Import summary">
          {importSummary &&
            `Imported: ${importSummary.added} added, ${importSummary.updated} updated, ${importSummary.skipped} skipped`}
          {importError}
        </div>
        <ul aria-label="Notes">
          {list.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </section>
      <section className="editor">
        {selectedId ? (
          <>
            <button className="narrow-only" onClick={() => void flush().then(() => setPane("list"))}>
              Back to notes
            </button>
            <button onClick={() => void trashSelected()}>Delete</button>
            <textarea
              aria-label="Note text"
              value={draft}
              onChange={(e) => edit(e.target.value)}
            />
          </>
        ) : (
          <p>Select a note or create a new one.</p>
        )}
      </section>
      </>
      )}
    </main>
    </>
  );
}
