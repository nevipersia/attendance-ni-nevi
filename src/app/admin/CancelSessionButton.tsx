"use client";

import { cancelSession } from "@/lib/actions/sessions";

export default function CancelSessionButton({
  sessionId,
  subjectName,
}: {
  sessionId: string;
  subjectName: string;
}) {
  return (
    <form
      action={cancelSession.bind(null, sessionId)}
      onSubmit={(e) => {
        if (!confirm(`Cancel today's ${subjectName} session? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button className="text-xs font-medium border border-red-200 text-red-700 rounded-md px-3 py-1.5 hover:bg-red-50">
        Cancel
      </button>
    </form>
  );
}
