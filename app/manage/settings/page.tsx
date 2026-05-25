import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_TZ } from "@/lib/settings";
import { TimezoneForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor") redirect("/dashboard");

  const { data: tzRow } = await supabase
    .from("app_settings")
    .select("value, updated_at, updated_by_name")
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
            updatedByName={tzRow?.updated_by_name ?? null}
            updatedAt={tzRow?.updated_at ?? null}
          />
        </CardBody>
      </Card>
    </main>
  );
}
