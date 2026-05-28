import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { MedicationForm } from "../medication-form";
import type { Medication } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditMedicationPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "doctor") redirect("/dashboard");

  const supabase = createServiceClient();
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
