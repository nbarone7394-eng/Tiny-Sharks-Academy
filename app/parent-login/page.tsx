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
      setMessage("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { data: matchedClient, error: clientError } = await supabase
      .from("clients")
      .select("id, child_name")
      .eq("parent_email", trimmedEmail)
      .single();

    if (clientError || !matchedClient) {
      setMessage(
        "We couldn’t find a swimmer linked to that email yet. Please ask the instructor to add your email first."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
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
        "Your signup was started. If email confirmation is turned on, please check your inbox and then come back to log in."
      );
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("parent_accounts").upsert(
      [
        {
          auth_user_id: authUserId,
          parent_name: parentName.trim() || null,
          email: trimmedEmail,
          client_id: (matchedClient as MatchedClient).id,
        },
      ],
      { onConflict: "email" }
    );

    if (upsertError) {
      setMessage("Your account was created, but the parent link failed: " + upsertError.message);
      setLoading(false);
      return;
    }

    setMessage(
      `Your parent account is ready for ${(matchedClient as MatchedClient).child_name}. You can log in now.`
    );
    setParentName("");
    setEmail("");
    setPassword("");
    setLoading(false);
    setMode("login");
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
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
    <main className="min-h-screen bg-sky-50 px-3 py-4 sm:px-4 md:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                Tiny Sharks Academy
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">Parent Login</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-50 sm:text-base">
                Sign in to view lesson progress, package details, notes, and important updates.
              </p>
            </div>

            <div className="rounded-[22px] bg-white/15 px-5 py-4 text-center backdrop-blur-sm">
              <div className="text-4xl">🦈</div>
              <p className="mt-1 text-sm font-bold">Welcome to the parent portal</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black text-sky-800">What you can see here</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4">
                <div className="text-2xl">📘</div>
                <h3 className="mt-2 text-lg font-black text-sky-700">Lesson Notes</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Read updates about what your swimmer practiced and how they’re progressing.
                </p>
              </div>

              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-2xl">🎟️</div>
                <h3 className="mt-2 text-lg font-black text-emerald-700">Lessons Remaining</h3>
                <p className="mt-1 text-sm text-slate-600">
                  See how many lessons are left in the current package at a glance.
                </p>
              </div>

              <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4">
                <div className="text-2xl">📈</div>
                <h3 className="mt-2 text-lg font-black text-violet-700">Progress Updates</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Follow growth over time with simple progress ratings and next-focus goals.
                </p>
              </div>

              <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4">
                <div className="text-2xl">📣</div>
                <h3 className="mt-2 text-lg font-black text-rose-700">Important Alerts</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Get important schedule updates like weather cancellations and reminders.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex gap-2 rounded-full bg-slate-100 p-1">
              <button
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-700"
                }`}
              >
                Log In
              </button>

              <button
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-bold transition ${
                  mode === "signup"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-700"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="mt-5">
              <h2 className="text-2xl font-black text-sky-800">
                {mode === "login" ? "Log into your account" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "login"
                  ? "Use the email address linked to your swimmer."
                  : "Sign up using the same email address the instructor has on file."}
              </p>
            </div>

            <div className="mt-5 space-y-4">
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
                  className="w-full rounded-[18px] bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
                >
                  {loading ? "Logging In..." : "Log In"}
                </button>
              ) : (
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full rounded-[18px] bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
                >
                  {loading ? "Creating Account..." : "Create Parent Account"}
                </button>
              )}

              {message && (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </div>

            <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Tip: If signup doesn’t work, the instructor may still need to add your email to
                your swimmer’s profile first.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}