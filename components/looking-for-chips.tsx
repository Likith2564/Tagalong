"use client";

import { Check } from "lucide-react";

import {
  LOOKING_FOR_OPTIONS,
  type LookingForValue,
} from "@/lib/validations/participation";
import { cn } from "@/lib/utils";

type Props = {
  value: LookingForValue[];
  onChange: (next: LookingForValue[]) => void;
  className?: string;
};

export function LookingForChips({ value, onChange, className }: Props) {
  function toggle(option: LookingForValue) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {LOOKING_FOR_OPTIONS.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={selected}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-foreground hover:bg-muted",
            )}
          >
            {selected ? <Check className="h-3.5 w-3.5" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
