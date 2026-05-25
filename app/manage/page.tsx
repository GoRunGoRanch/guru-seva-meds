import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatTime12 } from "@/lib/time";
import type { Medication, Profile } from "@/lib/types";
import { ManageRowActions } from "./row-actions";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if ((profile as Profile)?.role !== "doctor") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold">Doctor access only</h1>
            <p className="mt-2 text-muted">
              The Manage page is restricted to doctor accounts. Ask an admin to promote your
              account in Supabase Studio if you need access.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex h-11 items-center rounded-2xl border border-line bg-white px-4 font-medium"
            >
              Back to dashboard
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const { data: meds } = await supabase
    .from("medications")
    .select("*")
    .order("sort_order");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Manage medication list</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/manage/settings"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            ⚙ Settings
          </Link>
          <Link
            href="/manage/import"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Import from Google Sheet
          </Link>
          <Link
            href="/manage/new"
            className="rounded-xl bg-saffron px-3 py-2 text-sm font-semibold text-white shadow-soft hover:bg-amber-600"
          >
            + Add medication
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="space-y-3">
        {(meds as Medication[] | null)?.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-muted">
                No medications yet. Use <span className="font-medium">+ Add medication</span> or{" "}
                <span className="font-medium">Import from Google Sheet</span>.
              </p>
            </CardBody>
          </Card>
        )}

        {(meds as Medication[] | null)?.map((m) => (
          <Card key={m.id} className={m.active ? "" : "opacity-60"}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    {m.name}
                    {m.brand && <span className="ml-1 text-muted">({m.brand})</span>}
                  </div>
                  <div className="text-sm text-muted">
                    {m.dosage} ·{" "}
                    <span className="font-medium text-ink">
                      {m.frequency_label || `${m.frequency_count}× per day`}
                    </span>{" "}
                    · {m.scheduled_times.map(formatTime12).join(", ")}
                    {m.meal_relation && <> · {m.meal_relation}</>}
                  </div>
                  {m.dialysis_scheduled_times.length > 0 && (
                    <div className="mt-1 text-xs text-amber-800">
                      Dialysis-day: {m.dialysis_dosage || m.dosage} ·{" "}
                      {m.dialysis_scheduled_times.map(formatTime12).join(", ")}
                    </div>
                  )}
                  {m.special_note && (
                    <div className="mt-1 text-sm text-amber-900">⚠ {m.special_note}</div>
                  )}
                </div>
                <Badge tone={m.active ? "ok" : "neutral"}>
                  {m.active ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
              <ManageRowActions id={m.id} active={m.active} />
            </CardBody>
          </Card>
        ))}
      </div>
    </main>
  );
}
