"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  buildDoseSlots,
  formatTime12,
  minutesSinceMidnightInTz,
  sortDoseSlots,
} from "@/lib/time";
import type {
  Administration,
  DialysisDay,
  DoseSlot,
  Medication,
  Profile,
} from "@/lib/types";
import { DialysisToggle } from "./dialysis-toggle";
import { MarkGivenButton } from "./mark-given-button";

interface Props {
  initialMedications: Medication[];
  initialAdministrations: Administration[];
  initialDialysisDay: DialysisDay | null;
  doseDate: string;
  timezone: string;
  currentUser: Profile;
}

export function DashboardClient({
  initialMedications,
  initialAdministrations,
  initialDialysisDay,
  doseDate,
  timezone,
  currentUser,
}: Props) {
  const [medications, setMedications] = useState(initialMedications);
  const [administrations, setAdministrations] = useState(initialAdministrations);
  const [dialysisDay, setDialysisDay] = useState(initialDialysisDay);
  const [nowMinutes, setNowMinutes] = useState(() => minutesSinceMidnightInTz(timezone));
  const overdueRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMinutes(minutesSinceMidnightInTz(timezone)), 30_000);
    return () => clearInterval(id);
  }, [timezone]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "administrations" },
        async () => {
          const { data } = await supabase
            .from("administrations")
            .select("*")
            .eq("dose_date", doseDate);
          if (data) setAdministrations(data as Administration[]);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medications" },
        async () => {
          const { data } = await supabase
            .from("medications")
            .select("*")
            .eq("active", true)
            .order("sort_order");
          if (data) setMedications(data as Medication[]);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dialysis_days", filter: `dose_date=eq.${doseDate}` },
        async () => {
          const { data } = await supabase
            .from("dialysis_days")
            .select("*")
            .eq("dose_date", doseDate)
            .maybeSingle();
          setDialysisDay((data as DialysisDay) || null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doseDate]);

  const slots: DoseSlot[] = useMemo(
    () =>
      sortDoseSlots(
        buildDoseSlots(
          medications,
          administrations,
          !!dialysisDay?.is_dialysis,
          doseDate,
          nowMinutes,
        ),
      ),
    [medications, administrations, dialysisDay, doseDate, nowMinutes],
  );

  const overdueCount = slots.filter((s) => s.status === "overdue").length;
  const givenCount = slots.filter((s) => s.status === "given").length;
  const upcomingCount = slots.filter((s) => s.status === "upcoming").length;

  const dateLabel = new Date(`${doseDate}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {overdueCount > 0 && (
        <button
          type="button"
          onClick={() => overdueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="w-full rounded-2xl bg-warn px-4 py-4 text-left text-white shadow-soft transition-transform active:scale-[0.99]"
        >
          <div className="text-lg font-semibold">
            ⚠ {overdueCount} {overdueCount === 1 ? "DOSE" : "DOSES"} OVERDUE
          </div>
          <div className="text-sm opacity-90">Tap to jump · please administer now.</div>
        </button>
      )}

      <DialysisToggle dialysisDay={dialysisDay} />

      <div className="flex items-center justify-between text-sm text-muted">
        <div>
          {dateLabel} · {timezone}
        </div>
        <div className="flex gap-2">
          <Badge tone="warn">{overdueCount} overdue</Badge>
          <Badge tone="wait">{upcomingCount} upcoming</Badge>
          <Badge tone="ok">{givenCount} given</Badge>
        </div>
      </div>

      <div className="space-y-3" ref={overdueRef}>
        {slots.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-muted">
                No medications in the list yet.{" "}
                {currentUser.role === "doctor" ? (
                  <>
                    Go to <span className="font-medium">Manage list</span> to add or import them.
                  </>
                ) : (
                  <>Ask a doctor to add or import the list.</>
                )}
              </p>
            </CardBody>
          </Card>
        )}
        {slots.map((slot) => (
          <DoseCard key={`${slot.medication.id}|${slot.scheduled_time}`} slot={slot} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

function DoseCard({ slot, currentUser }: { slot: DoseSlot; currentUser: Profile }) {
  const med = slot.medication;
  const borderClass =
    slot.status === "overdue"
      ? "border-warn"
      : slot.status === "given"
        ? "border-ok"
        : "border-line";

  const statusBadge =
    slot.status === "given" ? (
      <Badge tone="ok">GIVEN</Badge>
    ) : slot.status === "overdue" ? (
      <Badge tone="warn">
        OVERDUE{slot.minutes_overdue > 0 ? ` · ${slot.minutes_overdue} min` : ""}
      </Badge>
    ) : (
      <Badge tone="wait">UPCOMING</Badge>
    );

  return (
    <Card className={`border-2 ${borderClass}`}>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-lg font-semibold">{med.name}</h3>
              {med.brand && <span className="text-sm text-muted">({med.brand})</span>}
            </div>
            <div className="mt-1 text-base font-medium">
              {slot.effective_dosage}
              {slot.day_type === "dialysis" && (
                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  dialysis-day dose
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted">
              Dose {slot.dose_index} of {slot.total_doses} · scheduled for{" "}
              <span className="font-medium text-ink">{formatTime12(slot.scheduled_time)}</span>
              {med.meal_relation && <> · {med.meal_relation.toLowerCase()}</>}
            </div>
            {med.special_note && (
              <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-semibold">Note:</span> {med.special_note}
              </div>
            )}
            {med.suggestions && (
              <div className="mt-1 text-sm text-muted">💡 {med.suggestions}</div>
            )}
          </div>
          <div className="shrink-0">{statusBadge}</div>
        </div>

        <MarkGivenButton slot={slot} currentUser={currentUser} />
      </CardBody>
    </Card>
  );
}
