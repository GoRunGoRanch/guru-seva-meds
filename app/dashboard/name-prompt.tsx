"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveOwnName } from "./actions";

export function NamePromptCard() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Welcome 🙏</h2>
          <p className="mt-1 text-muted">
            Tell us your name so we can record who gives each medication.
          </p>
        </div>
        <form
          action={(fd) => {
            const name = String(fd.get("full_name") || "");
            setError(null);
            startTransition(async () => {
              const res = await saveOwnName(name);
              if (res?.error) setError(res.error);
              else window.location.reload();
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="full_name">Your name</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              placeholder="e.g. Bhakta Rama"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-warn">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
