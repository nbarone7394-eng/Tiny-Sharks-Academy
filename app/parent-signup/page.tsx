"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ParentSignupPage() {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          parent_name: parentName,
        },
        emailRedirectTo: "https://tiny-sharks-academy.vercel.app/parent-login",
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: parentError } = await supabase.from("parent_accounts").upsert(
        [
          {
            parent_name: parentName,
            parent_email: email,
            auth_user_id: data.user.id,
          },
        ],
        { onConflict: "parent_email" }
      );

      if (parentError) {
        setMessage(parentError.message);
        setLoading(false);
        return;
      }
    }

    setMessage("Account created. Please check your email to confirm your signup.");
    setLoading(false);
    setParentName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sky-700">Parent Sign Up</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create your Tiny Sharks Academy parent portal account.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Parent Name
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Sarah Smith"
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. parent@email.com"
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating Account..." : "Create Parent Account"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/parent-login" className="font-semibold text-sky-700 hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </main>
  );
}