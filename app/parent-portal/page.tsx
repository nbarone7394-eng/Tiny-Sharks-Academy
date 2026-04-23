"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name: string;
  parent_account_id: string | null;
};

type PackageRow = {
  id: string;
  client_id: string;
  lessons_remaining: number | null;
};

type LessonRow = {
  id: string;
  client_id: string;
  lesson_date: string | null;
  status: string | null;
};

type NoteRow = {
  id: string;
  client_id: string;
  lesson_date: string | null;
  note: string | null;
  skills_worked_on: string | null;
  progress_level: string | null;
  next_focus: string | null;
  created_at?: string | null;
};

export default function ParentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);

  useEffect(() => {
    loadPortal();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/parent-login";
  }

  async function loadPortal() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Please log in to view the parent portal.");
      setLoading(false);
      return;
    }

    const { data: parentAccount, error: parentError } = await supabase
      .from("parent_accounts")
      .select("id, auth_user_id, parent_name, email, parent_email")
      .eq("auth_user_id", user.id)
      .single();

    if (parentError || !parentAccount) {
      setError("Parent account not found.");
      setLoading(false);
      return;
    }

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, child_name, parent_account_id")
      .eq("parent_account_id", parentAccount.id)
      .order("child_name", { ascending: true });

    if (clientError) {
      setError(clientError.message);
      setLoading(false);
      return;
    }

    const safeClients = (clientData || []) as Client[];
    setClients(safeClients);

    if (safeClients.length === 0) {
      setPackages([]);
      setLessons([]);
      setNotes([]);
      setLoading(false);
      return;
    }

    const clientIds = safeClients.map((c) => c.id);

    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .select("id, client_id, lessons_remaining")
      .in("client_id", clientIds);

    if (packageError) {
      setError(packageError.message);
      setLoading(false);
      return;
    }

    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .select("id, client_id, lesson_date, status")
      .in("client_id", clientIds)
      .order("lesson_date", { ascending: false });

    if (lessonError) {
      setError(lessonError.message);
      setLoading(false);
      return;
    }

    const { data: noteData, error: noteError } = await supabase
      .from("progress_notes")
      .select(
        "id, client_id, lesson_date, note, skills_worked_on, progress_level, next_focus, created_at"
      )
      .in("client_id", clientIds)
      .order("lesson_date", { ascending: false });

    if (noteError) {
      setError(noteError.message);
      setLoading(false);
      return;
    }

    setPackages((packageData || []) as PackageRow[]);
    setLessons((lessonData || []) as LessonRow[]);
    setNotes((noteData || []) as NoteRow[]);
    setLoading(false);
  }

  function getChildName(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    return client?.child_name || "Unknown Swimmer";
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-lg text-slate-600">Loading parent portal...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-white p-6 shadow">
            <h1 className="mb-3 text-3xl font-bold text-sky-800">🐬 Parent Portal</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={handleLogout}
              className="mt-4 rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="relative mb-6 rounded-3xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-sky-800">🐬 Parent Portal</h1>
          <p className="mt-2 text-slate-600">
            View your swimmer’s lessons, packages, and progress notes.
          </p>

          <button
            onClick={handleLogout}
            className="absolute right-6 top-6 rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white"
          >
            Logout
          </button>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold text-sky-800">Your Swimmers</h2>

          {clients.length === 0 ? (
            <p className="text-slate-600">No swimmers found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {clients.map((client) => (
                <div key={client.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xl font-semibold text-slate-800">{client.child_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold text-sky-800">Packages</h2>

          {packages.length === 0 ? (
            <p className="text-slate-600">No packages found.</p>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800">{getChildName(pkg.client_id)}</p>
                  <p className="mt-1 text-slate-600">
                    Lessons Remaining: {pkg.lessons_remaining ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold text-sky-800">Recent Lessons</h2>

          {lessons.length === 0 ? (
            <p className="text-slate-600">No lessons found.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-800">{getChildName(lesson.client_id)}</p>
                  <p className="mt-1 text-slate-600">Date: {formatDate(lesson.lesson_date)}</p>
                  <p className="text-slate-600">Status: {lesson.status || "N/A"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold text-sky-800">Progress Notes</h2>

          {notes.length === 0 ? (
            <p className="text-slate-600">No progress notes yet.</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-lg font-semibold text-slate-800">
                    {getChildName(note.client_id)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Lesson Date: {formatDate(note.lesson_date)}
                  </p>

                  {note.skills_worked_on ? (
                    <p className="mt-2 text-slate-700">
                      <span className="font-semibold">Skills Worked On:</span>{" "}
                      {note.skills_worked_on}
                    </p>
                  ) : null}

                  {note.progress_level ? (
                    <p className="mt-1 text-slate-700">
                      <span className="font-semibold">Progress Level:</span>{" "}
                      {note.progress_level}
                    </p>
                  ) : null}

                  {note.note ? (
                    <p className="mt-2 text-slate-700">
                      <span className="font-semibold">Notes:</span> {note.note}
                    </p>
                  ) : null}

                  {note.next_focus ? (
                    <p className="mt-2 text-slate-700">
                      <span className="font-semibold">Next Focus:</span>{" "}
                      {note.next_focus}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}