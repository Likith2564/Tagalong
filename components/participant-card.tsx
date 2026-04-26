import { ArrowRight, MapPin } from "lucide-react";

import { ContactReveal } from "@/components/contact-reveal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LOOKING_FOR_OPTIONS,
  type LookingForValue,
} from "@/lib/validations/participation";
import { cn } from "@/lib/utils";

type Props = {
  participant: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    origin_city: string;
    arrival_datetime: string;
    departure_datetime: string;
    looking_for: string[];
    notes: string | null;
    telegram_handle: string | null;
    twitter_handle: string | null;
    whatsapp_number: string | null;
    instagram_handle: string | null;
  };
  isYou?: boolean;
  className?: string;
};

const LOOKING_FOR_LABEL: Record<string, string> = Object.fromEntries(
  LOOKING_FOR_OPTIONS.map((o) => [o.value, o.label]),
);

export function ParticipantCard({ participant, isYou, className }: Props) {
  const initials = getInitials(participant.full_name);
  const arrival = formatDateTime(participant.arrival_datetime);
  const departure = formatDateTime(participant.departure_datetime);

  const hasContacts =
    participant.telegram_handle ||
    participant.whatsapp_number ||
    participant.twitter_handle ||
    participant.instagram_handle;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm",
        isYou && "ring-2 ring-accent/40",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <Avatar className="h-11 w-11 border border-border">
          {participant.avatar_url ? (
            <AvatarImage src={participant.avatar_url} alt={participant.full_name} />
          ) : null}
          <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {participant.full_name}
            </h3>
            {isYou ? (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                You
              </span>
            ) : null}
          </div>
          {participant.bio ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {participant.bio}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          From {participant.origin_city}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-muted-foreground">
          {arrival} <ArrowRight className="inline h-3 w-3 mx-0.5" /> {departure}
        </span>
      </div>

      {participant.looking_for.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {participant.looking_for.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {LOOKING_FOR_LABEL[tag] ?? tag}
            </span>
          ))}
        </div>
      ) : null}

      {participant.notes ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
          {participant.notes}
        </p>
      ) : null}

      {hasContacts && !isYou ? (
        <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Reach out:</span>
          {participant.telegram_handle ? (
            <ContactReveal kind="telegram" value={participant.telegram_handle} />
          ) : null}
          {participant.whatsapp_number ? (
            <ContactReveal kind="whatsapp" value={participant.whatsapp_number} />
          ) : null}
          {participant.twitter_handle ? (
            <ContactReveal kind="twitter" value={participant.twitter_handle} />
          ) : null}
          {participant.instagram_handle ? (
            <ContactReveal
              kind="instagram"
              value={participant.instagram_handle}
            />
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
