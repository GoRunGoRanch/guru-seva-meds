import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { FALLBACK_TZ } from "@/lib/timezones";
import { TimezoneForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "doctor") redirect("/dashboard");

  const supabase = createServiceClient();
  const { data: tzRow } = await supabase
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", "current_timezone")
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link
          href="/manage"
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          ← Back to Manage
        </Link>
      </header>

      <Card>
        <CardBody>
          <TimezoneForm
            currentTz={tzRow?.value || FALLBACK_TZ}
            updatedAt={tzRow?.updated_at ?? null}
          />
        </CardBody>
      </Card>
    </main>
  );
}
