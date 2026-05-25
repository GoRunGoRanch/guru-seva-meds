"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTime12 } from "@/lib/time";
import {
  commitImport,
  fetchSheetPreview,
  parseUploadedCsv,
  type ImportRow,
} from "./actions";

const DEFAULT_SHEET =
  "https://docs.google.com/spreadsheets/d/1dN21JTSAi7DVpeWoZ7UvQK41dHft0_g_4gAygdBXtdk/edit?gid=0";

export function ImportClient() {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET);
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [replaceAll, setReplaceAll] = useState(true);
  const [pending, startTransition] = useTransition();

  const validCount = preview?.filter((r) => r.errors.length === 0).length ?? 0;
  const invalidCount = preview?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="sheet">Google Sheets URL</Label>
            <Input
              id="sheet"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={pending || !sheetUrl}
              onClick={() => {
                setError(null);
                setSuccess(null);
                startTransition(async () => {
                  const res = await fetchSheetPreview(sheetUrl);
                  if (!res.ok) setError(res.error);
                  else setPreview(res.rows);
                });
              }}
            >
              {pending ? "Loading…" : "Preview from Google Sheet"}
            </Button>
            <label className="inline-flex h-11 items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-medium hover:bg-gray-50">
              Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError(null);
                  setSuccess(null);
                  const text = await file.text();
                  startTransition(async () => {
                    const res = await parseUploadedCsv(text);
                    setPreview(res.rows);
                  });
                }}
              />
            </label>
          </div>
          {error && <p className="text-sm text-warn">{error}</p>}
        </CardBody>
      </Card>

      {preview && (
        <>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold text-ok">{validCount} ready</span>{" "}
              {invalidCount > 0 && (
                <>
                  · <span className="font-semibold text-warn">{invalidCount} need fixing</span>
                </>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="h-5 w-5"
              />
              Replace the current list
            </label>
          </div>

          <div className="space-y-2">
            {preview.map((r, i) => (
              <Card
                key={i}
                className={r.errors.length ? "border-2 border-warn" : "border border-line"}
              >
                <CardBody className="space-y-1">
                  <div className="text-base font-semibold">
                    {r.name}
                    {r.brand && <span className="ml-1 text-muted">({r.brand})</span>}
                  </div>
                  <div className="text-sm text-muted">
                    {r.dosage} · {r.frequency_label || `${r.frequency_count}× per day`} ·{" "}
                    {r.scheduled_times.length
                      ? r.scheduled_times.map(formatTime12).join(", ")
                      : "(no times)"}
                    {r.meal_relation && <> · {r.meal_relation}</>}
                  </div>
                  {r.special_note && (
                    <div className="text-sm text-amber-900">⚠ {r.special_note}</div>
                  )}
                  {r.errors.map((err, k) => (
                    <div key={k} className="text-sm font-medium text-warn">
                      ✗ {err}
                    </div>
                  ))}
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={pending || validCount === 0}
              onClick={() => {
                if (
                  replaceAll &&
                  !confirm(
                    "This will DELETE the current medication list and replace it with the previewed rows. Past administration records remain. Continue?",
                  )
                )
                  return;
                setError(null);
                setSuccess(null);
                startTransition(async () => {
                  const res = await commitImport(JSON.stringify(preview), replaceAll);
                  if ("error" in res && res.error) setError(res.error);
                  else if ("ok" in res) {
                    setSuccess(`Imported ${res.inserted} medication(s).`);
                    setPreview(null);
                  }
                });
              }}
            >
              {pending
                ? "Saving…"
                : `Save ${validCount} medication${validCount === 1 ? "" : "s"}`}
            </Button>
            <Link
              href="/manage"
              className="inline-flex h-14 items-center rounded-2xl border border-line bg-white px-5 text-base font-semibold hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>

          {success && <p className="text-sm font-medium text-ok">{success}</p>}
        </>
      )}
    </div>
  );
}
