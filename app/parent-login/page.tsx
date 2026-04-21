"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MatchedClient = {
  id: string;
  child_name: string;
};

export default function ParentLoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setMessage("");

    if (!email || !password) {
      setMessage("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    const { data: matchedClient, error: clientError } = await supabase
      .from("clients")
      .select("id, child_name")
      .eq("parent_email", email.trim())
      .single();

    if (clientError || !matchedClient) {
      setMessage(
        "We couldn't find a swimmer linked to that email yet. Please ask the instructor to add your email first."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const authUserId = data.user?.id;

    if (!authUserId) {
      setMessage(
        "Signup started. Please check your email if confirmation is required, then log in."
      );
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("parent_accounts").upsert(
      [
        {
          auth_user_id: authUserId,
          parent_name: parentName.trim() || null,
          email: email.trim(),
          client_id: (matchedClient as MatchedClient).id,
        },
      ],
      { onConflict: "email" }
    );

    if (upsertError) {
      setMessage("Account created, but parent link failed: " + upsertError.message);
      setLoading(false);
      return;
    }

    setMessage(
      `Parent account created successfully for ${(matchedClient as MatchedClient).child_name}. You can log in now.`
    );
    setParentName("");
    setEmail("");
    setPassword("");
    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/parent-portal";
  }

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-[32px] border border-sky-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
            🦈 Tiny Sharks Academy
          </div>
          <h1 className="text-3xl font-black text-sky-700">Parent Portal</h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to view your swimmer’s progress, notes, and lesson balance.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold ${
              mode === "signup"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Parent Name
              </label>
              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Parent Name"
                className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
            />
          </div>

          {mode === "login" ? (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-[18px] bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          ) : (
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full rounded-[18px] bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Parent Account"}
            </button>
          )}

          {message && (
            <div className="rounded-[18px] bg-slate-50 p-3 text-sm text-slate-700">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}