"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddNote({ clients, onNoteAdded }: any) {
  const [selectedClient, setSelectedClient] = useState("");
  const [note, setNote] = useState("");
  const [lessonDate, setLessonDate] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!selectedClient || !note || !lessonDate) {
      alert("Please fill out all fields");
      return;
    }

    const { error } = await supabase.from("progress_notes").insert({
      client_id: selectedClient,
      note: note,
      lesson_date: lessonDate,
    });

    if (error) {
      console.error(error);
      alert("Error saving note");
    } else {
      alert("Note saved!");
      setNote("");
      setLessonDate("");
      onNoteAdded && onNoteAdded();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-3">Add Progress Note</h2>

      {/* Select Client */}
      <select
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      >
        <option value="">Select Child</option>
        {clients.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.child_name}
          </option>
        ))}
      </select>

      {/* Lesson Date */}
      <input
        type="date"
        value={lessonDate}
        onChange={(e) => setLessonDate(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />

      {/* Note */}
      <textarea
        placeholder="Enter progress note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save Note
      </button>
    </form>
  );
}