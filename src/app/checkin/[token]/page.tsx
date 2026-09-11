import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getCheckinPhase } from "@/lib/session-status";
import CheckinSuccess from "./CheckinSuccess";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm text-center bg-white border border-neutral-200 rounded-xl p-8">
        <h1 className="text-lg font-semibold mb-2">{title}</h1>
        <p className="text-sm text-neutral-500">{body}</p>
      </div>
    </main>
  );
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?returnTo=${encodeURIComponent(`/checkin/${token}`)}`);
  }

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, subject_id, scheduled_start, scheduled_end")
    .eq("qr_token", token)
    .single();

  if (!session) {
    return (
      <Message
        title="Invalid code"
        body="This code isn't valid. Ask your teacher to re-show the QR."
      />
    );
  }

  const { data: subject } = await supabase
    .from("subjects")
    .select("name, grace_minutes")
    .eq("id", session.subject_id)
    .single();

  if (!subject) {
    return (
      <Message
        title="Invalid code"
        body="This code isn't valid. Ask your teacher to re-show the QR."
      />
    );
  }

  const { data: existing } = await supabase
    .from("attendance")
    .select("marked_at, status")
    .eq("session_id", session.id)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (existing) {
    return (
      <CheckinSuccess
        subjectName={subject.name}
        time={formatTime(existing.marked_at)}
        status={existing.status as "present" | "late" | "absent"}
      />
    );
  }

  const phase = getCheckinPhase(
    session.scheduled_start,
    session.scheduled_end,
    subject.grace_minutes,
  );

  if (phase === "upcoming") {
    return (
      <Message
        title="Check-in opens soon"
        body={`Check-in for ${subject.name} opens at ${formatTime(session.scheduled_start)}.`}
      />
    );
  }

  if (phase === "closed") {
    return (
      <Message
        title="Check-in closed"
        body={`${subject.name} ended at ${formatTime(session.scheduled_end)}. See your teacher to be marked manually.`}
      />
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("attendance").insert({
    session_id: session.id,
    student_id: profile.id,
    status: phase,
    method: "qr",
  });

  if (error) {
    return (
      <Message
        title="Couldn't check you in"
        body="Something went wrong marking your attendance. Ask your teacher to mark you manually."
      />
    );
  }

  return <CheckinSuccess subjectName={subject.name} time={formatTime(now)} status={phase} />;
}
