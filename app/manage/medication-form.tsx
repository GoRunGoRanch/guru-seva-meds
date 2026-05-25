"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveMedicationFromForm } from "./actions";
import type { Medication } from "@/lib/types";

interface Props {
  initial?: Partial<Medication>;
  mode: "create" | "edit";
}

export function MedicationForm({ initial, mode }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardBody>
        <h2 className="mb-4 text-xl font-semibold">
          {mode === "edit" ? "Edit medication" : "Add medication"}
        </h2>
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await saveMedicationFromForm(fd);
              if (res && "error" in res && res.error) setError(res.error);
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {initial?.id && <input type="hidden" name="id" value={initial.id} />}

          <Field label="Name *" full>
            <Input name="name" required defaultValue={initial?.name ?? ""} />
          </Field>

          <Field label="Brand">
            <Input name="brand" defaultValue={initial?.brand ?? ""} />
          </Field>

          <Field label="Dosage *">
            <Input name="dosage" required defaultValue={initial?.dosage ?? ""} />
          </Field>

          <Field label="Frequency count *">
            <Input
              name="frequency_count"
              type="number"
              min={1}
              max={12}
              required
              defaultValue={initial?.frequency_count ?? 1}
            />
          </Field>

          <Field label="Frequency label (e.g. ONCE, TWICE)">
            <Input name="frequency_label" defaultValue={initial?.frequency_label ?? ""} />
          </Field>

          <Field label="Times *" full hint="Comma-separated. e.g. 5:15 AM, 6:00 PM">
            <Input
              name="scheduled_times"
              required
              placeholder="5:15 AM, 6:00 PM"
              defaultValue={(initial?.scheduled_times ?? []).join(", ")}
            />
          </Field>

          <Field label="Routine (e.g. MRNG, MRNG & EVNG)">
            <Input name="routine" defaultValue={initial?.routine ?? ""} />
          </Field>

          <Field label="Meal relation (e.g. EMPTY STOMACH)">
            <Input name="meal_relation" defaultValue={initial?.meal_relation ?? ""} />
          </Field>

          <Field label="Special note" full>
            <Textarea name="special_note" defaultValue={initial?.special_note ?? ""} />
          </Field>

          <Field label="Suggestions" full>
            <Textarea name="suggestions" defaultValue={initial?.suggestions ?? ""} />
          </Field>

          <div className="col-span-full mt-2 rounded-xl border border-line bg-bg p-3">
            <div className="mb-2 text-sm font-semibold text-ink">
              Dialysis-day dosing (optional)
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dialysis-day dosage">
                <Input
                  name="dialysis_dosage"
                  placeholder="e.g. 100 mg"
                  defaultValue={initial?.dialysis_dosage ?? ""}
                />
              </Field>
              <Field
                label="Dialysis-day times"
                hint={`Leave empty unless different. Must match frequency count if filled.`}
              >
                <Input
                  name="dialysis_scheduled_times"
                  placeholder="e.g. 6:00 AM, 7:00 PM"
                  defaultValue={(initial?.dialysis_scheduled_times ?? []).join(", ")}
                />
              </Field>
            </div>
          </div>

          <Field label="Sort order">
            <Input
              name="sort_order"
              type="number"
              defaultValue={initial?.sort_order ?? 100}
            />
          </Field>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initial?.active ?? true}
                className="h-5 w-5"
              />
              Active (shows on dashboard)
            </label>
          </div>

          {error && (
            <p className="col-span-full text-sm text-warn" role="alert">
              {error}
            </p>
          )}

          <div className="col-span-full flex gap-3">
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Add medication"}
            </Button>
            <a
              href="/manage"
              className="inline-flex h-14 items-center rounded-2xl border border-line bg-white px-5 text-base font-semibold text-ink hover:bg-gray-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
