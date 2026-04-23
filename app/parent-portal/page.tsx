"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ParentPortalPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: clientData } = await supabase.from("clients").select("*");
    const { data: packageData } = await supabase.from("packages").select("*");
    const { data: lessonData } = await supabase.from("lessons").select("*");

    setClients(clientData || []);
    setPackages(packageData || []);
    setLessons(lessonData || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/parent-login";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🐬 Parent Portal</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl"
        >
          Logout
        </button>
      </div>

      {clients.map((client) => {
        const clientPackages = packages.filter(
          (p) => p.client_id === client.id
        );

        const clientLessons = lessons.filter(
          (l) => l.client_id === client.id
        );

        return (
          <div key={client.id} className="mb-8 border p-4 rounded-2xl">

            <h2 className="text-xl font-semibold mb-2">
              {client.child_name}
            </h2>

            {/* Packages */}
            {clientPackages.map((pkg) => {
              const lessonsUsed = clientLessons.filter(
                (l) => l.package_id === pkg.id
              ).length;

              const remaining = pkg.total_lessons - lessonsUsed;

              return (
                <div key={pkg.id} className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <p><strong>Total Lessons:</strong> {pkg.total_lessons}</p>
                  <p><strong>Lessons Used:</strong> {lessonsUsed}</p>
                  <p><strong>Lessons Remaining:</strong> {remaining}</p>
                </div>
              );
            })}

            {/* Lesson History */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Lesson History</h3>

              {clientLessons.length === 0 && (
                <p className="text-gray-500">No lessons yet</p>
              )}

              {clientLessons.map((lesson) => (
                <div key={lesson.id} className="text-sm border-b py-1">
                  {formatDate(lesson.lesson_date)}
                </div>
              ))}
            </div>

          </div>
        );
      })}
    </main>
  );
}