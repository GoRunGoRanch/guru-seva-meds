import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTimezone } from "@/lib/settings";
import { todayIsoInTz } from "@/lib/time";
import type { Administration, DialysisDay, Medication, Profile } from "@/lib/types";
import { DashboardClient } from "./dashboard-client";
import { NamePromptCard } from "./name-prompt";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tz = await getCurrentTimezone();
  const dose_date = todayIsoInTz(tz);

  const [{ data: profile }, { data: meds }, { data: admins }, { data: dialysis }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("medications").select("*").eq("active", true).order("sort_order"),
      supabase.from("administrations").select("*").eq("dose_date", dose_date),
      supabase.from("dialysis_days").select("*").eq("dose_date", dose_date).maybeSingle(),
    ]);

  if (!profile?.full_name) {
    return (
      <main className="mx-auto max-w-md p-6">
        <NamePromptCard />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Guru Seva Meds</h1>
          <p className="text-sm text-muted">
            {(profile as Profile).role === "doctor" ? "Doctor" : "Servant"} ·{" "}
            {(profile as Profile).full_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(profile as Profile).role === "doctor" && (
            <Link
              href="/manage"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-gray-50"
            >
              Manage list
            </Link>
          )}
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <DashboardClient
        initialMedications={(meds as Medication[]) || []}
        initialAdministrations={(admins as Administration[]) || []}
        initialDialysisDay={(dialysis as DialysisDay) || null}
        doseDate={dose_date}
        timezone={tz}
        currentUser={profile as Profile}
      />
    </main>
  );
}
