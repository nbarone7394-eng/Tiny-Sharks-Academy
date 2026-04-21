"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name: string;
  parent_name: string | null;
};

type LessonPackage = {
  id: string;
  package_name: string | null;
  lessons_total: number;
  lessons_used: number;
};

type ProgressNote = {
  id: string;
  note: string | null;
  skills_worked_on: string | null;
  progress_level: number | null;
  next_focus: string | null;
  created_at: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
};

export default function ParentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [packages, setPackages] = useState<LessonPackage[]>([]);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAllNotes, setShowAllNotes] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Please log in first.");
        setLoading(false);
        return;
      }

      const { data: parentAccount, error: parentError } = await supabase
        .from("parent_accounts")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (parentError || !parentAccount) {
        setMessage("We couldn't find a parent account linked to this login.");
        setLoading(false);
        return;
      }

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", parentAccount.client_id)
        .single();

      if (clientError || !clientData) {
        setMessage("We couldn't find your swimmer's profile.");
        setLoading(false);
        return;
      }

      setClient(clientData as Client);

      const { data: packageData } = await supabase
        .from("packages")
        .select("*")
        .eq("client_id", parentAccount.client_id)
        .order("created_at", { ascending: false });

      setPackages((packageData as LessonPackage[]) || []);

      const { data: notesData } = await supabase
        .from("progress_notes")
        .select("*")
        .eq("client_id", parentAccount.client_id)
        .order("created_at", { ascending: false });

      setNotes((notesData as ProgressNote[]) || []);

      const { data: alertData } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setAnnouncements((alertData as Announcement[]) || []);

      setLoading(false);
    }

    loadPortal();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/parent-login";
  }

  function renderStars(level: number | null) {
    if (!level) return "Not rated yet";
    return "⭐".repeat(level);
  }

  function renderProgressLabel(level: number | null) {
    if (!level) return "No rating yet";
    if (level === 1) return "Getting comfortable";
    if (level === 2) return "Trying new skills";
    if (level === 3) return "Building confidence";
    if (level === 4) return "Swimming stronger";
    if (level === 5) return "Almost independent";
    return "Swim star";
  }

  const totalLessons = useMemo(
    () => packages.reduce((sum, pkg) => sum + pkg.lessons_total, 0),
    [packages]
  );

  const lessonsUsed = useMemo(
    () => packages.reduce((sum, pkg) => sum + pkg.lessons_used, 0),
    [packages]
  );

  const lessonsRemaining = totalLessons - lessonsUsed;
  const progressPercent =
    totalLessons > 0 ? Math.round((lessonsUsed / totalLessons) * 100) : 0;

  const mostRecentNote = notes.length > 0 ? notes[0] : null;
  const recentNotes = notes.slice(0, 5);
  const displayedHistory = showAllNotes ? notes : recentNotes;
  const lastLessonDate = mostRecentNote
    ? new Date(mostRecentNote.created_at).toLocaleDateString()
    : "No lessons logged yet";

  if (loading) {
    return (
      <main className="min-h-screen bg-sky-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
                🦈 Tiny Sharks Academy
              </div>

              <h1 className="text-3xl font-black md:text-5xl">Parent Portal</h1>

              <p className="mt-3 max-w-2xl text-sm text-blue-50 md:text-base">
                {client
                  ? `Welcome! Here’s a simple view of ${client.child_name}'s swim progress, lesson balance, and recent updates.`
                  : message}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-[18px] bg-rose-500 px-5 py-3 font-black text-white shadow-md transition hover:bg-rose-600"
            >
              Log Out
            </button>
          </div>
        </section>

        {announcements.length > 0 && (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h2 className="text-2xl font-black text-rose-700">📣 Important Update</h2>

            <div className="mt-4 space-y-3">
              {announcements.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-[20px] border border-rose-200 bg-white p-4"
                >
                  <h3 className="text-lg font-black text-rose-700">{alert.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {alert.message}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Posted {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {message && !client && (
          <section className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">{message}</p>
          </section>
        )}

        {client && (
          <>
            <section className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-sky-700">
                    {client.child_name}'s Swim Snapshot
                  </h2>
                  <p className="mt-1 text-slate-500">
                    Parent: {client.parent_name || "N/A"}
                  </p>
                </div>

                <div className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
                  Last update: {lastLessonDate}
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[24px] border border-sky-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl">🐬</div>
                <p className="mt-2 text-sm font-bold text-slate-500">Swimmer</p>
                <p className="mt-1 text-2xl font-black text-sky-700">
                  {client.child_name}
                </p>
              </div>

              <div className="rounded-[24px] border border-emerald-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl">🎟️</div>
                <p className="mt-2 text-sm font-bold text-slate-500">Lessons Left</p>
                <p className="mt-1 text-3xl font-black text-emerald-600">
                  {lessonsRemaining}
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl">⭐</div>
                <p className="mt-2 text-sm font-bold text-slate-500">Lessons Completed</p>
                <p className="mt-1 text-3xl font-black text-amber-500">
                  {lessonsUsed}
                </p>
              </div>

              <div className="rounded-[24px] border border-violet-200 bg-white p-5 text-center shadow-sm">
                <div className="text-3xl">📈</div>
                <p className="mt-2 text-sm font-bold text-slate-500">Overall Progress</p>
                <p className="mt-1 text-3xl font-black text-violet-600">
                  {progressPercent}%
                </p>
              </div>
            </div>

            <section className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-sky-700">Current Lesson Packages</h2>
              <p className="mt-1 text-slate-500">
                This shows how many lessons are still available.
              </p>

              <div className="mt-4 grid gap-4">
                {packages.length > 0 ? (
                  packages.map((pkg) => {
                    const remaining = pkg.lessons_total - pkg.lessons_used;
                    const percent =
                      pkg.lessons_total > 0
                        ? Math.round((pkg.lessons_used / pkg.lessons_total) * 100)
                        : 0;

                    return (
                      <div
                        key={pkg.id}
                        className="rounded-[24px] border border-slate-200 bg-sky-50 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-xl font-black text-sky-800">
                              {pkg.package_name || "Lesson Package"}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {remaining > 0
                                ? `${remaining} lesson${remaining === 1 ? "" : "s"} remaining`
                                : "No lessons remaining in this package"}
                            </p>
                          </div>

                          <div
                            className={`rounded-full px-4 py-2 text-sm font-black ${
                              remaining <= 2
                                ? "bg-rose-100 text-rose-600"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {remaining} left
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[18px] bg-white p-4 text-center">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Total Lessons
                            </p>
                            <p className="mt-1 text-3xl font-black text-sky-700">
                              {pkg.lessons_total}
                            </p>
                          </div>

                          <div className="rounded-[18px] bg-white p-4 text-center">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Lessons Used
                            </p>
                            <p className="mt-1 text-3xl font-black text-blue-700">
                              {pkg.lessons_used}
                            </p>
                          </div>

                          <div className="rounded-[18px] bg-white p-4 text-center">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Package Progress
                            </p>
                            <p className="mt-1 text-3xl font-black text-violet-600">
                              {percent}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500">No lesson packages found.</p>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-sky-700">Latest Lesson Update</h2>
              <p className="mt-1 text-slate-500">
                Here’s the newest note from your swimmer’s lessons.
              </p>

              <div className="mt-4">
                {mostRecentNote ? (
                  <div className="rounded-[24px] border border-slate-200 bg-sky-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Skills Practiced
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {mostRecentNote.skills_worked_on || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Progress Rating
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {renderStars(mostRecentNote.progress_level)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {renderProgressLabel(mostRecentNote.progress_level)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Lesson Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-800">
                        {mostRecentNote.note || "—"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Next Focus
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {mostRecentNote.next_focus || "—"}
                      </p>
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                      {new Date(mostRecentNote.created_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">No lesson notes yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-sky-700">
                    Lesson Update History
                  </h2>
                  <p className="mt-1 text-slate-500">
                    Review recent progress notes and next steps.
                  </p>
                </div>

                {notes.length > 5 && (
                  <button
                    onClick={() => setShowAllNotes((prev) => !prev)}
                    className="rounded-[16px] bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-200"
                  >
                    {showAllNotes ? "Show Fewer Updates" : "Show All Updates"}
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {displayedHistory.length > 0 ? (
                  displayedHistory.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-[20px] border border-slate-200 bg-sky-50 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Skills Practiced
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {note.skills_worked_on || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Progress Rating
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {renderStars(note.progress_level)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {renderProgressLabel(note.progress_level)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Lesson Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-800">
                          {note.note || "—"}
                        </p>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Next Focus
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {note.next_focus || "—"}
                        </p>
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No lesson notes yet.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}