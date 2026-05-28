"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { getCurrentTimezone } from "@/lib/settings";
import { todayIsoInTz } from "@/lib/time";
import type { DayType } from "@/lib/types";

export async function markGiven(input: {
  medication_id: string;
  scheduled_time: string;
  day_type: DayType;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const supabase = createServiceClient();
  const dose_date = todayIsoInTz(await getCurrentTimezone());

  const { error } = await supabase.from("administrations").insert({
    medication_id: input.medication_id,
    scheduled_time: input.scheduled_time,
    dose_date,
    day_type: input.day_type,
    given_by_name: session.name,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function undoGiven(input: { medication_id: string; scheduled_time: string }) {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  if (session.role !== "doctor") return { error: "Only doctors can undo a mark." };

  const supabase = createServiceClient();
  const dose_date = todayIsoInTz(await getCurrentTimezone());

  const { error } = await supabase
    .from("administrations")
    .delete()
    .eq("medication_id", input.medication_id)
    .eq("scheduled_time", input.scheduled_time)
    .eq("dose_date", dose_date);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setDialysisDay(isDialysis: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const supabase = createServiceClient();
  const dose_date = todayIsoInTz(await getCurrentTimezone());

  const { error } = await supabase.from("dialysis_days").upsert({
    dose_date,
    is_dialysis: isDialysis,
    set_by_name: session.name,
    set_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
