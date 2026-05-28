import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "doctor") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="mb-1 text-2xl font-semibold">Import medication list</h1>
      <p className="mb-4 text-muted">
        Paste your Google Sheets URL (the sheet must be shared as "Anyone with the link can view"), or
        upload a CSV exported from it. We'll preview every row and refuse to save any where frequency
        doesn't match the number of times.
      </p>
      <ImportClient />
    </main>
  );
}
