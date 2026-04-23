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

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    setClients(clientData || []);
    setPackages(packageData || []);
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
      return pkg.lessons_remaining;
    }
    if (pkg.lessons_left !== undefined && pkg.lessons_left !== null) {
      return pkg.lessons_left;
    }
    if (pkg.remaining_lessons !== undefined && pkg.remaining_lessons !== null) {
      return pkg.remaining_lessons;
    }
    return 0;
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}