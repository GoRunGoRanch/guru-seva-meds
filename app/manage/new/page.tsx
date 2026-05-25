import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MedicationForm } from "../medication-form";

export const dynamic = "force-dynamic";

export default async function NewMedicationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <MedicationForm mode="create" />
    </main>
  );
}
