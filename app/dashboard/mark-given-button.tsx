"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markGiven, undoGiven } from "./actions";
import type { DoseSlot } from "@/lib/types";
import type { Session } from "@/lib/session";
import { formatTime12 } from "@/lib/time";

interface Props {
  slot: DoseSlot;
  currentSession: Session;
}

function getPosition(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60_000 },
    );
  });
}

export function MarkGivenButton({ slot, currentSession }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (slot.status === "given") {
    const t = slot.given_at ? new Date(slot.given_at) : null;
    const timeStr = t
      ? t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-semibold text-ok">Given at {timeStr}</span>
          {slot.given_by_name && (
            <span className="text-muted"> by {slot.given_by_name}</span>
          )}
        </div>
        {currentSession.role === "doctor" && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (!confirm("Undo this Mark as Given? Only do this if it was a mistake.")) return;
              startTransition(async () => {
                const res = await undoGiven({
                  medication_id: slot.medication.id,
                  scheduled_time: slot.scheduled_time,
                });
                if (res?.error) setError(res.error);
              });
            }}
          >
            Undo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        variant={slot.status === "overdue" ? "danger" : "primary"}
        className="w-full"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const pos = await getPosition();
            const res = await markGiven({
              medication_id: slot.medication.id,
              scheduled_time: slot.scheduled_time,
              day_type: slot.day_type,
              latitude: pos?.latitude ?? null,
              longitude: pos?.longitude ?? null,
            });
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending
          ? "Marking…"
          : slot.status === "overdue"
            ? `Mark as Given (was due ${formatTime12(slot.scheduled_time)})`
            : `Mark as Given (${formatTime12(slot.scheduled_time)})`}
      </Button>
      {error && <p className="text-sm text-warn">{error}</p>}
    </div>
  );
}
