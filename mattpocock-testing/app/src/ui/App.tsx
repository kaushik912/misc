import { useCallback, useEffect, useRef, useState } from "react";
import { openNotes, type Notes, type NoteView, type TagCount } from "../core";

const AUTOSAVE_DELAY_MS = 400;

export function App() {
  const [notes, setNotes] = useState<Notes | null>(null);
  const [list, setList] = useState<NoteView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const pending = useRef<{ id: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [tags, setTags] = useState<TagCount[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const refresh = useCallback(
    async (store: Notes, tag: string | null) => {
      const all = await store.listTags();
      setTags(all);
      // A Tag with no remaining Notes is gone: drop the filter with it.
      const live = tag && all.some((t) => t.tag === tag) ? tag : null;
      if (live !== tag) setActiveTag(live);
      setList(live ? await store.notesByTag(live) : await store.list());
    },
    [],
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
    setActiveTag(tag);
    await refresh(notes, tag);
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
  }

  async function select(note: NoteView) {
    await flush();
    setSelectedId(note.id);
    setDraft(note.text);
  }

  function edit(text: string) {
    if (!selectedId) return;
    setDraft(text);
    pending.current = { id: selectedId, text };
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  }

  return (
    <main style={{ display: "flex", gap: 16 }}>
      <nav aria-label="Tags" style={{ width: 140 }}>
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
      </nav>
      <section style={{ width: 240 }}>
        <button onClick={newNote} disabled={!notes}>
          New note
        </button>
        <button onClick={() => void exportNotes()} disabled={!notes}>
          Export
        </button>
        <ul aria-label="Notes">
          {list.map((note) => (
            <li key={note.id}>
              <button
                onClick={() => void select(note)}
                aria-current={note.id === selectedId}
              >
                {note.title}
              </button>
              {note.tags.map((tag) => (
                <span key={tag} data-testid="tag-chip" style={{ marginLeft: 4, fontSize: 12 }}>
                  #{tag}
                </span>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section style={{ flex: 1 }}>
        {selectedId ? (
          <textarea
            aria-label="Note text"
            value={draft}
            onChange={(e) => edit(e.target.value)}
            style={{ width: "100%", minHeight: 300 }}
          />
        ) : (
          <p>Select a note or create a new one.</p>
        )}
      </section>
    </main>
  );
}
