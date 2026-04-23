"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name: string;
  parent_account_id: string | null;
};

type PackageRow = {
  id: string;
  client_id: string;
  [key: string]: any;
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
      .select("id, auth_user_id, parent_name, email")
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
      .select("*")
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

  const grouped = useMemo(() => {
    return clients.map((client) => {
      const clientPackages = packages.filter((p) => p.client_id === client.id);
      const clientLessons = lessons.filter((l) => l.client_id === client.id);
      const clientNotes = notes.filter((n) => n.client_id === client.id);

      return {
        client,
        packages: clientPackages,
        lessons: clientLessons,
        notes: clientNotes,
      };
    });
  }, [clients, packages, lessons, notes]);

  function formatDate(dateString: string | null) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  }

  function getNumber(value: any, fallback = 0) {
    if (value === null || value === undefined || value === "") return fallback;
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function getPackageStats(pkg: PackageRow) {
    const totalLessons =
      pkg.total_lessons ??
      pkg.package_size ??
      pkg.lessons_total ??
      pkg.number_of_lessons ??
      0;

    const lessonsUsed =
      pkg.lessons_used ??
      pkg.used_lessons ??
      pkg.completed_lessons ??
      0;

    const lessonsRemaining =
      pkg.lessons_remaining ??
      pkg.lessons_left ??
      pkg.remaining_lessons ??
      (getNumber(totalLessons) - getNumber(lessonsUsed));

    const progressPercent =
      getNumber(totalLessons) > 0
        ? Math.round((getNumber(lessonsUsed) / getNumber(totalLessons)) * 100)
        : pkg.progress_percent ?? 0;

    return {
      totalLessons: getNumber(totalLessons),
      lessonsUsed: getNumber(lessonsUsed),
      lessonsRemaining: getNumber(lessonsRemaining),
      progressPercent: getNumber(progressPercent),
      paymentStatus: pkg.payment_status ?? "N/A",
      packagePrice: pkg.package_price ?? pkg.price ?? null,
      purchaseDate: pkg.purchase_date ?? pkg.created_at ?? null,
      packageName: pkg.package_name ?? pkg.name ?? "Swim Package",
    };
  }

  function getProgressStars(level: string | null) {
    if (!level) return "—";
    const val = level.toLowerCase();

    if (val.includes("excellent")) return "⭐⭐⭐⭐⭐";
    if (val.includes("strong")) return "⭐⭐⭐⭐";
    if (val.includes("improving")) return "⭐⭐⭐";
    if (val.includes("beginner")) return "⭐⭐";
    return level;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-lg text-slate-600">Loading parent portal...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-6 shadow">
          <h1 className="mb-3 text-3xl font-bold text-sky-800">🐬 Parent Portal</h1>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleLogout}
            className="mt-4 rounded-2xl bg-red-500 px-4 py-2 font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="relative mb-6 rounded-[32px] bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold text-sky-800">🐬 Parent Portal</h1>
          <p className="mt-2 text-lg text-slate-600">
            View your swimmer’s lessons, packages, and progress notes.
          </p>

          <button
            onClick={handleLogout}
            className="absolute right-8 top-8 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white"
          >
            Logout
          </button>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-[32px] bg-white p-8 shadow-sm">
            <p className="text-slate-600">No swimmers found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ client, packages: clientPackages, lessons: clientLessons, notes: clientNotes }) => (
              <section
                key={client.id}
                className="rounded-[32px] border border-sky-100 bg-[#eef8ff] p-6 shadow-sm"
              >
                <div className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
                  <h2 className="text-3xl font-bold text-sky-800">{client.child_name}</h2>
                </div>

                <div className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-2xl font-bold text-sky-800">Packages</h3>

                  {clientPackages.length === 0 ? (
                    <p className="text-slate-600">No packages on file.</p>
                  ) : (
                    <div className="space-y-5">
                      {clientPackages.map((pkg) => {
                        const stats = getPackageStats(pkg);

                        return (
                          <div
                            key={pkg.id}
                            className="rounded-[28px] border border-sky-100 bg-[#f8fcff] p-5"
                          >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xl font-bold text-sky-800">
                                  🎯 {stats.packageName}
                                </p>
                                <p className="text-sm text-slate-500">Active package</p>
                              </div>

                              <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                                {stats.lessonsRemaining} Left
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                              <div className="rounded-2xl border bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Total Lessons
                                </p>
                                <p className="mt-2 text-3xl font-bold text-sky-700">
                                  {stats.totalLessons}
                                </p>
                              </div>

                              <div className="rounded-2xl border bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Lessons Used
                                </p>
                                <p className="mt-2 text-3xl font-bold text-blue-600">
                                  {stats.lessonsUsed}
                                </p>
                              </div>

                              <div className="rounded-2xl border bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase text-orange-500">
                                  Lessons Remaining
                                </p>
                                <p className="mt-2 text-3xl font-bold text-orange-500">
                                  {stats.lessonsRemaining}
                                </p>
                              </div>

                              <div className="rounded-2xl border bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Progress
                                </p>
                                <p className="mt-2 text-3xl font-bold text-emerald-600">
                                  {stats.progressPercent}%
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="mb-1 flex items-center justify-between text-sm text-slate-500">
                                <span>Package Progress</span>
                                <span>{stats.progressPercent}%</span>
                              </div>
                              <div className="h-3 rounded-full bg-slate-200">
                                <div
                                  className="h-3 rounded-full bg-sky-500"
                                  style={{ width: `${Math.min(stats.progressPercent, 100)}%` }}
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Payment Status
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {String(stats.paymentStatus)}
                                </p>
                              </div>

                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Package Price
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {stats.packagePrice ? `$${stats.packagePrice}` : "N/A"}
                                </p>
                              </div>

                              <div className="rounded-2xl border bg-white p-4">
                                <p className="text-xs font-bold uppercase text-slate-500">
                                  Purchase Date
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {formatDate(stats.purchaseDate)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-6 rounded-[28px] bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-2xl font-bold text-sky-800">Recent Lessons</h3>

                  {clientLessons.length === 0 ? (
                    <div className="rounded-2xl bg-[#f1f8fd] p-4 text-slate-600">
                      No lesson history yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="rounded-2xl border border-sky-100 bg-[#f8fcff] p-4"
                        >
                          <p className="font-semibold text-slate-800">
                            Date: {formatDate(lesson.lesson_date)}
                          </p>
                          <p className="text-slate-600">
                            Status: {lesson.status || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-2xl font-bold text-sky-800">Progress Notes</h3>

                  {clientNotes.length === 0 ? (
                    <div className="rounded-2xl bg-[#f1f8fd] p-4 text-slate-600">
                      No progress notes yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-[24px] border border-sky-100 bg-[#f8fcff] p-5"
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-500">
                                Skills Worked On
                              </p>
                              <p className="mt-1 font-semibold text-slate-800">
                                {note.skills_worked_on || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-slate-500">
                                Progress
                              </p>
                              <p className="mt-1 text-xl text-amber-500">
                                {getProgressStars(note.progress_level)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase text-slate-500">Notes</p>
                            <p className="mt-1 text-slate-700">{note.note || "—"}</p>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase text-slate-500">
                              Next Focus
                            </p>
                            <p className="mt-1 text-slate-700">{note.next_focus || "—"}</p>
                          </div>

                          <p className="mt-4 text-sm text-slate-500">
                            {formatDate(note.lesson_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}