"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUp, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8">
        <h1 className="text-xl font-semibold mb-1">Create account</h1>
        <p className="text-sm text-neutral-500 mb-6">BSIT 2-2 Attendance</p>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>
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
              minLength={6}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">I am a…</label>
            <select
              name="role"
              defaultValue="student"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 bg-white"
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
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
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-neutral-500 mt-5">
          Already have an account?{" "}
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="text-emerald-800 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
