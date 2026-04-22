"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ParentPortal() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    // 1. Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // 2. Get parent account
    const { data: parent, error: parentError } = await supabase
      .from("parent_accounts")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (parentError || !parent) {
      setError("Parent account not found.");
      setLoading(false);
      return;
    }

    // 3. Get clients for this parent
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("parent_account_id", parent.id);

    if (clientError) {
      setError(clientError.message);
      setLoading(false);
      return;
    }

    setClients(clientData || []);

    const clientIds = (clientData || []).map((c) => c.id);

    if (clientIds.length === 0) {
      setLoading(false);
      return;
    }

    // 4. Get packages
    const { data: packageData } = await supabase
      .from("packages")
      .select("*")
      .in("client_id", clientIds);

    // 5. Get lessons
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("*")
      .in("client_id", clientIds)
      .order("lesson_date", { ascending: false });

    // 6. Get progress notes
    const { data: noteData } = await supabase
      .from("progress_notes")
      .select("*")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    setPackages(packageData || []);
    setLessons(lessonData || []);
    setNotes(noteData || []);
    setLoading(false);
  }

  if (loading) {
    return <p className="p-6">Loading your dashboard...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">
        🐬 Parent Portal
      </h1>

      {/* CLIENTS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Swimmers</h2>
        {clients.length === 0 ? (
          <p>No swimmers found.</p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="mb-2 rounded-xl bg-white p-4 shadow">
              <p className="font-semibold">{client.child_name}</p>
            </div>
          ))
        )}
      </div>

      {/* PACKAGES */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Packages</h2>
        {packages.map((pkg) => (
          <div key={pkg.id} className="mb-2 rounded-xl bg-white p-4 shadow">
            <p>Lessons Remaining: {pkg.lessons_remaining}</p>
          </div>
        ))}
      </div>

      {/* LESSONS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Recent Lessons</h2>
        {lessons.map((lesson) => (
          <div key={lesson.id} className="mb-2 rounded-xl bg-white p-4 shadow">
            <p>Date: {lesson.lesson_date}</p>
            <p>Status: {lesson.status}</p>
          </div>
        ))}
      </div>

      {/* NOTES */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Progress Notes</h2>
        {notes.map((note) => (
          <div key={note.id} className="mb-2 rounded-xl bg-white p-4 shadow">
            <p>{note.note}</p>
          </div>
        ))}
      </div>
    </main>
  );
}