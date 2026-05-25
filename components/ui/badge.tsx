import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "wait" | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  ok: "bg-okBg text-ok",
  warn: "bg-warnBg text-warn",
  wait: "bg-waitBg text-muted",
  neutral: "bg-gray-100 text-ink",
  info: "bg-amber-50 text-amber-800",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
