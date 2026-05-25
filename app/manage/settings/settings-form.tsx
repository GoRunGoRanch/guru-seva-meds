"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { COMMON_TIMEZONES } from "@/lib/settings";
import { saveTimezone } from "./actions";

interface Props {
  currentTz: string;
  updatedByName: string | null;
  updatedAt: string | null;
}

export function TimezoneForm({ currentTz, updatedByName, updatedAt }: Props) {
  const [selected, setSelected] = useState(currentTz);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nowExample = new Date().toLocaleString(undefined, {
    timeZone: selected,
    hour: "numeric",
    minute: "2-digit",
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <form
      action={(fd) => {
        setError(null);
        setSuccess(false);
        startTransition(async () => {
          const res = await saveTimezone(fd);
          if (res?.error) setError(res.error);
          else setSuccess(true);
        });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="timezone">Patient's current timezone</Label>
        <select
          id="timezone"
          name="timezone"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-saffron"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-muted">
          Right now in <span className="font-medium text-ink">{selected}</span>:{" "}
          <span className="font-medium text-ink">{nowExample}</span>
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        <strong>What this controls:</strong> every "5:15 AM" scheduled dose is interpreted in this
        timezone. Change this when Guru Maharaj crosses a time zone (e.g. Dallas → Atlanta).
        Updating it does <em>not</em> alter past records.
      </div>

      {updatedByName && updatedAt && (
        <p className="text-xs text-muted">
          Last changed by {updatedByName} on{" "}
          {new Date(updatedAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          .
        </p>
      )}

      {error && <p className="text-sm font-medium text-warn">{error}</p>}
      {success && (
        <p className="text-sm font-medium text-ok">
          Saved. Reload the dashboard to see the new times.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || selected === currentTz}>
        {pending ? "Saving…" : "Save timezone"}
      </Button>
    </form>
  );
}
