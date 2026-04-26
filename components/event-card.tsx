import Link from "next/link";
import { MapPin } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { CATEGORY_META, type EventCategory } from "@/lib/events/categories";
import { formatEventDateRange } from "@/lib/events/format";
import { cn } from "@/lib/utils";

type Props = {
  event: {
    slug: string;
    name: string;
    category: EventCategory;
    city: string;
    start_date: string;
    end_date: string;
    cover_image_url: string | null;
  };
  className?: string;
};

export function EventCard({ event, className }: Props) {
  const meta = CATEGORY_META[event.category];

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-[16/9] w-full overflow-hidden",
          meta.bgClass,
        )}
      >
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center",
              meta.textClass,
            )}
            aria-hidden
          >
            <span className="text-2xl font-semibold opacity-50">
              {meta.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <CategoryBadge category={event.category} />
          <span className="text-xs text-muted-foreground">
            {formatEventDateRange(event.start_date, event.end_date)}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
          {event.name}
        </h3>
        <p className="mt-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {event.city}
        </p>
      </div>
    </Link>
  );
}
