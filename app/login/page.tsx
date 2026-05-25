"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">🪔</div>
        <h1 className="text-2xl font-semibold">Guru Seva Meds</h1>
        <p className="mt-1 text-muted">Medication & therapy seva tracker</p>
      </div>

      <Card>
        <CardBody>
          {sentTo ? (
            <div className="space-y-3 text-center">
              <div className="text-2xl">✉️</div>
              <h2 className="text-lg font-semibold">Check your email</h2>
              <p className="text-muted">
                We sent a sign-in link to <span className="font-medium text-ink">{sentTo}</span>.
              </p>
              <p className="text-sm text-muted">Open the email on this device and tap the link.</p>
              <Button variant="ghost" onClick={() => setSentTo(null)} className="mt-2">
                Use a different email
              </Button>
            </div>
          ) : (
            <form
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const result = await sendMagicLink(fd);
                  if (result?.error) setError(result.error);
                  else if (result?.ok) setSentTo(result.email);
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  inputMode="email"
                />
              </div>
              {error && <p className="text-sm text-warn">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? "Sending…" : "Send sign-in link"}
              </Button>
              <p className="text-center text-sm text-muted">
                No password needed. We'll email you a link.
              </p>
            </form>
          )}
        </CardBody>
      </Card>
    </main>
  );
}
