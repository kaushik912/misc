import { useCallback, useEffect, useRef, useState } from "react";
import { openNotes, type Notes, type NoteView } from "../core";

const AUTOSAVE_DELAY_MS = 400;

export function App() {
  const [notes, setNotes] = useState<Notes | null>(null);
  const [list, setList] = useState<NoteView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const pending = useRef<{ id: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    openNotes().then(async (opened) => {
      setNotes(opened);
      setList(await opened.list());
    });
  }, []);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const job = pending.current;
    if (!job || !notes) return;
    pending.current = null;
    await notes.update(job.id, job.text);
    setList(await notes.list());
  }, [notes]);

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
    setList(await notes.list());
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
