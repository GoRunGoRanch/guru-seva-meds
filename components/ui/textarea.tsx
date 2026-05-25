import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[80px] w-full rounded-xl border border-line bg-white p-3 text-base text-ink",
      "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-saffron",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
