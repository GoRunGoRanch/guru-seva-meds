import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "default" | "lg" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-saffron text-white hover:bg-amber-600 active:bg-amber-700",
  secondary: "bg-white text-ink border border-line hover:bg-gray-50",
  ghost: "bg-transparent text-ink hover:bg-gray-100",
  danger: "bg-warn text-white hover:bg-red-700",
  success: "bg-ok text-white hover:bg-green-800",
};

const sizeClasses: Record<Size, string> = {
  default: "h-11 px-5 text-base",
  lg: "h-14 px-6 text-lg",
  sm: "h-9 px-3 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-semibold transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed shadow-soft",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
