"use client";

import { useState } from "react";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";

export function DayNotesPanel({
  date,
  compact,
}: {
  date: string | null;
  compact?: boolean;
}) {
  const { getDayNotes, addDayNote, updateDayNote, deleteDayNote } = useCalendar();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!date) return null;

  const notes = getDayNotes(date);

  const saveNew = () => {
    if (!draft.trim()) return;
    addDayNote(date, draft);
    setDraft("");
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    updateDayNote(editingId, editText);
    setEditingId(null);
    setEditText("");
  };

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-amber-50/40 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-700" />
        <h3 className="text-sm font-bold text-ink">
          Note post-it · {date}
        </h3>
        <span className="text-[10px] font-bold uppercase text-ink-soft">
          {notes.length} note
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveNew();
          }}
          placeholder="Scrivi una nota rapida…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white/90 px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
        <button
          type="button"
          onClick={saveNew}
          disabled={!draft.trim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-300 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Aggiungi
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-ink-soft">
          Nessuna nota. Usa il campo sopra per appunti rapidi su questo giorno.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="relative rotate-[0.5deg] rounded-lg border border-amber-300/60 p-3 shadow-sm transition hover:rotate-0"
              style={{
                backgroundColor: note.color ?? "#fef08a",
                boxShadow: "2px 3px 8px rgba(15,28,46,0.12)",
              }}
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-amber-400/50 bg-white/80 px-2 py-1.5 text-sm outline-none"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded-md bg-ink/10 px-2 py-1 text-[10px] font-bold"
                    >
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md px-2 py-1 text-[10px] font-bold text-ink-soft"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(note.id, note.text)}
                    className="block w-full text-left text-sm leading-snug text-ink"
                  >
                    {note.text}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDayNote(note.id)}
                    className="absolute right-1.5 top-1.5 rounded p-1 text-ink/50 hover:bg-black/5 hover:text-red-700"
                    aria-label="Elimina nota"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DayNoteIndicator({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-amber-300/90 px-1 py-0.5 text-[7px] font-black uppercase text-amber-950"
      title={`${count} nota/e post-it`}
    >
      <StickyNote className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}
