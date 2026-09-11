"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8">
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-neutral-500 mb-6">Attendance system</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-md bg-emerald-800 text-white text-sm font-medium py-2.5 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-neutral-500 mt-5">
          No account?{" "}
          <Link href="/signup" className="text-emerald-800 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
