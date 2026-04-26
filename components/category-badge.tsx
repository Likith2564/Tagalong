import { CATEGORY_META, type EventCategory } from "@/lib/events/categories";
import { cn } from "@/lib/utils";

type Props = {
  category: EventCategory;
  className?: string;
};

export function CategoryBadge({ category, className }: Props) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.bgClass,
        meta.textClass,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
