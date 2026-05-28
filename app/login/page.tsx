"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">🪔</div>
        <h1 className="text-2xl font-semibold">Guru Seva Meds</h1>
        <p className="mt-1 text-muted">
          Sign in with your name and the seva team password
        </p>
      </div>

      <Card>
        <CardBody>
          <form
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await signIn(fd);
                if (res?.error) setError(res.error);
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                name="name"
                required
                autoFocus
                autoComplete="name"
                placeholder="e.g. Vinaya Gauracandra Dasa"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="The shared seva team password"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-warnBg px-3 py-2 text-sm text-warn">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Continue"}
            </Button>
            <p className="text-center text-xs text-muted">
              Doctors use a different password than servants. Ask whoever shared this link.
            </p>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
