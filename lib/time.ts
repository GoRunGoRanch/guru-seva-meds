import type { Administration, DoseSlot, DoseStatus, Medication } from "./types";

export const APP_TZ = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "Asia/Kolkata";

export function todayIsoInTz(tz: string = APP_TZ, now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

export function minutesSinceMidnightInTz(tz: string = APP_TZ, now: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hh, mm] = fmt.format(now).split(":").map(Number);
  return hh * 60 + mm;
}

export function timeStringToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + (mm || 0);
}

export function formatTime12(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm || 0).padStart(2, "0")} ${period}`;
}

export function buildDoseSlots(
  medications: Medication[],
  administrations: Administration[],
  isDialysisDay: boolean,
  doseDate: string,
  nowMinutes: number,
): DoseSlot[] {
  const adminIndex = new Map<string, Administration>();
  for (const a of administrations) {
    if (a.dose_date !== doseDate) continue;
    adminIndex.set(`${a.medication_id}|${a.scheduled_time}`, a);
  }

  const slots: DoseSlot[] = [];
  for (const med of medications) {
    if (!med.active) continue;

    const useDialysis =
      isDialysisDay && med.dialysis_scheduled_times && med.dialysis_scheduled_times.length > 0;

    const times = useDialysis ? med.dialysis_scheduled_times : med.scheduled_times;
    const effectiveDosage = useDialysis && med.dialysis_dosage ? med.dialysis_dosage : med.dosage;
    const dayType = useDialysis ? "dialysis" : "regular";

    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const given = adminIndex.get(`${med.id}|${t}`);
      const scheduledMinutes = timeStringToMinutes(t);

      let status: DoseStatus;
      if (given) status = "given";
      else if (nowMinutes >= scheduledMinutes) status = "overdue";
      else status = "upcoming";

      slots.push({
        medication: med,
        scheduled_time: t,
        dose_index: i + 1,
        total_doses: times.length,
        effective_dosage: effectiveDosage,
        day_type: dayType,
        status,
        given_at: given?.given_at ?? null,
        given_by_name: given?.given_by_name ?? null,
        minutes_overdue: status === "overdue" ? nowMinutes - scheduledMinutes : 0,
      });
    }
  }
  return slots;
}

export function sortDoseSlots(slots: DoseSlot[]): DoseSlot[] {
  const order: Record<DoseStatus, number> = { overdue: 0, upcoming: 1, given: 2 };
  return [...slots].sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    if (a.scheduled_time !== b.scheduled_time)
      return timeStringToMinutes(a.scheduled_time) - timeStringToMinutes(b.scheduled_time);
    return a.medication.sort_order - b.medication.sort_order;
  });
}
