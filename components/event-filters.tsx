"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { CATEGORY_META, EVENT_CATEGORIES } from "@/lib/events/categories";
import { cn } from "@/lib/utils";

export function EventFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  function hrefFor(category: string | null) {
    const params = new URLSearchParams(searchParams);
    if (category) params.set("category", category);
    else params.delete("category");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
        <FilterChip href={hrefFor(null)} isActive={!active}>
          All
        </FilterChip>
        {EVENT_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <FilterChip
              key={cat}
              href={hrefFor(cat)}
              isActive={active === cat}
              accentClass={meta.dotClass}
            >
              {meta.label}
            </FilterChip>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  isActive,
  accentClass,
  children,
}: {
  href: string;
  isActive: boolean;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:bg-muted",
      )}
    >
      {accentClass ? (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", accentClass)}
          aria-hidden
        />
      ) : null}
      {children}
    </Link>
  );
}
