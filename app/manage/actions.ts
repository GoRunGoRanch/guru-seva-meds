"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface MedicationInput {
  id?: string;
  sort_order: number;
  name: string;
  brand: string | null;
  dosage: string;
  frequency_count: number;
  frequency_label: string | null;
  scheduled_times: string[];
  routine: string | null;
  meal_relation: string | null;
  special_note: string | null;
  suggestions: string | null;
  dialysis_dosage: string | null;
  dialysis_scheduled_times: string[];
  active: boolean;
}

function parseTimes(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeTime);
}

function normalizeTime(t: string): string {
  // Accepts "5:15 AM", "05:15", "17:15", "5:15pm" etc. → "HH:MM"
  const cleaned = t.replace(/\s+/g, "").toUpperCase();
  const m = cleaned.match(/^(\d{1,2}):?(\d{0,2})(AM|PM)?$/);
  if (!m) return t;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const period = m[3];
  if (period === "AM") {
    if (hh === 12) hh = 0;
  } else if (period === "PM") {
    if (hh !== 12) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

async function requireDoctor() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Not signed in." } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor")
    return { supabase, user, error: "Doctor role required." } as const;
  return { supabase, user, error: null } as const;
}

function validate(input: MedicationInput): string | null {
  if (!input.name.trim()) return "Medication name is required.";
  if (!input.dosage.trim()) return "Dosage is required.";
  if (!Number.isInteger(input.frequency_count) || input.frequency_count < 1)
    return "Frequency must be 1 or more.";
  if (input.scheduled_times.length !== input.frequency_count)
    return `Frequency says ${input.frequency_count} but you entered ${input.scheduled_times.length} time(s). They must match.`;
  for (const t of input.scheduled_times)
    if (!/^\d{2}:\d{2}$/.test(t)) return `Time "${t}" is not valid (use HH:MM).`;
  if (
    input.dialysis_scheduled_times.length > 0 &&
    input.dialysis_scheduled_times.length !== input.frequency_count
  )
    return `Dialysis-day times must either be empty or have exactly ${input.frequency_count} value(s).`;
  return null;
}

export async function saveMedicationFromForm(formData: FormData) {
  const idRaw = String(formData.get("id") || "");
  const input: MedicationInput = {
    id: idRaw || undefined,
    sort_order: Number(formData.get("sort_order") || 0),
    name: String(formData.get("name") || "").trim(),
    brand: (String(formData.get("brand") || "").trim() || null) as string | null,
    dosage: String(formData.get("dosage") || "").trim(),
    frequency_count: Number(formData.get("frequency_count") || 1),
    frequency_label: (String(formData.get("frequency_label") || "").trim() || null) as
      | string
      | null,
    scheduled_times: parseTimes(String(formData.get("scheduled_times") || "")),
    routine: (String(formData.get("routine") || "").trim() || null) as string | null,
    meal_relation: (String(formData.get("meal_relation") || "").trim() || null) as
      | string
      | null,
    special_note: (String(formData.get("special_note") || "").trim() || null) as
      | string
      | null,
    suggestions: (String(formData.get("suggestions") || "").trim() || null) as string | null,
    dialysis_dosage: (String(formData.get("dialysis_dosage") || "").trim() || null) as
      | string
      | null,
    dialysis_scheduled_times: parseTimes(
      String(formData.get("dialysis_scheduled_times") || ""),
    ),
    active: formData.get("active") !== null,
  };

  const err = validate(input);
  if (err) return { error: err };

  const { supabase, user, error: authErr } = await requireDoctor();
  if (authErr) return { error: authErr };

  if (input.id) {
    const { error } = await supabase
      .from("medications")
      .update({ ...input, created_by: undefined })
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("medications")
      .insert({ ...input, created_by: user!.id });
    if (error) return { error: error.message };
  }

  revalidatePath("/manage");
  revalidatePath("/dashboard");
  redirect("/manage");
}

export async function deleteMedication(id: string) {
  const { supabase, error: authErr } = await requireDoctor();
  if (authErr) return { error: authErr };
  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/manage");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleActive(id: string, active: boolean) {
  const { supabase, error: authErr } = await requireDoctor();
  if (authErr) return { error: authErr };
  const { error } = await supabase.from("medications").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/manage");
  revalidatePath("/dashboard");
  return { ok: true };
}
