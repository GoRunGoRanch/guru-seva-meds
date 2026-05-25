import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MedicationForm } from "../medication-form";
import type { Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditMedicationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor") redirect("/dashboard");

  const { data: med } = await supabase
    .from("medications")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!med) notFound();

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <MedicationForm mode="edit" initial={med as Medication} />
    </main>
  );
}
