"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlock } from "./actions";

export function EnterForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">🪔</div>
        <h1 className="text-2xl font-semibold">Guru Seva Meds</h1>
        <p className="mt-1 text-muted">Enter the seva team's shared password</p>
      </div>
      <Card>
        <CardBody>
          <form
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await unlock(fd);
                if (res?.error) setError(res.error);
              });
            }}
            className="space-y-4"
          >
            <input type="hidden" name="next" value={next} />
            <div>
              <Label htmlFor="password">Shared password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-warn">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Checking…" : "Continue"}
            </Button>
            <p className="text-center text-xs text-muted">
              After this, you'll sign in with your own email — magic link, no password to remember.
            </p>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
