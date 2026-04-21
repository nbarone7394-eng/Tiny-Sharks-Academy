"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking your secure link...");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepareSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setMessage(
          "Open this page from the email link you were sent. If the link expired, request a new password reset."
        );
        setReady(false);
        return;
      }

      const userEmail = session.user.email?.toLowerCase();

      if (userEmail) {
        await supabase
          .from("parent_accounts")
          .update({ auth_user_id: session.user.id })
          .eq("email", userEmail);
      }

      setMessage("");
      setReady(true);
    }

    prepareSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase();
        if (userEmail) {
          await supabase
            .from("parent_accounts")
            .update({ auth_user_id: session.user.id })
            .eq("email", userEmail);
        }
        setMessage("");
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSavePassword() {
    setLoading(true);
    setMessage("");

    if (!password || !confirmPassword) {
      setMessage("Please fill out both password fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password saved! Redirecting to your parent portal...");
    setLoading(false);

    setTimeout(() => {
      window.location.href = "/parent-portal";
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-sky-50 px-3 py-4 sm:px-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                Tiny Sharks Academy
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">
                Set Your Password
              </h1>
              <p className="mt-2 text-sm text-blue-50 sm:text-base">
                Create a password to finish setting up your parent portal access.
              </p>
            </div>

            <div className="rounded-[22px] bg-white/15 px-5 py-4 text-center backdrop-blur-sm">
              <div className="text-4xl">🔐</div>
              <p className="mt-1 text-sm font-bold">Secure account setup</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
          {!ready ? (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {message}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={handleSavePassword}
                disabled={loading}
                className="w-full rounded-[18px] bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Password"}
              </button>

              {message && (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}