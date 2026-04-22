"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name: string;
};

type AddLessonNoteProps = {
  clients: Client[];
  selectedClientId: string;
  onSaved?: () => void;
};

export default function AddLessonNote({
  clients,
  selectedClientId,
  onSaved,
}: AddLessonNoteProps) {
  const [lessonDate, setLessonDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [skillsWorkedOn, setSkillsWorkedOn] = useState("");
  const [progressLevel, setProgressLevel] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [nextFocus, setNextFocus] = useState("");
  const [savingLessonNote, setSavingLessonNote] = useState(false);

  const selectedClient = clients.find((client) => client.id === selectedClientId);

  async function handleCompleteLesson() {
    if (!selectedClientId) {
      alert("Please select a client first.");
      return;
    }

    if (!lessonDate) {
      alert("Please choose a lesson date.");
      return;
    }

    setSavingLessonNote(true);

    try {
      const { error } = await supabase.from("progress_notes").insert({
        client_id: selectedClientId,
        lesson_date: lessonDate,
        skills_worked_on: skillsWorkedOn,
        progress_level: progressLevel,
        note: lessonNotes,
        next_focus: nextFocus,
      });

      if (error) {
        alert("Error saving lesson note: " + error.message);
        return;
      }

      alert("Lesson note saved!");

      setLessonDate(new Date().toISOString().split("T")[0]);
      setSkillsWorkedOn("");
      setProgressLevel("");
      setLessonNotes("");
      setNextFocus("");

      if (onSaved) onSaved();
    } finally {
      setSavingLessonNote(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-6 text-2xl font-bold text-sky-800">✏️ Add Lesson Note</h2>

      {selectedClient ? (
        <p className="mb-4 text-sm font-medium text-slate-500">
          Saving note for: <span className="text-sky-700">{selectedClient.child_name}</span>
        </p>
      ) : (
        <p className="mb-4 text-sm font-medium text-rose-500">
          Please select a swimmer first.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Skills Worked On
          </label>
          <input
            type="text"
            value={skillsWorkedOn}
            onChange={(e) => setSkillsWorkedOn(e.target.value)}
            placeholder="e.g. Floating, Kicking, Breath Control"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Progress Level
          </label>
          <select
            value={progressLevel}
            onChange={(e) => setProgressLevel(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
          >
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Improving">Improving</option>
            <option value="Strong">Strong</option>
            <option value="Excellent">Excellent</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Lesson Date
        </label>
        <input
          type="date"
          value={lessonDate}
          onChange={(e) => setLessonDate(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Notes
        </label>
        <textarea
          value={lessonNotes}
          onChange={(e) => setLessonNotes(e.target.value)}
          placeholder="How did the lesson go? Any wins or challenges?"
          rows={5}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Next Focus
        </label>
        <input
          type="text"
          value={nextFocus}
          onChange={(e) => setNextFocus(e.target.value)}
          placeholder="What should we work on next lesson?"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-sky-400"
        />
      </div>

      <button
        type="button"
        onClick={handleCompleteLesson}
        disabled={savingLessonNote || !selectedClientId}
        className="mt-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 text-lg font-bold text-white shadow-md transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {savingLessonNote ? "Saving..." : "⭐ Complete Lesson"}
      </button>
    </div>
  );
}