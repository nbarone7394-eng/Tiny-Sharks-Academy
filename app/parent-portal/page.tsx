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
  payment_status: "paid" | "partial" | "unpaid" | null;
  package_price: number | null;
  purchase_date: string | null;
};

type ProgressNote = {
  id: string;
  note: string | null;
  skills_worked_on: string | null;
  progress_level: number | null;
  next_focus: string | null;
  created_at: string;
  package_id: string | null;
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
      <main className="min-h-screen bg-sky-50 px-3 py-4 sm:px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (message) {
    return (
      <main className="min-h-screen bg-sky-50 px-3 py-4 sm:px-4 md:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <section className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black text-sky-700 sm:text-4xl">
                  Parent Portal
                </h1>
                <p className="mt-2 text-slate-500">{message}</p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-[16px] bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm"
              >
                Log Out
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-3 py-4 sm:px-4 md:px-6">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                Parent Portal
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">
                Welcome{client?.parent_name ? `, ${client.parent_name}` : ""}!
              </h1>
              <p className="mt-2 text-sm text-blue-50 sm:text-base">
                Here’s your swimmer’s latest progress, package details, and lesson updates.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-[16px] bg-white px-5 py-3 text-sm font-bold text-sky-700 shadow-sm"
            >
              Log Out
            </button>
          </div>
        </section>

        {announcements.length > 0 && (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 shadow-sm sm:p-5">
            <h2 className="text-xl font-black text-rose-700">Important Updates</h2>
            <div className="mt-3 space-y-3">
              {announcements.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-[20px] border border-rose-200 bg-white p-4"
                >
                  <h3 className="text-lg font-black text-rose-700">{alert.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">{alert.message}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Posted {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-sky-800">
                {client?.child_name || "Swimmer"}
              </h2>
              <p className="text-slate-500">
                {client?.parent_name ? `Parent: ${client.parent_name}` : "Swim progress overview"}
              </p>
            </div>

            <div className="rounded-full bg-sky-100 px-4 py-2 text-sm font-black text-sky-700">
              Last update: {lastLessonDate}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total Lessons
              </p>
              <p className="mt-1 text-4xl font-black text-sky-700">{totalLessons}</p>
            </div>

            <div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Lessons Used
              </p>
              <p className="mt-1 text-4xl font-black text-blue-700">{lessonsUsed}</p>
            </div>

            <div
              className={`rounded-[22px] border p-4 text-center ${
                lessonsRemaining <= 0
                  ? "border-rose-300 bg-rose-100 text-rose-700"
                  : lessonsRemaining <= 2
                  ? "border-red-300 bg-red-100 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide">Lessons Left</p>
              <p className="mt-1 text-4xl font-black">{lessonsRemaining}</p>
            </div>

            <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Overall Progress
              </p>
              <p className="mt-1 text-4xl font-black text-violet-700">{progressPercent}%</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Overall Package Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  lessonsRemaining <= 0
                    ? "bg-rose-500"
                    : lessonsRemaining <= 2
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-500">
              {lessonsRemaining <= 0
                ? "This package has been fully used."
                : lessonsRemaining <= 2
                ? `Only ${lessonsRemaining} lesson${
                    lessonsRemaining === 1 ? "" : "s"
                  } left in this package.`
                : `${lessonsRemaining} lessons remaining.`}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {packages.length > 0 ? (
            packages.map((pkg) => {
              const remaining = pkg.lessons_total - pkg.lessons_used;
              const percent =
                pkg.lessons_total > 0
                  ? Math.round((pkg.lessons_used / pkg.lessons_total) * 100)
                  : 0;

              const packageNotes = notes.filter((note) => note.package_id === pkg.id);
              const newestPackageNote = packageNotes[0] || null;

              return (
                <div
                  key={pkg.id}
                  className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-sky-800">
                        {pkg.package_name || "Lesson Package"}
                      </h3>
                      <p className="mt-1 text-slate-500">
                        {remaining <= 0
                          ? "This package has no lessons remaining."
                          : remaining <= 2
                          ? `Almost time for a new package — only ${remaining} left.`
                          : `${remaining} lessons remaining.`}
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        remaining <= 0
                          ? "bg-rose-600 text-white"
                          : remaining <= 2
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {remaining <= 0
                        ? "No Lessons Left"
                        : remaining <= 2
                        ? `Only ${remaining} Left`
                        : `${remaining} Left`}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-[20px] border border-slate-200 bg-sky-50 p-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Total
                      </p>
                      <p className="mt-1 text-3xl font-black text-sky-700">
                        {pkg.lessons_total}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-blue-50 p-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Used
                      </p>
                      <p className="mt-1 text-3xl font-black text-blue-700">
                        {pkg.lessons_used}
                      </p>
                    </div>

                    <div
                      className={`rounded-[20px] border p-4 text-center ${
                        remaining <= 0
                          ? "border-rose-300 bg-rose-100 text-rose-700"
                          : remaining <= 2
                          ? "border-red-300 bg-red-100 text-red-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide">Remaining</p>
                      <p className="mt-1 text-3xl font-black">{remaining}</p>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-violet-50 p-4 text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Progress
                      </p>
                      <p className="mt-1 text-3xl font-black text-violet-700">{percent}%</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                      <span>Package Progress</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          remaining <= 0
                            ? "bg-rose-500"
                            : remaining <= 2
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Payment
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-800">
                        {pkg.payment_status || "unpaid"}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Package Price
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-800">
                        {pkg.package_price !== null && pkg.package_price !== undefined
                          ? `$${Number(pkg.package_price).toFixed(2)}`
                          : "Not listed"}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Purchase Date
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-800">
                        {pkg.purchase_date
                          ? new Date(pkg.purchase_date).toLocaleDateString()
                          : "Not listed"}
                      </p>
                    </div>
                  </div>

                  {newestPackageNote && (
                    <div className="mt-5 rounded-[24px] border border-sky-100 bg-sky-50 p-4">
                      <h4 className="text-lg font-black text-sky-700">Most Recent Lesson Note</h4>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Skills Worked On
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {newestPackageNote.skills_worked_on || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Progress
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {renderStars(newestPackageNote.progress_level)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {renderProgressLabel(newestPackageNote.progress_level)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Notes
                          </p>
                          <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-800">
                            {newestPackageNote.note || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Next Focus
                          </p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {newestPackageNote.next_focus || "—"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        Updated {new Date(newestPackageNote.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <section className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
              <p className="text-slate-500">No lesson packages found yet.</p>
            </section>
          )}
        </section>

        <section className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-sky-800">Lesson History</h2>
              <p className="text-slate-500">
                A quick look at recent progress and lesson notes.
              </p>
            </div>

            {notes.length > 5 && (
              <button
                onClick={() => setShowAllNotes((prev) => !prev)}
                className="rounded-[16px] bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700"
              >
                {showAllNotes ? "Show Less" : "Show All"}
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {displayedHistory.length > 0 ? (
              displayedHistory.map((note) => (
                <div
                  key={note.id}
                  className="rounded-[22px] border border-slate-200 bg-sky-50 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Skills Worked On
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {note.skills_worked_on || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Progress
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {renderStars(note.progress_level)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {renderProgressLabel(note.progress_level)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-800">
                        {note.note || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Next Focus
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {note.next_focus || "—"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] bg-sky-50 p-4 text-sm text-slate-500">
                No lesson notes yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}