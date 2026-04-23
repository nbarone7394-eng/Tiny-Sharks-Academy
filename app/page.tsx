"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name?: string;
  name?: string;
  parent_name?: string | null;
  parent_email?: string | null;
};

type PackageRow = {
  id: string;
  client_id: string;
  lessons_remaining?: number | null;
  lessons_left?: number | null;
  remaining_lessons?: number | null;
  total_lessons?: number | null;
  package_name?: string | null;
};

type LessonFormState = {
  lessonDate: string;
  status: string;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingClientId, setSavingClientId] = useState<string | null>(null);
  const [lessonForms, setLessonForms] = useState<Record<string, LessonFormState>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .order("child_name", { ascending: true });

    if (clientError) {
      console.error(clientError);
      setError("Error loading clients: " + clientError.message);
      setLoading(false);
      return;
    }

    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .select("*");

    if (packageError) {
      console.error(packageError);
      setError("Error loading packages: " + packageError.message);
      setLoading(false);
      return;
    }

    const safeClients = clientData || [];
    const safePackages = packageData || [];

    setClients(safeClients);
    setPackages(safePackages);

    const initialForms: Record<string, LessonFormState> = {};
    for (const client of safeClients) {
      initialForms[client.id] = {
        lessonDate: new Date().toISOString().split("T")[0],
        status: "completed",
      };
    }
    setLessonForms(initialForms);

    setLoading(false);
  }

  function getClientPackages(clientId: string) {
    return packages.filter((pkg) => pkg.client_id === clientId);
  }

  function getClientName(client: Client) {
    return client.child_name || client.name || "Unnamed Client";
  }

  function getRemainingLessons(pkg: PackageRow) {
    if (pkg.lessons_remaining !== undefined && pkg.lessons_remaining !== null) {
      return Number(pkg.lessons_remaining);
    }
    if (pkg.lessons_left !== undefined && pkg.lessons_left !== null) {
      return Number(pkg.lessons_left);
    }
    if (pkg.remaining_lessons !== undefined && pkg.remaining_lessons !== null) {
      return Number(pkg.remaining_lessons);
    }
    return 0;
  }

  function setRemainingLessonsUpdate(pkg: PackageRow, newValue: number) {
    if (pkg.lessons_remaining !== undefined) {
      return { lessons_remaining: newValue };
    }
    if (pkg.lessons_left !== undefined) {
      return { lessons_left: newValue };
    }
    if (pkg.remaining_lessons !== undefined) {
      return { remaining_lessons: newValue };
    }
    return { lessons_remaining: newValue };
  }

  function updateLessonForm(
    clientId: string,
    field: keyof LessonFormState,
    value: string
  ) {
    setLessonForms((prev) => ({
      ...prev,
      [clientId]: {
        ...(prev[clientId] || {
          lessonDate: new Date().toISOString().split("T")[0],
          status: "completed",
        }),
        [field]: value,
      },
    }));
  }

  async function handleCompleteLesson(clientId: string) {
    const form = lessonForms[clientId];

    if (!form?.lessonDate) {
      alert("Please choose a lesson date.");
      return;
    }

    const clientPackages = getClientPackages(clientId);
    const activePackage = clientPackages[0] || null;

    setSavingClientId(clientId);

    const lessonInsert: {
      client_id: string;
      lesson_date: string;
      status: string;
      package_id?: string;
    } = {
      client_id: clientId,
      lesson_date: form.lessonDate,
      status: form.status || "completed",
    };

    if (activePackage?.id) {
      lessonInsert.package_id = activePackage.id;
    }

    const { error: lessonError } = await supabase
      .from("lessons")
      .insert(lessonInsert);

    if (lessonError) {
      console.error(lessonError);
      alert("Error saving lesson: " + lessonError.message);
      setSavingClientId(null);
      return;
    }

    if (activePackage?.id) {
      const remaining = getRemainingLessons(activePackage);

      if (remaining > 0) {
        const { error: packageUpdateError } = await supabase
          .from("packages")
          .update(setRemainingLessonsUpdate(activePackage, remaining - 1))
          .eq("id", activePackage.id);

        if (packageUpdateError) {
          console.error(packageUpdateError);
          alert("Lesson saved, but package did not update: " + packageUpdateError.message);
          setSavingClientId(null);
          await fetchData();
          return;
        }
      }
    }

    alert("Lesson completed successfully.");
    setSavingClientId(null);
    await fetchData();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-4 text-3xl font-bold text-sky-800">
            🦈 Tiny Sharks Academy Dashboard
          </h1>
          <p className="text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-sky-800">
          🦈 Tiny Sharks Academy Dashboard
        </h1>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-slate-600">No clients found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const clientPackages = getClientPackages(client.id);
              const form = lessonForms[client.id] || {
                lessonDate: new Date().toISOString().split("T")[0],
                status: "completed",
              };

              return (
                <div
                  key={client.id}
                  className="rounded-2xl bg-white p-5 shadow"
                >
                  <h2 className="text-xl font-bold text-slate-800">
                    {getClientName(client)}
                  </h2>

                  {client.parent_name && (
                    <p className="mt-1 text-slate-600">
                      Parent: {client.parent_name}
                    </p>
                  )}

                  {client.parent_email && (
                    <p className="text-slate-600">
                      Email: {client.parent_email}
                    </p>
                  )}

                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold text-sky-700">
                      Packages
                    </h3>

                    {clientPackages.length === 0 ? (
                      <p className="text-slate-500">No packages</p>
                    ) : (
                      <div className="space-y-2">
                        {clientPackages.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="rounded-xl bg-slate-100 p-3"
                          >
                            <p className="font-medium text-slate-800">
                              {pkg.package_name || "Swim Package"}
                            </p>
                            <p className="text-slate-700">
                              Lessons Remaining:{" "}
                              <span className="font-bold">
                                {getRemainingLessons(pkg)}
                              </span>
                            </p>
                            {pkg.total_lessons !== undefined &&
                              pkg.total_lessons !== null && (
                                <p className="text-slate-600">
                                  Total Lessons: {pkg.total_lessons}
                                </p>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-sky-700">
                      Complete Lesson
                    </h3>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Lesson Date
                        </label>
                        <input
                          type="date"
                          value={form.lessonDate}
                          onChange={(e) =>
                            updateLessonForm(client.id, "lessonDate", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Status
                        </label>
                        <select
                          value={form.status}
                          onChange={(e) =>
                            updateLessonForm(client.id, "status", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        >
                          <option value="completed">completed</option>
                          <option value="scheduled">scheduled</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteLesson(client.id)}
                      disabled={savingClientId === client.id}
                      className="mt-4 rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    >
                      {savingClientId === client.id ? "Saving..." : "Complete Lesson"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}