import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span
        className="h-2.5 w-2.5 rounded-full bg-accent transition-transform group-hover:scale-110"
        aria-hidden
      />
      <span>tagalong</span>
    </Link>
  );
}
