"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name: string;
};

type PackageRow = {
  id: string;
  client_id: string;
  package_name?: string | null;
  lessons_remaining?: number | null;
  lessons_left?: number | null;
  remaining_lessons?: number | null;
};

type AddLessonNoteProps = {
  clients: Client[];
  packages: PackageRow[];
  selectedClientId: string;
  onSaved?: () => void;
};

export default function AddLessonNote({
  clients,
  packages,
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

  const clientPackages = packages.filter((pkg) => pkg.client_id === selectedClientId);

  const selectedPackage = clientPackages[0] || null;

  function getRemainingLessons(pkg: PackageRow | null) {
    if (!pkg) return null;
    if (pkg.lessons_remaining !== undefined && pkg.lessons_remaining !== null) {
      return Number(pkg.lessons_remaining);
    }
    if (pkg.lessons_left !== undefined && pkg.lessons_left !== null) {
      return Number(pkg.lessons_left);
    }
    if (pkg.remaining_lessons !== undefined && pkg.remaining_lessons !== null) {
      return Number(pkg.remaining_lessons);
    }
    return null;
  }

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
      const lessonInsert: {
        client_id: string;
        lesson_date: string;
        status: string;
        package_id?: string;
      } = {
        client_id: selectedClientId,
        lesson_date: lessonDate,
        status: "completed",
      };

      if (selectedPackage?.id) {
        lessonInsert.package_id = selectedPackage.id;
      }

      const { error: lessonError } = await supabase
        .from("lessons")
        .insert(lessonInsert);

      if (lessonError) {
        alert("Error saving lesson: " + lessonError.message);
        return;
      }

      const noteInsert: {
        client_id: string;
        lesson_date: string;
        note: string;
        skills_worked_on: string;
        progress_level: string;
        next_focus: string;
        package_id?: string;
      } = {
        client_id: selectedClientId,
        lesson_date: lessonDate,
        note: lessonNotes,
        skills_worked_on: skillsWorkedOn,
        progress_level: progressLevel,
        next_focus: nextFocus,
      };

      if (selectedPackage?.id) {
        noteInsert.package_id = selectedPackage.id;
      }

      const { error: noteError } = await supabase
        .from("progress_notes")
        .insert(noteInsert);

      if (noteError) {
        alert("Error saving progress note: " + noteError.message);
        return;
      }

      if (selectedPackage?.id) {
        const remaining = getRemainingLessons(selectedPackage);

        if (remaining !== null && remaining > 0) {
          if (selectedPackage.lessons_remaining !== undefined) {
            await supabase
              .from("packages")
              .update({ lessons_remaining: remaining - 1 })
              .eq("id", selectedPackage.id);
          } else if (selectedPackage.lessons_left !== undefined) {
            await supabase
              .from("packages")
              .update({ lessons_left: remaining - 1 })
              .eq("id", selectedPackage.id);
          } else if (selectedPackage.remaining_lessons !== undefined) {
            await supabase
              .from("packages")
              .update({ remaining_lessons: remaining - 1 })
              .eq("id", selectedPackage.id);
          }
        }
      }

      alert("Lesson saved!");

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
          Saving lesson for:{" "}
          <span className="text-sky-700">{selectedClient.child_name}</span>
        </p>
      ) : (
        <p className="mb-4 text-sm font-medium text-rose-500">
          Please select a swimmer first.
        </p>
      )}

      {selectedPackage ? (
        <p className="mb-4 text-sm text-slate-500">
          Package:{" "}
          <span className="font-semibold text-slate-700">
            {selectedPackage.package_name || "Active Package"}
          </span>
        </p>
      ) : (
        <p className="mb-4 text-sm text-amber-600">
          No package found for this swimmer. Lesson and note will still try to save.
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
            <option value="⭐ 1 - Just Starting">⭐ 1 - Just Starting</option>
            <option value="⭐⭐ 2 - Trying Skills">⭐⭐ 2 - Trying Skills</option>
            <option value="⭐⭐⭐ 3 - Improving">⭐⭐⭐ 3 - Improving</option>
            <option value="⭐⭐⭐⭐ 4 - Strong">⭐⭐⭐⭐ 4 - Strong</option>
            <option value="⭐⭐⭐⭐⭐ 5 - Excellent">⭐⭐⭐⭐⭐ 5 - Excellent</option>
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