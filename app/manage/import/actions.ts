"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ImportRow {
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
  active: boolean;
  errors: string[];
}

const FREQ_WORDS: Record<string, number> = {
  ONCE: 1,
  TWICE: 2,
  THRICE: 3,
  "QID": 4,
  "Q.I.D": 4,
  "TID": 3,
  "T.I.D": 3,
  "BID": 2,
  "B.I.D": 2,
  "OD": 1,
  "1x": 1,
  "2x": 2,
  "3x": 3,
  "4x": 4,
};

function parseFrequencyCount(label: string | null): number | null {
  if (!label) return null;
  const upper = label.trim().toUpperCase();
  if (FREQ_WORDS[upper] != null) return FREQ_WORDS[upper];
  const numMatch = upper.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return null;
}

function normalizeTime(t: string): string | null {
  const cleaned = t.replace(/\s+/g, "").toUpperCase();
  const m = cleaned.match(/^(\d{1,2}):?(\d{0,2})(AM|PM)?$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const period = m[3];
  if (period === "AM") {
    if (hh === 12) hh = 0;
  } else if (period === "PM") {
    if (hh !== 12) hh += 12;
  }
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseTimes(raw: string): string[] {
  const parts = raw
    .split(/[,&/]| and /i)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const n = normalizeTime(p);
    if (n) out.push(n);
  }
  return out;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (ch === "\r") {
        // skip
      } else cur += ch;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function findColumn(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = norm.indexOf(c.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function toSheetCsvUrl(input: string): string | null {
  const m = input.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const id = m[1];
  const gidMatch = input.match(/[?#&]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export async function fetchSheetPreview(sheetUrlOrId: string): Promise<
  | { ok: true; rows: ImportRow[]; rawCount: number }
  | { ok: false; error: string }
> {
  const csvUrl = toSheetCsvUrl(sheetUrlOrId.trim());
  if (!csvUrl)
    return { ok: false, error: "That doesn't look like a Google Sheets URL." };

  let text: string;
  try {
    const res = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
    if (!res.ok)
      return {
        ok: false,
        error: `Could not fetch the sheet (HTTP ${res.status}). Make sure it's shared as "Anyone with the link can view".`,
      };
    text = await res.text();
    if (text.includes("<html") && text.toLowerCase().includes("sign in"))
      return {
        ok: false,
        error: 'Sheet is not public. Share it as "Anyone with the link can view".',
      };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not fetch the sheet." };
  }

  return { ok: true, ...parseSheetCsv(text) };
}

export async function parseUploadedCsv(text: string) {
  return { ok: true, ...parseSheetCsv(text) };
}

function parseSheetCsv(text: string): { rows: ImportRow[]; rawCount: number } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { rows: [], rawCount: 0 };

  const headers = rows[0];
  const idx = {
    no: findColumn(headers, ["No.", "No", "#"]),
    name: findColumn(headers, ["Medication Name", "Name", "Medication"]),
    brand: findColumn(headers, ["Current Brands in Use", "Brand", "Brands"]),
    dosage: findColumn(headers, ["Dosage", "Dose"]),
    special: findColumn(headers, ["SPECIAL NOTE", "Special Note", "Note"]),
    freq: findColumn(headers, ["Frequency"]),
    times: findColumn(headers, ["Timings", "Times", "Timing"]),
    routine: findColumn(headers, ["Routine"]),
    meals: findColumn(headers, ["Meals", "Meal", "Meal Relation"]),
    suggestions: findColumn(headers, ["Suggestions to HG Pr", "Suggestions", "Notes"]),
  };

  const out: ImportRow[] = [];
  let order = 0;
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const name = (cols[idx.name] || "").trim();
    if (!name) continue;
    if (/^gap\s+row/i.test(name) || /^_/i.test(name)) continue;

    order += 1;
    const errors: string[] = [];
    const freqLabel = idx.freq >= 0 ? (cols[idx.freq] || "").trim() : "";
    let freqCount = parseFrequencyCount(freqLabel);
    const times = idx.times >= 0 ? parseTimes(cols[idx.times] || "") : [];
    if (!freqCount && times.length) freqCount = times.length;
    if (!freqCount) {
      freqCount = 1;
      errors.push("Could not infer frequency — defaulting to 1. Please verify.");
    }
    if (times.length !== freqCount) {
      errors.push(
        `Frequency says ${freqCount} but ${times.length} time(s) parsed. Fix before saving.`,
      );
    }

    const dosage = (cols[idx.dosage] || "").trim();
    if (!dosage) errors.push("Dosage missing.");

    out.push({
      sort_order: order * 10,
      name,
      brand: idx.brand >= 0 ? (cols[idx.brand] || "").trim() || null : null,
      dosage: dosage || "(missing)",
      frequency_count: freqCount,
      frequency_label: freqLabel || null,
      scheduled_times: times,
      routine: idx.routine >= 0 ? (cols[idx.routine] || "").trim() || null : null,
      meal_relation: idx.meals >= 0 ? (cols[idx.meals] || "").trim() || null : null,
      special_note: idx.special >= 0 ? (cols[idx.special] || "").trim() || null : null,
      suggestions:
        idx.suggestions >= 0 ? (cols[idx.suggestions] || "").trim() || null : null,
      active: true,
      errors,
    });
  }

  return { rows: out, rawCount: rows.length - 1 };
}

export async function commitImport(rowsJson: string, replaceAll: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor") return { error: "Doctor role required." };

  let rows: ImportRow[];
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return { error: "Bad payload." };
  }

  const valid = rows.filter(
    (r) => r.errors.length === 0 && r.scheduled_times.length === r.frequency_count,
  );
  if (valid.length === 0) return { error: "No valid rows to import." };

  if (replaceAll) {
    const { error: delErr } = await supabase.from("medications").delete().neq("id", "");
    if (delErr) return { error: delErr.message };
  }

  const payload = valid.map((r) => ({
    sort_order: r.sort_order,
    name: r.name,
    brand: r.brand,
    dosage: r.dosage,
    frequency_count: r.frequency_count,
    frequency_label: r.frequency_label,
    scheduled_times: r.scheduled_times,
    routine: r.routine,
    meal_relation: r.meal_relation,
    special_note: r.special_note,
    suggestions: r.suggestions,
    dialysis_dosage: null,
    dialysis_scheduled_times: [],
    active: r.active,
    created_by: user.id,
  }));

  const { error } = await supabase.from("medications").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/manage");
  revalidatePath("/dashboard");
  return { ok: true, inserted: valid.length };
}
