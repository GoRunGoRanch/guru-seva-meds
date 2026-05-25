"use client";
import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setDialysisDay } from "./actions";
import type { DialysisDay } from "@/lib/types";

interface Props {
  dialysisDay: DialysisDay | null;
}

export function DialysisToggle({ dialysisDay }: Props) {
  const initial = !!dialysisDay?.is_dialysis;
  const [optimistic, setOptimistic] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: boolean) => {
    setOptimistic(next);
    startTransition(async () => {
      const res = await setDialysisDay(next);
      if (res?.error) setOptimistic(!next);
    });
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div>
        <div className="text-sm font-medium text-ink">Today is a dialysis day</div>
        <div className="text-xs text-muted">
          {optimistic
            ? "Dialysis-day dosing is active for medications that have it set."
            : "Standard dosing is in effect."}
          {dialysisDay?.set_by_name && optimistic === initial && (
            <> · last changed by {dialysisDay.set_by_name}</>
          )}
        </div>
      </div>
      <Switch
        checked={optimistic}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label="Toggle dialysis day"
      />
    </div>
  );
}
