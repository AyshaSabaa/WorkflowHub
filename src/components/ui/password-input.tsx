"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, id, autoComplete = "current-password", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="relative w-full overflow-visible">
        <Input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={0}
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute top-1/2 right-3 z-20 -translate-y-1/2",
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            "text-gray-500 hover:text-[#ff7a59] dark:text-gray-400 dark:hover:text-[#ff7a59]",
            "cursor-pointer transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a59]/40"
          )}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={inputId}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
