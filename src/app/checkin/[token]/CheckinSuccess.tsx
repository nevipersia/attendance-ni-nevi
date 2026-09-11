"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REDIRECT_SECONDS = 10;

export default function CheckinSuccess({
  subjectName,
  time,
  status,
}: {
  subjectName: string;
  time: string;
  status: "present" | "late";
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const iv = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(iv);
          router.push("/me");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [router]);

  const pct = ((REDIRECT_SECONDS - remaining) / REDIRECT_SECONDS) * 100;

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm text-center bg-white border border-neutral-200 rounded-xl p-8">
        <div
          className={`w-14 h-14 rounded-full text-white flex items-center justify-center text-2xl mx-auto mb-4 ${
            status === "late" ? "bg-amber-600" : "bg-emerald-700"
          }`}
        >
          ✓
        </div>
        <h1 className="text-lg font-semibold mb-1">
          {status === "late" ? "Marked late" : "Marked present"}
        </h1>
        <p className="text-sm text-neutral-500 font-mono mb-6">
          {subjectName} · {time}
        </p>

        <div className="h-1 bg-neutral-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-700 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-neutral-400 font-mono mb-4">
          redirecting in {remaining}s…
        </p>

        <button
          onClick={() => router.push("/me")}
          className="text-sm text-emerald-800 font-medium hover:underline"
        >
          Go now
        </button>
      </div>
    </main>
  );
}
