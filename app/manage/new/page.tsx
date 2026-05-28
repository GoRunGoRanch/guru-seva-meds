import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MedicationForm } from "../medication-form";

export const dynamic = "force-dynamic";

export default async function NewMedicationPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "doctor") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <MedicationForm mode="create" />
    </main>
  );
}
