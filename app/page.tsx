"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  name: string;
};

type Package = {
  id: string;
  client_id: string;
  lessons_remaining: number;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");

    // ✅ GET CLIENTS
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*");

    if (clientError) {
      console.error(clientError);
      setError("Error loading clients");
      setLoading(false);
      return;
    }

    // ✅ GET PACKAGES (THIS FIXES YOUR ERROR)
    const { data: packageData, error: packageError } = await supabase
      .from("packages") // ⚠️ MUST BE EXACTLY THIS
      .select("*");

    if (packageError) {
      console.error(packageError);
      setError("Error loading packages");
      setLoading(false);
      return;
    }

    setClients(clientData || []);
    setPackages(packageData || []);
    setLoading(false);
  }

  function getClientPackages(clientId: string) {
    return packages.filter((p) => p.client_id === clientId);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        🦈 Tiny Sharks Academy Dashboard
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {clients.length === 0 && (
        <p className="text-gray-500">No clients found.</p>
      )}

      {clients.map((client) => {
        const clientPackages = getClientPackages(client.id);

        return (
          <div
            key={client.id}
            className="border rounded-xl p-4 mb-4 shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-2">
              {client.name}
            </h2>

            {clientPackages.length === 0 ? (
              <p className="text-gray-500">No packages</p>
            ) : (
              clientPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-gray-100 p-3 rounded mb-2"
                >
                  Lessons Remaining:{" "}
                  <span className="font-bold">
                    {pkg.lessons_remaining}
                  </span>
                </div>
              ))
            )}
          </div>
        );
      })}
    </main>
  );
}