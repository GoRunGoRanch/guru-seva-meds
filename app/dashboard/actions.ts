"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.trim();
  if (!name) return { error: "Please set your name first." };

  const dose_date = todayIsoInTz(await getCurrentTimezone());

  const { error } = await supabase.from("administrations").insert({
    medication_id: input.medication_id,
    scheduled_time: input.scheduled_time,
    dose_date,
    day_type: input.day_type,
    given_by: user.id,
    given_by_name: name,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function undoGiven(input: { medication_id: string; scheduled_time: string }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor") return { error: "Only doctors can undo a mark." };

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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const dose_date = todayIsoInTz(await getCurrentTimezone());
  const { error } = await supabase.from("dialysis_days").upsert({
    dose_date,
    is_dialysis: isDialysis,
    set_by: user.id,
    set_by_name: profile?.full_name ?? null,
    set_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveOwnName(fullName: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = fullName.trim();
  if (!name) return { error: "Please enter your name." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
