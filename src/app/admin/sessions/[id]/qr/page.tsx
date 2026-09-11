import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getSessionStatus } from "@/lib/session-status";

export default async function SessionQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, qr_token, scheduled_start, scheduled_end, subject_id")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, admin_id, grace_minutes")
    .eq("id", session.subject_id)
    .single();

  if (!subject || subject.admin_id !== profile.id) notFound();

  const status = getSessionStatus(
    session.scheduled_start,
    session.scheduled_end,
    subject.grace_minutes,
  );

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const checkinUrl = `${protocol}://${host}/checkin/${session.qr_token}`;
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, { width: 360, margin: 1 });

  return (
    <main className="min-h-screen bg-neutral-50 p-8 flex items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm text-neutral-500 mb-1">
          <Link href="/admin" className="hover:underline">
            ← Today
          </Link>
        </p>
        <h1 className="text-lg font-semibold mb-1">{subject.name}</h1>
        <p className="text-xs font-mono uppercase tracking-wide text-neutral-400 mb-6">
          {status}
        </p>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Check-in QR code" width={280} height={280} />
        </div>

        <p className="text-xs text-neutral-400 mt-5">
          Students scan this with their phone camera. Valid for the whole
          session — present before class starts, late after 10 minutes,
          auto-marked absent after 30.
        </p>
      </div>
    </main>
  );
}
