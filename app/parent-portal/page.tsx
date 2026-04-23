"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ParentPortal() {
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      fetchData(data.user.id);
    }
  }

  async function fetchData(userId: string) {
    // get parent account
    const { data: parent } = await supabase
      .from("parent_accounts")
      .select("*")
      .eq("auth_user_id", userId)
      .single();

    if (!parent) return;

    // get clients tied to parent
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("parent_account_id", parent.id);

    setClients(clientData || []);

    if (!clientData || clientData.length === 0) return;

    const clientIds = clientData.map((c) => c.id);

    // get progress notes
    const { data: notesData } = await supabase
      .from("progress_notes")
      .select("*")
      .in("client_id", clientIds)
      .order("lesson_date", { ascending: false });

    setNotes(notesData || []);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Parent Portal</h1>

      {/* CLIENTS */}
      <h2 className="text-xl font-semibold mb-2">Your Swimmers</h2>
      {clients.length === 0 ? (
        <p>No swimmers found.</p>
      ) : (
        clients.map((client) => (
          <div key={client.id} className="mb-3 p-3 bg-white rounded shadow">
            <p className="font-semibold">{client.child_name}</p>
          </div>
        ))
      )}

      {/* PROGRESS NOTES */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Progress Notes</h2>

      {notes.length === 0 ? (
        <p>No progress notes yet.</p>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className="mb-3 p-4 bg-white rounded-xl shadow"
          >
            <p className="text-sm text-gray-500 mb-1">
              Lesson Date:{" "}
              {note.lesson_date
                ? new Date(note.lesson_date).toLocaleDateString()
                : "N/A"}
            </p>

            <p className="text-sm text-gray-400 mb-2">
              Child ID: {note.client_id}
            </p>

            <p>{note.note}</p>
          </div>
        ))
      )}
    </div>
  );
}
import { supabase } from "@/lib/supabaseClient";
async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = "/parent-login";
}
<button
  onClick={handleLogout}
  className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl"
>
  Logout
</button>