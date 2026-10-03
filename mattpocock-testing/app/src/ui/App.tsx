import { useEffect, useState } from "react";
import { openNotes, type Notes, type NoteView } from "../core";

export function App() {
  const [notes, setNotes] = useState<Notes | null>(null);
  const [list, setList] = useState<NoteView[]>([]);

  useEffect(() => {
    openNotes().then(async (opened) => {
      setNotes(opened);
      setList(await opened.list());
    });
  }, []);

  async function newNote() {
    if (!notes) return;
    await notes.create("");
    setList(await notes.list());
  }

  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main>
      <button onClick={newNote} disabled={!notes}>
        New note
      </button>
      <ul aria-label="Notes">
        {sorted.map((note) => (
          <li key={note.id}>{note.title}</li>
        ))}
      </ul>
    </main>
  );
}
